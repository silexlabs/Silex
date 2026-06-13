/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! API routes for Silex server
//!
//! This module defines all HTTP endpoints for the Silex API.
//! Routes are organized into submodules by functionality.

mod connector;
mod publication;
mod website;

use std::sync::Arc;

use axum::routing::get;
use axum::Router;

use crate::config::Config;
use crate::connectors::ConnectorRegistry;
use crate::services::JobManager;

/// Shared application state
///
/// This state is available to all route handlers via Axum's State extractor.
#[derive(Clone)]
pub struct AppState {
    /// Server configuration
    pub config: Arc<Config>,

    /// Registry of available connectors
    pub registry: Arc<ConnectorRegistry>,

    /// Job manager for tracking async operations (shared across requests)
    pub job_manager: JobManager,
}

impl AppState {
    /// Get the shared job manager
    pub fn job_manager(&self) -> JobManager {
        self.job_manager.clone()
    }
}

/// Build the API router with all routes
pub fn api_routes() -> Router<AppState> {
    Router::new()
        // Health check endpoint
        .route("/health", get(health_check))
        // Connector routes (authentication, user info)
        .nest("/connector", connector::routes())
        // Website routes (CRUD operations)
        .nest("/website", website::routes())
        // Publication routes
        .nest("/publication", publication::routes())
}

/// Health check endpoint
///
/// Returns a simple JSON response to verify the server is running.
async fn health_check() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "status": "ok",
        "service": "silex-server",
        "version": env!("CARGO_PKG_VERSION")
    }))
}
