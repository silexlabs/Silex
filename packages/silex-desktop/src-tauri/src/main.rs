/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

// Prevents an extra console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Mutex;

use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tokio::net::TcpListener;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use silex_server::Config;

mod mcp;

// ==================
// App State
// ==================

struct AppState {
    current_website_id: Mutex<Option<String>>,
    current_website_name: Mutex<Option<String>>,
    has_unsaved_changes: Mutex<bool>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            current_website_id: Mutex::new(None),
            current_website_name: Mutex::new(None),
            has_unsaved_changes: Mutex::new(false),
        }
    }
}

// ==================
// Tauri Commands
// ==================

#[tauri::command]
fn set_current_project(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    website_id: String,
    website_name: String,
) {
    *state.current_website_id.lock().unwrap() = Some(website_id);
    *state.current_website_name.lock().unwrap() = Some(website_name.clone());
    *state.has_unsaved_changes.lock().unwrap() = false;

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_title(&format!("{} \u{2014} Silex", website_name));
    }
}

#[tauri::command]
fn clear_current_project(app: tauri::AppHandle, state: tauri::State<'_, AppState>) {
    *state.current_website_id.lock().unwrap() = None;
    *state.current_website_name.lock().unwrap() = None;
    *state.has_unsaved_changes.lock().unwrap() = false;

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_title("Silex");
    }
}

#[tauri::command]
fn mark_unsaved(app: tauri::AppHandle, state: tauri::State<'_, AppState>) {
    *state.has_unsaved_changes.lock().unwrap() = true;

    if let Some(name) = state.current_website_name.lock().unwrap().as_ref() {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.set_title(&format!("\u{2022} {} \u{2014} Silex", name));
        }
    }
}

fn show_quit_dialog(app: &tauri::AppHandle) {
    use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

    let app_handle = app.clone();
    app.dialog()
        .message("Do you want to save changes before quitting?")
        .title("Silex")
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::OkCancelCustom(
            "Save & Quit".into(),
            "Quit".into(),
        ))
        .show(move |result| {
            if result {
                let _ = app_handle.emit("menu-save", ());
                // Give a moment for save, then close
                let handle = app_handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(2));
                    if let Some(window) = handle.get_webview_window("main") {
                        let _ = window.destroy();
                    }
                });
            } else if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.destroy();
            }
        });
}

// ==================
// Server
// ==================

fn resolve_frontend_path() -> PathBuf {
    let dev_path =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../silex-lib/dist/client");
    if dev_path.exists() {
        return dev_path.canonicalize().unwrap_or(dev_path);
    }

    if let Ok(path) = std::env::var("SILEX_STATIC_PATH") {
        return PathBuf::from(path);
    }

    tracing::warn!(
        "Could not find silex-lib frontend at {}",
        dev_path.display()
    );
    dev_path
}

async fn start_server(pending_evals: mcp::PendingEvals) -> u16 {
    let mut config = Config::from_env();

    let frontend_path = resolve_frontend_path();
    tracing::info!("Frontend path: {}", frontend_path.display());
    config.static_path = Some(frontend_path);

    let (app, port) = silex_server::build_app(config).await;

    // Add eval-callback route for JS→Rust result passing (same origin, no CORS)
    let app = app
        .route(
            "/eval-callback/:id",
            axum::routing::post(mcp::eval_callback),
        )
        .layer(axum::Extension(pending_evals));

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = TcpListener::bind(addr).await.unwrap();
    tracing::info!("Silex server listening on http://{}", addr);

    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    port
}

// ==================
// Main
// ==================

fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "silex_server=info,silex_desktop=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            set_current_project,
            clear_current_project,
            mark_unsaved,
        ])
        .setup(|app| {
            let pending_evals = mcp::PendingEvals::default();
            let port = tauri::async_runtime::block_on(start_server(pending_evals.clone()));

            let url = format!("http://localhost:{}/welcome", port);
            let window = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(url.parse().unwrap()),
            )
            .title("Silex")
            .maximized(true)
            .initialization_script(include_str!("../scripts/desktop-bridge.js"))
            .build()?;

            // Start the MCP server on port 6807
            let mcp_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                mcp::start_mcp_server(mcp_handle, pending_evals, 6807).await;
            });

            // Handle window close with unsaved changes
            let app_handle = app.handle().clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    let state = app_handle.state::<AppState>();
                    let has_changes = *state.has_unsaved_changes.lock().unwrap();
                    if has_changes {
                        api.prevent_close();
                        show_quit_dialog(&app_handle);
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
