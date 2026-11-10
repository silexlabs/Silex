/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Where the programs of this machine are

use std::env;
use std::path::PathBuf;
use std::sync::Mutex;

#[cfg(not(target_os = "windows"))]
use super::run;
use super::run::outside_the_appimage;
use crate::held::held;

/// Every place this program could be, the likeliest first
pub(crate) fn users_own(name: &str) -> Option<PathBuf> {
    let a_file = |path: PathBuf| path.is_file().then_some(path);

    env::join_paths(search_path())
        .ok()
        .and_then(|path| which::which_in(name, Some(path), env::temp_dir()).ok())
        .and_then(a_file)
        .or_else(|| known_paths(name).into_iter().find_map(a_file))
}

/// The PATH every program is started with
pub(crate) fn search_path() -> Vec<PathBuf> {
    if let Some(folders) = &*held(&LOOKED_UP) {
        return folders.clone();
    }
    // Without the lock, which every program being started takes
    let folders = look_up();
    held(&LOOKED_UP).get_or_insert(folders).clone()
}

/// So that the next search reads the PATH where installers write it, for a
/// program installed while Silex runs, and asks again a shell that failed
pub(crate) fn forget() {
    *held(&LOOKED_UP) = None;
}

static LOOKED_UP: Mutex<Option<Vec<PathBuf>>> = Mutex::new(None);

/// The PATH the shell of the user has now, then the one of the process
///
/// An app started from a desktop launcher does not get the PATH of a shell,
/// and a program installed by nvm, volta, fnm, asdf or mise lives in a folder
/// only that shell knows about. In the other order, on macOS the git of Apple
/// and the node of the system pass before those of Homebrew and nvm.
#[cfg(not(target_os = "windows"))]
fn look_up() -> Vec<PathBuf> {
    let process = env::var_os("PATH").unwrap_or_default();
    outside_the_appimage(
        ask_the_login_shell()
            .into_iter()
            .chain(env::split_paths(&process)),
    )
}

#[cfg(not(target_os = "windows"))]
fn ask_the_login_shell() -> Vec<PathBuf> {
    let Some(shell) = env::var_os("SHELL").map(PathBuf::from) else {
        return Vec::new();
    };
    if !shell.is_file() {
        return Vec::new();
    }

    // -l so that it reads the files a version manager is set up in, -i
    // because most of them are set up in the interactive ones. tcsh takes -l
    // only alone.
    let flags = match shell.file_name().and_then(|name| name.to_str()) {
        Some("tcsh" | "csh") => "-ic",
        _ => "-lic",
    };
    // printenv rather than $PATH, which fish gives as a list
    let asked = format!("echo {}; printenv PATH", MARKER);
    let Ok(said) = run::run_login_shell(&shell, &[flags, &asked]) else {
        return Vec::new();
    };
    after_the_marker(&said)
        .map(env::split_paths)
        .map(Iterator::collect)
        .unwrap_or_default()
}

/// What the shell writes back is surrounded by whatever a talkative startup
/// file prints, so the line to read is marked
#[cfg(not(target_os = "windows"))]
const MARKER: &str = "__silex_path__";

#[cfg(not(target_os = "windows"))]
fn after_the_marker(said: &str) -> Option<&str> {
    let lines: Vec<&str> = said.lines().collect();
    let marker = lines.iter().rposition(|line| line.trim() == MARKER)?;
    lines.get(marker + 1).map(|line| line.trim())
}

/// Where installers write the PATH, then the PATH of the process
///
/// A process keeps the environment it started with, and some installers, glab
/// among them, do not even tell Windows that they changed it.
#[cfg(target_os = "windows")]
fn look_up() -> Vec<PathBuf> {
    use windows_registry::{CURRENT_USER, LOCAL_MACHINE};

    let system = LOCAL_MACHINE
        .open(r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment")
        .and_then(|key| key.get_string("Path"))
        .ok();
    let user_environment = CURRENT_USER.open("Environment").ok();
    let user = user_environment
        .as_ref()
        .and_then(|key| key.get_string("Path").ok());
    // A variable created since Silex started is only in the registry
    let variable = |name: &str| {
        env::var(name).ok().or_else(|| {
            let value = user_environment.as_ref()?.get_string(name).ok()?;
            Some(expanded(&value, |name| env::var(name).ok()))
        })
    };
    let registry: Vec<PathBuf> = [system, user]
        .into_iter()
        .flatten()
        .flat_map(|path| {
            env::split_paths(&path)
                .map(|folder| PathBuf::from(expanded(folder.to_string_lossy().trim(), &variable)))
                .collect::<Vec<_>>()
        })
        .collect();
    let process = env::var_os("PATH").unwrap_or_default();
    outside_the_appimage(registry.into_iter().chain(env::split_paths(&process)))
}

/// `%NAME%` replaced with its value, left as it is when there is none, as
/// Windows does
#[cfg(target_os = "windows")]
fn expanded(written: &str, variable: impl Fn(&str) -> Option<String>) -> String {
    let mut with_values = String::new();
    let mut rest = written;
    while let Some(start) = rest.find('%') {
        let after = &rest[start + 1..];
        let Some(end) = after.find('%') else {
            break;
        };
        with_values.push_str(&rest[..start]);
        let name = &after[..end];
        match variable(name) {
            Some(value) => with_values.push_str(&value),
            None => with_values.push_str(&rest[start..start + end + 2]),
        }
        rest = &after[end + 1..];
    }
    with_values.push_str(rest);
    with_values
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
    let mut known: Vec<PathBuf> = installs
        .iter()
        // Git puts in cmd what is meant to be called from the outside and in
        // bin the bare ones; which one is there varies
        .flat_map(|install| {
            [
                install.join(name).join("cmd"),
                install.join(name).join("bin"),
                install.join(name),
                install.clone(),
            ]
        })
        .flat_map(|folder| {
            ["exe", "cmd", "bat"]
                .iter()
                .map(|extension| folder.join(format!("{}.{}", name, extension)))
                .collect::<Vec<_>>()
        })
        .collect();
    // Where winget links a program that comes without an installer of its own
    if let Some(folder) = std::env::var_os("LOCALAPPDATA") {
        known.push(
            PathBuf::from(folder)
                .join(r"Microsoft\WinGet\Links")
                .join(format!("{}.exe", name)),
        );
    }
    known
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

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(not(target_os = "windows"))]
    #[test]
    fn reads_the_path_after_what_startup_files_print() {
        let said = format!("Welcome\n{}\n/home/me/.nvm/bin:/usr/bin\n", MARKER);
        assert_eq!(after_the_marker(&said), Some("/home/me/.nvm/bin:/usr/bin"));
        assert_eq!(after_the_marker("no marker\n/usr/bin"), None);
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn expands_the_variables_it_knows_and_leaves_the_others() {
        let variable =
            |name: &str| (name == "LOCALAPPDATA").then(|| r"C:\Users\me\AppData\Local".to_string());
        assert_eq!(
            expanded(r"%LOCALAPPDATA%\Programs\glab", variable),
            r"C:\Users\me\AppData\Local\Programs\glab"
        );
        assert_eq!(expanded(r"%NOPE%\bin", variable), r"%NOPE%\bin");
    }
}
