/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Connector interfaces and implementations
//!
//! Connectors are backends for storing website data (StorageConnector)
//! and publishing websites (HostingConnector).

mod fs_hosting;
mod fs_storage;
mod registry;
mod traits;

pub use fs_hosting::FsHosting;
pub use fs_storage::FsStorage;
pub use registry::ConnectorRegistry;
pub use traits::{
    hosting_to_connector_data, to_connector_data, HostingConnector,
    StorageConnector,
};
