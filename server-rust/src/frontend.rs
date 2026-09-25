/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Serving of the editor, compiled into the binary
//!
//! What else is served at `/` is up to whoever runs the server. Without the
//! `embed-frontend` feature the crate serves the API only.

use axum::Router;

#[cfg(feature = "embed-frontend")]
use axum::extract::Request;
#[cfg(feature = "embed-frontend")]
use axum::http::{header, StatusCode};
#[cfg(feature = "embed-frontend")]
use axum::response::{IntoResponse, Response};
#[cfg(feature = "embed-frontend")]
use rust_embed::Embed;

/// Editor assets, path relative to this crate's Cargo.toml
#[cfg(feature = "embed-frontend")]
#[derive(Embed)]
#[folder = "../dist/client/"]
// The same bundle under its stable name, for the dashboard of the hosted Silex
#[exclude = "js/main.js*"]
pub struct EditorAssets;

/// A fallback rather than a route: a route would settle what `/` is for
/// everyone, and the desktop app has its own answer to that
#[cfg(feature = "embed-frontend")]
pub fn configure<S: Clone + Send + Sync + 'static>(app: Router<S>) -> Router<S> {
    app.fallback(|req: Request| async move {
        serve::<EditorAssets>(asset(req.uri().path()), if_none_match(&req))
    })
}

#[cfg(not(feature = "embed-frontend"))]
pub fn configure<S: Clone + Send + Sync + 'static>(app: Router<S>) -> Router<S> {
    app
}

/// The file a request asks for, the page itself when it names none
#[cfg(feature = "embed-frontend")]
fn asset(path: &str) -> &str {
    match path.trim_start_matches('/') {
        "" => "index.html",
        path => path,
    }
}

/// Every opening of the editor loads the page again: with the ETag the 2 MB
/// bundle comes from WebKit's cache, and `no-cache` still asks, so a new build
/// is never served stale
#[cfg(feature = "embed-frontend")]
pub fn try_serve<E: Embed>(path: &str, if_none_match: Option<&str>) -> Option<Response> {
    // In debug builds rust-embed reads the folder from disk instead of the
    // binary, so a path escaping it has to be refused
    if path.contains("..") {
        return None;
    }

    E::get(path).map(|content| {
        let etag = format!("\"{}\"", hex(&content.metadata.sha256_hash()));
        let cache = [
            (header::ETAG, etag.clone()),
            (header::CACHE_CONTROL, "no-cache".to_string()),
        ];
        if if_none_match == Some(etag.as_str()) {
            return (StatusCode::NOT_MODIFIED, cache).into_response();
        }
        let mime = mime_guess::from_path(path).first_or_octet_stream();
        let content_type = if mime.type_() == mime_guess::mime::TEXT
            || mime.subtype() == mime_guess::mime::JAVASCRIPT
        {
            format!("{}; charset=utf-8", mime)
        } else {
            mime.to_string()
        };
        (cache, [(header::CONTENT_TYPE, content_type)], content.data).into_response()
    })
}

#[cfg(feature = "embed-frontend")]
fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

#[cfg(feature = "embed-frontend")]
pub fn serve<E: Embed>(path: &str, if_none_match: Option<&str>) -> Response {
    try_serve::<E>(path, if_none_match).unwrap_or_else(|| StatusCode::NOT_FOUND.into_response())
}

#[cfg(feature = "embed-frontend")]
pub fn if_none_match<B>(req: &axum::http::Request<B>) -> Option<&str> {
    req.headers()
        .get(header::IF_NONE_MATCH)
        .and_then(|value| value.to_str().ok())
}
