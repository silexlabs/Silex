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
use tauri_plugin_updater::UpdaterExt;

mod mcp;

// ==================
// Telemetry consent
// ==================

fn telemetry_consent_path(data_dir: &PathBuf) -> PathBuf {
    data_dir.join("telemetry_consent")
}

/// Returns Some(true) if opted in, Some(false) if opted out, None if never asked.
fn read_telemetry_consent(data_dir: &PathBuf) -> Option<bool> {
    std::fs::read_to_string(telemetry_consent_path(data_dir))
        .ok()
        .map(|s| s.trim() == "true")
}

fn write_telemetry_consent(data_dir: &PathBuf, accepted: bool) {
    let _ = std::fs::create_dir_all(data_dir);
    let _ = std::fs::write(
        telemetry_consent_path(data_dir),
        if accepted { "true" } else { "false" },
    );
}

/// Prompt the user for telemetry consent (non-blocking, saves result for next launch).
fn prompt_telemetry_consent(app: &tauri::AppHandle, data_dir: PathBuf) {
    use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

    app.dialog()
        .message(
            "Help improve Silex by sending anonymous crash reports and basic usage data?\n\n\
             No personal data or website content is ever collected.\n\
             You can change this later in Settings.",
        )
        .title("Telemetry")
        .kind(MessageDialogKind::Info)
        .buttons(MessageDialogButtons::OkCancelCustom(
            "Yes, help improve Silex".into(),
            "No thanks".into(),
        ))
        .show(move |accepted| {
            write_telemetry_consent(&data_dir, accepted);
            if accepted {
                tracing::info!("Telemetry opted in");
            } else {
                tracing::info!("Telemetry opted out");
            }
        });
}

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

#[tauri::command]
fn open_folder(path: String) {
    // Strip file:// prefix if present
    let path = path.strip_prefix("file://").unwrap_or(&path);
    let _ = open::that(path);
}

#[tauri::command]
fn log_debug(message: String) {
    tracing::debug!("[webview] {message}");
}

#[tauri::command]
fn get_glitchtip_dsn() -> Option<String> {
    // Only expose DSN to the frontend if the user has opted in
    let data_dir = dirs::data_dir()?.join("org.silex.desktop");
    if read_telemetry_consent(&data_dir) == Some(true) {
        option_env!("GLITCHTIP_DSN").map(String::from)
    } else {
        None
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
// Auto-update
// ==================

fn check_for_updates(app: tauri::AppHandle) {
    use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

    tauri::async_runtime::spawn(async move {
        tracing::info!("Checking for updates...");
        match app.updater().expect("updater not configured").check().await {
            Ok(Some(update)) => {
                let version = update.version.clone();
                let app_clone = app.clone();

                app.dialog()
                    .message(format!(
                        "Silex {} is available. Do you want to update now?",
                        version
                    ))
                    .title("Update Available")
                    .kind(MessageDialogKind::Info)
                    .buttons(MessageDialogButtons::OkCancelCustom(
                        "Update & Restart".into(),
                        "Later".into(),
                    ))
                    .show(move |accepted| {
                        if accepted {
                            tauri::async_runtime::spawn(async move {
                                tracing::info!("Downloading update v{}...", version);
                                match update.download_and_install(|_, _| {}, || {}).await {
                                    Ok(_) => {
                                        tracing::info!("Update installed, restarting...");
                                        app_clone.restart();
                                    }
                                    Err(e) => {
                                        tracing::error!("Update failed: {}", e);
                                    }
                                }
                            });
                        }
                    });
            }
            Ok(None) => {
                tracing::info!("No update available");
            }
            Err(e) => {
                tracing::warn!("Update check failed: {}", e);
            }
        }
    });
}

// ==================
// Server
// ==================

async fn start_server(pending_evals: mcp::PendingEvals, data_path: std::path::PathBuf) -> u16 {
    // Set SILEX_DATA_PATH so Config::from_env() picks it up (unless already set by user)
    if std::env::var("SILEX_DATA_PATH").is_err() {
        std::env::set_var("SILEX_DATA_PATH", &data_path);
    }
    let config = Config::from_env();

    let (app, port) = silex_server::build_app(config).await;

    // Add eval-callback route for JS→Rust result passing (same origin, no CORS)
    let app = app
        .route(
            "/eval-callback/{id}",
            axum::routing::post(mcp::eval_callback),
        )
        .layer(axum::Extension(pending_evals));

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = match TcpListener::bind(addr).await {
        Ok(l) => l,
        Err(_) => {
            // Port taken (another instance running) — bind to OS-assigned port
            let fallback = SocketAddr::from(([127, 0, 0, 1], 0));
            TcpListener::bind(fallback).await.unwrap()
        }
    };
    let addr = listener.local_addr().unwrap();
    let port = addr.port();
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
    // Fix EGL crash on Linux with certain GPU/Wayland configurations
    // (especially NVIDIA + recent WebKitGTK). Must be set before any
    // WebKit/GTK initialization. See: https://github.com/tauri-apps/tauri/issues/11988
    #[cfg(target_os = "linux")]
    {
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    // Resolve the app data dir early so we can check telemetry consent before Tauri starts.
    // This mirrors the path Tauri uses: ~/.local/share/org.silex.desktop (Linux),
    // ~/Library/Application Support/org.silex.desktop (macOS),
    // %APPDATA%/org.silex.desktop (Windows).
    let app_data_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("org.silex.desktop");
    let _ = std::fs::create_dir_all(&app_data_dir);

    // Initialize error tracking (GlitchTip / Sentry-compatible).
    // Sentry is always initialized when GLITCHTIP_DSN is set, but events are only
    // sent if the user has opted in. This way consent takes effect immediately
    // (no need to restart after opting in on first launch).
    let consent_dir_for_send = app_data_dir.clone();
    let consent_dir_for_traces = app_data_dir.clone();
    let _sentry_guard = sentry::init(sentry::ClientOptions {
        dsn: option_env!("GLITCHTIP_DSN")
            .and_then(|s| s.parse().ok()),
        release: Some(env!("CARGO_PKG_VERSION").into()),
        environment: Some(
            if cfg!(debug_assertions) { "development" } else { "production" }.into(),
        ),
        before_send: Some(std::sync::Arc::new(move |event| {
            if read_telemetry_consent(&consent_dir_for_send) == Some(true) {
                Some(event)
            } else {
                None
            }
        })),
        // Sample 100% of transactions (volume is low for a desktop app),
        // but only if the user has opted in.
        traces_sampler: Some(std::sync::Arc::new(move |_ctx| {
            if read_telemetry_consent(&consent_dir_for_traces) == Some(true) {
                1.0
            } else {
                0.0
            }
        })),
        // Track sessions for user count and crash-free rate
        auto_session_tracking: true,
        session_mode: sentry::SessionMode::Application,
        ..Default::default()
    });
    sentry::configure_scope(|scope| {
        scope.set_tag("os", std::env::consts::OS);
        scope.set_tag("arch", std::env::consts::ARCH);
    });

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "silex_server=info,silex_desktop=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .with(sentry::integrations::tracing::layer())
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            set_current_project,
            clear_current_project,
            mark_unsaved,
            open_folder,
            log_debug,
            get_glitchtip_dsn,
        ])
        .setup(|app| {
            // Log app launch with OS/arch info (visible in Issues even without errors)
            sentry::capture_event(sentry::protocol::Event {
                message: Some("app_started".into()),
                level: sentry::Level::Info,
                ..Default::default()
            });

            // Start a performance transaction for app startup
            let tx_ctx = sentry::TransactionContext::new("app_startup", "lifecycle");
            let transaction = sentry::start_transaction(tx_ctx);
            sentry::configure_scope(|scope| scope.set_span(Some(transaction.clone().into())));

            // Use Tauri's app_data_dir for user-writable storage
            let data_path = app.path().app_data_dir()
                .expect("failed to resolve app data dir")
                .join("storage");

            // On first launch, ask the user for telemetry consent.
            // The choice is saved and takes effect on next launch.
            let consent_dir = app.path().app_data_dir()
                .expect("failed to resolve app data dir");
            if option_env!("GLITCHTIP_DSN").is_some()
                && read_telemetry_consent(&consent_dir).is_none()
            {
                prompt_telemetry_consent(app.handle(), consent_dir);
            }

            // Show splash screen while the app loads
            let _splash = WebviewWindowBuilder::new(
                app,
                "splash",
                WebviewUrl::App("splash.html".into()),
            )
            .title("Silex")
            .inner_size(400.0, 300.0)
            .resizable(false)
            .decorations(false)
            .center()
            .always_on_top(true)
            .build()?;

            let pending_evals = mcp::PendingEvals::default();
            let port = tauri::async_runtime::block_on(start_server(pending_evals.clone(), data_path));

            let url = format!("http://localhost:{}/", port);
            let app_handle_for_splash = app.handle().clone();
            let window = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(url.parse().unwrap()),
            )
            .title("Silex")
            .maximized(true)
            .initialization_script(include_str!("../scripts/desktop-bridge.js"))
            .on_page_load(move |webview, payload| {
                if matches!(payload.event(), tauri::webview::PageLoadEvent::Finished) {
                    // Close splash — main window is already maximized behind it
                    if let Some(splash) = app_handle_for_splash.get_webview_window("splash") {
                        let _ = splash.close();
                    }
                    let _ = webview.set_focus();
                }
            })
            .build()?;

            // MCP transport: --stdio for agent-managed launch, HTTP otherwise
            if std::env::args().any(|a| a == "--stdio") {
                let mcp_handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    mcp::start_mcp_stdio(mcp_handle, pending_evals).await;
                });
            } else {
                let mcp_handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    mcp::start_mcp_server(mcp_handle, pending_evals, 6807).await;
                });
            }

            // Finish the startup transaction (sends to GlitchTip Performance)
            transaction.finish();

            // Check for updates in the background
            check_for_updates(app.handle().clone());

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
