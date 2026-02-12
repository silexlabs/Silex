/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Filesystem hosting connector
//!
//! Publishes websites to the local filesystem.
//! This is useful for local development and testing.

use async_trait::async_trait;
use std::path::PathBuf;
use tokio::fs;

use crate::connectors::traits::{ConnectorInfo, HostingConnector};
use crate::error::ConnectorResult;
use crate::models::{
    ConnectorData, ConnectorFile, ConnectorOptions, ConnectorType, ConnectorUser,
    PublicationJobData, WebsiteId,
};
use crate::services::JobManager;

/// Icon for the hosting connector (same as storage)
const FILE_ICON: &str = "/assets/laptop.png";

/// User icon for the connector
const USER_ICON: &str = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='1em' viewBox='0 0 448 512'%3E%3Cpath d='M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464H398.7c-8.9-63.3-63.3-112-129-112H178.3c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3z'/%3E%3C/svg%3E";

/// Filesystem hosting connector
///
/// Publishes websites to a local directory.
/// By default, publishes each site to `{data_path}/{website_id}/public/`.
/// When `hosting_path` is explicitly configured, all sites publish to that shared directory.
pub struct FsHosting {
    /// Path where website data is stored (used to compute per-site publish dirs)
    data_path: PathBuf,
    /// Optional shared hosting path (set when user explicitly configures SILEX_HOSTING_PATH)
    hosting_path: Option<PathBuf>,
}

impl FsHosting {
    /// Create a new FsHosting connector
    ///
    /// # Arguments
    /// * `data_path` - Directory where website data is stored
    /// * `hosting_path` - Optional shared hosting directory; when `None`, each site
    ///   publishes to `{data_path}/{website_id}/public/`
    pub fn new(data_path: PathBuf, hosting_path: Option<PathBuf>) -> Self {
        FsHosting {
            data_path,
            hosting_path,
        }
    }

    /// Compute the publish directory for a given website
    fn publish_dir(&self, website_id: &WebsiteId) -> PathBuf {
        match &self.hosting_path {
            Some(path) => path.clone(),
            None => self.data_path.join(website_id).join("public"),
        }
    }

    /// Initialize the hosting directory
    ///
    /// When a shared hosting path is configured, creates it with standard
    /// subdirectories. Otherwise, per-site directories are created on publish.
    pub async fn init(&self) -> ConnectorResult<()> {
        if let Some(path) = &self.hosting_path {
            if fs::metadata(path).await.is_ok() {
                return Ok(());
            }

            fs::create_dir_all(path.join("assets")).await?;
            fs::create_dir_all(path.join("css")).await?;

            tracing::info!("Created hosting directory at {}", path.display());
        }

        Ok(())
    }

    /// Write files to a target directory
    ///
    /// This is the core publication logic.
    async fn write_files(
        &self,
        target_dir: &PathBuf,
        files: &[ConnectorFile],
        job: &mut PublicationJobData,
    ) -> ConnectorResult<()> {
        for file in files {
            // Normalize the path
            let relative_path = file.path.trim_start_matches('/');
            let file_path = target_dir.join(relative_path);

            // Update job status
            job.base.message = format!("Writing {}", relative_path);
            job.log(format!("Writing: {}", relative_path));

            // Ensure parent directory exists
            if let Some(parent) = file_path.parent() {
                fs::create_dir_all(parent).await?;
            }

            // Write the file
            match fs::write(&file_path, &file.content).await {
                Ok(_) => {
                    tracing::debug!("Success::: {:?} -> {}", file_path.to_str(), relative_path);
                    job.log(format!("Success: {}", relative_path));
                }
                Err(e) => {
                    let error_msg = format!("Error writing {}: {}", relative_path, e);
                    job.error(error_msg.clone());
                    tracing::error!("{}", error_msg);
                    return Err(e.into());
                }
            }
        }

        Ok(())
    }
}

impl ConnectorInfo for FsHosting {
    fn connector_id(&self) -> &str {
        "fs-hosting"
    }

    fn connector_type(&self) -> ConnectorType {
        ConnectorType::Hosting
    }

    fn display_name(&self) -> &str {
        "File system hosting"
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
        // FsHosting has no authentication, so hide logout button
        true
    }
}

#[async_trait]
impl HostingConnector for FsHosting {
    // ==================
    // Authentication
    // FsHosting has no authentication - always logged in
    // ==================

    async fn is_logged_in(&self, _session: &serde_json::Value) -> ConnectorResult<bool> {
        // Filesystem hosting has no authentication
        Ok(true)
    }

    async fn get_oauth_url(&self, _session: &serde_json::Value) -> ConnectorResult<Option<String>> {
        // No OAuth for filesystem hosting
        Ok(None)
    }

    async fn set_token(
        &self,
        _session: &mut serde_json::Value,
        _token: &serde_json::Value,
    ) -> ConnectorResult<()> {
        // No tokens for filesystem hosting
        Ok(())
    }

    async fn logout(&self, _session: &mut serde_json::Value) -> ConnectorResult<()> {
        // No logout for filesystem hosting
        Ok(())
    }

    async fn get_user(&self, session: &serde_json::Value) -> ConnectorResult<ConnectorUser> {
        // Return the current system username
        let username = whoami::username().unwrap_or_else(|_| "unknown".to_string());

        // Create connector data for this hosting connector
        let storage_data = ConnectorData {
            connector_id: self.connector_id().to_string(),
            connector_type: self.connector_type(),
            display_name: self.display_name().to_string(),
            icon: self.icon().to_string(),
            disable_logout: self.disable_logout(),
            is_logged_in: self.is_logged_in(session).await?,
            oauth_url: self.get_oauth_url(session).await?,
            color: self.color().to_string(),
            background: self.background().to_string(),
        };

        Ok(ConnectorUser {
            name: username,
            email: None,
            picture: Some(USER_ICON.to_string()),
            storage: storage_data,
        })
    }

    fn get_options(&self, _form_data: &serde_json::Value) -> ConnectorOptions {
        // No options for filesystem hosting
        ConnectorOptions::default()
    }

    // ==================
    // Publication
    // ==================

    async fn publish(
        &self,
        _session: &serde_json::Value,
        website_id: &WebsiteId,
        files: Vec<ConnectorFile>,
        job_manager: &JobManager,
    ) -> ConnectorResult<PublicationJobData> {
        let target_dir = self.publish_dir(website_id);

        // Start a new publication job
        let mut job = job_manager.start_job(format!("Publishing to {}", self.display_name()));

        job.log(format!(
            "Publishing {} files to {}",
            files.len(),
            target_dir.display()
        ));

        // Write all files to the target directory
        match self.write_files(&target_dir, &files, &mut job).await {
            Ok(_) => {
                job.success(format!(
                    "Published {} files to {}",
                    files.len(),
                    target_dir.display()
                ));
                job_manager.complete_job(&job.base.job_id);
            }
            Err(e) => {
                job.fail(format!("Publication failed: {}", e));
                job_manager.fail_job(&job.base.job_id, &e.to_string());
            }
        }

        Ok(job)
    }

    async fn get_url(
        &self,
        _session: &serde_json::Value,
        website_id: &WebsiteId,
    ) -> ConnectorResult<String> {
        let target_dir = self.publish_dir(website_id);
        let file_path = target_dir.join("index.html");
        let url = format!("file://{}", file_path.display());
        Ok(url)
    }
}
