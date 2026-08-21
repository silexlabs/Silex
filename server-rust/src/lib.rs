/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Silex server
//!
//! Serves the Silex frontend and the API it needs, on top of a directory of
//! websites. It knows nothing about the machine it runs on: it starts no
//! process and never leaves its data path.

mod actions;
mod config;
mod error;
mod frontend;
mod jobs;
mod models;
mod publish;
mod routes;
mod storage;

use axum::Router;
use tower_http::trace::TraceLayer;

pub use actions::{Actions, Hosting, OptionsField, OptionsForm, PublicationOptions};
pub use config::{Config, PORT};
pub use jobs::{Job, JobData, JobStatus, Jobs};
pub use storage::published_files_url;

/// Build the application router, ready to be served
pub async fn build_app(config: Config) -> (Router, u16) {
    if let Err(e) = storage::init(&config.data_path).await {
        tracing::warn!("Failed to create the data directory: {}", e);
    }

    let app = Router::new()
        .nest("/api", routes::api_routes())
        .with_state(routes::AppState::new(&config));

    let app = frontend::configure(app).layer(TraceLayer::new_for_http());

    (app, PORT)
}
