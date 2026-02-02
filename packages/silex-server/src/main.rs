/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

use std::net::SocketAddr;
use std::sync::Arc;

use axum::Router;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tower_sessions::{MemoryStore, SessionManagerLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod connectors;
mod error;
mod models;
mod routes;
mod services;

use config::Config;
use connectors::{ConnectorRegistry, FsHosting, FsStorage};
use services::{configure_static_files, StaticConfig};

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "silex_server=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env();
    tracing::info!("Starting Silex server on {}", config.server_url());

    // Create and initialize connectors
    let registry = init_connectors(&config).await;

    // Create session layer (in-memory for dev; use Redis for production)
    let session_store = MemoryStore::default();
    let session_layer = SessionManagerLayer::new(session_store).with_secure(false);

    // Extract static config before moving config into Arc
    let static_config = StaticConfig {
        static_path: config.static_path.clone(),
        static_routes: config.static_routes.clone(),
    };
    let port = config.port;

    // Create application state
    let state = routes::AppState {
        config: Arc::new(config),
        registry: Arc::new(registry),
        job_manager: services::JobManager::new(),
    };

    // Build the router
    let app = Router::new()
        .nest("/api", routes::api_routes())
        .with_state(state);

    // Configure static file serving
    let app = configure_static_files(app, static_config);

    // Add middleware layers
    let app = app
        .layer(session_layer)
        .layer(TraceLayer::new_for_http())
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    // Start the server
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(addr).await.unwrap();
    tracing::info!("Listening on {}", addr);

    axum::serve(listener, app).await.unwrap();
}

/// Initialize storage and hosting connectors
async fn init_connectors(config: &Config) -> ConnectorRegistry {
    let mut registry = ConnectorRegistry::new();

    // Filesystem storage (stores website data)
    let fs_storage = FsStorage::new(config.data_path.clone(), config.assets_folder.clone());
    if let Err(e) = fs_storage.init(&config.default_website_id).await {
        tracing::warn!("Failed to initialize FsStorage: {}", e);
    }

    // Filesystem hosting (publishes websites)
    let fs_hosting = FsHosting::new(config.hosting_path.clone());
    if let Err(e) = fs_hosting.init().await {
        tracing::warn!("Failed to initialize FsHosting: {}", e);
    }

    registry.register_storage(Arc::new(fs_storage));
    registry.register_hosting(Arc::new(fs_hosting));

    registry
}
