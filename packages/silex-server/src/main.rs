/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

use std::net::SocketAddr;

use tokio::net::TcpListener;
use tower::Layer;
use tower_http::normalize_path::NormalizePathLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use silex_server::Config;

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

    // Build the application
    let (app, port) = silex_server::build_app(config).await;

    // Start the server
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(addr).await.unwrap();
    tracing::info!("Listening on {}", addr);

    let app = NormalizePathLayer::trim_trailing_slash().layer(app);
    axum::serve(listener, axum::ServiceExt::<axum::extract::Request>::into_make_service(app)).await.unwrap();
}
