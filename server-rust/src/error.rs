/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Error types for Silex server
//!
//! This module defines all error types used throughout the server.
//! Errors are designed to be informative and map cleanly to HTTP status codes.

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;
use thiserror::Error;

use crate::models::WebsiteId;
use crate::said::{self, Said};

/// Errors that can occur while serving the API
///
/// Each variant maps to a specific HTTP status code for API responses.
#[derive(Error, Debug)]
pub enum Error {
    /// Requested resource does not exist (HTTP 404)
    #[error("Resource not found: {0}")]
    NotFound(String),

    /// The website asked for is not in the data path (HTTP 404)
    #[error("Resource not found: Website '{0}' not found")]
    NoWebsite(WebsiteId),

    /// Invalid input data (HTTP 400)
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    /// More was sent than the server accepts (HTTP 413)
    ///
    /// Only the middleware knows the limit, so only it names one. A handler
    /// carries the status up to it and says nothing of the size.
    #[error("This is too large to save.{}", .0.map(|limit| format!(" Silex takes up to {} MB at a time. If you are adding a file, please use a smaller one.", limit / 1024 / 1024)).unwrap_or_default())]
    TooLarge(Option<usize>),

    /// The stored website is not usable as is (HTTP 500)
    #[error("Invalid website data: {0}")]
    InvalidWebsite(String),

    /// A file of a website is not the JSON Silex wrote (HTTP 500)
    #[error("Invalid website data: {}", Said::new(said::DAMAGED).with("file", .file).because(.why))]
    Damaged { file: String, why: String },

    /// Filesystem operation failed (HTTP 500)
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON parsing/serialization failed (HTTP 500)
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    /// Something the person editing has to know, in their own words (HTTP 500)
    ///
    /// The editor shows it as it is written here, so no prefix names what went
    /// wrong technically.
    #[error("{0}")]
    Told(String),

    /// Something the dashboard says in the language of the person (HTTP 500)
    #[error("{0}")]
    Said(Said),
}

impl Error {
    /// Get the HTTP status code for this error
    pub fn status_code(&self) -> StatusCode {
        match self {
            Error::NotFound(_) | Error::NoWebsite(_) => StatusCode::NOT_FOUND,
            Error::InvalidInput(_) => StatusCode::BAD_REQUEST,
            Error::TooLarge(_) => StatusCode::PAYLOAD_TOO_LARGE,
            Error::InvalidWebsite(_) | Error::Damaged { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            Error::Io(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Error::Json(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Error::Told(_) | Error::Said(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn said(&self) -> Option<Said> {
        match self {
            Error::NoWebsite(_) => Some(Said::new(said::NO_WEBSITE)),
            Error::Damaged { file, why } => {
                Some(Said::new(said::DAMAGED).with("file", file).because(why))
            }
            Error::Said(said) => Some(said.clone()),
            _ => None,
        }
    }
}

/// What the system said, when Silex has no sentence of its own for it
impl From<Error> for Said {
    fn from(error: Error) -> Self {
        error.said().unwrap_or_else(|| Said::raw(error))
    }
}

/// Convert an Error into an HTTP response
///
/// This allows returning Error directly from route handlers,
/// and Axum will automatically convert it to a JSON error response.
impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status = self.status_code();
        let message = self.to_string();

        if status.is_server_error() {
            tracing::error!("Server error: {}", message);
        } else if status.is_client_error() {
            tracing::warn!("Refused a request with {}: {}", status.as_u16(), message);
        }

        // `message` stays the English the editor shows, the dashboard translates the rest
        let mut body = json!({
            "error": true,
            "message": message
        });
        if let (Some(said), Some(fields)) = (self.said(), body.as_object_mut()) {
            if let Ok(serde_json::Value::Object(said)) = serde_json::to_value(said) {
                fields.extend(said);
            }
        }
        let body = Json(body);

        (status, body).into_response()
    }
}

/// Result type alias for server operations
pub type Result<T> = std::result::Result<T, Error>;
