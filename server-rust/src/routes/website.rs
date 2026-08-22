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
use axum::extract::multipart::MultipartError;
use axum::extract::{Multipart, Path, Query, State};
use axum::http::{header, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{delete, get, post, put};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};
use crate::history::{self, Versioned};
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
                let _ = tokio::task::spawn_blocking(move || catching_up.catch_up(asked_about.as_str()))
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

    let site = storage::website_path(&state.data_path, &query.website_id)?;
    // On a thread of its own: a save landing during a publication waits for the
    // repository, and waiting there would hold a thread the server answers with.
    let versioned = tokio::task::spawn_blocking(move || {
        // Same message as the SaaS server writes, so that a history reads the
        // same wherever the website was edited.
        history::version(&site, "Update website data from Silex")
    })
    .await;

    let why = match versioned {
        Ok(Ok(versioned)) => {
            forget(&state, query.website_id.as_str());
            if let (Versioned::Created, Some(actions)) = (versioned, &state.actions) {
                // A website nobody changed is sent nowhere: syncing it costs
                // seconds and several processes to send what is already there
                actions.sync(query.website_id.as_str());
            }
            None
        }
        Ok(Err(e)) => Some(e),
        Err(e) => Some(e.to_string()),
    };

    if let Some(why) = why {
        tracing::warn!("Could not version website {}: {}", query.website_id, why);
        // Reporting and forgetting was the first answer here, on the grounds
        // that the website is on the disk and an error would tell the editor the
        // work is lost. What it tells the user instead is nothing at all, while
        // their history quietly stops being written, so it is said, in words
        // that put the saving first.
        if worth_saying(&state, query.website_id.as_str(), &why) {
            return Err(Error::Told(format!(
                "Your website is saved on this computer. What Silex could not do is add this version to its history: {}",
                why
            )));
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
        website_id: website_id.to_string(),
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
    let body_limit = state.body_limit;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| unreadable_upload(e, body_limit))?
    {
        let file_name = field
            .file_name()
            .map(String::from)
            .unwrap_or_else(|| "unknown".to_string());

        let content = field
            .bytes()
            .await
            .map_err(|e| unreadable_upload(e, body_limit))?;

        files.push(File {
            path: stored_as(&file_name),
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

/// Where an uploaded file goes in the assets folder of the website
///
/// GrapesJS sends back the `/assets/` an asset is already under, so a sub folder
/// is meant. A name that is a path of its own is not: it comes from the machine
/// the file was picked on, and would make those folders here. A relative `..` is
/// left as it is, for the storage to refuse it.
fn stored_as(file_name: &str) -> String {
    let asked = std::path::Path::new(file_name.strip_prefix("/assets/").unwrap_or(file_name));

    let path = if asked.is_absolute() {
        asked
            .file_name()
            .map(|name| name.to_string_lossy().into_owned())
            .unwrap_or_else(|| "unknown".to_string())
    } else {
        asked.to_string_lossy().into_owned()
    };

    format!("/{}", path.trim_start_matches('/'))
}

/// What to tell the person adding a file Silex could not read
fn unreadable_upload(e: MultipartError, body_limit: usize) -> Error {
    if e.status() == StatusCode::PAYLOAD_TOO_LARGE {
        return Error::TooLarge(body_limit);
    }

    Error::InvalidInput(format!("Silex could not read the file you added: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::Request as HttpRequest;
    use std::path::PathBuf;
    use tower::ServiceExt;

    async fn a_server(name: &str, body_limit: usize) -> (PathBuf, axum::Router, WebsiteId) {
        let name = format!("silex-website-{}-{}", name, std::process::id());
        let data_path = std::env::temp_dir().join(name);
        let _ = std::fs::remove_dir_all(&data_path);
        std::fs::create_dir_all(&data_path).unwrap();

        let meta = WebsiteMetaFileContent {
            name: "A website".to_string(),
            image_url: None,
        };
        let website_id = storage::create_website(&data_path, &meta).await.unwrap();

        let config = crate::Config::new(data_path.clone()).with_body_limit(body_limit);
        let (app, _) = crate::build_app(config).await;

        (data_path, app, website_id)
    }

    fn a_website_of(size: usize) -> Vec<u8> {
        let data = serde_json::json!({
            "pages": [],
            "pagesFolder": "pages",
            "filler": "x".repeat(size),
        });
        serde_json::to_vec(&data).unwrap()
    }

    fn an_upload_of(files: &[(&str, usize)]) -> (String, Vec<u8>) {
        let boundary = "silexuploadboundary";
        let mut body = Vec::new();

        for (file_name, size) in files {
            let header = format!("--{}\r\nContent-Disposition: form-data; name=\"files[]\"; filename=\"{}\"\r\nContent-Type: application/octet-stream\r\n\r\n", boundary, file_name);
            body.extend_from_slice(header.as_bytes());
            body.extend(std::iter::repeat_n(b'p', *size));
            body.extend_from_slice(b"\r\n");
        }
        body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());

        (format!("multipart/form-data; boundary={}", boundary), body)
    }

    async fn answered(app: &axum::Router, request: HttpRequest<Body>) -> (StatusCode, String) {
        let response = app.clone().oneshot(request).await.unwrap();
        let status = response.status();
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();

        (status, String::from_utf8_lossy(&body).into_owned())
    }

    fn saving(website_id: &WebsiteId, body: Vec<u8>) -> HttpRequest<Body> {
        HttpRequest::builder()
            .method("POST")
            .uri(format!("/api/website?websiteId={}", website_id))
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(body))
            .unwrap()
    }

    fn uploading(website_id: &WebsiteId, files: &[(&str, usize)]) -> HttpRequest<Body> {
        let (content_type, body) = an_upload_of(files);
        HttpRequest::builder()
            .method("POST")
            .uri(format!("/api/website/assets?websiteId={}", website_id))
            .header(header::CONTENT_TYPE, content_type)
            .body(Body::from(body))
            .unwrap()
    }

    /// The dashboard asks for `/api/connector/`, and the Express server this
    /// one stands in for answers a route with or without its last slash
    #[tokio::test]
    async fn a_route_asked_for_with_a_last_slash_is_still_answered() {
        let (data_path, app, _) = a_server("trailing-slash", crate::config::MAX_BODY_SIZE).await;

        let asked = HttpRequest::builder()
            .uri("/api/connector/?type=STORAGE")
            .body(Body::empty())
            .unwrap();
        let response = app.clone().oneshot(asked).await.unwrap();
        assert_eq!(response.status(), StatusCode::PERMANENT_REDIRECT);
        assert_eq!(
            response.headers().get("location").unwrap(),
            "/api/connector?type=STORAGE",
            "sent to the route that exists, query kept"
        );

        // What is not a route is still not a route
        let (status, _) = answered(
            &app,
            HttpRequest::builder().uri("/api/nowhere").body(Body::empty()).unwrap(),
        )
        .await;
        assert_eq!(status, StatusCode::NOT_FOUND);

        let _ = std::fs::remove_dir_all(&data_path);
    }

    #[tokio::test]
    async fn a_website_of_several_megabytes_is_saved() {
        let (data_path, app, website_id) = a_server("big", crate::config::MAX_BODY_SIZE).await;

        let (status, said) = answered(&app, saving(&website_id, a_website_of(3_900_000))).await;
        assert_eq!(status, StatusCode::OK, "{}", said);

        let _ = std::fs::remove_dir_all(&data_path);
    }

    #[tokio::test]
    async fn a_photo_of_several_megabytes_is_uploaded() {
        let (data_path, app, website_id) = a_server("photo", crate::config::MAX_BODY_SIZE).await;

        let files = [("photo.png", 5 * 1024 * 1024)];
        let (status, said) = answered(&app, uploading(&website_id, &files)).await;
        assert_eq!(status, StatusCode::OK, "{}", said);

        let _ = std::fs::remove_dir_all(&data_path);
    }

    #[tokio::test]
    async fn what_is_over_the_limit_is_said_in_words_not_in_http() {
        let (data_path, app, website_id) = a_server("over", 1024 * 1024).await;

        let (status, said) = answered(&app, saving(&website_id, a_website_of(2 * 1024 * 1024))).await;
        assert_eq!(status, StatusCode::PAYLOAD_TOO_LARGE);
        assert!(said.contains("too large"), "{}", said);
        assert!(said.contains("1 MB"), "{}", said);
        assert!(!said.contains("buffer"), "{}", said);

        let files = [("photo.png", 2 * 1024 * 1024)];
        let (status, upload_said) = answered(&app, uploading(&website_id, &files)).await;
        assert_eq!(status, StatusCode::PAYLOAD_TOO_LARGE);
        assert!(upload_said.contains("too large"), "{}", upload_said);

        let _ = std::fs::remove_dir_all(&data_path);
    }

    #[tokio::test]
    async fn the_name_of_an_uploaded_file_makes_no_folders_of_its_own() {
        let (data_path, app, website_id) = a_server("folders", crate::config::MAX_BODY_SIZE).await;

        let files = [
            ("/assets/img/photo.png", 8),
            ("/tmp/somewhere/else/evil.txt", 8),
        ];
        let (status, said) = answered(&app, uploading(&website_id, &files)).await;
        assert_eq!(status, StatusCode::OK, "{}", said);

        let assets = data_path.join(website_id.as_str()).join("assets");
        assert!(assets.join("img").join("photo.png").is_file(), "a sub folder the editor asks for is kept");
        assert!(assets.join("evil.txt").is_file(), "a file name that is a path is kept as its last part");
        assert!(!assets.join("tmp").exists(), "the folders of that path are not made");

        let _ = std::fs::remove_dir_all(&data_path);
    }

    #[test]
    fn a_file_name_that_leads_out_is_left_for_the_storage_to_refuse() {
        assert_eq!(stored_as("/assets/../../evil.txt"), "/../../evil.txt");
    }
}
