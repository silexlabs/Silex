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

use tauri::Manager;
use tokio::net::TcpListener;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use silex_server::Config;

/// Start the embedded Silex API server in the background.
///
/// Returns the URL the server is listening on.
async fn start_server() -> String {
    let mut config = Config::from_env();

    // Use port 0 to let the OS pick a free port
    config.port = 0;

    let (app, _) = silex_server::build_app(config).await;

    let addr = SocketAddr::from(([127, 0, 0, 1], 0));
    let listener = TcpListener::bind(addr).await.unwrap();
    let actual_addr = listener.local_addr().unwrap();
    let url = format!("http://{}", actual_addr);

    tracing::info!("Silex server listening on {}", url);

    // Spawn the server in the background
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    url
}

fn main() {
    // Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "silex_server=info,silex_desktop=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            // Start the API server on the Tokio runtime
            tauri::async_runtime::spawn(async move {
                let server_url = start_server().await;
                tracing::info!("Server ready at {}", server_url);

                // Navigate the main window to the server URL
                if let Some(window) = handle.get_webview_window("main") {
                    let url: url::Url = server_url.parse().unwrap();
                    let _ = window.navigate(url);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
