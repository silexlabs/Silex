/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The git integration
//!
//! Versions a website by committing its folder, the way the SaaS server does
//! it on GitLab: one commit per save, on one branch, everything in it. A
//! website is a folder of files first, git is a layer on top of it.

use std::path::{Path, PathBuf};

use super::run::run;

/// The git program found on this machine
pub struct Git {
    program: PathBuf,
}

/// A program that was found, and answered when asked for its version
pub struct Detected {
    pub path: PathBuf,
    pub version: String,
}

/// Look for git in PATH, then where it is usually installed
///
/// An app started from a desktop launcher does not get the PATH of a shell, so
/// finding nothing in it proves nothing.
fn find_program(name: &str) -> Option<PathBuf> {
    which::which(name)
        .ok()
        .or_else(|| known_paths(name).into_iter().find(|path| path.is_file()))
}

/// Where git is usually installed
#[cfg(target_os = "windows")]
fn known_paths(name: &str) -> Vec<PathBuf> {
    let mut installs = Vec::new();

    // Read the folder rather than hard coding C:\Program Files: it is
    // translated on some installs, and can live on another drive
    for variable in ["ProgramFiles", "ProgramFiles(x86)"] {
        if let Some(folder) = std::env::var_os(variable) {
            installs.push(PathBuf::from(folder).join("Git"));
        }
    }
    // What Git for Windows does when installed "for me only", which is what
    // happens without administrator rights
    if let Some(folder) = std::env::var_os("LOCALAPPDATA") {
        installs.push(PathBuf::from(folder).join("Programs").join("Git"));
    }

    let program = format!("{}.exe", name);
    installs
        .iter()
        // cmd holds the programs meant to be called from the outside, bin the
        // bare ones. Both exist, and which one is there varies with the install
        .flat_map(|install| [install.join("cmd").join(&program), install.join("bin").join(&program)])
        .collect()
}

#[cfg(not(target_os = "windows"))]
fn known_paths(name: &str) -> Vec<PathBuf> {
    ["/usr/bin", "/usr/local/bin", "/opt/homebrew/bin", "/opt/local/bin"]
        .iter()
        .map(|folder| PathBuf::from(folder).join(name))
        .collect()
}

impl Git {
    /// Look for git on this machine, and read its version to make sure it runs
    ///
    /// Done once, the first time the app runs: which programs are installed
    /// cannot be told reliably enough to be asked again at every save.
    pub fn detect() -> Option<Detected> {
        let git = Git::at(find_program("git")?);
        match git.run(&std::env::temp_dir(), &["--version"]) {
            Ok(version) => Some(Detected {
                path: git.program,
                version: version.trim().to_string(),
            }),
            Err(e) => {
                tracing::warn!("Found git but could not run it: {}", e);
                None
            }
        }
    }

    /// Use the git that was found earlier, at the path it was found at
    pub fn at(program: PathBuf) -> Self {
        Git { program }
    }

    /// Add everything in the website folder to a new version of it
    ///
    /// Nothing is ignored: the published files live in the website folder too,
    /// and the SaaS keeps sources and publication in the same repository.
    pub fn version(&self, site: &Path, message: &str) -> Result<(), String> {
        if !site.join(".git").exists() {
            self.init(site)?;
        }

        self.run(site, &["add", "-A"])?;

        // Saving a website that did not change is not a failure, it just has
        // nothing to version. Asking git rather than reading what it says
        // about it, which is translated.
        if self.run(site, &["status", "--porcelain"])?.trim().is_empty() {
            return Ok(());
        }

        self.run(site, &["commit", "-m", message])?;
        Ok(())
    }

    fn init(&self, site: &Path) -> Result<(), String> {
        // -b main: the default branch name depends on the user's git config,
        // and publishing pushes to main
        self.run(site, &["init", "-b", "main"])?;

        // Committing needs a name and a mail address, and the user may have
        // never set any. Theirs is used when they have one, and the one made
        // up here stays in this repository: the global config is left alone.
        if self.run(site, &["config", "--get", "user.email"]).is_err() {
            self.run(site, &["config", "user.name", "Silex"])?;
            self.run(site, &["config", "user.email", "silex@localhost"])?;
        }

        Ok(())
    }

    fn run(&self, dir: &Path, args: &[&str]) -> Result<String, String> {
        run(&self.program, dir, args)
    }
}

