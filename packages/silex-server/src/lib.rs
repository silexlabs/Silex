/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Silex Server Library
//!
//! This crate provides the core server functionality for Silex website builder.
//! It includes storage and hosting connectors, API routes, and supporting services.

pub mod config;
pub mod connectors;
pub mod error;
pub mod models;
pub mod routes;
pub mod services;

// Re-export commonly used types for convenience
pub use config::Config;
pub use connectors::{ConnectorRegistry, FsHosting, FsStorage, HostingConnector, StorageConnector};
pub use error::ConnectorError;
pub use models::{ConnectorType, WebsiteData, WebsiteMeta};
