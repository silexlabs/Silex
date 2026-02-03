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

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tokio::net::TcpListener;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use silex_server::Config;

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
    update_menu_state(&app, true);
}

#[tauri::command]
fn clear_current_project(app: tauri::AppHandle, state: tauri::State<'_, AppState>) {
    *state.current_website_id.lock().unwrap() = None;
    *state.current_website_name.lock().unwrap() = None;
    *state.has_unsaved_changes.lock().unwrap() = false;

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_title("Silex");
    }
    update_menu_state(&app, false);
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

// ==================
// Menu
// ==================

fn build_menu(app: &tauri::AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let file_menu = Submenu::with_id_and_items(
        app,
        "file",
        "File",
        true,
        &[
            &MenuItem::with_id(app, "new_project", "New Project", true, Some("CmdOrCtrl+N"))?,
            &MenuItem::with_id(
                app,
                "open_project",
                "Open Project...",
                true,
                Some("CmdOrCtrl+O"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "save", "Save", false, Some("CmdOrCtrl+S"))?,
            &MenuItem::with_id(
                app,
                "duplicate",
                "Duplicate",
                false,
                Some("CmdOrCtrl+Shift+S"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                "close_project",
                "Close Project",
                false,
                Some("CmdOrCtrl+W"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, Some("Quit Silex"))?,
        ],
    )?;

    let edit_menu = Submenu::with_id_and_items(
        app,
        "edit",
        "Edit",
        true,
        &[
            &MenuItem::with_id(app, "undo", "Undo", false, Some("CmdOrCtrl+Z"))?,
            &MenuItem::with_id(app, "redo", "Redo", false, Some("CmdOrCtrl+Shift+Z"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, Some("Cut"))?,
            &PredefinedMenuItem::copy(app, Some("Copy"))?,
            &PredefinedMenuItem::paste(app, Some("Paste"))?,
            &PredefinedMenuItem::select_all(app, Some("Select All"))?,
        ],
    )?;

    let view_menu = Submenu::with_id_and_items(
        app,
        "view",
        "View",
        true,
        &[
            &MenuItem::with_id(
                app,
                "toggle_fullscreen",
                "Toggle Fullscreen",
                true,
                Some("F11"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "zoom_in", "Zoom In", true, Some("CmdOrCtrl+="))?,
            &MenuItem::with_id(app, "zoom_out", "Zoom Out", true, Some("CmdOrCtrl+-"))?,
            &MenuItem::with_id(app, "zoom_reset", "Reset Zoom", true, Some("CmdOrCtrl+0"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "dev_tools", "Developer Tools", true, Some("F12"))?,
        ],
    )?;

    let help_menu = Submenu::with_id_and_items(
        app,
        "help",
        "Help",
        true,
        &[
            &MenuItem::with_id(app, "about", "About Silex", true, None::<&str>)?,
            &MenuItem::with_id(app, "documentation", "Documentation", true, None::<&str>)?,
        ],
    )?;

    Menu::with_items(app, &[&file_menu, &edit_menu, &view_menu, &help_menu])
}

fn update_menu_state(app: &tauri::AppHandle, has_project: bool) {
    if let Some(menu) = app.menu() {
        for id in ["save", "duplicate", "close_project", "undo", "redo"] {
            if let Some(item) = menu.get(id) {
                if let Some(mi) = item.as_menuitem() {
                    let _ = mi.set_enabled(has_project);
                }
            }
        }
    }
}

fn handle_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    let id = event.id().as_ref();

    match id {
        "new_project" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval("window.location.href = '/welcome?action=new'");
            }
        }
        "open_project" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval("window.location.href = '/welcome'");
            }
        }
        "save" => {
            let _ = app.emit("menu-save", ());
        }
        "duplicate" => {
            let _ = app.emit("menu-duplicate", ());
        }
        "close_project" => {
            let state = app.state::<AppState>();
            let has_changes = *state.has_unsaved_changes.lock().unwrap();
            if has_changes {
                show_save_dialog(app);
            } else {
                let _ = app.emit("menu-close-project", ());
            }
        }
        "undo" => {
            let _ = app.emit("menu-undo", ());
        }
        "redo" => {
            let _ = app.emit("menu-redo", ());
        }
        "toggle_fullscreen" => {
            if let Some(window) = app.get_webview_window("main") {
                let is_fullscreen = window.is_fullscreen().unwrap_or(false);
                let _ = window.set_fullscreen(!is_fullscreen);
            }
        }
        "zoom_in" => {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.eval(
                    "document.body.style.zoom = (parseFloat(document.body.style.zoom || 1) + 0.1).toString()",
                );
            }
        }
        "zoom_out" => {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.eval(
                    "document.body.style.zoom = (parseFloat(document.body.style.zoom || 1) - 0.1).toString()",
                );
            }
        }
        "zoom_reset" => {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.eval("document.body.style.zoom = '1'");
            }
        }
        "dev_tools" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.open_devtools();
            }
        }
        "about" => {
            use tauri_plugin_dialog::DialogExt;
            app.dialog()
                .message(format!(
                    "Silex v{}\n\nFree/libre no-code website builder.\nhttps://www.silex.me",
                    env!("CARGO_PKG_VERSION")
                ))
                .title("About Silex")
                .blocking_show();
        }
        "documentation" => {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.eval("window.open('https://docs.silex.me', '_blank')");
            }
        }
        _ => {}
    }
}

fn show_save_dialog(app: &tauri::AppHandle) {
    use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

    let app_handle = app.clone();
    app.dialog()
        .message("Do you want to save changes to the current project?")
        .title("Silex")
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::OkCancelCustom(
            "Save".into(),
            "Don't Save".into(),
        ))
        .show(move |result| {
            if result {
                let _ = app_handle.emit("menu-save-and-close", ());
            } else {
                let _ = app_handle.emit("menu-close-project", ());
            }
        });
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
            } else {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.destroy();
                }
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

async fn start_server() -> u16 {
    let mut config = Config::from_env();

    let frontend_path = resolve_frontend_path();
    tracing::info!("Frontend path: {}", frontend_path.display());
    config.static_path = Some(frontend_path);

    let (app, port) = silex_server::build_app(config).await;

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
            let port = tauri::async_runtime::block_on(start_server());
            let menu = build_menu(app.handle())?;

            let url = format!("http://localhost:{}/welcome", port);
            let window = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(url.parse().unwrap()),
            )
            .title("Silex")
            .inner_size(1280.0, 800.0)
            .menu(menu)
            .initialization_script(include_str!("../scripts/desktop-bridge.js"))
            .build()?;

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
        .on_menu_event(handle_menu_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
