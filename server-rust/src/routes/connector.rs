/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Connector API routes
//!
//! The editor is shared with the SaaS, where a connector is an account on a
//! remote service the user has to log into. Here the websites are local files,
//! so these two endpoints answer constants. `isLoggedIn` and `disableLogout`
//! being true is what makes the editor skip the login dialog and hide the
//! logout button.
//!
//! Routes:
//! - GET /api/connector/?type=STORAGE|HOSTING - List connectors
//! - GET /api/connector/user?type=STORAGE|HOSTING - Get user info

use axum::extract::Query;
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::routes::AppState;

/// Build connector routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_connectors))
        .route("/user", get(get_user))
}

/// Type of connector, storage holds the websites, hosting publishes them
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum ConnectorType {
    Storage,
    Hosting,
}

#[derive(Debug, Deserialize)]
pub struct ConnectorTypeQuery {
    #[serde(rename = "type")]
    pub connector_type: ConnectorType,
}

/// Connector as the editor expects it
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectorData {
    pub connector_id: &'static str,
    #[serde(rename = "type")]
    pub connector_type: ConnectorType,
    pub display_name: &'static str,
    /// No account to log out from
    pub disable_logout: bool,
    /// Local files are always available
    pub is_logged_in: bool,
    /// Only read when logging in, which never happens here
    pub oauth_url: Option<String>,
}

/// User as the editor expects it. `storage` is read by the publication code,
/// which sends `storage.connectorId` back as the storage of the website.
#[derive(Debug, Serialize)]
pub struct ConnectorUser {
    pub name: String,
    pub storage: ConnectorData,
}

fn connector_data(connector_type: ConnectorType) -> ConnectorData {
    let (connector_id, display_name) = match connector_type {
        ConnectorType::Storage => ("fs-storage", "File system storage"),
        ConnectorType::Hosting => ("fs-hosting", "File system hosting"),
    };

    ConnectorData {
        connector_id,
        connector_type,
        display_name,
        disable_logout: true,
        is_logged_in: true,
        oauth_url: None,
    }
}

/// List the connectors of a given type
///
/// GET /api/connector/?type=STORAGE|HOSTING
async fn list_connectors(Query(query): Query<ConnectorTypeQuery>) -> Json<Vec<ConnectorData>> {
    Json(vec![connector_data(query.connector_type)])
}

/// Get the current user
///
/// GET /api/connector/user?type=STORAGE|HOSTING
async fn get_user(Query(query): Query<ConnectorTypeQuery>) -> Json<ConnectorUser> {
    Json(ConnectorUser {
        name: user_name(),
        storage: connector_data(query.connector_type),
    })
}

/// Name shown in the dashboard, the one of the account running the app
fn user_name() -> String {
    std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
        .unwrap_or_else(|_| "local".to_string())
}
