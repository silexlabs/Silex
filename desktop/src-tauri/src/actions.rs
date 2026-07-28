/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! What the server asks for, done on this machine
//!
//! The server writes files and asks for what it cannot do itself. Which
//! integration answers, and whether any does, is decided here: the server has
//! no idea git exists, and git has no idea whether the user enabled it.

use std::path::PathBuf;

use crate::integrations::Integrations;

pub struct SilexActions {
    /// Directory holding one sub directory per website
    data_path: PathBuf,
    integrations: Integrations,
}

impl SilexActions {
    pub fn new(data_path: PathBuf, integrations: Integrations) -> Self {
        SilexActions {
            data_path,
            integrations,
        }
    }
}

impl silex_server::Actions for SilexActions {
    fn version(&self, website_id: &str, message: &str) -> Result<(), String> {
        // Nobody to version with, and that is a perfectly fine way to run:
        // a website is a folder of files, versioning it is a layer on top
        let Some(git) = self.integrations.git() else {
            return Ok(());
        };

        git.version(&self.data_path.join(website_id), message)
    }
}
