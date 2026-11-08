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
//! so there is nobody to log in as: `isLoggedIn` and `disableLogout` being
//! true is what makes the editor skip the login dialog and hide the logout
//! button.
//!
//! Everything else is a constant until a host application says otherwise,
//! which is how Silex Desktop tells the editor where a website is kept.
//!
//! Routes:
//! - GET /api/connector/?type=STORAGE|HOSTING - List connectors
//! - GET /api/connector/user?type=STORAGE|HOSTING - Get user info

use axum::extract::{Query, State};
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::actions::OptionsForm;
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
    pub display_name: String,
    /// No account to log out from
    pub disable_logout: bool,
    /// Local files are always available
    pub is_logged_in: bool,
    /// Only read when logging in, which never happens here
    pub oauth_url: Option<String>,

    /// What to ask the user before publishing, when the host cannot say where
    /// the website is served. Silex Desktop only.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options_form: Option<OptionsForm>,

    /// Why this hosting cannot publish the website. Silex Desktop only.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unavailable: Option<String>,
    /// HTML under the list of the hostings. Silex Desktop only.
    pub after_list: Option<String>,
}

/// User as the editor expects it. `storage` is read by the publication code,
/// which sends `storage.connectorId` back as the storage of the website.
#[derive(Debug, Serialize)]
pub struct ConnectorUser {
    pub name: String,
    pub storage: ConnectorData,
}

/// The hosting the editor publishes to when no host application takes the
/// files further, and the one id the publication tells apart
pub const LOCAL_FOLDER: &str = "local-folder";
const LOCAL_FOLDER_NAME: &str = "File system hosting";

async fn connectors(state: &AppState, connector_type: ConnectorType) -> Vec<ConnectorData> {
    let local = |connector_id, display_name: &str| ConnectorData {
        connector_id,
        connector_type,
        display_name: display_name.to_string(),
        disable_logout: true,
        is_logged_in: true,
        oauth_url: None,
        options_form: None,
        unavailable: None,
        after_list: None,
    };
    // Only the hosting is asked about: the storage is these files whoever
    // embeds the crate, while what serves a website depends on the machine
    let (ConnectorType::Hosting, Some(actions)) = (connector_type, state.actions.clone()) else {
        return vec![match connector_type {
            ConnectorType::Storage => local("fs-storage", "File system storage"),
            ConnectorType::Hosting => local(LOCAL_FOLDER, LOCAL_FOLDER_NAME),
        }];
    };
    // Answering reads the files of the website and of the programs that
    // publish it, which is no work for the async runtime
    let after_list = actions.more_hostings();
    let hostings = tokio::task::spawn_blocking(move || actions.hostings())
        .await
        .unwrap_or_else(|e| {
            tracing::warn!("Could not tell what hosts the website: {}", e);
            Vec::new()
        });
    hostings
        .into_iter()
        .map(|hosting| ConnectorData {
            connector_id: hosting.connector_id,
            connector_type,
            display_name: hosting.display_name,
            disable_logout: true,
            is_logged_in: true,
            oauth_url: None,
            options_form: hosting.options_form,
            unavailable: hosting.unavailable,
            after_list: None,
        })
        .chain([ConnectorData {
            after_list,
            ..local(LOCAL_FOLDER, LOCAL_FOLDER_NAME)
        }])
        .collect()
}

/// List the connectors of a given type
///
/// GET /api/connector/?type=STORAGE|HOSTING
async fn list_connectors(
    State(state): State<AppState>,
    Query(query): Query<ConnectorTypeQuery>,
) -> Json<Vec<ConnectorData>> {
    Json(connectors(&state, query.connector_type).await)
}

/// Get the current user
///
/// GET /api/connector/user?type=STORAGE|HOSTING
async fn get_user(
    State(state): State<AppState>,
    Query(query): Query<ConnectorTypeQuery>,
) -> Json<ConnectorUser> {
    Json(ConnectorUser {
        name: user_name(),
        storage: connectors(&state, query.connector_type).await.remove(0),
    })
}

/// Name shown in the dashboard, the one of the account running the app
fn user_name() -> String {
    std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
        .unwrap_or_else(|_| "local".to_string())
}
