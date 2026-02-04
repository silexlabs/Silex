/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Silex Server Library
//!
//! This crate provides the core server functionality for Silex website builder.
//! It includes storage and hosting connectors, API routes, and supporting services.

pub mod config;
pub mod connectors;
pub mod error;
pub mod models;
pub mod routes;
pub mod services;

use std::sync::Arc;

use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tower_sessions::{MemoryStore, SessionManagerLayer};

#[cfg(feature = "embed-ui")]
mod embedded_ui {
    use axum::extract::Path;
    use axum::http::{header, StatusCode};
    use axum::response::IntoResponse;
    use include_dir::{include_dir, Dir};

    static DASHBOARD_DIR: Dir<'_> =
        include_dir!("$CARGO_MANIFEST_DIR/../silex_silex-dashboard-2026/public");

    static FRONTEND_DIR: Dir<'_> =
        include_dir!("$CARGO_MANIFEST_DIR/../silex-lib/dist/client");

    fn serve_from_dir(dir: &'static Dir<'static>, path: &str) -> Result<impl IntoResponse, StatusCode> {
        let file = dir.get_file(path).ok_or(StatusCode::NOT_FOUND)?;
        let mime = mime_guess::from_path(path).first_or_octet_stream();
        // Add charset=utf-8 for text types so browsers don't misinterpret UTF-8 as Latin-1
        let content_type = if mime.type_() == mime_guess::mime::TEXT
            || mime.subtype() == mime_guess::mime::JAVASCRIPT
        {
            format!("{}; charset=utf-8", mime)
        } else {
            mime.to_string()
        };
        Ok(([(header::CONTENT_TYPE, content_type)], file.contents()))
    }

    pub async fn dashboard_index() -> impl IntoResponse {
        serve_from_dir(&DASHBOARD_DIR, "index.html")
    }

    pub async fn dashboard_file(Path(path): Path<String>) -> impl IntoResponse {
        serve_from_dir(&DASHBOARD_DIR, &path)
    }

    pub async fn frontend_file(Path(path): Path<String>) -> impl IntoResponse {
        serve_from_dir(&FRONTEND_DIR, &path)
    }

    pub async fn frontend_index() -> impl IntoResponse {
        serve_from_dir(&FRONTEND_DIR, "index.html")
    }
}

// Re-export commonly used types for convenience
pub use config::Config;
pub use connectors::{ConnectorRegistry, FsHosting, FsStorage, HostingConnector, StorageConnector};
pub use error::ConnectorError;
pub use models::{ConnectorType, WebsiteData, WebsiteMeta};
pub use services::{configure_static_files, JobManager, StaticConfig};

/// Build the full application router, ready to be served.
///
/// Returns the router and the port number from the config.
/// The router includes API routes, static file serving, sessions, CORS, and tracing.
pub async fn build_app(config: Config) -> (Router, u16) {
    let registry = init_connectors(&config).await;

    let session_store = MemoryStore::default();
    let session_layer = SessionManagerLayer::new(session_store).with_secure(false);

    let port = config.port;

    #[cfg(not(feature = "embed-ui"))]
    let static_config = StaticConfig {
        static_path: config.static_path.clone(),
        static_routes: config.static_routes.clone(),
    };

    let state = routes::AppState {
        config: Arc::new(config),
        registry: Arc::new(registry),
        job_manager: JobManager::new(),
    };

    let app = Router::new()
        .nest("/api", routes::api_routes())
        .with_state(state);

    // When embed-ui is enabled, serve dashboard and frontend from the binary.
    // Otherwise, fall back to disk-based static file serving.
    #[cfg(feature = "embed-ui")]
    let app = {
        use axum::routing::get;
        app.route("/welcome", get(embedded_ui::dashboard_index))
            .route("/welcome/*path", get(embedded_ui::dashboard_file))
            .route("/*path", get(embedded_ui::frontend_file))
            .fallback(get(embedded_ui::frontend_index))
    };

    #[cfg(not(feature = "embed-ui"))]
    let app = configure_static_files(app, static_config);

    let app = app
        .layer(session_layer)
        .layer(TraceLayer::new_for_http())
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    (app, port)
}

/// Initialize storage and hosting connectors from config
pub async fn init_connectors(config: &Config) -> ConnectorRegistry {
    let mut registry = ConnectorRegistry::new();

    let fs_storage = FsStorage::new(config.data_path.clone(), config.assets_folder.clone());
    if let Err(e) = fs_storage.init(&config.default_website_id).await {
        tracing::warn!("Failed to initialize FsStorage: {}", e);
    }

    let fs_hosting = FsHosting::new(config.hosting_path.clone());
    if let Err(e) = fs_hosting.init().await {
        tracing::warn!("Failed to initialize FsHosting: {}", e);
    }

    registry.register_storage(Arc::new(fs_storage));
    registry.register_hosting(Arc::new(fs_hosting));

    registry
}


