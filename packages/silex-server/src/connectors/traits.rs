/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Connector trait definitions
//!
//! These traits define the interface that all connectors must implement.
//! StorageConnector: for storing and retrieving website data
//! HostingConnector: for publishing websites

use async_trait::async_trait;

use crate::error::ConnectorResult;
use crate::models::{
    ConnectorData, ConnectorFile, ConnectorOptions, ConnectorType, ConnectorUser,
    PublicationJobData, WebsiteData, WebsiteId, WebsiteMeta, WebsiteMetaFileContent,
};
use crate::services::JobManager;

/// Base information that all connectors must provide
pub trait ConnectorInfo: Send + Sync {
    /// Unique identifier for this connector (e.g., "fs-storage")
    fn connector_id(&self) -> &str;

    /// Type of connector (STORAGE or HOSTING)
    fn connector_type(&self) -> ConnectorType;

    /// Human-readable name for UI display
    fn display_name(&self) -> &str;

    /// Icon URL or data URI
    fn icon(&self) -> &str;

    /// Primary color for UI
    fn color(&self) -> &str;

    /// Background color for UI
    fn background(&self) -> &str;

    /// Whether to hide the logout button
    fn disable_logout(&self) -> bool {
        false
    }
}

/// StorageConnector stores website data and assets
///
/// This is the main interface for website persistence.
/// Implementations might store data on:
/// - Local filesystem (FsStorage)
/// - GitLab repositories
/// - FTP servers
/// - Cloud storage (S3, etc.)
#[async_trait]
pub trait StorageConnector: ConnectorInfo {
    // ==================
    // Authentication
    // ==================

    /// Check if the user is currently logged in
    ///
    /// For connectors without authentication (like FsStorage),
    /// this always returns true.
    async fn is_logged_in(&self, session: &serde_json::Value) -> ConnectorResult<bool>;

    /// Get the OAuth URL to start authentication
    ///
    /// Returns None if this connector uses basic auth or no auth.
    async fn get_oauth_url(&self, session: &serde_json::Value) -> ConnectorResult<Option<String>>;

    /// Store authentication tokens in the session
    ///
    /// Called after OAuth callback or form submission.
    async fn set_token(
        &self,
        session: &mut serde_json::Value,
        token: &serde_json::Value,
    ) -> ConnectorResult<()>;

    /// Log out the user (clear session data)
    async fn logout(&self, session: &mut serde_json::Value) -> ConnectorResult<()>;

    /// Get the currently logged in user's data
    async fn get_user(&self, session: &serde_json::Value) -> ConnectorResult<ConnectorUser>;

    /// Extract connector options from form data
    fn get_options(&self, form_data: &serde_json::Value) -> ConnectorOptions;

    // ==================
    // Website CRUD
    // ==================

    /// List all websites accessible to the user
    async fn list_websites(&self, session: &serde_json::Value) -> ConnectorResult<Vec<WebsiteMeta>>;

    /// Read a website's data
    async fn read_website(
        &self,
        session: &serde_json::Value,
        website_id: &WebsiteId,
    ) -> ConnectorResult<WebsiteData>;

    /// Create a new website
    ///
    /// Returns the new website's ID.
    async fn create_website(
        &self,
        session: &serde_json::Value,
        meta: &WebsiteMetaFileContent,
    ) -> ConnectorResult<WebsiteId>;

    /// Update an existing website's data
    async fn update_website(
        &self,
        session: &serde_json::Value,
        website_id: &WebsiteId,
        data: &WebsiteData,
    ) -> ConnectorResult<()>;

    /// Delete a website
    async fn delete_website(
        &self,
        session: &serde_json::Value,
        website_id: &WebsiteId,
    ) -> ConnectorResult<()>;

    /// Duplicate a website
    async fn duplicate_website(
        &self,
        session: &serde_json::Value,
        website_id: &WebsiteId,
    ) -> ConnectorResult<WebsiteId>;

    // ==================
    // Assets
    // ==================

    /// Write multiple asset files
    async fn write_assets(
        &self,
        session: &serde_json::Value,
        website_id: &WebsiteId,
        files: Vec<ConnectorFile>,
    ) -> ConnectorResult<Vec<String>>;

    /// Read a single asset file
    async fn read_asset(
        &self,
        session: &serde_json::Value,
        website_id: &WebsiteId,
        file_name: &str,
    ) -> ConnectorResult<Vec<u8>>;

    // ==================
    // Metadata
    // ==================

    /// Get website metadata
    async fn get_website_meta(
        &self,
        session: &serde_json::Value,
        website_id: &WebsiteId,
    ) -> ConnectorResult<WebsiteMeta>;

    /// Update website metadata
    async fn set_website_meta(
        &self,
        session: &serde_json::Value,
        website_id: &WebsiteId,
        meta: &WebsiteMetaFileContent,
    ) -> ConnectorResult<()>;
}

/// HostingConnector publishes websites to make them accessible
///
/// Implementations might publish to:
/// - Local filesystem (FsHosting)
/// - GitLab Pages
/// - FTP servers
/// - CDNs
#[async_trait]
pub trait HostingConnector: ConnectorInfo {
    // ==================
    // Authentication
    // ==================

    /// Check if the user is currently logged in
    async fn is_logged_in(&self, session: &serde_json::Value) -> ConnectorResult<bool>;

    /// Get the OAuth URL to start authentication
    async fn get_oauth_url(&self, session: &serde_json::Value) -> ConnectorResult<Option<String>>;

    /// Store authentication tokens in the session
    async fn set_token(
        &self,
        session: &mut serde_json::Value,
        token: &serde_json::Value,
    ) -> ConnectorResult<()>;

    /// Log out the user
    async fn logout(&self, session: &mut serde_json::Value) -> ConnectorResult<()>;

    /// Get the currently logged in user's data
    async fn get_user(&self, session: &serde_json::Value) -> ConnectorResult<ConnectorUser>;

    /// Extract connector options from form data
    fn get_options(&self, form_data: &serde_json::Value) -> ConnectorOptions;

    // ==================
    // Publication
    // ==================

    /// Publish website files
    ///
    /// Takes the files to publish and a job manager for progress tracking.
    /// Returns job data with publication status.
    async fn publish(
        &self,
        session: &serde_json::Value,
        website_id: &WebsiteId,
        files: Vec<ConnectorFile>,
        job_manager: &JobManager,
    ) -> ConnectorResult<PublicationJobData>;

    /// Get the URL where the published website is accessible
    async fn get_url(
        &self,
        session: &serde_json::Value,
        website_id: &WebsiteId,
    ) -> ConnectorResult<String>;
}

/// Helper function to convert a connector to ConnectorData for the frontend
pub async fn to_connector_data<C: StorageConnector + ?Sized>(
    session: &serde_json::Value,
    connector: &C,
) -> ConnectorResult<ConnectorData> {
    Ok(ConnectorData {
        connector_id: connector.connector_id().to_string(),
        connector_type: connector.connector_type(),
        display_name: connector.display_name().to_string(),
        icon: connector.icon().to_string(),
        disable_logout: connector.disable_logout(),
        is_logged_in: connector.is_logged_in(session).await?,
        oauth_url: connector.get_oauth_url(session).await?,
        color: connector.color().to_string(),
        background: connector.background().to_string(),
    })
}

/// Helper function to convert a hosting connector to ConnectorData
pub async fn hosting_to_connector_data<C: HostingConnector + ?Sized>(
    session: &serde_json::Value,
    connector: &C,
) -> ConnectorResult<ConnectorData> {
    Ok(ConnectorData {
        connector_id: connector.connector_id().to_string(),
        connector_type: connector.connector_type(),
        display_name: connector.display_name().to_string(),
        icon: connector.icon().to_string(),
        disable_logout: connector.disable_logout(),
        is_logged_in: connector.is_logged_in(session).await?,
        oauth_url: connector.get_oauth_url(session).await?,
        color: connector.color().to_string(),
        background: connector.background().to_string(),
    })
}
