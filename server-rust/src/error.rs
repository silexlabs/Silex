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

/// Errors that can occur while serving the API
///
/// Each variant maps to a specific HTTP status code for API responses.
#[derive(Error, Debug)]
pub enum Error {
    /// Requested resource does not exist (HTTP 404)
    #[error("Resource not found: {0}")]
    NotFound(String),

    /// Invalid input data (HTTP 400)
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    /// The stored website is not usable as is (HTTP 500)
    #[error("Invalid website data: {0}")]
    InvalidWebsite(String),

    /// Filesystem operation failed (HTTP 500)
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON parsing/serialization failed (HTTP 500)
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

impl Error {
    /// Get the HTTP status code for this error
    pub fn status_code(&self) -> StatusCode {
        match self {
            Error::NotFound(_) => StatusCode::NOT_FOUND,
            Error::InvalidInput(_) => StatusCode::BAD_REQUEST,
            Error::InvalidWebsite(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Error::Io(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Error::Json(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
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

        // Log server errors for debugging
        if status.is_server_error() {
            tracing::error!("Server error: {}", message);
        }

        let body = Json(json!({
            "error": true,
            "message": message
        }));

        (status, body).into_response()
    }
}

/// Result type alias for server operations
pub type Result<T> = std::result::Result<T, Error>;
