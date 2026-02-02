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
//! Handles authentication and connector management.
//!
//! Routes:
//! - GET /api/connector/?type=STORAGE|HOSTING - List connectors
//! - GET /api/connector/user?type=STORAGE|HOSTING&connectorId=X - Get user info
//! - GET /api/connector/login?type=STORAGE|HOSTING&connectorId=X - Start login
//! - GET/POST /api/connector/login/callback - OAuth callback
//! - POST /api/connector/logout?type=STORAGE|HOSTING&connectorId=X - Logout

use axum::extract::{Query, State};
use axum::response::{Html, IntoResponse, Redirect, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tower_sessions::Session;

use crate::connectors::{hosting_to_connector_data, to_connector_data};
use crate::error::{ConnectorError, ConnectorResult};
use crate::models::{ConnectorData, ConnectorOptions, ConnectorType, ConnectorUser};
use crate::routes::AppState;

/// Build connector routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_connectors))
        .route("/user", get(get_user))
        .route("/login", get(login))
        .route("/login/callback", get(login_callback).post(login_callback))
        .route("/logout", post(logout))
}

// ==================
// Query parameter types
// ==================

#[derive(Debug, Deserialize)]
pub struct ConnectorTypeQuery {
    #[serde(rename = "type")]
    pub connector_type: ConnectorType,
}

#[derive(Debug, Deserialize)]
pub struct ConnectorQuery {
    #[serde(rename = "type")]
    pub connector_type: ConnectorType,
    #[serde(rename = "connectorId")]
    pub connector_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginQuery {
    #[serde(rename = "type")]
    pub connector_type: ConnectorType,
    #[serde(rename = "connectorId")]
    pub connector_id: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginCallbackQuery {
    #[serde(rename = "type")]
    pub connector_type: ConnectorType,
    #[serde(rename = "connectorId")]
    pub connector_id: Option<String>,
    pub error: Option<String>,
    pub code: Option<String>,
    pub state: Option<String>,
}

// ==================
// Response types
// ==================

#[derive(Debug, Serialize)]
pub struct SuccessResponse {
    pub error: bool,
    pub message: String,
}

// ==================
// Route handlers
// ==================

/// List all connectors of a given type
///
/// GET /api/connector/?type=STORAGE|HOSTING
async fn list_connectors(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<ConnectorTypeQuery>,
) -> ConnectorResult<Json<Vec<ConnectorData>>> {
    let session_data = get_session_data(&session).await;

    let connectors = match query.connector_type {
        ConnectorType::Storage => {
            let mut result = Vec::new();
            for connector in state.registry.storage_connectors() {
                let data = to_connector_data(&session_data, connector.as_ref()).await?;
                result.push(data);
            }
            result
        }
        ConnectorType::Hosting => {
            let mut result = Vec::new();
            for connector in state.registry.hosting_connectors() {
                let data = hosting_to_connector_data(&session_data, connector.as_ref()).await?;
                result.push(data);
            }
            result
        }
    };

    Ok(Json(connectors))
}

/// Get the current user for a connector
///
/// GET /api/connector/user?type=STORAGE|HOSTING&connectorId=X
///
/// Returns 401 if not logged in.
async fn get_user(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<ConnectorQuery>,
) -> ConnectorResult<Json<ConnectorUser>> {
    let session_data = get_session_data(&session).await;

    match query.connector_type {
        ConnectorType::Storage => {
            let connector = state
                .registry
                .get_storage_connector_or_default(query.connector_id.as_deref())
                .ok_or_else(|| {
                    ConnectorError::NotFound(format!(
                        "Connector not found: {:?}",
                        query.connector_id
                    ))
                })?;

            if !connector.is_logged_in(&session_data).await? {
                return Err(ConnectorError::NotAuthenticated);
            }

            let user = connector.get_user(&session_data).await?;
            Ok(Json(user))
        }
        ConnectorType::Hosting => {
            let connector = state
                .registry
                .get_hosting_connector_or_default(query.connector_id.as_deref())
                .ok_or_else(|| {
                    ConnectorError::NotFound(format!(
                        "Connector not found: {:?}",
                        query.connector_id
                    ))
                })?;

            if !connector.is_logged_in(&session_data).await? {
                return Err(ConnectorError::NotAuthenticated);
            }

            let user = connector.get_user(&session_data).await?;
            Ok(Json(user))
        }
    }
}

/// Start the login process for a connector
///
/// GET /api/connector/login?type=STORAGE|HOSTING&connectorId=X
///
/// For OAuth connectors, redirects to the OAuth URL.
/// For form-based auth, returns an HTML login form.
/// If already logged in, redirects to callback.
async fn login(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<LoginQuery>,
) -> ConnectorResult<Response> {
    let session_data = get_session_data(&session).await;
    let callback_url = format!(
        "/api/connector/login/callback?type={:?}&connectorId={}",
        query.connector_type, query.connector_id
    );

    match query.connector_type {
        ConnectorType::Storage => {
            let connector = state
                .registry
                .get_storage_connector(&query.connector_id)
                .ok_or_else(|| {
                    ConnectorError::NotFound(format!("Connector not found: {}", query.connector_id))
                })?;

            // Already logged in? Redirect to callback
            if connector.is_logged_in(&session_data).await? {
                return Ok(Redirect::to(&callback_url).into_response());
            }

            // Check for OAuth URL
            if let Some(oauth_url) = connector.get_oauth_url(&session_data).await? {
                return Ok(Redirect::to(&oauth_url).into_response());
            }

            // For FsStorage and similar, no login needed - redirect to callback
            Ok(Redirect::to(&callback_url).into_response())
        }
        ConnectorType::Hosting => {
            let connector = state
                .registry
                .get_hosting_connector(&query.connector_id)
                .ok_or_else(|| {
                    ConnectorError::NotFound(format!("Connector not found: {}", query.connector_id))
                })?;

            // Already logged in? Redirect to callback
            if connector.is_logged_in(&session_data).await? {
                return Ok(Redirect::to(&callback_url).into_response());
            }

            // Check for OAuth URL
            if let Some(oauth_url) = connector.get_oauth_url(&session_data).await? {
                return Ok(Redirect::to(&oauth_url).into_response());
            }

            // For FsHosting and similar, no login needed - redirect to callback
            Ok(Redirect::to(&callback_url).into_response())
        }
    }
}

/// Handle login callback (OAuth redirect or form submission)
///
/// GET/POST /api/connector/login/callback
///
/// Returns an HTML page that posts a message to the parent window
/// and optionally closes the popup.
async fn login_callback(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<LoginCallbackQuery>,
) -> ConnectorResult<Html<String>> {
    // Check for error in query params
    if let Some(error) = &query.error {
        return Ok(Html(get_end_auth_html(
            error,
            true,
            query.connector_id.as_deref().unwrap_or(""),
            query.connector_type,
            None,
            None,
        )));
    }

    let connector_id = query.connector_id.as_deref().unwrap_or("");
    let mut session_data = get_session_data(&session).await;

    // Process the callback based on connector type
    let options = match query.connector_type {
        ConnectorType::Storage => {
            let connector = state
                .registry
                .get_storage_connector(connector_id)
                .ok_or_else(|| {
                    ConnectorError::NotFound(format!("Connector not found: {}", connector_id))
                })?;

            // Store token if not already logged in
            if !connector.is_logged_in(&session_data).await? {
                let token = serde_json::json!({
                    "code": query.code,
                    "state": query.state,
                });
                connector.set_token(&mut session_data, &token).await?;
                save_session_data(&session, &session_data).await;
            }

            connector.get_options(&serde_json::json!({}))
        }
        ConnectorType::Hosting => {
            let connector = state
                .registry
                .get_hosting_connector(connector_id)
                .ok_or_else(|| {
                    ConnectorError::NotFound(format!("Connector not found: {}", connector_id))
                })?;

            // Store token if not already logged in
            if !connector.is_logged_in(&session_data).await? {
                let token = serde_json::json!({
                    "code": query.code,
                    "state": query.state,
                });
                connector.set_token(&mut session_data, &token).await?;
                save_session_data(&session, &session_data).await;
            }

            connector.get_options(&serde_json::json!({}))
        }
    };

    // Parse redirect from state if present
    let redirect = query.state.as_ref().and_then(|s| {
        serde_json::from_str::<serde_json::Value>(s)
            .ok()
            .and_then(|v| v.get("redirect").and_then(|r| r.as_str()).map(String::from))
    });

    Ok(Html(get_end_auth_html(
        "Logged in",
        false,
        connector_id,
        query.connector_type,
        Some(options),
        redirect,
    )))
}

/// Logout from a connector
///
/// POST /api/connector/logout?type=STORAGE|HOSTING&connectorId=X
async fn logout(
    State(state): State<AppState>,
    session: Session,
    Query(query): Query<ConnectorQuery>,
) -> ConnectorResult<Json<SuccessResponse>> {
    let mut session_data = get_session_data(&session).await;

    match query.connector_type {
        ConnectorType::Storage => {
            if let Some(connector) = state
                .registry
                .get_storage_connector_or_default(query.connector_id.as_deref())
            {
                connector.logout(&mut session_data).await?;
                save_session_data(&session, &session_data).await;
            }
        }
        ConnectorType::Hosting => {
            if let Some(connector) = state
                .registry
                .get_hosting_connector_or_default(query.connector_id.as_deref())
            {
                connector.logout(&mut session_data).await?;
                save_session_data(&session, &session_data).await;
            }
        }
    }

    Ok(Json(SuccessResponse {
        error: false,
        message: "OK".to_string(),
    }))
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

/// Save session data
async fn save_session_data(session: &Session, data: &serde_json::Value) {
    let _ = session.insert("data", data.clone()).await;
}

/// Generate the HTML page shown after authentication
///
/// This page sends a postMessage to the parent window and closes the popup.
fn get_end_auth_html(
    message: &str,
    error: bool,
    connector_id: &str,
    connector_type: ConnectorType,
    options: Option<ConnectorOptions>,
    redirect: Option<String>,
) -> String {
    let status = if error { "Error" } else { "Success" };

    let data = serde_json::json!({
        "type": "login",
        "error": error,
        "message": message,
        "connectorId": connector_id,
        "connectorType": connector_type,
        "options": options,
        "redirect": redirect,
    });

    let data_json = serde_json::to_string(&data).unwrap_or_else(|_| "{}".to_string());

    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <title>Authentication {status}</title>
    <style>
        :root {{
            --primaryColor: #333333;
            --secondaryColor: #ddd;
            --tertiaryColor: #8873FE;
            --quaternaryColor: #A291FF;
        }}
        body {{
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 50px;
            color: var(--primaryColor);
            background-color: var(--secondaryColor);
        }}
        h1 {{ color: var(--tertiaryColor); }}
        p {{ font-size: 18px; }}
        a {{ color: var(--tertiaryColor); text-decoration: none; }}
        a:hover {{ text-decoration: underline; }}
        .container {{ max-width: 600px; margin: auto; }}
        .button {{
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            font-size: 16px;
            color: var(--secondaryColor);
            background-color: var(--tertiaryColor);
            border: none;
            border-radius: 5px;
            text-decoration: none;
            cursor: pointer;
        }}
        .button:hover {{ background-color: var(--quaternaryColor); }}
        .error {{
            display: none;
            margin-top: 20px;
            padding: 15px;
            border: 1px solid var(--tertiaryColor);
            border-radius: 5px;
            text-wrap: wrap;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div id="message">
            <h1>Authentication {status}</h1>
            <p>{display_message}</p>
        </div>
        {error_section}
    </div>
</body>
</html>"#,
        status = status,
        display_message = if error { "" } else { message },
        error_section = if error {
            format!(
                r#"<p><a href="/">Click here to continue</a>.</p>
<a href="/" class="button">Retry</a>
<pre id="error-container" class="error" style="display:block">{message}</pre>
<script>
    if(window.opener && window.opener !== window) {{
        document.querySelectorAll('a').forEach(link => {{
            link.addEventListener('click', (e) => {{
                e.preventDefault();
                const data = {data_json};
                window.opener.postMessage(data, '*');
                window.close();
            }});
        }});
    }}
</script>"#,
                message = message,
                data_json = data_json
            )
        } else {
            format!(
                r#"<p>If this window doesn't close automatically, <a href="/">click here to return to the homepage</a>.</p>
<a href="/" class="button">Go to Homepage</a>
<script>
    const data = {data_json};
    if (window.opener && window.opener !== window) {{
        try {{
            window.opener.postMessage(data, '*');
            window.close();
        }} catch (e) {{
            console.error('Unable to close window:', e);
        }}
    }} else {{
        window.location.href = '{redirect}';
    }}
</script>"#,
                data_json = data_json,
                redirect = redirect.as_deref().unwrap_or("/")
            )
        }
    )
}
