/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Server configuration
//!
//! The server only ever needs to know where the websites live. Anything that
//! depends on the machine it runs on (integrations, processes, packaging) is
//! the desktop app's business, not the server's.

use std::path::PathBuf;

/// Port the server listens on.
pub const PORT: u16 = 6805;

/// Server configuration
#[derive(Debug, Clone)]
pub struct Config {
    /// Directory holding one sub directory per website.
    pub data_path: PathBuf,
}

impl Config {
    /// Create a config for the given website storage directory.
    pub fn new(data_path: PathBuf) -> Self {
        Config { data_path }
    }
}
