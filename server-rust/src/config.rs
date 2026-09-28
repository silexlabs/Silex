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
use std::sync::Arc;

use crate::actions::Actions;

/// Port the server listens on.
pub const PORT: u16 = 6805;

/// Largest request body the server accepts, in bytes.
///
/// The same 100mb the Node server takes (`SILEX_EXPRESS_JSON_LIMIT` in
/// `.env.default`): a website that saves on one has to save on the other.
pub const MAX_BODY_SIZE: usize = 100 * 1024 * 1024;

/// Server configuration
#[derive(Clone)]
pub struct Config {
    /// Directory holding one sub directory per website.
    pub data_path: PathBuf,
    /// Who performs the actions the server asks for, when somebody does.
    pub actions: Option<Arc<dyn Actions>>,
    /// Largest request body accepted, in bytes.
    pub body_limit: usize,
}

impl Config {
    /// Create a config for the given website storage directory.
    pub fn new(data_path: PathBuf) -> Self {
        Config {
            data_path,
            actions: None,
            body_limit: MAX_BODY_SIZE,
        }
    }

    /// Give the server somebody to ask for what it cannot do itself.
    pub fn with_actions(mut self, actions: Arc<dyn Actions>) -> Self {
        self.actions = Some(actions);
        self
    }

    /// Accept request bodies up to this many bytes.
    pub fn with_body_limit(mut self, bytes: usize) -> Self {
        self.body_limit = bytes;
        self
    }
}
