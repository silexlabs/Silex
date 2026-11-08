/*
 * Silex website builder - desktop app.
 * Copyright (c) 2026 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Native webview screenshot implementation across platforms
//!
//! Uses Tauri's `with_webview` to capture the entire webview window using platform APIs:
//! - Windows: WebView2 `CapturePreview`
//! - Linux: WebKitGTK `webkit_web_view_get_snapshot`
//! - macOS: WKWebView `takeSnapshotWithConfiguration:completionHandler:`

use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::Manager;

pub async fn capture_webview_ui(app_handle: &tauri::AppHandle) -> Result<Vec<u8>, String> {
    let window = app_handle
        .get_webview_window("main")
        .ok_or_else(|| "No main window".to_string())?;

    let (tx, rx) = tokio::sync::oneshot::channel::<Result<Vec<u8>, String>>();

    window
        .with_webview(move |webview| {
            #[cfg(windows)]
            {
                capture_windows(&webview, tx);
            }

            #[cfg(target_os = "linux")]
            {
                capture_linux(&webview, tx);
            }

            #[cfg(target_os = "macos")]
            {
                capture_macos(&webview, tx);
            }

            #[cfg(not(any(windows, target_os = "linux", target_os = "macos")))]
            {
                let _ = tx.send(Err(
                    "Platform webview capture is not supported on this OS".into()
                ));
            }
        })
        .map_err(|e| format!("Failed to access native webview: {}", e))?;

    tokio::time::timeout(Duration::from_secs(15), rx)
        .await
        .map_err(|_| "Native webview capture timed out after 15 seconds".to_string())?
        .map_err(|_| "Native webview capture channel closed unexpectedly".to_string())?
}

// ============================================================================
// Windows (WebView2 CapturePreview)
// ============================================================================

#[cfg(windows)]
fn capture_windows(
    webview: &tauri::webview::PlatformWebview,
    tx: tokio::sync::oneshot::Sender<Result<Vec<u8>, String>>,
) {
    use webview2_com::CapturePreviewCompletedHandler;
    use webview2_com::Microsoft::Web::WebView2::Win32::COREWEBVIEW2_CAPTURE_PREVIEW_IMAGE_FORMAT_PNG;
    use windows::Win32::Foundation::HGLOBAL;
    use windows::Win32::System::Com::StructuredStorage::CreateStreamOnHGlobal;
    use windows::Win32::System::Com::{IStream, STATFLAG_NONAME, STREAM_SEEK_SET};

    let tx_cell = Arc::new(Mutex::new(Some(tx)));
    let tx_clone = tx_cell.clone();

    unsafe {
        let controller = webview.controller();
        let core = match controller.CoreWebView2() {
            Ok(c) => c,
            Err(e) => {
                if let Some(sender) = tx_cell.lock().unwrap().take() {
                    let _ = sender.send(Err(format!("Failed to get CoreWebView2: {:?}", e)));
                }
                return;
            }
        };

        let stream: IStream = match CreateStreamOnHGlobal(HGLOBAL::default(), true) {
            Ok(s) => s,
            Err(e) => {
                if let Some(sender) = tx_cell.lock().unwrap().take() {
                    let _ = sender.send(Err(format!("Failed to create memory stream: {:?}", e)));
                }
                return;
            }
        };

        let stream_clone = stream.clone();
        let handler = CapturePreviewCompletedHandler::create(Box::new(move |error_code| {
            let sender = tx_clone.lock().unwrap().take();
            let Some(sender) = sender else {
                return Ok(());
            };

            if let Err(e) = error_code {
                let _ = sender.send(Err(format!("CapturePreview failed: {:?}", e)));
                return Ok(());
            }

            if let Err(e) = stream_clone.Seek(0, STREAM_SEEK_SET, None) {
                let _ = sender.send(Err(format!("Stream seek failed: {:?}", e)));
                return Ok(());
            }

            let mut stat = std::mem::zeroed();
            if let Err(e) = stream_clone.Stat(&mut stat, STATFLAG_NONAME) {
                let _ = sender.send(Err(format!("Stream stat failed: {:?}", e)));
                return Ok(());
            }

            let size = stat.cbSize as usize;
            let mut buf = vec![0u8; size];
            let mut bytes_read = 0u32;
            if let Err(e) = stream_clone
                .Read(
                    buf.as_mut_ptr() as *mut _,
                    size as u32,
                    Some(&mut bytes_read),
                )
                .ok()
            {
                let _ = sender.send(Err(format!("Stream read failed: {:?}", e)));
                return Ok(());
            }

            buf.truncate(bytes_read as usize);
            let _ = sender.send(Ok(buf));
            Ok(())
        }));

        if let Err(e) = core.CapturePreview(
            COREWEBVIEW2_CAPTURE_PREVIEW_IMAGE_FORMAT_PNG,
            &stream,
            &handler,
        ) {
            if let Some(sender) = tx_cell.lock().unwrap().take() {
                let _ = sender.send(Err(format!("CapturePreview initiation failed: {:?}", e)));
            }
        }
    }
}

// ============================================================================
// Linux (WebKitGTK webkit_web_view_get_snapshot)
// ============================================================================

#[cfg(target_os = "linux")]
fn capture_linux(
    webview: &tauri::webview::PlatformWebview,
    tx: tokio::sync::oneshot::Sender<Result<Vec<u8>, String>>,
) {
    use webkit2gtk::traits::WebViewExt;
    use webkit2gtk::{SnapshotOptions, SnapshotRegion};

    webview.inner().snapshot(
        SnapshotRegion::Visible,
        SnapshotOptions::NONE,
        None,
        move |res| match res {
            Ok(surface) => {
                let mut bytes = Vec::new();
                match surface.write_to_png(&mut bytes) {
                    Ok(_) => {
                        let _ = tx.send(Ok(bytes));
                    }
                    Err(e) => {
                        let _ = tx.send(Err(format!("Cairo write_to_png failed: {:?}", e)));
                    }
                }
            }
            Err(e) => {
                let _ = tx.send(Err(format!("WebKit snapshot failed: {:?}", e)));
            }
        },
    );
}

// ============================================================================
// macOS (WKWebView takeSnapshotWithConfiguration)
// ============================================================================

#[cfg(target_os = "macos")]
fn capture_macos(
    webview: &tauri::webview::PlatformWebview,
    tx: tokio::sync::oneshot::Sender<Result<Vec<u8>, String>>,
) {
    use block2::RcBlock;
    use objc2_app_kit::{NSBitmapImageFileType, NSBitmapImageRep, NSImage};
    use objc2_foundation::NSError;
    use objc2_web_kit::WKWebView;

    unsafe {
        let view: &WKWebView = &*webview.inner();
        let block = RcBlock::new(move |image: *mut NSImage, error: *mut NSError| {
            if !error.is_null() {
                let err = &*error;
                let _ = tx.send(Err(format!("WKWebView snapshot failed: {:?}", err)));
                return;
            }
            if image.is_null() {
                let _ = tx.send(Err("WKWebView snapshot returned null image".into()));
                return;
            }

            let ns_image = &*image;
            let Some(tiff_data) = ns_image.TIFFRepresentation() else {
                let _ = tx.send(Err("Failed to get TIFF representation".into()));
                return;
            };

            let Some(rep) = NSBitmapImageRep::imageRepWithData(&tiff_data) else {
                let _ = tx.send(Err("Failed to create NSBitmapImageRep".into()));
                return;
            };

            let Some(png_data) = rep.representationUsingType_properties(
                NSBitmapImageFileType::PNG,
                &objc2_foundation::NSDictionary::new(),
            ) else {
                let _ = tx.send(Err("Failed to convert image to PNG".into()));
                return;
            };

            let bytes = png_data.as_bytes().to_vec();
            let _ = tx.send(Ok(bytes));
        });

        view.takeSnapshotWithConfiguration_completionHandler(None, &block);
    }
}
