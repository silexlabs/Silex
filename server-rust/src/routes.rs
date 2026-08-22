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

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use axum::extract::{DefaultBodyLimit, OriginalUri, Request, State};
use axum::http::StatusCode;
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Response};
use axum::Router;

use crate::actions::Actions;
use crate::config::Config;
use crate::error::Error;
use crate::jobs::Jobs;

/// State shared by all route handlers
#[derive(Clone)]
pub struct AppState {
    /// Directory holding one sub directory per website
    pub data_path: Arc<PathBuf>,
    /// Who performs the actions the server asks for, when somebody does
    pub actions: Option<Arc<dyn Actions>>,
    /// Why a website could not be versioned, the last time it was said
    ///
    /// A website saves itself every few seconds. A repository that cannot take
    /// a version fails at every one of those saves, and saying so each time
    /// would bury the editor under one message. It is said once, and again only
    /// when the reason changes.
    pub not_versioned: Arc<Mutex<HashMap<String, String>>>,
    /// The publications the editor is following
    pub jobs: Jobs,
    /// Largest request body accepted, in bytes
    pub body_limit: usize,
}

impl AppState {
    pub fn new(config: &Config) -> Self {
        AppState {
            data_path: Arc::new(config.data_path.clone()),
            actions: config.actions.clone(),
            not_versioned: Arc::new(Mutex::new(HashMap::new())),
            jobs: Jobs::default(),
            body_limit: config.body_limit,
        }
    }
}

/// Build the API router
pub fn api_routes(body_limit: usize) -> Router<AppState> {
    Router::new()
        .nest("/connector", connector::routes())
        .nest("/website", website::routes())
        .nest("/publication", publication::routes())
        .fallback(same_route_without_the_slash)
        .layer(DefaultBodyLimit::max(body_limit))
        .layer(middleware::from_fn_with_state(body_limit, in_plain_words))
}

/// Answer `/api/connector/` the way `/api/connector` is answered
///
/// The Express server this one stands in for answers a route with or without
/// its last slash, and the dashboard asks for `/api/connector/`. Sending the
/// caller to the route that exists keeps both spellings working, whoever wrote
/// them.
async fn same_route_without_the_slash(OriginalUri(asked): OriginalUri) -> Response {
    let Some(path) = asked
        .path()
        .strip_suffix('/')
        .filter(|path| !path.is_empty())
    else {
        return (StatusCode::NOT_FOUND, "Not found").into_response();
    };
    let elsewhere = match asked.query() {
        Some(query) => format!("{}?{}", path, query),
        None => path.to_string(),
    };
    // Permanent and method-preserving: a POST that lands here has a body to
    // carry over, which a 301 would turn into a GET
    (
        StatusCode::PERMANENT_REDIRECT,
        [(axum::http::header::LOCATION, elsewhere)],
    )
        .into_response()
}

/// Say what a body over the limit is, in words the person editing can act on
///
/// The extractors turn it into "Failed to buffer the request body: length limit
/// exceeded", which the editor shows as it is.
async fn in_plain_words(State(body_limit): State<usize>, request: Request, next: Next) -> Response {
    let response = next.run(request).await;

    if response.status() == StatusCode::PAYLOAD_TOO_LARGE {
        return Error::TooLarge(body_limit).into_response();
    }

    response
}
