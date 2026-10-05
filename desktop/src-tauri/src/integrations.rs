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
//! once the user is fine with it.
//!
//! What was found is remembered in `integrations.json` and looked for only
//! once, the first time the app runs.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::{mpsc, LazyLock};

use serde::{Deserialize, Serialize};
use silex_server::PublicationOptions;

use common::programs::found;
use common::run;
use integration::{Capacity, Integration};

pub mod common;
mod glab;
mod hut;
pub mod integration;
mod tea;

/// What is known of one integration
///
/// Whatever a later version wrote and this one knows nothing of travels in
/// `rest`, so downgrading once and saving does not lose it.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationState {
    /// Whether the user wants Silex to use it
    #[serde(default)]
    pub enabled: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub path: Option<PathBuf>,
    /// What it answered when asked for its version
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,

    /// Whether it is there but does not run
    ///
    /// Told apart from not being installed: the user repairs it rather than
    /// installs it.
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub broken: bool,

    /// What a version that knows more wrote here, kept as it was found
    #[serde(flatten)]
    rest: serde_json::Map<String, serde_json::Value>,
}

/// What Silex knows of the programs of this machine, one entry per integration
///
/// An integration this version has never heard of keeps its entry whole, the
/// same way an unknown field does.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(transparent)]
pub struct Integrations {
    known: BTreeMap<String, IntegrationState>,
}

fn catalog() -> [&'static dyn Integration; 3] {
    [&glab::Glab, &tea::Tea, &hut::Hut]
}

pub struct Publishing {
    pub integration: &'static dyn Integration,
    pub cli: PathBuf,
    pub prepared: integration::Prepared,
    /// None when nobody is signed in to the host, and why when it could not be asked
    pub urls: Result<Option<integration::Urls>, String>,
}

impl Integrations {
    /// The integrations the user enabled that can do this for this website,
    /// with the path of their program
    pub fn get<'a>(
        &'a self,
        capacity: Capacity,
        site: &'a Path,
    ) -> impl Iterator<Item = (&'static dyn Integration, PathBuf)> + 'a {
        catalog()
            .into_iter()
            .filter(move |integration| integration.capacities().contains(&capacity))
            .filter_map(move |integration| {
                let cli = self.program_path(integration.program())?;
                integration.answers_for(site).then_some((integration, cli))
            })
    }

    /// Prepare a website for its host and send it
    ///
    /// `say` is told each step as it starts, for whoever is waiting on it.
    pub fn publish(
        &self,
        (integration, cli): (&'static dyn Integration, PathBuf),
        site: &Path,
        host: &str,
        options: &PublicationOptions,
        say: &dyn Fn(String),
    ) -> Result<Publishing, String> {
        // git pushes with what the user set it up with, which does not need
        // the host to answer
        let urls = integration.urls(&cli, site, options);
        // Scoped rather than set: this runs on a pool thread that the next
        // website to sync inherits
        sentry::with_scope(
            |scope| scope.set_tag("forge", integration.program()),
            || {
                say(format!("Getting your website ready for {}", host));
                let prepared = integration.deploy(&cli, site, options)?;
                say(format!("Sending your website to {}", host));
                if integration.capacities().contains(&Capacity::Sync) {
                    integration
                        .push(site, prepared.tag.as_deref())
                        .map_err(|e| e.to_string())?;
                }
                Ok(Publishing {
                    integration,
                    cli,
                    prepared,
                    urls,
                })
            },
        )
    }

    /// The programs Silex can use here, and what version each answered
    pub fn at_hand(&self) -> impl Iterator<Item = (&str, Option<&str>)> {
        self.known
            .iter()
            .filter(|(_, state)| state.enabled && state.path.is_some())
            .map(|(id, state)| (id.as_str(), state.version.as_deref()))
    }

    fn program_path(&self, id: &str) -> Option<PathBuf> {
        let state = self.known.get(id)?;
        if !state.enabled || state.broken {
            return None;
        }
        // Uninstalled since it was found: the path would fail every save
        state.path.as_ref().filter(|path| path.is_file()).cloned()
    }
}

fn path(data_dir: &Path) -> PathBuf {
    data_dir.join("integrations.json")
}

/// What Silex knows of this machine, asking again of what it already found
///
/// A program looked for once is never looked for again: on macOS, asking for a
/// git that is not installed pops the dialog offering the developer tools. What
/// was found is asked for its version at every start, because a program gets
/// updated, repaired or removed while Silex is not looking.
pub fn load(data_dir: &Path) -> Integrations {
    let mut integrations = read(data_dir);
    // Written by 3.10.0-canary.2, when git was listed with the integrations
    let mut changed = integrations.known.remove("git").is_some();

    for integration in catalog() {
        let id = integration.program();
        let known = integrations.known.get(id).cloned();

        // One the user turned off is left alone rather than started at every
        // launch
        if known.as_ref().is_some_and(|state| !state.enabled) {
            continue;
        }

        let path = match &known {
            Some(state) => state.path.clone(),
            None => found(id),
        };
        let Some(path) = path else {
            if known.is_none() {
                integrations.known.insert(
                    id.to_string(),
                    IntegrationState {
                        enabled: false,
                        path: None,
                        version: None,
                        broken: false,
                        rest: Default::default(),
                    },
                );
                changed = true;
            }
            continue;
        };

        // Gone from the disk since it was found: keeping the path would fail
        // every publication
        if !path.is_file() {
            tracing::info!("{} is no longer at {}", id, path.display());
            let state = integrations.known.get_mut(id).expect("known to be there");
            state.path = None;
            state.version = None;
            state.broken = false;
            changed = true;
            continue;
        }

        // Asking for a version tells a program that is there but does not run
        // from one Silex can use
        let answered = run::run(&path, &std::env::temp_dir(), integration.version_args());
        let was = integrations.known.entry(id.to_string()).or_insert_with(|| {
            changed = true;
            IntegrationState {
                enabled: true,
                path: Some(path.clone()),
                version: None,
                broken: false,
                rest: Default::default(),
            }
        });
        match answered {
            Ok(said) => {
                let version = run::readable(said.lines().next().unwrap_or_default())
                    .trim()
                    .to_string();
                if was.broken {
                    tracing::info!("{} runs again", id);
                }
                if was.version.as_deref() != Some(version.as_str()) || was.broken {
                    was.version = Some(version);
                    was.broken = false;
                    changed = true;
                }
            }
            Err(e) => {
                if !was.broken {
                    tracing::warn!("{} is at {} but does not run: {}", id, path.display(), e);
                    was.broken = true;
                    changed = true;
                }
            }
        }
    }

    if changed {
        write(data_dir, &integrations);
    }
    integrations
}

/// The integrations of `load`, waited for by whoever first needs them
pub type Loading = LazyLock<Integrations, Box<dyn FnOnce() -> Integrations + Send>>;

/// `load` without holding up the start of the app
///
/// Asking every program for its version takes as long as the rest of the
/// start. `then` is told what was found before anyone else gets it.
pub fn load_in_background(
    data_dir: PathBuf,
    then: impl FnOnce(&Integrations) + Send + 'static,
) -> Loading {
    let (found, waited_for) = mpsc::sync_channel(1);
    let loaded_in = data_dir.clone();
    std::thread::spawn(move || {
        let integrations = load(&loaded_in);
        then(&integrations);
        let _ = found.send(integrations);
    });
    // Should the thread die, what the user set up last time still holds
    LazyLock::new(Box::new(move || {
        waited_for.recv().unwrap_or_else(|_| read(&data_dir))
    }))
}

fn read(data_dir: &Path) -> Integrations {
    let file = path(data_dir);
    let Ok(content) = std::fs::read_to_string(&file) else {
        return Integrations::default();
    };
    match serde_json::from_str(&content) {
        Ok(integrations) => integrations,
        Err(e) => {
            // Starting over turns back on what the user had turned off, so
            // the file they had is kept to be read and put back by hand
            let kept = file.with_extension("json.unreadable");
            let _ = std::fs::rename(&file, &kept);
            tracing::error!(
                "Could not read {}: {}. Kept it as {}, and looking for the programs again: anything that was turned off there is turned back on",
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
    // Written beside the file and moved onto it, so that an app closing
    // mid-write leaves the file it had
    let file = path(data_dir);
    let being_written = file.with_extension("json.writing");
    let written = std::fs::write(&being_written, content)
        .and_then(|_| std::fs::rename(&being_written, &file));
    if let Err(e) = written {
        tracing::warn!("Could not store the integrations: {}", e);
        let _ = std::fs::remove_file(&being_written);
    }
}
