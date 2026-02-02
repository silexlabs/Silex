/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Connector-related data models

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Type of connector: STORAGE or HOSTING
///
/// Storage connectors persist website data and assets.
/// Hosting connectors publish websites to make them accessible.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum ConnectorType {
    Storage,
    Hosting,
}

/// Connector data sent to the frontend
///
/// This is what the client sees when listing available connectors.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectorData {
    /// Unique identifier for this connector
    pub connector_id: String,

    /// Type of connector (STORAGE or HOSTING)
    #[serde(rename = "type")]
    pub connector_type: ConnectorType,

    /// Human-readable name shown in UI
    pub display_name: String,

    /// URL or data URI for the connector icon
    pub icon: String,

    /// If true, hide the logout button for this connector
    pub disable_logout: bool,

    /// Whether the user is currently logged in
    pub is_logged_in: bool,

    /// OAuth URL if this connector uses OAuth (null for basic auth)
    pub oauth_url: Option<String>,

    /// Primary color for UI styling
    pub color: String,

    /// Background color for UI styling
    pub background: String,
}

/// User data returned after authentication
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectorUser {
    /// User's display name
    pub name: String,

    /// User's email address (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,

    /// URL to user's profile picture (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub picture: Option<String>,

    /// The storage connector this user is associated with
    pub storage: ConnectorData,
}

/// Options passed to connectors, stored in website metadata
///
/// These are connector-specific settings that may include things like:
/// - Publication URL preferences
/// - Repository settings
/// - Custom paths
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectorOptions {
    /// The URL where the website will be published
    #[serde(skip_serializing_if = "Option::is_none")]
    pub website_url: Option<String>,

    /// Additional connector-specific options
    #[serde(flatten)]
    pub extra: HashMap<String, serde_json::Value>,
}
