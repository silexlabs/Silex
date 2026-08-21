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
//! Everything else is a constant until a host application says otherwise. One
//! that knows where the website it has open is served names that host and
//! answers for it, which is how Silex Desktop tells the editor about a forge.
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

    /// What publishing already knows, `websiteUrl` among it
    ///
    /// Only Silex Desktop has anything to say here: it is the one that knows
    /// which forge holds the website, and what that forge answered about it.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<serde_json::Value>,

    /// What to ask the user before publishing, when the forge cannot say
    /// where the website is served. Silex Desktop only, as above.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options_form: Option<OptionsForm>,
}

/// User as the editor expects it. `storage` is read by the publication code,
/// which sends `storage.connectorId` back as the storage of the website.
#[derive(Debug, Serialize)]
pub struct ConnectorUser {
    pub name: String,
    pub storage: ConnectorData,
}

async fn connector_data(state: &AppState, connector_type: ConnectorType) -> ConnectorData {
    // Only the hosting is asked about: the storage is these files whoever
    // embeds the crate, while what serves a website depends on the machine.
    // Served alone, nobody answers and the constants below stand.
    let hosting = match (connector_type, state.actions.clone()) {
        // Answering this starts the command line of a forge, which reaches the
        // network. On a thread of its own, so that a forge taking its time does
        // not hold up everything else the editor asks for.
        (ConnectorType::Hosting, Some(actions)) => {
            tokio::task::spawn_blocking(move || actions.hosting())
                .await
                .unwrap_or_else(|e| {
                    tracing::warn!("Could not tell what hosts the website: {}", e);
                    None
                })
        }
        _ => None,
    };

    let (connector_id, display_name, options, options_form) = match hosting {
        Some(hosting) => (
            hosting.connector_id,
            hosting.display_name,
            hosting.options,
            hosting.options_form,
        ),
        None => {
            let (connector_id, display_name) = match connector_type {
                ConnectorType::Storage => ("fs-storage", "File system storage"),
                ConnectorType::Hosting => ("fs-hosting", "File system hosting"),
            };
            (connector_id, display_name.to_string(), None, None)
        }
    };

    ConnectorData {
        connector_id,
        connector_type,
        display_name,
        disable_logout: true,
        is_logged_in: true,
        oauth_url: None,
        options,
        options_form,
    }
}

/// List the connectors of a given type
///
/// GET /api/connector/?type=STORAGE|HOSTING
async fn list_connectors(
    State(state): State<AppState>,
    Query(query): Query<ConnectorTypeQuery>,
) -> Json<Vec<ConnectorData>> {
    Json(vec![connector_data(&state, query.connector_type).await])
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
        storage: connector_data(&state, query.connector_type).await,
    })
}

/// Name shown in the dashboard, the one of the account running the app
fn user_name() -> String {
    std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
        .unwrap_or_else(|_| "local".to_string())
}
