/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Static file serving for the Silex frontend
//!
//! Serves the dashboard and editor from one or more directories on disk.
//! The dashboard is shown at `/` by default; the editor is shown when `?id=` is present.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

use axum::extract::{Query, Request};
use axum::http::{header, StatusCode};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Router;
use tower_http::services::ServeDir;

#[cfg(feature = "embed-frontend")]
use rust_embed::Embed;

/// Embedded frontend assets (compiled into the binary when `embed-frontend` feature is enabled).
/// The folder path is relative to silex-server's Cargo.toml.
#[cfg(feature = "embed-frontend")]
#[derive(Embed)]
#[folder = "../silex-lib/dist/client/"]
struct FrontendAssets;

/// Static file configuration
pub struct StaticConfig {
    /// Dashboard directory (its index.html is served at `/` when no `?id=`)
    pub dashboard_path: Option<PathBuf>,
    /// Simple mode: single directory at "/"
    pub static_path: Option<PathBuf>,
    /// Advanced mode: multiple route:path pairs
    pub static_routes: Vec<(String, PathBuf)>,
}

/// Configure static file serving on the router
///
/// When `dashboard_path` is set:
///   - `GET /` → dashboard `index.html` (no `?id=`)
///   - `GET /?id=...` → editor `index.html`
///   - All other paths → files from dashboard + editor directories
///
/// Without `dashboard_path`, falls back to the original ServeDir behavior.
pub fn configure_static_files<S: Clone + Send + Sync + 'static>(
    mut app: Router<S>,
    config: StaticConfig,
) -> Router<S> {
    // Collect all root directories (order matters: first match wins)
    let mut root_dirs: Vec<PathBuf> = Vec::new();
    let mut dashboard_index: Option<PathBuf> = None;
    let mut editor_index: Option<PathBuf> = None;

    // Dashboard directory first (its CSS/assets take priority for hashed filenames)
    if let Some(ref dashboard) = config.dashboard_path {
        if dashboard.exists() {
            tracing::info!("Dashboard: {}", dashboard.display());
            let idx = dashboard.join("index.html");
            if idx.exists() {
                dashboard_index = Some(idx);
            }
            root_dirs.push(dashboard.clone());
        } else {
            tracing::warn!("Dashboard path does not exist: {}", dashboard.display());
        }
    }

    // Non-root static routes (e.g., "/some-prefix" → some directory)
    for (route, path) in &config.static_routes {
        if route != "/" && path.exists() {
            tracing::info!("Static route: {} -> {}", route, path.display());
            app = app.nest_service(route, ServeDir::new(path));
        } else if route != "/" {
            tracing::warn!("Static route: {} -> {} (path does not exist)", route, path.display());
        }
    }

    // Root paths from static_routes
    for (route, path) in &config.static_routes {
        if route == "/" && path.exists() {
            if editor_index.is_none() {
                let idx = path.join("index.html");
                if idx.exists() {
                    editor_index = Some(idx);
                }
            }
            root_dirs.push(path.clone());
        }
    }

    // Root path from static_path
    if let Some(ref path) = config.static_path {
        if path.exists() {
            if editor_index.is_none() {
                let idx = path.join("index.html");
                if idx.exists() {
                    editor_index = Some(idx);
                }
            }
            root_dirs.push(path.clone());
        }
    }

    for dir in &root_dirs {
        tracing::info!("  / -> {}", dir.display());
    }

    // When dashboard is configured, serve `/` based on `?id=` query param
    if dashboard_index.is_some() && editor_index.is_some() {
        let dash_bytes: Vec<u8> =
            std::fs::read(dashboard_index.as_ref().unwrap()).unwrap_or_default();
        let edit_bytes: Vec<u8> =
            std::fs::read(editor_index.as_ref().unwrap()).unwrap_or_default();
        let dash = Arc::new(dash_bytes);
        let edit = Arc::new(edit_bytes);

        tracing::info!(
            "  / -> dashboard (default) or editor (?id=)",
        );

        app = app.route(
            "/",
            get(move |Query(params): Query<HashMap<String, String>>| {
                let dash = dash.clone();
                let edit = edit.clone();
                async move {
                    let body = if params.contains_key("id") {
                        edit.as_ref().clone()
                    } else {
                        dash.as_ref().clone()
                    };
                    (
                        [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
                        body,
                    )
                }
            }),
        );
    }

    // Fallback: serve static files from all root directories
    if !root_dirs.is_empty() {
        let dirs = Arc::new(root_dirs);
        app = app.fallback(move |req: Request| {
            let dirs = dirs.clone();
            async move { serve_from_dirs(&dirs, req.uri().path()).await }
        });
    } else {
        // No filesystem directories configured — try embedded assets
        #[cfg(feature = "embed-frontend")]
        {
            tracing::info!("Serving embedded frontend assets");

            // Serve index.html at /
            app = app.route(
                "/",
                get(|| async {
                    match FrontendAssets::get("index.html") {
                        Some(content) => (
                            [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
                            content.data.to_vec(),
                        )
                            .into_response(),
                        None => StatusCode::NOT_FOUND.into_response(),
                    }
                }),
            );

            // Serve all other embedded files as fallback
            app = app.fallback(|req: Request| async move {
                serve_embedded(req.uri().path()).await
            });
        }
    }

    app
}

/// Serve a file from embedded frontend assets.
#[cfg(feature = "embed-frontend")]
async fn serve_embedded(uri_path: &str) -> impl IntoResponse {
    let path = uri_path.trim_start_matches('/');
    if path.contains("..") {
        return StatusCode::NOT_FOUND.into_response();
    }
    match FrontendAssets::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();
            let content_type = if mime.type_() == mime_guess::mime::TEXT
                || mime.subtype() == mime_guess::mime::JAVASCRIPT
            {
                format!("{}; charset=utf-8", mime)
            } else {
                mime.to_string()
            };
            ([(header::CONTENT_TYPE, content_type)], content.data.to_vec()).into_response()
        }
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

/// Try to serve a file from multiple directories in order. First match wins.
async fn serve_from_dirs(dirs: &[PathBuf], uri_path: &str) -> impl IntoResponse {
    let path = uri_path.trim_start_matches('/');

    // Basic path traversal protection
    if path.contains("..") {
        return StatusCode::NOT_FOUND.into_response();
    }

    for dir in dirs {
        let file = dir.join(path);
        // If the path points to a directory (or is empty), try index.html
        let file = if file.is_dir() || path.is_empty() {
            file.join("index.html")
        } else {
            file
        };
        if file.is_file() {
            if let Ok(bytes) = tokio::fs::read(&file).await {
                let mime = mime_guess::from_path(&file).first_or_octet_stream();
                let content_type = if mime.type_() == mime_guess::mime::TEXT
                    || mime.subtype() == mime_guess::mime::JAVASCRIPT
                {
                    format!("{}; charset=utf-8", mime)
                } else {
                    mime.to_string()
                };
                return ([(header::CONTENT_TYPE, content_type)], bytes).into_response();
            }
        }
    }

    StatusCode::NOT_FOUND.into_response()
}
