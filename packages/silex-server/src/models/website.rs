/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Website-related data models

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Unique identifier for a website
pub type WebsiteId = String;

/// Content stored in meta.json file
///
/// This is the metadata saved alongside the website data.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteMetaFileContent {
    /// Human-readable website name
    pub name: String,

    /// Preview image URL (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,

    /// Per-connector settings for this website
    #[serde(default)]
    pub connector_user_settings: HashMap<String, serde_json::Value>,
}

/// Website metadata returned to the frontend
///
/// Includes computed fields like creation/modification dates.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteMeta {
    /// Unique website identifier
    pub website_id: WebsiteId,

    /// Human-readable website name
    pub name: String,

    /// Preview image URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,

    /// Per-connector settings
    #[serde(default)]
    pub connector_user_settings: HashMap<String, serde_json::Value>,

    /// When the website was created
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,

    /// When the website was last modified
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

impl WebsiteMeta {
    /// Create WebsiteMeta from file content and additional fields
    pub fn from_file_content(
        website_id: WebsiteId,
        content: WebsiteMetaFileContent,
        created_at: Option<DateTime<Utc>>,
        updated_at: Option<DateTime<Utc>>,
    ) -> Self {
        WebsiteMeta {
            website_id,
            name: content.name,
            image_url: content.image_url,
            connector_user_settings: content.connector_user_settings,
            created_at,
            updated_at,
        }
    }
}

/// Full website data including pages, styles, and assets
///
/// This is the main data structure stored in website.json.
/// We use serde_json::Value for nested objects to maintain compatibility
/// with the GrapesJS editor format without defining every field.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteData {
    /// Array of page objects (GrapesJS Page format)
    #[serde(default)]
    pub pages: Vec<serde_json::Value>,

    /// Folder where individual page files are stored
    #[serde(default = "default_pages_folder")]
    pub pages_folder: String,

    /// Array of asset objects (images, etc.)
    #[serde(default)]
    pub assets: Vec<serde_json::Value>,

    /// Array of style objects (CSS rules)
    #[serde(default)]
    pub styles: Vec<serde_json::Value>,

    /// Website settings (title, description, etc.)
    #[serde(default)]
    pub settings: serde_json::Value,

    /// Font definitions
    #[serde(default)]
    pub fonts: Vec<serde_json::Value>,

    /// Symbol definitions (reusable components)
    #[serde(default)]
    pub symbols: Vec<serde_json::Value>,

    /// Publication settings
    #[serde(default)]
    pub publication: serde_json::Value,
}

fn default_pages_folder() -> String {
    "pages".to_string()
}

impl Default for WebsiteData {
    fn default() -> Self {
        // Match EMPTY_WEBSITE from TypeScript
        WebsiteData {
            pages: vec![serde_json::json!({})], // GrapesJS expects this to create an empty page
            pages_folder: "pages".to_string(),
            assets: Vec::new(),
            styles: Vec::new(),
            settings: serde_json::json!({}),
            fonts: Vec::new(),
            symbols: Vec::new(),
            publication: serde_json::json!({}),
        }
    }
}

/// A file to be written to storage or hosting
#[derive(Debug, Clone)]
pub struct ConnectorFile {
    /// Path relative to the website root
    pub path: String,

    /// File content as bytes
    pub content: Vec<u8>,
}

/// Constants matching TypeScript constants.ts
pub mod constants {
    /// Main website data file
    pub const WEBSITE_DATA_FILE: &str = "website.json";

    /// Website metadata file
    pub const WEBSITE_META_DATA_FILE: &str = "meta.json";

    /// Legacy pages folder (for backwards compatibility)
    pub const LEGACY_WEBSITE_PAGES_FOLDER: &str = "src";
}
