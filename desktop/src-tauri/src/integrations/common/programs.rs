/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Where the programs of this machine are

use std::path::PathBuf;

use super::run;

/// Every place this program could be, the likeliest first
///
/// An app started from a desktop launcher does not get the PATH of a shell, so
/// finding nothing in it proves nothing. The shell is asked only then, because
/// asking it costs half a second of somebody else's startup files.
pub(crate) fn found(name: &str) -> Option<PathBuf> {
    let a_file = |path: PathBuf| path.is_file().then_some(path);

    which::which(name)
        .ok()
        .and_then(a_file)
        .or_else(|| {
            login_shell_path()
                .into_iter()
                .find_map(|folder| a_file(folder.join(name)))
        })
        .or_else(|| known_paths(name).into_iter().find_map(a_file))
}

/// The folders the shell of the user puts in its PATH
///
/// A program installed by nvm, volta, fnm, asdf or mise lives in a folder only
/// their shell knows about. Asking is one question, where guessing is a list
/// that is never finished.
#[cfg(not(target_os = "windows"))]
fn login_shell_path() -> Vec<PathBuf> {
    // Starting a login shell runs every startup file the user has, and the
    // answer is the same all session long
    static ASKED: std::sync::OnceLock<Vec<PathBuf>> = std::sync::OnceLock::new();
    ASKED.get_or_init(ask_the_login_shell).clone()
}

#[cfg(not(target_os = "windows"))]
fn ask_the_login_shell() -> Vec<PathBuf> {
    // What the shell writes back is surrounded by whatever a talkative startup
    // file prints, so the line to read is marked
    const MARKER: &str = "__silex_path__";

    let Some(shell) = std::env::var_os("SHELL").map(PathBuf::from) else {
        return Vec::new();
    };
    if !shell.is_file() {
        return Vec::new();
    }

    // -l so that it reads the files a version manager is set up in, -i
    // because most of them are set up in the interactive ones
    let asked = format!("echo {}$PATH", MARKER);
    let Ok(said) = run::run(&shell, &std::env::temp_dir(), &["-lic", &asked]) else {
        return Vec::new();
    };
    said.lines()
        .rev()
        .find_map(|line| line.trim().strip_prefix(MARKER))
        .map(|path| {
            path.split(':')
                .filter(|folder| !folder.is_empty())
                .map(PathBuf::from)
                .collect()
        })
        .unwrap_or_default()
}

#[cfg(target_os = "windows")]
fn login_shell_path() -> Vec<PathBuf> {
    Vec::new()
}

/// Where programs are usually installed
#[cfg(target_os = "windows")]
fn known_paths(name: &str) -> Vec<PathBuf> {
    let mut installs = Vec::new();

    // Read the folder rather than hard coding C:\Program Files: it is
    // translated on some installs
    for variable in ["ProgramFiles", "ProgramFiles(x86)"] {
        if let Some(folder) = std::env::var_os(variable) {
            installs.push(PathBuf::from(folder));
        }
    }
    // Where an installer puts a program installed "for me only"
    if let Some(folder) = std::env::var_os("LOCALAPPDATA") {
        installs.push(PathBuf::from(folder).join("Programs"));
    }

    // npm and scoop write a .cmd shim and some write a .bat, so the .exe
    // alone misses most of what a user installs themselves
    installs
        .iter()
        // Git puts in cmd what is meant to be called from the outside and in
        // bin the bare ones; which one is there varies
        .flat_map(|install| {
            [
                install.join(name).join("cmd"),
                install.join(name).join("bin"),
                install.clone(),
            ]
        })
        .flat_map(|folder| {
            ["exe", "cmd", "bat"]
                .iter()
                .map(|extension| folder.join(format!("{}.{}", name, extension)))
                .collect::<Vec<_>>()
        })
        .collect()
}

#[cfg(not(target_os = "windows"))]
fn known_paths(name: &str) -> Vec<PathBuf> {
    [
        "/usr/bin",
        "/usr/local/bin",
        "/usr/local/sbin",
        // Homebrew, on apple silicon and on intel
        "/opt/homebrew/bin",
        "/opt/homebrew/sbin",
        "/opt/local/bin",
        // Where Ubuntu puts a snap, which is how glab is distributed there
        "/snap/bin",
        // Flatpak, installed for everybody
        "/var/lib/flatpak/exports/bin",
    ]
    .iter()
    .map(|folder| PathBuf::from(folder).join(name))
    .chain(std::env::var_os("HOME").into_iter().flat_map(|home| {
        let home = PathBuf::from(home);
        [
            // What a user installs for themselves
            home.join(".local/bin").join(name),
            home.join(".local/share/flatpak/exports/bin").join(name),
            home.join(".bun/bin").join(name),
            home.join(".cargo/bin").join(name),
        ]
    }))
    .collect()
}
