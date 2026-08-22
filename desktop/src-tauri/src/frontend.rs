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
//! nothing about this one. Here the dashboard is served at `/`, the editor at
//! `/?id=<website id>`.

use std::collections::HashMap;

use axum::extract::{Query, Request};
use axum::routing::get;
use axum::Router;

use rust_embed::Embed;
use silex_server::frontend::{serve, try_serve, EditorAssets};

/// Dashboard assets, path relative to this crate's Cargo.toml
#[derive(Embed)]
#[folder = "../../silex-dashboard-2026/public/"]
struct DashboardAssets;

/// Serve the dashboard, leaving the editor everything it does not hold
pub fn configure(app: Router) -> Router {
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
