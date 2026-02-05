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

    let static_config = StaticConfig {
        dashboard_path: config.dashboard_path.clone(),
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

    let fs_hosting = FsHosting::new(config.data_path.clone(), config.hosting_path.clone());
    if let Err(e) = fs_hosting.init().await {
        tracing::warn!("Failed to initialize FsHosting: {}", e);
    }

    registry.register_storage(Arc::new(fs_storage));
    registry.register_hosting(Arc::new(fs_hosting));

    registry
}
