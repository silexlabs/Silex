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
//! Configures serving of static files from multiple directories.
//! Supports both simple (single directory) and advanced (multiple routes) modes.

use std::path::PathBuf;

use axum::Router;
use tower_http::services::{ServeDir, ServeFile};

/// Static file configuration
pub struct StaticConfig {
    /// Simple mode: single directory at "/"
    pub static_path: Option<PathBuf>,
    /// Advanced mode: multiple route:path pairs
    pub static_routes: Vec<(String, PathBuf)>,
}

/// Configure static file serving on the router
///
/// Priority: static_routes > static_path
///
/// For static_routes, non-root routes (e.g., "/assets", "/css") are served directly.
/// Multiple "/" routes are combined with fallback behavior, searching each directory
/// in order until a file is found.
pub fn configure_static_files<S: Clone + Send + Sync + 'static>(
    mut app: Router<S>,
    config: StaticConfig,
) -> Router<S> {
    if !config.static_routes.is_empty() {
        app = configure_routes(app, config.static_routes);
    } else if let Some(path) = config.static_path {
        app = configure_single_path(app, path);
    }
    app
}

/// Configure multiple static routes
fn configure_routes<S: Clone + Send + Sync + 'static>(
    mut app: Router<S>,
    routes: Vec<(String, PathBuf)>,
) -> Router<S> {
    tracing::info!("Configuring {} static route(s)", routes.len());

    // Add non-root routes first (e.g., /assets/, /css/)
    for (route, path) in &routes {
        if route != "/" && path.exists() {
            tracing::info!("  {} -> {}", route, path.display());
            app = app.nest_service(route, ServeDir::new(path));
        } else if route != "/" {
            tracing::warn!("  {} -> {} (path does not exist)", route, path.display());
        }
    }

    // Collect root paths
    let root_paths: Vec<PathBuf> = routes
        .iter()
        .filter(|(route, path)| route == "/" && path.exists())
        .map(|(_, path)| path.clone())
        .collect();

    if root_paths.is_empty() {
        return app;
    }

    // Find index.html for SPA fallback
    let index_path = root_paths
        .iter()
        .map(|p| p.join("index.html"))
        .find(|p| p.exists())
        .unwrap_or_else(|| root_paths[0].join("index.html"));

    for path in &root_paths {
        tracing::info!("  / -> {}", path.display());
    }
    tracing::info!("  SPA fallback: {}", index_path.display());

    // For multiple root paths, chain ServeDir with fallbacks
    // Start from the last and work backwards, each becoming a fallback for the previous
    match root_paths.len() {
        0 => app,
        1 => {
            let serve_dir = ServeDir::new(&root_paths[0])
                .not_found_service(ServeFile::new(&index_path));
            app.fallback_service(serve_dir)
        }
        2 => {
            // Two directories: second is fallback for first, index.html is final fallback
            let inner = ServeDir::new(&root_paths[1])
                .not_found_service(ServeFile::new(&index_path));
            let outer = ServeDir::new(&root_paths[0]).not_found_service(inner);
            app.fallback_service(outer)
        }
        3 => {
            // Three directories
            let inner = ServeDir::new(&root_paths[2])
                .not_found_service(ServeFile::new(&index_path));
            let middle = ServeDir::new(&root_paths[1]).not_found_service(inner);
            let outer = ServeDir::new(&root_paths[0]).not_found_service(middle);
            app.fallback_service(outer)
        }
        _ => {
            // For more than 3, just use the last one (with warning)
            tracing::warn!(
                "More than 3 root paths configured; only using last 3: {:?}",
                root_paths.iter().rev().take(3).collect::<Vec<_>>()
            );
            let inner = ServeDir::new(&root_paths[root_paths.len() - 1])
                .not_found_service(ServeFile::new(&index_path));
            let middle =
                ServeDir::new(&root_paths[root_paths.len() - 2]).not_found_service(inner);
            let outer =
                ServeDir::new(&root_paths[root_paths.len() - 3]).not_found_service(middle);
            app.fallback_service(outer)
        }
    }
}

/// Configure a single static path at "/"
fn configure_single_path<S: Clone + Send + Sync + 'static>(
    app: Router<S>,
    path: PathBuf,
) -> Router<S> {
    if path.exists() {
        tracing::info!("Serving static files from {}", path.display());
        let index = path.join("index.html");
        let serve_dir = ServeDir::new(&path).not_found_service(ServeFile::new(index));
        app.fallback_service(serve_dir)
    } else {
        tracing::warn!("Static path {} does not exist", path.display());
        app
    }
}
