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
use std::sync::{Arc, Mutex, OnceLock};

use serde::{Deserialize, Serialize};
use silex_server::PublicationOptions;

use crate::held::held;
use deploy::Deploy;
use programs::found;

pub mod deploy;
pub mod git;
mod glab;
mod hut;
pub mod pipeline;
pub mod programs;
pub mod remote;
mod run;
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

fn integrations() -> [&'static dyn Deploy; 3] {
    [&glab::Glab, &tea::Tea, &hut::Hut]
}

/// What Silex says when no integration answers for a website
pub const NOBODY_TO_PUBLISH_WITH: &str = "Silex does not know how to publish this website. It publishes to Codeberg, GitLab and SourceHut, and needs the command line of one of them installed and signed in.";

pub struct Publishing {
    pub provider: &'static dyn Deploy,
    pub cli: PathBuf,
    pub prepared: deploy::Prepared,
    /// None when nobody is signed in to the host
    pub urls: Option<deploy::Urls>,
}

impl Integrations {
    pub fn answering_for(&self, site: &Path) -> Option<(&'static dyn Deploy, PathBuf)> {
        integrations().into_iter().find_map(|integration| {
            let cli = self.program(integration.program())?;
            integration.keeps(site).then_some((integration, cli))
        })
    }

    pub fn resolve_deploy(
        &self,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Option<(&'static dyn Deploy, PathBuf, Option<deploy::Urls>)>, String> {
        let Some((integration, cli)) = self.answering_for(site) else {
            return Ok(None);
        };
        let urls = integration.urls(&cli, site, options)?;
        Ok(Some((integration, cli, urls)))
    }

    /// Prepare a website for its host and send it
    ///
    /// `say` is told each step as it starts, for whoever is waiting on it.
    pub fn publish(
        &self,
        site: &Path,
        host: &str,
        options: &PublicationOptions,
        say: &dyn Fn(String),
    ) -> Result<Publishing, String> {
        // Finding out who answers means asking every program that could, and
        // that is the longest silence of a publication
        say("Looking for where your website is kept".to_string());
        let Some((provider, cli, urls)) = self.resolve_deploy(site, options)? else {
            return Err(NOBODY_TO_PUBLISH_WITH.to_string());
        };
        // Scoped rather than set: this runs on a pool thread that the next
        // website to sync inherits
        sentry::with_scope(
            |scope| scope.set_tag("forge", provider.program()),
            || {
                say(format!("Getting your website ready for {}", host));
                let prepared = provider.deploy(&cli, site, options)?;
                say(format!("Sending your website to {}", host));
                {
                    let sending = one_at_a_time(site);
                    let _sending = held(&sending);
                    push(site, prepared.tag.as_deref())?;
                }
                Ok(Publishing {
                    provider,
                    cli,
                    prepared,
                    urls,
                })
            },
        )
    }

    /// Take in what was pushed to this website from somewhere else
    ///
    /// Only for a website an integration answers for: one Silex would never
    /// push to is one it has no business pulling from.
    pub fn sync_pull(&self, site: &Path) -> Result<(), String> {
        if self.answering_for(site).is_none() {
            return Ok(());
        }
        let Some(git) = git::Git::found() else {
            return Ok(());
        };
        // Under the same lock as sending: a merge writes the index, and git
        // refuses rather than waits when a save is holding it
        let alone = one_at_a_time(site);
        let _alone = held(&alone);
        git.pull(site)
    }

    /// Send a website to wherever it is kept
    ///
    /// Nothing happens when nobody recognises it: the website stays on this
    /// computer, which is not a failure.
    pub fn sync(&self, site: &Path) -> Result<(), String> {
        // Asking what they know of the website means a question over the
        // network, which sending does not wait for
        if self.answering_for(site).is_none() {
            return Ok(());
        }
        let sending = one_at_a_time(site);
        let _sending = held(&sending);
        push(site, None)
    }

    /// The programs Silex can use here, and what version each answered
    pub fn at_hand(&self) -> impl Iterator<Item = (&str, Option<&str>)> {
        self.known
            .iter()
            .filter(|(_, state)| state.enabled && state.path.is_some())
            .map(|(id, state)| (id.as_str(), state.version.as_deref()))
    }

    fn program(&self, id: &str) -> Option<PathBuf> {
        let state = self.known.get(id)?;
        if !state.enabled || state.broken {
            return None;
        }
        // Uninstalled since it was found: the path would fail every save
        state.path.as_ref().filter(|path| path.is_file()).cloned()
    }
}

/// Send what was versioned to where the website is kept
fn push(site: &Path, tag: Option<&str>) -> Result<(), String> {
    let git = git::Git::found().ok_or(
        "Silex could not find git on this computer, and it is git that sends a website to its host.",
    )?;
    git.push(site, tag)
}

/// The lock that lets one git of this website run at a time
///
/// git refuses rather than queues when a save, a publication and a pull race
/// for the same ref or index. Which goes first does not matter.
fn one_at_a_time(site: &Path) -> Arc<Mutex<()>> {
    static ON_THIS_WEBSITE: OnceLock<Mutex<BTreeMap<PathBuf, Arc<Mutex<()>>>>> = OnceLock::new();
    held(ON_THIS_WEBSITE.get_or_init(Default::default))
        .entry(site.to_path_buf())
        .or_default()
        .clone()
}

fn path(data_dir: &Path) -> PathBuf {
    data_dir.join("integrations.json")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn two_pushes_of_one_website_wait_for_each_other() {
        use std::sync::atomic::{AtomicUsize, Ordering};

        let sending = Arc::new(AtomicUsize::new(0));
        let together = Arc::new(AtomicUsize::new(0));
        let pushing = |site: &Path| {
            let lock = one_at_a_time(site);
            let sending = sending.clone();
            let together = together.clone();
            let site = site.to_path_buf();
            std::thread::spawn(move || {
                let _held = held(&lock);
                if sending.fetch_add(1, Ordering::SeqCst) > 0 {
                    together.fetch_add(1, Ordering::SeqCst);
                }
                std::thread::sleep(std::time::Duration::from_millis(50));
                sending.fetch_sub(1, Ordering::SeqCst);
                let _ = &site;
            })
        };

        let one = Path::new("/tmp/silex-one-website");
        let both: Vec<_> = (0..2).map(|_| pushing(one)).collect();
        for thread in both {
            thread.join().unwrap();
        }
        assert_eq!(
            together.load(Ordering::SeqCst),
            0,
            "two pushes of one website went together"
        );

        // Two websites have nothing to wait for from each other
        assert!(!Arc::ptr_eq(
            &one_at_a_time(one),
            &one_at_a_time(Path::new("/tmp/silex-another-website"))
        ));
    }

    #[test]
    fn keeps_what_a_version_that_knows_more_wrote() {
        // Downgrading once would otherwise lose those settings for good
        let written = r#"{
            "git": { "enabled": true, "path": "/usr/bin/git", "version": "git version 2.51.0" },
            "rclone": { "enabled": true, "instance": "my-bucket" }
        }"#;

        let integrations: Integrations = serde_json::from_str(written).unwrap();
        assert!(integrations.known.contains_key("git"));
        assert!(
            integrations.known.contains_key("rclone"),
            "an integration this version never heard of keeps its entry"
        );

        let read_back: serde_json::Value =
            serde_json::from_str(&serde_json::to_string(&integrations).unwrap()).unwrap();
        assert_eq!(read_back["rclone"]["instance"], "my-bucket");
        assert_eq!(read_back["git"]["path"], "/usr/bin/git");
    }

    #[test]
    fn an_entry_a_version_that_knows_more_wrote_keeps_both_halves() {
        // An integration this version knows, with a field it does not
        let written = r#"{
            "git": { "enabled": true, "path": "/usr/bin/git", "signing_key": "ABC123" }
        }"#;
        let integrations: Integrations = serde_json::from_str(written).unwrap();

        assert_eq!(
            integrations.known["git"].path.as_deref(),
            Some(std::path::Path::new("/usr/bin/git")),
            "the fields this version knows are still read"
        );

        let read_back: serde_json::Value =
            serde_json::from_str(&serde_json::to_string(&integrations).unwrap()).unwrap();
        assert_eq!(read_back["git"]["signing_key"], "ABC123");
        assert_eq!(read_back["git"]["path"], "/usr/bin/git");
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
        std::fs::write(path(&dir), &written).unwrap();
        let integrations = load(&dir);

        // Uninstalled since: the path it left behind would fail every
        // publication
        let glab = &integrations.known["glab"];
        assert_eq!(glab.path, None);
        assert!(!glab.broken, "not broken, just not there any more");

        let tea = &integrations.known["tea"];
        assert!(tea.broken);
        assert!(tea.path.is_some(), "and we can still say which file it is");
        assert!(
            integrations.program("tea").is_none(),
            "a broken one is not used"
        );

        // One the user turned off is not started at all, so what was written
        // about it stands untouched
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

/// What Silex knows of this machine, asking again of what it already found
///
/// A program looked for once is never looked for again: on macOS, asking for a
/// git that is not installed pops the dialog offering the developer tools. What
/// was found is asked for its version at every start, because a program gets
/// updated, repaired or removed while Silex is not looking.
pub fn load(data_dir: &Path) -> Integrations {
    let known_integrations = integrations();
    let mut integrations = read(data_dir);
    let mut changed = false;

    for provider in known_integrations {
        let id = provider.program();
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
        let answered = run::run(&path, &std::env::temp_dir(), provider.version_args());
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
