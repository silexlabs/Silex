/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The programs Silex works with, on this machine
//!
//! Being installed is not the same as being used: an integration only acts
//! once the user is fine with it. Git is the exception the user can undo, it
//! starts enabled when it is already installed, because versioning websites is
//! what Silex would do with it anyway.
//!
//! What was found is remembered in `integrations.json`, next to the install id,
//! and looked for only once, the first time the app runs. Afterwards Silex
//! goes by what it knows: a user installing git later says so on the
//! integrations screen, rather than having Silex guess behind their back.

pub mod git;
mod run;

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use git::Git;

/// What is known of one integration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationState {
    /// Whether the user wants Silex to use it
    pub enabled: bool,
    /// Where the program was found, empty when it was not
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<PathBuf>,
    /// What it answered when asked for its version
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
}

/// The state of every integration, as stored on the disk
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Integrations {
    /// Missing until git has been looked for a first time
    #[serde(skip_serializing_if = "Option::is_none")]
    pub git: Option<IntegrationState>,
}

impl Integrations {
    /// The git to version websites with, when there is one to use
    pub fn git(&self) -> Option<Git> {
        let state = self.git.as_ref()?;
        if !state.enabled {
            return None;
        }
        // The program may have been uninstalled since it was found. Saying so
        // once beats failing on every save with a path that leads nowhere.
        let path = state.path.as_ref().filter(|path| path.is_file())?;
        Some(Git::at(path.clone()))
    }
}

fn path(data_dir: &Path) -> PathBuf {
    data_dir.join("integrations.json")
}

/// What Silex knows of this machine, looking for the programs the first time
pub fn load(data_dir: &Path) -> Integrations {
    let mut integrations = read(data_dir);

    // Looked for already: nothing to ask this machine again. Every look costs
    // a program started, and on macOS asking for a git that is not there is
    // enough to pop the dialog offering to install the developer tools.
    if integrations.git.is_some() {
        return integrations;
    }

    // First run: git being installed is enough to version websites with it
    let detected = Git::detect();
    integrations.git = Some(IntegrationState {
        enabled: detected.is_some(),
        path: detected.as_ref().map(|git| git.path.clone()),
        version: detected.map(|git| git.version),
    });

    write(data_dir, &integrations);
    integrations
}

fn read(data_dir: &Path) -> Integrations {
    let Ok(content) = std::fs::read_to_string(path(data_dir)) else {
        return Integrations::default();
    };
    serde_json::from_str(&content).unwrap_or_else(|e| {
        tracing::warn!("Could not read the integrations, starting over: {}", e);
        Integrations::default()
    })
}

fn write(data_dir: &Path, integrations: &Integrations) {
    let Ok(content) = serde_json::to_string_pretty(integrations) else {
        return;
    };
    if let Err(e) = std::fs::write(path(data_dir), content) {
        tracing::warn!("Could not store the integrations: {}", e);
    }
}
