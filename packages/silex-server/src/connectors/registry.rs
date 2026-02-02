/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Connector registry
//!
//! Manages the available storage and hosting connectors.
//! The registry provides methods to look up connectors by ID or type.

use std::sync::Arc;

use crate::connectors::traits::{HostingConnector, StorageConnector};

/// Registry of available connectors
///
/// The registry holds all registered connectors and provides
/// methods to look them up by ID or type.
pub struct ConnectorRegistry {
    /// Storage connectors (for website data persistence)
    storage_connectors: Vec<Arc<dyn StorageConnector>>,

    /// Hosting connectors (for website publication)
    hosting_connectors: Vec<Arc<dyn HostingConnector>>,
}

impl ConnectorRegistry {
    /// Create a new empty registry
    pub fn new() -> Self {
        ConnectorRegistry {
            storage_connectors: Vec::new(),
            hosting_connectors: Vec::new(),
        }
    }

    /// Register a storage connector
    pub fn register_storage(&mut self, connector: Arc<dyn StorageConnector>) {
        self.storage_connectors.push(connector);
    }

    /// Register a hosting connector
    pub fn register_hosting(&mut self, connector: Arc<dyn HostingConnector>) {
        self.hosting_connectors.push(connector);
    }

    /// Get all storage connectors
    pub fn storage_connectors(&self) -> &[Arc<dyn StorageConnector>] {
        &self.storage_connectors
    }

    /// Get all hosting connectors
    pub fn hosting_connectors(&self) -> &[Arc<dyn HostingConnector>] {
        &self.hosting_connectors
    }

    /// Find a storage connector by ID
    ///
    /// Returns None if no connector with that ID exists.
    pub fn get_storage_connector(&self, connector_id: &str) -> Option<Arc<dyn StorageConnector>> {
        self.storage_connectors
            .iter()
            .find(|c| c.connector_id() == connector_id)
            .cloned()
    }

    /// Find a hosting connector by ID
    ///
    /// Returns None if no connector with that ID exists.
    pub fn get_hosting_connector(&self, connector_id: &str) -> Option<Arc<dyn HostingConnector>> {
        self.hosting_connectors
            .iter()
            .find(|c| c.connector_id() == connector_id)
            .cloned()
    }

    /// Get the first storage connector, or a specific one by ID
    ///
    /// If connector_id is provided, returns that connector.
    /// Otherwise, returns the first connector (or None if empty).
    pub fn get_storage_connector_or_default(
        &self,
        connector_id: Option<&str>,
    ) -> Option<Arc<dyn StorageConnector>> {
        match connector_id {
            Some(id) => self.get_storage_connector(id),
            None => self.storage_connectors.first().cloned(),
        }
    }

    /// Get the first hosting connector, or a specific one by ID
    ///
    /// If connector_id is provided, returns that connector.
    /// Otherwise, returns the first connector (or None if empty).
    pub fn get_hosting_connector_or_default(
        &self,
        connector_id: Option<&str>,
    ) -> Option<Arc<dyn HostingConnector>> {
        match connector_id {
            Some(id) => self.get_hosting_connector(id),
            None => self.hosting_connectors.first().cloned(),
        }
    }

}

impl Default for ConnectorRegistry {
    fn default() -> Self {
        Self::new()
    }
}
