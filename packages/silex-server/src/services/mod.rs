/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Server services
//!
//! Supporting services for the Silex server.

mod jobs;
mod static_files;

pub use jobs::JobManager;
pub use static_files::{configure_static_files, StaticConfig};
