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
        match asset(req.uri().path()) {
            "index.html" => serve_editor::<EditorAssets>(if_none_match(&req)),
            path => serve::<EditorAssets>(path, if_none_match(&req)),
        }
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
        if if_none_match.is_some_and(|tags| matches(tags, &etag)) {
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

/// RFC 9110 §13.1.2: `*` or a list of tags, compared weakly, so `W/` does not count
#[cfg(feature = "embed-frontend")]
fn matches(if_none_match: &str, etag: &str) -> bool {
    if_none_match.trim() == "*"
        || if_none_match
            .split(',')
            .any(|tag| tag.trim().trim_start_matches("W/") == etag)
}

#[cfg(feature = "embed-frontend")]
fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

#[cfg(feature = "embed-frontend")]
pub fn serve<E: Embed>(path: &str, if_none_match: Option<&str>) -> Response {
    try_serve::<E>(path, if_none_match).unwrap_or_else(|| StatusCode::NOT_FOUND.into_response())
}

/// The desktop app gives the editor its IPC, so no script from elsewhere may
/// run there, only its bundle and the inline script that starts it. A website
/// in the canvas takes its styles, fonts, images and embeds from anywhere, and
/// its data sources are any https API.
#[cfg(feature = "embed-frontend")]
fn editor_csp(page: &[u8]) -> String {
    use base64::Engine;
    use sha2::{Digest, Sha256};

    let page = String::from_utf8_lossy(page);
    let inline: String = page
        .split("<script>")
        .skip(1)
        .filter_map(|rest| rest.split_once("</script>"))
        .map(|(script, _)| {
            let hash = base64::engine::general_purpose::STANDARD.encode(Sha256::digest(script));
            format!(" 'sha256-{hash}'")
        })
        .collect();
    [
        "default-src 'self'".to_string(),
        format!("script-src 'self'{inline}"),
        "style-src 'self' 'unsafe-inline' https:".into(),
        "font-src 'self' data: https:".into(),
        "img-src 'self' data: blob: https: http:".into(),
        "media-src 'self' data: blob: https: http:".into(),
        "frame-src 'self' https:".into(),
        "connect-src 'self' ipc: http://ipc.localhost https: http:".into(),
        "worker-src 'self' blob:".into(),
        "object-src 'none'".into(),
        "base-uri 'self'".into(),
        "form-action 'self'".into(),
        "frame-ancestors 'self'".into(),
    ]
    .join("; ")
}

/// The editor's page, with its content security policy
#[cfg(feature = "embed-frontend")]
pub fn serve_editor<E: Embed>(if_none_match: Option<&str>) -> Response {
    let mut response = serve::<E>("index.html", if_none_match);
    let policy = E::get("index.html")
        .and_then(|page| header::HeaderValue::from_str(&editor_csp(&page.data)).ok());
    if let Some(policy) = policy {
        response
            .headers_mut()
            .insert(header::CONTENT_SECURITY_POLICY, policy);
    }
    response
}

#[cfg(feature = "embed-frontend")]
pub fn if_none_match<B>(req: &axum::http::Request<B>) -> Option<&str> {
    req.headers()
        .get(header::IF_NONE_MATCH)
        .and_then(|value| value.to_str().ok())
}

#[cfg(all(test, feature = "embed-frontend"))]
mod tests {
    use super::{editor_csp, matches};

    #[test]
    fn the_editor_policy_lets_only_its_own_inline_script_run() {
        let page = b"<script src=\"js/main.js\"></script><script>silex.start()</script>";
        let policy = editor_csp(page);
        let scripts = policy
            .split("; ")
            .find(|directive| directive.starts_with("script-src"))
            .unwrap();
        // sha256 of `silex.start()`
        assert_eq!(
            scripts,
            "script-src 'self' 'sha256-ZTqXUZ+1NRAS9IrIvnHGa9CJ4DvqhjohfKUUoSpEgWQ='"
        );
    }

    #[test]
    fn if_none_match_is_compared_weakly() {
        let etag = "\"abc\"";
        assert!(matches("\"abc\"", etag));
        assert!(matches("*", etag));
        assert!(matches("W/\"abc\"", etag));
        assert!(matches("\"xyz\", W/\"abc\"", etag));
        assert!(!matches("\"xyz\"", etag));
        assert!(!matches("abc", etag));
    }
}
