/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Data models for Silex server
//!
//! Only what the server needs to do its job is typed here. Website data itself
//! stays a raw `serde_json::Value`: everything the server does not need to
//! understand (plugin owned keys such as `dataSources`) must survive a round
//! trip untouched.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Unique identifier for a website
pub type WebsiteId = String;

/// Main website data file, and the marker of a Silex website on disk
pub const WEBSITE_DATA_FILE: &str = "website.json";

/// Website metadata file, optional (a cloned website has none)
pub const WEBSITE_META_DATA_FILE: &str = "meta.json";

/// Folder holding the uploaded assets inside a website directory
pub const ASSETS_FOLDER: &str = "assets";

/// Folder holding the published website inside a website directory
pub const PUBLIC_FOLDER: &str = "public";

/// Pages folder given to websites created from now on
pub const WEBSITE_PAGES_FOLDER: &str = "pages";

/// Content stored in meta.json file
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteMetaFileContent {
    /// Human-readable website name
    pub name: String,

    /// Preview image URL (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
}

/// Website metadata returned to the frontend
///
/// Includes computed fields like creation/modification dates.
/// Field names are compatible with the GitLab connector in silex-lib.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteMeta {
    /// Unique website identifier
    pub website_id: WebsiteId,

    /// Human-readable website name
    pub name: String,

    /// Preview image URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,

    /// When the website was created
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,

    /// When the website was last modified
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,

    /// Path to source files (maps to GitLab's repoUrl)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repo_url: Option<String>,

    /// Path to published site (maps to GitLab's pagesUrl)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pages_url: Option<String>,
}

/// A file to be written to storage or to the published folder
#[derive(Debug, Clone)]
pub struct File {
    /// Path relative to the website root
    pub path: String,

    /// File content as bytes
    pub content: Vec<u8>,
}

/// Data of a brand new website, mirrors `EMPTY_WEBSITE` in `common/types.ts`.
/// The empty page is what GrapesJS needs to create a first page.
pub fn empty_website() -> serde_json::Value {
    serde_json::json!({
        "pages": [{}],
        "pagesFolder": WEBSITE_PAGES_FOLDER,
    })
}
