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

/// Errors that can occur in connector operations
///
/// Each variant maps to a specific HTTP status code for API responses.
#[derive(Error, Debug)]
pub enum ConnectorError {
    /// User is not authenticated (HTTP 401)
    #[error("Not authenticated")]
    NotAuthenticated,

    /// Requested resource does not exist (HTTP 404)
    #[error("Resource not found: {0}")]
    NotFound(String),

    /// Invalid input data (HTTP 400)
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    /// Filesystem operation failed (HTTP 500)
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON parsing/serialization failed (HTTP 500)
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

impl ConnectorError {
    /// Get the HTTP status code for this error
    pub fn status_code(&self) -> StatusCode {
        match self {
            ConnectorError::NotAuthenticated => StatusCode::UNAUTHORIZED,
            ConnectorError::NotFound(_) => StatusCode::NOT_FOUND,
            ConnectorError::InvalidInput(_) => StatusCode::BAD_REQUEST,
            ConnectorError::Io(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ConnectorError::Json(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

/// Convert ConnectorError into an HTTP response
///
/// This allows returning ConnectorError directly from route handlers,
/// and Axum will automatically convert it to a JSON error response.
impl IntoResponse for ConnectorError {
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

/// Result type alias for connector operations
pub type ConnectorResult<T> = Result<T, ConnectorError>;
