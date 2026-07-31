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
//! The URLs and the JSON shapes are dictated by the editor, which is shared
//! with the SaaS: this crate is the local implementation of that contract.

mod connector;
mod publication;
mod website;

use std::path::PathBuf;
use std::sync::Arc;

use axum::Router;

use crate::actions::Actions;
use crate::config::Config;

/// State shared by all route handlers
#[derive(Clone)]
pub struct AppState {
    /// Directory holding one sub directory per website
    pub data_path: Arc<PathBuf>,
    /// Who performs the actions the server asks for, when somebody does
    pub actions: Option<Arc<dyn Actions>>,
}

impl AppState {
    pub fn new(config: &Config) -> Self {
        AppState {
            data_path: Arc::new(config.data_path.clone()),
            actions: config.actions.clone(),
        }
    }
}

/// Build the API router
pub fn api_routes() -> Router<AppState> {
    Router::new()
        .nest("/connector", connector::routes())
        .nest("/website", website::routes())
        .nest("/publication", publication::routes())
}
