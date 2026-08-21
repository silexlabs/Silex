/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Website API routes
//!
//! Routes:
//! - GET /api/website/?websiteId=X - Read website (or list them if no websiteId)
//! - POST /api/website/?websiteId=X - Update website
//! - PUT /api/website/ - Create website
//! - DELETE /api/website/?websiteId=X - Delete website
//! - POST /api/website/duplicate?websiteId=X - Duplicate website
//! - GET /api/website/meta?websiteId=X - Read metadata
//! - POST /api/website/meta?websiteId=X - Write metadata
//! - GET /api/website/assets/:path?websiteId=X - Read asset
//! - POST /api/website/assets?websiteId=X - Upload assets
//!
//! The editor always sends a `connectorId` query param, from the days when a
//! website could live on several backends. It is accepted and ignored.

use axum::body::Bytes;
use axum::extract::{Multipart, Path, Query, State};
use axum::http::header;
use axum::response::IntoResponse;
use axum::routing::{delete, get, post, put};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};
use crate::models::{File, WebsiteId, WebsiteMeta, WebsiteMetaFileContent};
use crate::routes::AppState;
use crate::storage;

/// Build website routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(read_or_list_website))
        .route("/", post(update_website))
        .route("/", put(create_website))
        .route("/", delete(delete_website))
        .route("/duplicate", post(duplicate_website))
        .route("/meta", get(get_meta))
        .route("/meta", post(set_meta))
        .route("/assets/{*path}", get(read_asset))
        .route("/assets", post(write_assets))
}

// ==================
// Query parameter types
// ==================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteReadQuery {
    pub website_id: Option<WebsiteId>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteQuery {
    pub website_id: WebsiteId,
}

// ==================
// Response types
// ==================

/// The editor parses the body of every successful response, so a response
/// without a body would be a parsing error on its side
#[derive(Debug, Serialize)]
pub struct MessageResponse {
    pub message: &'static str,
}

/// `websiteId` is read by the desktop app, to open the website it just created
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateResponse {
    pub website_id: String,
    pub message: &'static str,
}

#[derive(Debug, Serialize)]
pub struct AssetsResponse {
    pub data: Vec<String>,
}

// ==================
// Route handlers
// ==================

/// Read a website, or list them all when there is no `websiteId`
async fn read_or_list_website(
    State(state): State<AppState>,
    Query(query): Query<WebsiteReadQuery>,
) -> Result<axum::response::Response> {
    match query.website_id {
        Some(website_id) => {
            if let Some(actions) = &state.actions {
                let catching_up = actions.clone();
                let asked_about = website_id.clone();
                let _ = tokio::task::spawn_blocking(move || catching_up.catch_up(&asked_about))
                    .await;
            }
            let data = storage::read_website(&state.data_path, &website_id).await?;
            Ok(Json(data).into_response())
        }
        None => {
            let websites = storage::list_websites(&state.data_path).await?;
            Ok(Json(websites).into_response())
        }
    }
}

/// Update a website
async fn update_website(
    State(state): State<AppState>,
    Query(query): Query<WebsiteQuery>,
    Json(data): Json<serde_json::Value>,
) -> Result<Json<MessageResponse>> {
    storage::update_website(&state.data_path, &query.website_id, &data).await?;

    if let Some(actions) = &state.actions {
        // Same message as the SaaS server writes, so that a history reads the
        // same wherever the website was edited.
        // On a thread of its own: a save landing during a publication waits for
        // it, and waiting there would hold a thread the server answers with.
        let versioning = actions.clone();
        let website_id = query.website_id.clone();
        let versioned = tokio::task::spawn_blocking(move || {
            versioning.version(&website_id, "Update website data from Silex")
        })
        .await;
        let why = match versioned {
            Ok(Ok(())) => None,
            Ok(Err(e)) => Some(e),
            Err(e) => Some(e.to_string()),
        };
        match why {
            None => {
                forget(&state, &query.website_id);
                actions.sync(&query.website_id);
            }
            Some(why) => {
                tracing::warn!("Could not version website {}: {}", query.website_id, why);
                // Reporting and forgetting was the first answer here, on the
                // grounds that the website is on the disk and an error would
                // tell the editor the work is lost. What it tells the user
                // instead is nothing at all, while their history quietly stops
                // being written, so it is said, in words that put the saving
                // first.
                if worth_saying(&state, &query.website_id, &why) {
                    return Err(Error::Told(format!(
                        "Your website is saved on this computer. What Silex could not do is add this version to its history: {}",
                        why
                    )));
                }
            }
        }
    }

    Ok(Json(MessageResponse {
        message: "Website saved",
    }))
}

/// Whether this is worth stopping the user for
///
/// True the first time a website cannot be versioned, and again whenever it
/// starts failing for another reason. The rest of the time the editor would
/// show the same message every few seconds, which is how a real problem becomes
/// something people click through without reading.
fn worth_saying(state: &AppState, website_id: &str, why: &str) -> bool {
    let mut said = state.not_versioned.lock().unwrap_or_else(|held| {
        // Another request panicked holding this. What it left says nothing
        // about the website that was just saved, so it is taken back rather
        // than turned into a failure of this save.
        held.into_inner()
    });
    said.insert(website_id.to_string(), why.to_string()).as_deref() != Some(why)
}

/// Forget what was said about a website that versions again
///
/// Whatever fails next is news, including the same words as the failure before.
fn forget(state: &AppState, website_id: &str) {
    state
        .not_versioned
        .lock()
        .unwrap_or_else(|held| held.into_inner())
        .remove(website_id);
}

/// Create a website
async fn create_website(
    State(state): State<AppState>,
    Json(meta): Json<WebsiteMetaFileContent>,
) -> Result<Json<CreateResponse>> {
    let website_id = storage::create_website(&state.data_path, &meta).await?;

    Ok(Json(CreateResponse {
        website_id,
        message: "Website created",
    }))
}

/// Delete a website
async fn delete_website(
    State(state): State<AppState>,
    Query(query): Query<WebsiteQuery>,
) -> Result<Json<MessageResponse>> {
    storage::delete_website(&state.data_path, &query.website_id).await?;

    Ok(Json(MessageResponse {
        message: "Website deleted",
    }))
}

/// Duplicate a website
async fn duplicate_website(
    State(state): State<AppState>,
    Query(query): Query<WebsiteQuery>,
) -> Result<Json<MessageResponse>> {
    storage::duplicate_website(&state.data_path, &query.website_id).await?;

    Ok(Json(MessageResponse {
        message: "Website duplicated",
    }))
}

/// Read the metadata of a website
async fn get_meta(
    State(state): State<AppState>,
    Query(query): Query<WebsiteQuery>,
) -> Result<Json<WebsiteMeta>> {
    let meta = storage::get_website_meta(&state.data_path, &query.website_id).await?;

    Ok(Json(meta))
}

/// Write the metadata of a website
async fn set_meta(
    State(state): State<AppState>,
    Query(query): Query<WebsiteQuery>,
    Json(meta): Json<WebsiteMetaFileContent>,
) -> Result<Json<MessageResponse>> {
    storage::set_website_meta(&state.data_path, &query.website_id, &meta).await?;

    Ok(Json(MessageResponse {
        message: "Website meta saved",
    }))
}

/// Read one asset of a website
async fn read_asset(
    State(state): State<AppState>,
    Path(path): Path<String>,
    Query(query): Query<WebsiteQuery>,
) -> Result<impl IntoResponse> {
    let content = storage::read_asset(&state.data_path, &query.website_id, &path).await?;

    let content_type = mime_guess::from_path(&path)
        .first_or_octet_stream()
        .to_string();

    Ok(([(header::CONTENT_TYPE, content_type)], Bytes::from(content)))
}

/// Upload assets, sent as multipart form data
async fn write_assets(
    State(state): State<AppState>,
    Query(query): Query<WebsiteQuery>,
    mut multipart: Multipart,
) -> Result<Json<AssetsResponse>> {
    let mut files = Vec::new();

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        Error::InvalidInput(format!("Failed to read multipart field: {}", e))
    })? {
        let file_name = field
            .file_name()
            .map(String::from)
            .unwrap_or_else(|| "unknown".to_string());

        let content = field
            .bytes()
            .await
            .map_err(|e| Error::InvalidInput(format!("Failed to read file data: {}", e)))?;

        let path = file_name.replace("/assets/", "/");
        let path = if path.starts_with('/') {
            path
        } else {
            format!("/{}", path)
        };

        files.push(File {
            path,
            content: content.to_vec(),
        });
    }

    let paths = storage::write_assets(&state.data_path, &query.website_id, files).await?;

    // Relative URLs, so that the editor can parse them back into stored paths
    let data = paths
        .iter()
        .map(|path| {
            format!(
                "/api/website/assets{}?websiteId={}&connectorId=fs-storage",
                path, query.website_id
            )
        })
        .collect();

    Ok(Json(AssetsResponse { data }))
}
