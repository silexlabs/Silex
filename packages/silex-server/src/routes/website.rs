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
//! Handles website CRUD operations and asset management.
//!
//! Routes:
//! - GET /api/website/?websiteId=X - Read website (or list if no websiteId)
//! - POST /api/website/?websiteId=X - Update website
//! - PUT /api/website/ - Create new website
//! - DELETE /api/website/?websiteId=X - Delete website
//! - POST /api/website/duplicate?websiteId=X - Duplicate website
//! - GET /api/website/meta?websiteId=X - Get metadata
//! - POST /api/website/meta?websiteId=X - Update metadata
//! - GET /api/website/assets/:path?websiteId=X - Read asset
//! - POST /api/website/assets?websiteId=X - Upload assets

use axum::body::Bytes;
use axum::extract::{Multipart, Path, Query, State};
use axum::http::header;
use axum::response::IntoResponse;
use axum::routing::{delete, get, post, put};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tower_sessions::Session;

use crate::connectors::StorageConnector;
use crate::error::{ConnectorError, ConnectorResult};
use crate::models::{ConnectorFile, WebsiteData, WebsiteId, WebsiteMeta, WebsiteMetaFileContent};
use crate::routes::AppState;

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
        .route("/assets/*path", get(read_asset))
        .route("/assets", post(write_assets))
}

// ==================
// Query parameter types
// ==================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteReadQuery {
    pub website_id: Option<WebsiteId>,
    pub connector_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteWriteQuery {
    pub website_id: WebsiteId,
    pub connector_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateQuery {
    pub connector_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetReadQuery {
    pub website_id: WebsiteId,
    pub connector_id: Option<String>,
}

// ==================
// Response types
// ==================

#[derive(Debug, Serialize)]
pub struct MessageResponse {
    pub message: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateResponse {
    pub website_id: String,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct AssetsResponse {
    pub data: Vec<String>,
}

// ==================
// Route handlers
// ==================

/// Read website data or list websites
///
/// GET /api/website/?websiteId=X - Read specific website
/// GET /api/website/ - List all websites (if no websiteId)
async fn read_or_list_website(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<WebsiteReadQuery>,
) -> ConnectorResult<impl IntoResponse> {
    let session_data = get_session_data(&session).await;
    let connector = get_storage_connector(&state, &session_data, query.connector_id.as_deref()).await?;

    match query.website_id {
        Some(website_id) => {
            // Read specific website
            let data = connector.read_website(&session_data, &website_id).await?;
            Ok(Json(serde_json::to_value(data)?).into_response())
        }
        None => {
            // List all websites
            let websites = connector.list_websites(&session_data).await?;
            Ok(Json(websites).into_response())
        }
    }
}

/// Update an existing website
///
/// POST /api/website/?websiteId=X
async fn update_website(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<WebsiteWriteQuery>,
    Json(data): Json<WebsiteData>,
) -> ConnectorResult<Json<MessageResponse>> {
    let session_data = get_session_data(&session).await;
    let connector = get_storage_connector(&state, &session_data, query.connector_id.as_deref()).await?;

    connector
        .update_website(&session_data, &query.website_id, &data)
        .await?;

    Ok(Json(MessageResponse {
        message: "Website saved".to_string(),
    }))
}

/// Create a new website
///
/// PUT /api/website/
async fn create_website(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<CreateQuery>,
    Json(meta): Json<WebsiteMetaFileContent>,
) -> ConnectorResult<Json<CreateResponse>> {
    let session_data = get_session_data(&session).await;
    let connector = get_storage_connector(&state, &session_data, query.connector_id.as_deref()).await?;

    let website_id = connector.create_website(&session_data, &meta).await?;

    Ok(Json(CreateResponse {
        message: format!("Website created with ID: {}", website_id),
        website_id,
    }))
}

/// Delete a website
///
/// DELETE /api/website/?websiteId=X
async fn delete_website(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<WebsiteWriteQuery>,
) -> ConnectorResult<Json<MessageResponse>> {
    let session_data = get_session_data(&session).await;
    let connector = get_storage_connector(&state, &session_data, query.connector_id.as_deref()).await?;

    connector
        .delete_website(&session_data, &query.website_id)
        .await?;

    Ok(Json(MessageResponse {
        message: "Website deleted".to_string(),
    }))
}

/// Duplicate a website
///
/// POST /api/website/duplicate?websiteId=X
async fn duplicate_website(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<WebsiteWriteQuery>,
) -> ConnectorResult<Json<MessageResponse>> {
    let session_data = get_session_data(&session).await;
    let connector = get_storage_connector(&state, &session_data, query.connector_id.as_deref()).await?;

    let new_id = connector
        .duplicate_website(&session_data, &query.website_id)
        .await?;

    Ok(Json(MessageResponse {
        message: format!("Website duplicated with ID: {}", new_id),
    }))
}

/// Get website metadata
///
/// GET /api/website/meta?websiteId=X
async fn get_meta(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<WebsiteWriteQuery>,
) -> ConnectorResult<Json<WebsiteMeta>> {
    let session_data = get_session_data(&session).await;
    let connector = get_storage_connector(&state, &session_data, query.connector_id.as_deref()).await?;

    let meta = connector
        .get_website_meta(&session_data, &query.website_id)
        .await?;

    Ok(Json(meta))
}

/// Update website metadata
///
/// POST /api/website/meta?websiteId=X
async fn set_meta(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<WebsiteWriteQuery>,
    Json(meta): Json<WebsiteMetaFileContent>,
) -> ConnectorResult<Json<MessageResponse>> {
    let session_data = get_session_data(&session).await;
    let connector = get_storage_connector(&state, &session_data, query.connector_id.as_deref()).await?;

    connector
        .set_website_meta(&session_data, &query.website_id, &meta)
        .await?;

    Ok(Json(MessageResponse {
        message: "Website meta saved".to_string(),
    }))
}

/// Read an asset file
///
/// GET /api/website/assets/:path?websiteId=X
async fn read_asset(
    State(state): State<AppState>,
    session: Session,
    Path(path): Path<String>,
    Query(query): Query<AssetReadQuery>,
) -> ConnectorResult<impl IntoResponse> {
    let session_data = get_session_data(&session).await;
    let connector = get_storage_connector(&state, &session_data, query.connector_id.as_deref()).await?;

    let content = connector
        .read_asset(&session_data, &query.website_id, &path)
        .await?;

    // Determine content type from file extension
    let content_type = mime_guess::from_path(&path)
        .first_or_octet_stream()
        .to_string();

    Ok((
        [(header::CONTENT_TYPE, content_type)],
        Bytes::from(content),
    ))
}

/// Upload asset files
///
/// POST /api/website/assets?websiteId=X
///
/// Accepts multipart form data with files[] field.
async fn write_assets(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<WebsiteWriteQuery>,
    mut multipart: Multipart,
) -> ConnectorResult<Json<AssetsResponse>> {
    let session_data = get_session_data(&session).await;
    let connector = get_storage_connector(&state, &session_data, query.connector_id.as_deref()).await?;

    let mut files = Vec::new();

    // Process multipart form data
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        ConnectorError::InvalidInput(format!("Failed to read multipart field: {}", e))
    })? {
        let file_name = field
            .file_name()
            .map(String::from)
            .unwrap_or_else(|| "unknown".to_string());

        let content = field
            .bytes()
            .await
            .map_err(|e| ConnectorError::InvalidInput(format!("Failed to read file data: {}", e)))?;

        // Clean up the path (remove /assets/ prefix if present)
        let path = file_name.replace("/assets/", "/");
        let path = if !path.starts_with('/') {
            format!("/{}", path)
        } else {
            path
        };

        files.push(ConnectorFile {
            path,
            content: content.to_vec(),
        });
    }

    // Write the files
    let paths = connector
        .write_assets(&session_data, &query.website_id, files)
        .await?;

    // Build URLs for the uploaded assets
    let base_url = state.config.url.trim_end_matches('/');
    let data: Vec<String> = paths
        .iter()
        .map(|path| {
            format!(
                "{}/api/website/assets{}?websiteId={}&connectorId={}",
                base_url,
                path,
                query.website_id,
                query.connector_id.as_deref().unwrap_or("")
            )
        })
        .collect();

    Ok(Json(AssetsResponse { data }))
}

// ==================
// Helper functions
// ==================

/// Get session data as JSON value
async fn get_session_data(session: &Session) -> serde_json::Value {
    session
        .get::<serde_json::Value>("data")
        .await
        .ok()
        .flatten()
        .unwrap_or_else(|| serde_json::json!({}))
}

/// Get the storage connector, checking authentication
async fn get_storage_connector(
    state: &AppState,
    session_data: &serde_json::Value,
    connector_id: Option<&str>,
) -> ConnectorResult<std::sync::Arc<dyn StorageConnector>> {
    let connector = state
        .registry
        .get_storage_connector_or_default(connector_id)
        .ok_or_else(|| ConnectorError::NotFound("No storage connector found".to_string()))?;

    if !connector.is_logged_in(session_data).await? {
        return Err(ConnectorError::NotAuthenticated);
    }

    Ok(connector)
}
