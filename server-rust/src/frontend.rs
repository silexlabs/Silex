/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Serving of the frontend, compiled into the binary
//!
//! The dashboard is served at `/`, the editor at `/?id=<website id>`.
//! Without the `embed-frontend` feature the crate serves the API only.

use axum::Router;

#[cfg(feature = "embed-frontend")]
use axum::extract::{Query, Request};
#[cfg(feature = "embed-frontend")]
use axum::http::{header, StatusCode};
#[cfg(feature = "embed-frontend")]
use axum::response::{IntoResponse, Response};
#[cfg(feature = "embed-frontend")]
use axum::routing::get;
#[cfg(feature = "embed-frontend")]
use rust_embed::Embed;
#[cfg(feature = "embed-frontend")]
use std::collections::HashMap;

/// Editor assets, path relative to this crate's Cargo.toml
#[cfg(feature = "embed-frontend")]
#[derive(Embed)]
#[folder = "../dist/client/"]
struct EditorAssets;

/// Dashboard assets, the landing page shown at `/`
#[cfg(feature = "embed-frontend")]
#[derive(Embed)]
#[folder = "../silex-dashboard-2026/public/"]
struct DashboardAssets;

/// Serve the embedded frontend on the given router
#[cfg(feature = "embed-frontend")]
pub fn configure<S: Clone + Send + Sync + 'static>(app: Router<S>) -> Router<S> {
    app.route(
        "/",
        get(|Query(params): Query<HashMap<String, String>>| async move {
            if params.contains_key("id") {
                serve::<EditorAssets>("index.html")
            } else {
                serve::<DashboardAssets>("index.html")
            }
        }),
    )
    // Dashboard assets take priority, the editor serves everything else
    .fallback(|req: Request| async move {
        let path = req.uri().path().trim_start_matches('/');
        match try_serve::<DashboardAssets>(path) {
            Some(response) => response,
            None => serve::<EditorAssets>(path),
        }
    })
}

#[cfg(not(feature = "embed-frontend"))]
pub fn configure<S: Clone + Send + Sync + 'static>(app: Router<S>) -> Router<S> {
    app
}

#[cfg(feature = "embed-frontend")]
fn try_serve<E: Embed>(path: &str) -> Option<Response> {
    // In debug builds rust-embed reads the folder from disk instead of the
    // binary, so a path escaping it has to be refused
    if path.contains("..") {
        return None;
    }

    E::get(path).map(|content| {
        let mime = mime_guess::from_path(path).first_or_octet_stream();
        let content_type = if mime.type_() == mime_guess::mime::TEXT
            || mime.subtype() == mime_guess::mime::JAVASCRIPT
        {
            format!("{}; charset=utf-8", mime)
        } else {
            mime.to_string()
        };
        (
            [(header::CONTENT_TYPE, content_type)],
            content.data.to_vec(),
        )
            .into_response()
    })
}

#[cfg(feature = "embed-frontend")]
fn serve<E: Embed>(path: &str) -> Response {
    try_serve::<E>(path).unwrap_or_else(|| StatusCode::NOT_FOUND.into_response())
}
