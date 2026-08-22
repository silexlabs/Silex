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
use std::ffi::OsStr;
use std::fmt;
use std::path::Path;
use std::str::FromStr;
use uuid::Uuid;

/// Unique identifier for a website, and the name of its folder in the data path
///
/// An id comes from a request, so it is checked the moment it is read rather
/// than at each of its uses: `Path::join` on an absolute path forgets the
/// folder it was joined to, and `..` walks out of it.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
pub struct WebsiteId(String);

impl WebsiteId {
    /// The id of a website that does not exist yet
    pub fn fresh() -> Self {
        Self(Uuid::new_v4().to_string())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl FromStr for WebsiteId {
    type Err = String;

    fn from_str(id: &str) -> Result<Self, Self::Err> {
        if !names_one_folder(id) {
            return Err(format!("'{}' is not a website id", id));
        }

        Ok(Self(id.to_string()))
    }
}

/// Whether this names one folder inside another, and nothing else
///
/// `Path::join` on an absolute path forgets the folder it was joined to, and
/// `..` walks out of it, so a name coming from a request is read as a name or
/// refused.
pub(crate) fn names_one_folder(name: &str) -> bool {
    !name.is_empty()
        && !name.starts_with('.')
        && !name.contains("..")
        && !name.contains('/')
        && !name.contains('\\')
        && Path::new(name).file_name() == Some(OsStr::new(name))
}

impl fmt::Display for WebsiteId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl<'de> Deserialize<'de> for WebsiteId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let id = String::deserialize(deserializer)?;
        id.parse().map_err(serde::de::Error::custom)
    }
}

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_website_id_names_a_folder_and_nothing_else() {
        assert!("a1b2c3".parse::<WebsiteId>().is_ok());
        assert!("my website".parse::<WebsiteId>().is_ok());
        assert_eq!(WebsiteId::fresh().to_string().len(), 36);

        for refused in ["", ".", "..", ".hidden", "../etc", "a/b", "/home/user", "a\\b"] {
            assert!(
                refused.parse::<WebsiteId>().is_err(),
                "'{}' should not be a website id",
                refused
            );
        }
    }

    #[test]
    fn a_website_id_that_leads_out_is_a_bad_request_not_a_panic() {
        let refused: Result<WebsiteId, _> = serde_json::from_str("\"../../etc\"");
        assert!(refused.is_err());

        let read: WebsiteId = serde_json::from_str("\"a1b2c3\"").unwrap();
        assert_eq!(serde_json::to_value(&read).unwrap(), serde_json::json!("a1b2c3"));
    }
}
