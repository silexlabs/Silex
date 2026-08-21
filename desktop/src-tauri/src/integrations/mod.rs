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

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use deploy::{Answer, Deploy};

pub mod deploy;
pub mod git;
mod glab;
mod hut;
pub mod pipeline;
pub mod remote;
mod run;
mod tea;

/// Every place this program could be, the likeliest first
///
/// An app started from a desktop launcher does not get the PATH of a shell, so
/// finding nothing in it proves nothing: a `glab` installed by Homebrew lives
/// in a folder such an app never hears about. Several are answered rather than
/// one, because a file being there does not mean it runs: a broken install
/// first in the PATH would otherwise hide a working one further down.
pub(crate) fn candidates(name: &str) -> Vec<PathBuf> {
    let mut found: Vec<PathBuf> = Vec::new();
    let mut keep = |path: PathBuf| {
        if path.is_file() && !found.contains(&path) {
            found.push(path);
        }
    };

    if let Ok(path) = which::which(name) {
        keep(path);
    }
    for folder in login_shell_path() {
        keep(folder.join(name));
    }
    for path in known_paths(name) {
        keep(path);
    }
    found
}

/// The folders the shell of the user puts in its PATH
///
/// A program installed by nvm, volta, fnm, asdf or mise lives in a folder only
/// their shell knows about, and an app started from a desktop launcher never
/// hears of it. Asking the shell is one question, where guessing is a list of
/// folders that is never finished.
#[cfg(not(target_os = "windows"))]
fn login_shell_path() -> Vec<PathBuf> {
    // What the shell writes back is surrounded by whatever a talkative startup
    // file prints, so the line to read is marked
    const MARKER: &str = "__silex_path__";

    let Some(shell) = std::env::var_os("SHELL").map(PathBuf::from) else {
        return Vec::new();
    };
    if !shell.is_file() {
        return Vec::new();
    }

    // -l so that it reads the files a version manager is set up in, -i because
    // most of them are set up in the interactive ones. Reading nothing back is
    // an answer like any other: the folders below are still looked at.
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
    // translated on some installs, and can live on another drive
    for variable in ["ProgramFiles", "ProgramFiles(x86)"] {
        if let Some(folder) = std::env::var_os(variable) {
            installs.push(PathBuf::from(folder));
        }
    }
    // What an installer does when installing "for me only", which is what
    // happens without administrator rights
    if let Some(folder) = std::env::var_os("LOCALAPPDATA") {
        installs.push(PathBuf::from(folder).join("Programs"));
    }

    // An installer writes an .exe, npm and scoop write a .cmd shim, and some
    // write a .bat. Looking for the .exe alone misses most of what a user
    // installs themselves.
    installs
        .iter()
        // Git puts in cmd the programs meant to be called from the outside and
        // in bin the bare ones; both exist, and which one is there varies
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
        // Where Ubuntu puts what it installs as a snap, which is how glab
        // itself is distributed there
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

/// What is known of one integration
///
/// Refusing what it does not know is deliberate: an entry a later version wrote
/// with more in it is left to that version rather than read half and written
/// back short.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct IntegrationState {
    /// Whether the user wants Silex to use it
    pub enabled: bool,
    /// Where the program was found, empty when it was not
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<PathBuf>,
    /// What it answered when asked for its version
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,

    /// Whether it is there but does not run
    ///
    /// Told apart from not being installed at all, because what the user has to
    /// do is not the same: one of them installs it, the other repairs what they
    /// already have.
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub broken: bool,
}

/// What Silex knows of the programs of this machine, one entry per integration
///
/// Read and written entry by entry rather than as one shape: a file written by
/// a version that knows more integrations than this one keeps everything it
/// holds, instead of being rejected whole or written back short.
#[derive(Debug, Clone, Default)]
pub struct Integrations {
    known: BTreeMap<String, IntegrationState>,
    /// Entries this version has nothing to say about, kept as they were found
    unknown: BTreeMap<String, serde_json::Value>,
}

impl<'de> Deserialize<'de> for Integrations {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let entries = BTreeMap::<String, serde_json::Value>::deserialize(deserializer)?;
        let mut integrations = Integrations::default();
        for (id, entry) in entries {
            match serde_json::from_value(entry.clone()) {
                Ok(state) => integrations.known.insert(id, state).map(|_| ()),
                Err(_) => integrations.unknown.insert(id, entry).map(|_| ()),
            };
        }
        Ok(integrations)
    }
}

impl Serialize for Integrations {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut entries = self.unknown.clone();
        for (id, state) in &self.known {
            let state = serde_json::to_value(state).map_err(serde::ser::Error::custom)?;
            entries.insert(id.clone(), state);
        }
        entries.serialize(serializer)
    }
}

/// The integrations that provide `deploy`, asked in this order
fn deploy_providers() -> [&'static dyn Deploy; 3] {
    [&glab::Glab, &tea::Tea, &hut::Hut]
}

/// Who answers for a website, and how far they can go
pub enum Resolved {
    /// Nobody Silex knows recognises this website: it is versioned and sent all
    /// the same, and building it is up to whoever hosts it
    Nobody,
    /// One of them recognises it, but the user is not signed in to that forge
    NotSignedIn(&'static dyn Deploy, PathBuf),
    /// One of them speaks for it, and said what it knows
    SignedIn(&'static dyn Deploy, PathBuf, deploy::Urls),
}

/// A website that left for its forge, and what to ask its forge about the build
pub struct Publishing {
    pub provider: &'static dyn Deploy,
    pub cli: PathBuf,
    pub prepared: deploy::Prepared,
    /// What the forge knows of this website, when the user is signed in to it
    pub urls: Option<deploy::Urls>,
}

impl Resolved {
    /// The integration to publish with, when there is one, and what it knows
    ///
    /// No urls when the user is not signed in: the forge builds what it is
    /// pushed either way, Silex just has no way to say where that lands.
    pub fn into_parts(self) -> Option<(&'static dyn Deploy, PathBuf, Option<deploy::Urls>)> {
        match self {
            Resolved::Nobody => None,
            Resolved::NotSignedIn(provider, cli) => Some((provider, cli, None)),
            Resolved::SignedIn(provider, cli, urls) => Some((provider, cli, Some(urls))),
        }
    }
}

impl Integrations {
    /// Resolve `deploy` for a website: the first integration that provides it
    /// and answers for this one
    ///
    /// An integration that cannot tell is an error rather than a no: taking it
    /// for one would publish the website as if it had no forge at all.
    ///
    /// An integration that recognises the website but has nobody signed in is
    /// answered as such, so that publishing can still save and send it while
    /// saying what is missing.
    ///
    /// `website_url` is the address the user named, which the editor sends with
    /// the publication. None when nobody is publishing: the editor is then
    /// asking who serves this website, and it knows what it saved itself.
    pub fn resolve_deploy(
        &self,
        site: &Path,
        website_url: Option<&str>,
    ) -> Result<Resolved, String> {
        // Read once, by the git the user allowed, and handed to each of them:
        // a website whose remote cannot be read is still offered to the
        // programs that read it themselves
        let remote = git::remote_url(site).and_then(|url| {
            let read = remote::Remote::parse(&url);
            if read.is_none() {
                tracing::warn!(
                    remote = %remote::redact(&url),
                    "This remote is written in a way Silex cannot read"
                );
            }
            read
        });

        let mut recognized = None;
        for provider in deploy_providers() {
            let Some(cli) = self.program(provider.program()) else {
                continue;
            };
            match provider.urls(&cli, site, remote.as_ref(), website_url)? {
                Answer::Yes(urls) => return Ok(Resolved::SignedIn(provider, cli, urls)),
                // Kept, but a signed-in integration further down the list still
                // wins: a website can be on a host two of them know
                Answer::NotSignedIn => recognized = recognized.or(Some((provider, cli))),
                Answer::No => {}
            }
        }
        Ok(match recognized {
            Some((provider, cli)) => Resolved::NotSignedIn(provider, cli),
            None => Resolved::Nobody,
        })
    }

    /// Prepare a website for its forge and send it
    ///
    /// None when nobody recognises the website: it is versioned and sent as it
    /// is, and building it is up to whoever hosts it.
    ///
    /// `say` is told each step as it starts, for whoever is waiting on it.
    pub fn publish(
        &self,
        site: &Path,
        website_url: Option<&str>,
        say: &dyn Fn(String),
    ) -> Result<Option<Publishing>, String> {
        let git = git::Git::found().ok_or(
            "Silex could not find git on this computer, and it is git that sends a website to \
             its forge.",
        )?;
        // Said before rather than after: finding out which forge this is means
        // asking every program on this computer that knows one, and that is
        // the longest silence of a publication.
        say("Looking for the forge of your website".to_string());
        let Some((provider, cli, urls)) =
            self.resolve_deploy(site, website_url)?.into_parts()
        else {
            say("Writing the files that build your website".to_string());
            pipeline::ensure_build_files(site)?;
            say("Saving a version of your website".to_string());
            git::version(site, "Publish website")?;
            say("Sending it to your forge".to_string());
            git.push(site, None)?;
            return Ok(None);
        };

        say(format!(
            "Writing the files {} needs to build your website",
            provider.display_name()
        ));
        let prepared = provider.deploy(&cli, site, website_url)?;
        say(format!("Sending your website to {}", provider.display_name()));
        provider.push(&cli, site, &git, prepared.tag.as_deref())?;
        Ok(Some(Publishing {
            provider,
            cli,
            prepared,
            urls,
        }))
    }

    /// Send a website to wherever it is kept
    ///
    /// Nothing happens when nobody recognises the repository, and nothing
    /// happens without a git to send it with: neither is a failure, they are a
    /// website that stays on this computer.
    pub fn send(&self, site: &Path, tag: Option<&str>) -> Result<(), String> {
        let Some((provider, cli, _)) = self.resolve_deploy(site, None)?.into_parts() else {
            return Ok(());
        };
        let Some(git) = git::Git::found() else {
            return Ok(());
        };
        provider.push(&cli, site, &git, tag)
    }

    /// Whether this file already says something about that integration
    ///
    /// An entry a later version wrote lands in `unknown`, and looking only at
    /// `known` would have it looked for again, put back in `known`, and written
    /// over what that version had to say.
    fn has(&self, id: &str) -> bool {
        self.known.contains_key(id) || self.unknown.contains_key(id)
    }

    /// Where a program is, when the user enabled it and it is still installed
    fn program(&self, id: &str) -> Option<PathBuf> {
        let state = self.known.get(id)?;
        if !state.enabled || state.broken {
            return None;
        }
        // The program may have been uninstalled since it was found. Saying so
        // once beats failing on every save with a path that leads nowhere.
        state.path.as_ref().filter(|path| path.is_file()).cloned()
    }
}

fn path(data_dir: &Path) -> PathBuf {
    data_dir.join("integrations.json")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_what_a_version_that_knows_more_wrote() {
        // A newer Silex added an integration; this one has to give the file
        // back whole, or downgrading once would lose those settings for good
        let written = r#"{
            "git": { "enabled": true, "path": "/usr/bin/git", "version": "git version 2.51.0" },
            "rclone": { "enabled": true, "instance": "my-bucket" }
        }"#;

        let integrations: Integrations = serde_json::from_str(written).unwrap();
        assert!(integrations.known.contains_key("git"));
        assert!(integrations.unknown.contains_key("rclone"));

        let read_back: serde_json::Value =
            serde_json::from_str(&serde_json::to_string(&integrations).unwrap()).unwrap();
        assert_eq!(read_back["rclone"]["instance"], "my-bucket");
        assert_eq!(read_back["git"]["path"], "/usr/bin/git");
    }

    #[test]
    fn an_entry_a_version_that_knows_more_wrote_is_not_looked_for_again() {
        // The shape that matters: an integration THIS version knows, with a
        // field it does not. It lands in `unknown`, and looking for it again
        // would put a shorter entry back in its place.
        let written = r#"{
            "git": { "enabled": true, "path": "/usr/bin/git", "signing_key": "ABC123" }
        }"#;
        let integrations: Integrations = serde_json::from_str(written).unwrap();

        assert!(!integrations.known.contains_key("git"), "the extra field makes it unknown");
        assert!(integrations.has("git"), "but Silex must not look for it again");

        let read_back: serde_json::Value =
            serde_json::from_str(&serde_json::to_string(&integrations).unwrap()).unwrap();
        assert_eq!(read_back["git"]["signing_key"], "ABC123");
    }

    #[test]
    fn asks_again_of_what_was_found_and_says_what_changed() {
        let dir = std::env::temp_dir().join(format!("silex-again-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let gone = dir.join("uninstalled");
        let unrunnable = dir.join("not-a-program");
        std::fs::write(&unrunnable, "this is not a program").unwrap();

        let written = format!(
            r#"{{
                "glab": {{ "enabled": true, "path": "{}" }},
                "tea": {{ "enabled": true, "path": "{}" }},
                "hut": {{ "enabled": false, "path": "{}", "version": "hut v0.0" }}
            }}"#,
            gone.display(),
            unrunnable.display(),
            unrunnable.display()
        );
        let mut integrations: Integrations = serde_json::from_str(&written).unwrap();
        assert!(look_again(&mut integrations), "something changed");

        // Uninstalled since: the path it left behind would fail every
        // publication, so it goes
        let glab = &integrations.known["glab"];
        assert_eq!(glab.path, None);
        assert!(!glab.broken, "not broken, just not there any more");

        // There but does not run: told apart, because what the user has to do
        // is repair it rather than install it
        let tea = &integrations.known["tea"];
        assert!(tea.broken);
        assert!(tea.path.is_some(), "and we can still say which file it is");
        assert!(integrations.program("tea").is_none(), "a broken one is not used");

        // One the user turned off is not started at all, so what was written
        // about it stands untouched — even though it would fail to run
        let hut = &integrations.known["hut"];
        assert!(!hut.broken);
        assert_eq!(hut.version.as_deref(), Some("hut v0.0"));

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_program_the_user_turned_off_is_not_used() {
        let written = r#"{ "glab": { "enabled": false, "path": "/usr/bin/glab" } }"#;
        let integrations: Integrations = serde_json::from_str(written).unwrap();
        assert!(integrations.program("glab").is_none());
    }
}

/// What Silex knows of this machine, looking for the programs the first time
///
/// Looking again costs a program started, and on macOS asking for a git that
/// is not there pops the dialog offering to install the developer tools: an
/// integration already looked for is left as it is, and the user says on the
/// integrations screen when they install one.
pub fn load(data_dir: &Path) -> Integrations {
    let mut integrations = read(data_dir);
    let mut changed = false;

    for provider in deploy_providers() {
        let id = provider.program();
        if integrations.has(id) {
            continue;
        }
        // Asking for a version is how a program that is there but does not run
        // is told apart from one Silex can use, git included. Every place it
        // could be is tried: a broken install first in the PATH would
        // otherwise hide a working one further down.
        let version = candidates(id).into_iter().find_map(|path| {
            match run::run(&path, &std::env::temp_dir(), provider.version_args()) {
                Ok(version) => Some((path, run::readable(version.lines().next().unwrap_or_default()).trim().to_string())),
                Err(e) => {
                    tracing::warn!("Found {} at {} but could not run it: {}", id, path.display(), e);
                    None
                }
            }
        });
        integrations.known.insert(
            id.to_string(),
            IntegrationState {
                enabled: version.is_some(),
                path: version.as_ref().map(|(path, _)| path.clone()),
                version: version.map(|(_, version)| version),
                broken: false,
            },
        );
        changed = true;
    }

    changed |= look_again(&mut integrations);
    if changed {
        write(data_dir, &integrations);
    }
    integrations
}

/// Ask again of the programs already found whether they still answer
///
/// A program gets updated, repaired or removed while Silex is not looking, and
/// what was written the first time would otherwise stand for good: a version
/// that is no longer true in a bug report, and a program the user uninstalled
/// still offered to them.
///
/// Only what was already found is asked. Looking again for what was *not* there
/// is what must not happen at every start: on macOS, asking for a git that is
/// not installed pops the dialog offering to install the developer tools.
fn look_again(integrations: &mut Integrations) -> bool {
    let mut changed = false;
    let asked: Vec<(String, &'static [&'static str])> = deploy_providers()
        .into_iter()
        .map(|provider| (provider.program().to_string(), provider.version_args()))
        .collect();

    for (id, version_args) in asked {
        let Some(state) = integrations.known.get(&id) else {
            continue;
        };
        // One the user turned off is left alone: starting a program somebody
        // asked Silex not to use, every time the app opens, is the opposite of
        // what they asked for
        if !state.enabled {
            continue;
        }
        let Some(path) = state.path.clone() else {
            continue;
        };

        // Gone from the disk: nothing to ask, and keeping the path would have
        // every publication fail on a file that leads nowhere
        if !path.is_file() {
            tracing::info!("{} is no longer at {}", id, path.display());
            let state = integrations.known.get_mut(&id).expect("just read");
            state.path = None;
            state.version = None;
            state.broken = false;
            changed = true;
            continue;
        }

        let answered = run::run(&path, &std::env::temp_dir(), version_args);
        let state = integrations.known.get_mut(&id).expect("just read");
        match answered {
            Ok(said) => {
                let version = run::readable(said.lines().next().unwrap_or_default()).trim().to_string();
                if state.broken {
                    tracing::info!("{} runs again", id);
                }
                if state.version.as_deref() != Some(version.as_str()) || state.broken {
                    state.version = Some(version);
                    state.broken = false;
                    changed = true;
                }
            }
            Err(e) => {
                if !state.broken {
                    tracing::warn!("{} is at {} but does not run: {}", id, path.display(), e);
                    state.broken = true;
                    changed = true;
                }
            }
        }
    }
    changed
}

fn read(data_dir: &Path) -> Integrations {
    let file = path(data_dir);
    let Ok(content) = std::fs::read_to_string(&file) else {
        return Integrations::default();
    };
    match serde_json::from_str(&content) {
        Ok(integrations) => integrations,
        Err(e) => {
            // Starting over loses what the user had answered: a program they
            // had turned off is looked for again and turned back on. The file
            // they had is kept, so that what it said can still be read and put
            // back by hand.
            let kept = file.with_extension("json.unreadable");
            let _ = std::fs::rename(&file, &kept);
            tracing::warn!(
                "Could not read {}: {}. Kept it as {}, and looking for the programs again: \
                 anything that was turned off there is turned back on",
                file.display(),
                e,
                kept.display()
            );
            Integrations::default()
        }
    }
}

fn write(data_dir: &Path, integrations: &Integrations) {
    let Ok(content) = serde_json::to_string_pretty(integrations) else {
        return;
    };
    // Written beside the file and moved onto it: an app closing mid-write
    // leaves the file it had, never half of a new one
    let file = path(data_dir);
    let being_written = file.with_extension("json.writing");
    let written =
        std::fs::write(&being_written, content).and_then(|_| std::fs::rename(&being_written, &file));
    if let Err(e) = written {
        tracing::warn!("Could not store the integrations: {}", e);
        let _ = std::fs::remove_file(&being_written);
    }
}
