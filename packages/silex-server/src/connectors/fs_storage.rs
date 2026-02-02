/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Filesystem storage connector
//!
//! Stores website data on the local filesystem.
//! Each website is a directory containing:
//! - website.json (main data file)
//! - meta.json (metadata file)
//! - assets/ (uploaded assets)
//! - pages/ (individual page files)

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use std::collections::HashSet;
use std::path::PathBuf;
use tokio::fs;
use uuid::Uuid;

use crate::connectors::traits::{to_connector_data, ConnectorInfo, StorageConnector};
use crate::error::{ConnectorError, ConnectorResult};
use crate::models::{
    constants, ConnectorFile, ConnectorOptions, ConnectorType, ConnectorUser, WebsiteData,
    WebsiteId, WebsiteMeta, WebsiteMetaFileContent,
};

/// Icon for filesystem connector (user silhouette SVG as data URI)
const USER_ICON: &str = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='1em' viewBox='0 0 448 512'%3E%3Cpath d='M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464H398.7c-8.9-63.3-63.3-112-129-112H178.3c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3z'/%3E%3C/svg%3E";

/// Icon for the connector (laptop icon)
const FILE_ICON: &str = "/assets/laptop.png";

/// Filesystem storage connector
///
/// Stores websites in a directory structure:
/// ```text
/// data_path/
///   {website_id}/
///     website.json
///     meta.json
///     assets/
///       image.png
///     pages/
///       index-abc123.json
/// ```
pub struct FsStorage {
    /// Root path where all websites are stored
    data_path: PathBuf,

    /// Folder name for assets within each website
    assets_folder: String,
}

impl FsStorage {
    /// Create a new FsStorage connector
    ///
    /// # Arguments
    /// * `data_path` - Directory where websites will be stored
    /// * `assets_folder` - Name of the assets folder within each website
    pub fn new(data_path: PathBuf, assets_folder: String) -> Self {
        FsStorage {
            data_path,
            assets_folder,
        }
    }

    /// Get the path to a website's directory
    fn website_path(&self, website_id: &str) -> PathBuf {
        self.data_path.join(website_id)
    }

    /// Get the path to a website's data file
    fn website_data_path(&self, website_id: &str) -> PathBuf {
        self.website_path(website_id).join(constants::WEBSITE_DATA_FILE)
    }

    /// Get the path to a website's metadata file
    fn website_meta_path(&self, website_id: &str) -> PathBuf {
        self.website_path(website_id)
            .join(constants::WEBSITE_META_DATA_FILE)
    }

    /// Get the path to a website's assets folder
    fn assets_path(&self, website_id: &str) -> PathBuf {
        self.website_path(website_id).join(&self.assets_folder)
    }

    /// Initialize the data directory and create a default website if needed
    pub async fn init(&self, default_website_id: &str) -> ConnectorResult<()> {
        let default_path = self.website_path(default_website_id);

        // Check if the default website already exists
        if fs::metadata(&default_path).await.is_ok() {
            return Ok(());
        }

        // Create the default website directory with assets folder
        fs::create_dir_all(self.assets_path(default_website_id)).await?;

        // Create the default metadata
        let meta = WebsiteMetaFileContent {
            name: "Default website".to_string(),
            image_url: None,
            connector_user_settings: Default::default(),
        };
        let default_id = default_website_id.to_string();
        self.set_website_meta(&serde_json::json!({}), &default_id, &meta)
            .await?;

        // Create the default website data
        self.update_website(
            &serde_json::json!({}),
            &default_id,
            &WebsiteData::default(),
        )
        .await?;

        tracing::info!(
            "Created default website '{}' in {}",
            default_website_id,
            self.data_path.display()
        );

        Ok(())
    }

    /// Serialize data to JSON with sorted keys for stable output
    fn serialize_json<T: serde::Serialize>(data: &T) -> ConnectorResult<String> {
        // Serialize to Value first, then to string with sorted keys
        let value = serde_json::to_value(data)?;
        let sorted = sort_json_keys(&value);
        Ok(serde_json::to_string_pretty(&sorted)?)
    }

    /// Get the pages folder path from website data
    fn get_pages_folder(data: &WebsiteData) -> &str {
        if data.pages_folder.is_empty() {
            constants::LEGACY_WEBSITE_PAGES_FOLDER
        } else {
            &data.pages_folder
        }
    }

    /// Get a slug from a page name (for file naming)
    fn get_page_slug(name: &str) -> String {
        name.to_lowercase()
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '-' })
            .collect::<String>()
            .trim_matches('-')
            .to_string()
    }

    /// Split website data into separate files (website.json + individual pages)
    fn split_website_data(
        data: &WebsiteData,
    ) -> ConnectorResult<Vec<(String, String)>> {
        let mut files = Vec::new();
        let pages_folder = Self::get_pages_folder(data);

        // Process each page
        let mut page_refs = Vec::new();
        for page in &data.pages {
            // Get page ID and name
            let page_id = page.get("id").and_then(|v| v.as_str());
            let page_name = page
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("page");

            // Skip empty pages (like the {} from EMPTY_PAGES in tests)
            if page_id.is_none() {
                page_refs.push(page.clone());
                continue;
            }

            let page_id = page_id.unwrap();
            let slug = Self::get_page_slug(page_name);
            let file_name = format!("{}-{}.json", slug, page_id);
            let file_path = format!("{}/{}", pages_folder, file_name);

            // Write the page file
            let page_content = Self::serialize_json(page)?;
            files.push((file_path, page_content));

            // Create a reference to the page file
            page_refs.push(serde_json::json!({
                "name": page_name,
                "id": page_id,
                "isFile": true
            }));
        }

        // Create the main website.json with page references instead of full pages
        let website_data_with_refs = serde_json::json!({
            "pages": page_refs,
            "pagesFolder": pages_folder,
            "assets": data.assets,
            "styles": data.styles,
            "settings": data.settings,
            "fonts": data.fonts,
            "symbols": data.symbols,
            "publication": data.publication,
        });

        let website_content = Self::serialize_json(&website_data_with_refs)?;
        files.push((constants::WEBSITE_DATA_FILE.to_string(), website_content));

        Ok(files)
    }

    /// Merge website data from main file and page files
    async fn merge_website_data(
        &self,
        website_id: &str,
        website_content: &str,
    ) -> ConnectorResult<WebsiteData> {
        let mut parsed: serde_json::Value = serde_json::from_str(website_content)?;

        // Get pages folder
        let pages_folder = parsed
            .get("pagesFolder")
            .and_then(|v| v.as_str())
            .unwrap_or(constants::LEGACY_WEBSITE_PAGES_FOLDER);

        // Check if we have page references to load
        let pages = match parsed.get("pages") {
            Some(serde_json::Value::Array(pages)) if !pages.is_empty() => pages.clone(),
            _ => return Ok(serde_json::from_value(parsed)?),
        };

        // Check if pages are already embedded (no isFile field)
        if pages
            .first()
            .map(|p| !p.get("isFile").is_some())
            .unwrap_or(true)
        {
            return Ok(serde_json::from_value(parsed)?);
        }

        // Load pages from separate files
        let mut loaded_pages = Vec::new();
        for page_ref in pages {
            let is_file = page_ref.get("isFile").and_then(|v| v.as_bool()).unwrap_or(false);

            if is_file {
                let page_name = page_ref.get("name").and_then(|v| v.as_str()).unwrap_or("page");
                let page_id = page_ref.get("id").and_then(|v| v.as_str()).unwrap_or("");

                let slug = Self::get_page_slug(page_name);
                let file_name = format!("{}-{}.json", slug, page_id);
                let file_path = self.website_path(website_id).join(pages_folder).join(&file_name);

                match fs::read_to_string(&file_path).await {
                    Ok(content) => {
                        let page: serde_json::Value = serde_json::from_str(&content)?;
                        loaded_pages.push(page);
                    }
                    Err(e) => {
                        tracing::warn!("Could not load page file {}: {}", file_path.display(), e);
                        loaded_pages.push(page_ref);
                    }
                }
            } else {
                loaded_pages.push(page_ref);
            }
        }

        // Replace pages with loaded content
        parsed["pages"] = serde_json::Value::Array(loaded_pages);

        Ok(serde_json::from_value(parsed)?)
    }
}

impl ConnectorInfo for FsStorage {
    fn connector_id(&self) -> &str {
        "fs-storage"
    }

    fn connector_type(&self) -> ConnectorType {
        ConnectorType::Storage
    }

    fn display_name(&self) -> &str {
        "File system storage"
    }

    fn icon(&self) -> &str {
        FILE_ICON
    }

    fn color(&self) -> &str {
        "#ffffff"
    }

    fn background(&self) -> &str {
        "#006400"
    }

    fn disable_logout(&self) -> bool {
        // FsStorage has no authentication, so hide logout button
        true
    }
}

#[async_trait]
impl StorageConnector for FsStorage {
    // ==================
    // Authentication
    // FsStorage has no authentication - always logged in
    // ==================

    async fn is_logged_in(&self, _session: &serde_json::Value) -> ConnectorResult<bool> {
        // Filesystem storage has no authentication
        Ok(true)
    }

    async fn get_oauth_url(&self, _session: &serde_json::Value) -> ConnectorResult<Option<String>> {
        // No OAuth for filesystem storage
        Ok(None)
    }

    async fn set_token(
        &self,
        _session: &mut serde_json::Value,
        _token: &serde_json::Value,
    ) -> ConnectorResult<()> {
        // No tokens for filesystem storage
        Ok(())
    }

    async fn logout(&self, _session: &mut serde_json::Value) -> ConnectorResult<()> {
        // No logout for filesystem storage
        Ok(())
    }

    async fn get_user(&self, session: &serde_json::Value) -> ConnectorResult<ConnectorUser> {
        // Return the current system username
        let username = whoami::username();

        Ok(ConnectorUser {
            name: username,
            email: None,
            picture: Some(USER_ICON.to_string()),
            storage: to_connector_data(session, self).await?,
        })
    }

    fn get_options(&self, _form_data: &serde_json::Value) -> ConnectorOptions {
        // No options for filesystem storage
        ConnectorOptions::default()
    }

    // ==================
    // Website CRUD
    // ==================

    async fn list_websites(&self, session: &serde_json::Value) -> ConnectorResult<Vec<WebsiteMeta>> {
        let mut websites = Vec::new();

        // List all directories in the data path
        let mut entries = fs::read_dir(&self.data_path).await?;

        while let Some(entry) = entries.next_entry().await? {
            let file_type = entry.file_type().await?;
            if !file_type.is_dir() {
                continue;
            }

            let website_id = entry.file_name().to_string_lossy().to_string();

            // Try to get metadata for this website
            match self.get_website_meta(session, &website_id).await {
                Ok(meta) => websites.push(meta),
                Err(e) => {
                    tracing::warn!("Failed to get metadata for website {}: {}", website_id, e);
                }
            }
        }

        Ok(websites)
    }

    async fn read_website(
        &self,
        _session: &serde_json::Value,
        website_id: &WebsiteId,
    ) -> ConnectorResult<WebsiteData> {
        let path = self.website_data_path(website_id);

        // Read the main website data file
        let content = fs::read_to_string(&path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                ConnectorError::NotFound(format!("Website '{}' not found", website_id))
            } else {
                ConnectorError::Io(e)
            }
        })?;

        // Merge with page files if using split format
        self.merge_website_data(website_id, &content).await
    }

    async fn create_website(
        &self,
        session: &serde_json::Value,
        meta: &WebsiteMetaFileContent,
    ) -> ConnectorResult<WebsiteId> {
        // Generate a new UUID for the website
        let website_id = Uuid::new_v4().to_string();

        // Create the website directory with assets folder
        fs::create_dir_all(self.assets_path(&website_id)).await?;

        // Save the metadata
        self.set_website_meta(session, &website_id, meta).await?;

        // Save the default website data
        self.update_website(session, &website_id, &WebsiteData::default())
            .await?;

        Ok(website_id)
    }

    async fn update_website(
        &self,
        _session: &serde_json::Value,
        website_id: &WebsiteId,
        data: &WebsiteData,
    ) -> ConnectorResult<()> {
        let website_path = self.website_path(website_id);

        // Ensure the website directory exists
        fs::create_dir_all(&website_path).await?;

        // Split the website data into separate files
        let files = Self::split_website_data(data)?;

        // Get the pages folder path
        let pages_folder = Self::get_pages_folder(data);
        let pages_path = website_path.join(pages_folder);

        // Ensure pages directory exists if we have page files
        let has_page_files = files.iter().any(|(path, _)| path.starts_with(pages_folder));
        if has_page_files {
            fs::create_dir_all(&pages_path).await?;
        }

        // Delete pages that are no longer in the website data
        if let Ok(mut entries) = fs::read_dir(&pages_path).await {
            // Collect the new page file names
            let new_page_files: HashSet<_> = files
                .iter()
                .filter(|(path, _)| path.starts_with(pages_folder))
                .map(|(path, _)| path.replace(&format!("{}/", pages_folder), ""))
                .collect();

            while let Ok(Some(entry)) = entries.next_entry().await {
                let file_name = entry.file_name().to_string_lossy().to_string();
                if file_name.ends_with(".json") && !new_page_files.contains(&file_name) {
                    let _ = fs::remove_file(entry.path()).await;
                }
            }
        }

        // Write all files
        for (path, content) in files {
            let file_path = website_path.join(&path);
            fs::write(&file_path, content).await?;
        }

        Ok(())
    }

    async fn delete_website(
        &self,
        _session: &serde_json::Value,
        website_id: &WebsiteId,
    ) -> ConnectorResult<()> {
        let path = self.website_path(website_id);

        fs::remove_dir_all(&path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                ConnectorError::NotFound(format!("Website '{}' not found", website_id))
            } else {
                ConnectorError::Io(e)
            }
        })?;

        Ok(())
    }

    async fn duplicate_website(
        &self,
        session: &serde_json::Value,
        website_id: &WebsiteId,
    ) -> ConnectorResult<WebsiteId> {
        // Generate a new ID for the duplicate
        let new_website_id = Uuid::new_v4().to_string();

        let source_path = self.website_path(website_id);
        let dest_path = self.website_path(&new_website_id);

        // Copy the entire directory
        copy_dir_recursive(source_path, dest_path).await?;

        // Update the metadata with a new name
        let mut meta = self.get_website_meta(session, website_id).await?;
        let new_meta = WebsiteMetaFileContent {
            name: format!("{} copy", meta.name),
            image_url: meta.image_url.take(),
            connector_user_settings: meta.connector_user_settings,
        };
        self.set_website_meta(session, &new_website_id, &new_meta)
            .await?;

        Ok(new_website_id)
    }

    // ==================
    // Assets
    // ==================

    async fn write_assets(
        &self,
        _session: &serde_json::Value,
        website_id: &WebsiteId,
        files: Vec<ConnectorFile>,
    ) -> ConnectorResult<Vec<String>> {
        let assets_path = self.assets_path(website_id);

        // Ensure assets directory exists
        fs::create_dir_all(&assets_path).await?;

        let mut written_paths = Vec::new();

        for file in files {
            // Normalize the path (remove leading slash if present)
            let relative_path = file.path.trim_start_matches('/');
            let file_path = assets_path.join(relative_path);

            // Ensure parent directory exists
            if let Some(parent) = file_path.parent() {
                fs::create_dir_all(parent).await?;
            }

            // Write the file
            fs::write(&file_path, &file.content).await?;

            // Return the path as stored (with leading slash)
            written_paths.push(format!("/{}", relative_path));
        }

        Ok(written_paths)
    }

    async fn read_asset(
        &self,
        _session: &serde_json::Value,
        website_id: &WebsiteId,
        file_name: &str,
    ) -> ConnectorResult<Vec<u8>> {
        // Normalize the path (remove leading slash if present)
        let relative_path = file_name.trim_start_matches('/');
        let path = self.assets_path(website_id).join(relative_path);

        fs::read(&path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                ConnectorError::NotFound(format!("Asset '{}' not found", file_name))
            } else {
                ConnectorError::Io(e)
            }
        })
    }

    // ==================
    // Metadata
    // ==================

    async fn get_website_meta(
        &self,
        _session: &serde_json::Value,
        website_id: &WebsiteId,
    ) -> ConnectorResult<WebsiteMeta> {
        let meta_path = self.website_meta_path(website_id);
        let website_path = self.website_path(website_id);

        // Read the metadata file
        let content = fs::read_to_string(&meta_path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                ConnectorError::NotFound(format!("Website '{}' not found", website_id))
            } else {
                ConnectorError::Io(e)
            }
        })?;

        let file_content: WebsiteMetaFileContent = serde_json::from_str(&content)?;

        // Get file stats for created/updated timestamps
        let metadata = fs::metadata(&website_path).await?;
        let created_at = metadata
            .created()
            .ok()
            .map(|t| DateTime::<Utc>::from(t));
        let updated_at = metadata
            .modified()
            .ok()
            .map(|t| DateTime::<Utc>::from(t));

        Ok(WebsiteMeta::from_file_content(
            website_id.clone(),
            file_content,
            created_at,
            updated_at,
        ))
    }

    async fn set_website_meta(
        &self,
        _session: &serde_json::Value,
        website_id: &WebsiteId,
        meta: &WebsiteMetaFileContent,
    ) -> ConnectorResult<()> {
        let path = self.website_meta_path(website_id);
        let content = Self::serialize_json(meta)?;

        fs::write(&path, content).await?;

        Ok(())
    }
}

/// Recursively copy a directory
///
/// Uses Box::pin to handle the recursive async calls.
fn copy_dir_recursive(
    source: PathBuf,
    dest: PathBuf,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = ConnectorResult<()>> + Send>> {
    Box::pin(async move {
        fs::create_dir_all(&dest).await?;

        let mut entries = fs::read_dir(&source).await?;

        while let Some(entry) = entries.next_entry().await? {
            let entry_path = entry.path();
            let dest_path = dest.join(entry.file_name());

            if entry.file_type().await?.is_dir() {
                copy_dir_recursive(entry_path, dest_path).await?;
            } else {
                fs::copy(&entry_path, &dest_path).await?;
            }
        }

        Ok(())
    })
}

/// Sort JSON object keys recursively for stable serialization
fn sort_json_keys(value: &serde_json::Value) -> serde_json::Value {
    match value {
        serde_json::Value::Object(map) => {
            let mut sorted: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
            let mut keys: Vec<_> = map.keys().collect();
            keys.sort();
            for key in keys {
                sorted.insert(key.clone(), sort_json_keys(&map[key]));
            }
            serde_json::Value::Object(sorted)
        }
        serde_json::Value::Array(arr) => {
            serde_json::Value::Array(arr.iter().map(sort_json_keys).collect())
        }
        _ => value.clone(),
    }
}
