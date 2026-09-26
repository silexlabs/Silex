/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The dashboard, and what `/` opens on
//!
//! The hosted Silex has a dashboard of its own, so the server crate knows
//! nothing about this one: `/` is the dashboard, `/?id=<website id>` the
//! editor. `/silex.js`, the client config the editor loads, is the desktop's
//! too, built with the dashboard.

use std::collections::HashMap;

use axum::extract::{Query, Request};
use axum::routing::get;
use axum::Router;

use rust_embed::Embed;
use silex_server::frontend::{if_none_match, serve, try_serve, EditorAssets};

/// Path relative to this crate's Cargo.toml
#[derive(Embed)]
#[folder = "../dashboard/dist/"]
struct DashboardAssets;

/// Serve the dashboard, leaving the editor everything it does not hold
pub fn configure(app: Router) -> Router {
    app.route(
        "/",
        get(
            |Query(params): Query<HashMap<String, String>>, req: Request| async move {
                let if_none_match = if_none_match(&req);
                if params.contains_key("id") {
                    serve::<EditorAssets>("index.html", if_none_match)
                } else {
                    serve::<DashboardAssets>("index.html", if_none_match)
                }
            },
        ),
    )
    .route(
        "/silex.js",
        get(
            |req: Request| async move { serve::<DashboardAssets>("silex.js", if_none_match(&req)) },
        ),
    )
    // Dashboard assets take priority, the editor serves everything else
    .fallback(|req: Request| async move {
        let path = req.uri().path().trim_start_matches('/');
        let if_none_match = if_none_match(&req);
        match try_serve::<DashboardAssets>(path, if_none_match) {
            Some(response) => response,
            None => serve::<EditorAssets>(path, if_none_match),
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_dashboard_hides_no_file_of_the_editor() {
        let hidden: Vec<_> = DashboardAssets::iter()
            .filter(|path| {
                !["index.html", "silex.js"].contains(&path.as_ref())
                    && EditorAssets::get(path).is_some()
            })
            .collect();
        assert!(
            hidden.is_empty(),
            "served instead of the editor's: {hidden:?}"
        );
    }
}
