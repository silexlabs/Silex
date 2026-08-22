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
//! What was found is remembered in `integrations.json`, next to the install id,
//! and looked for only once, the first time the app runs. Afterwards Silex
//! goes by what it knows, rather than guessing behind the back of the user.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};

use serde::{Deserialize, Serialize};
use silex_server::PublicationOptions;

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

/// The integrations Silex knows
fn integrations() -> [&'static dyn Deploy; 3] {
    [&glab::Glab, &tea::Tea, &hut::Hut]
}

/// What Silex says when no integration answers for a website
///
/// Silex only puts a website online where it knows how: it writes the files a
/// build needs, names the version, and follows what happens. Somewhere it does
/// not know, it would push and then have nothing true to say.
pub const NOBODY_TO_PUBLISH_WITH: &str = "Silex does not know how to publish this website. It publishes to Codeberg, GitLab and SourceHut, and needs the command line of one of them installed and signed in.";

/// A website that left, and what to ask about the build
pub struct Publishing {
    pub provider: &'static dyn Deploy,
    pub cli: PathBuf,
    pub prepared: deploy::Prepared,
    /// What the host knows of this website, when the user is signed in to it
    pub urls: Option<deploy::Urls>,
}

impl Integrations {
    /// The first integration installed here that answers for this website, and
    /// the program it runs
    pub fn answering_for(&self, site: &Path) -> Option<(&'static dyn Deploy, PathBuf)> {
        integrations().into_iter().find_map(|integration| {
            let cli = self.program(integration.program())?;
            integration.keeps(site).then_some((integration, cli))
        })
    }

    /// Who answers for this website, and what they know of it
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
    /// `host` is where the website is kept, as the user knows it, and `say` is
    /// told each step as it starts, for whoever is waiting on it.
    pub fn publish(
        &self,
        site: &Path,
        host: &str,
        options: &PublicationOptions,
        say: &dyn Fn(String),
    ) -> Result<Publishing, String> {
        // Said before rather than after: finding out who answers means asking
        // every program on this computer that could, and that is the longest
        // silence of a publication.
        say("Looking for where your website is kept".to_string());
        let Some((provider, cli, urls)) = self.resolve_deploy(site, options)? else {
            return Err(NOBODY_TO_PUBLISH_WITH.to_string());
        };

        say(format!(
            "Writing the files {} needs to build your website",
            host
        ));
        let prepared = provider.deploy(&cli, site, options)?;
        say(format!("Sending your website to {}", host));
        {
            let sending = one_at_a_time(site);
            let _sending = sending.lock().unwrap_or_else(|held| held.into_inner());
            provider.push(&cli, site, prepared.tag.as_deref())?;
        }
        Ok(Publishing {
            provider,
            cli,
            prepared,
            urls,
        })
    }

    /// Take in what was pushed to this website from somewhere else
    ///
    /// Only for a website an integration answers for, which is the rule
    /// sending already follows: a website Silex would never push to is one it
    /// has no business pulling from either.
    pub fn sync_pull(&self, site: &Path) -> Result<(), String> {
        if self.answering_for(site).is_none() {
            return Ok(());
        }
        let Some(git) = git::Git::found() else {
            return Ok(());
        };
        // Under the same lock as sending: a merge writes the index of the
        // website, and git refuses rather than waits when a save is holding it
        let alone = one_at_a_time(site);
        let _alone = alone.lock().unwrap_or_else(|held| held.into_inner());
        git.pull(site)
    }

    /// Send a website to wherever it is kept
    ///
    /// Nothing happens when nobody recognises it, which is not a failure but a
    /// website that stays on this computer
    pub fn sync(&self, site: &Path, tag: Option<&str>) -> Result<(), String> {
        // Who answers is all this needs. Asking what they know of the website
        // means a question over the network, which sending does not wait for.
        let Some((provider, cli)) = self.answering_for(site) else {
            return Ok(());
        };
        let sending = one_at_a_time(site);
        let _sending = sending.lock().unwrap_or_else(|held| held.into_inner());
        provider.push(&cli, site, tag)
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

/// The lock that lets one git of this website run at a time
///
/// A save and a publication both send the same website, and a read pulls it:
/// git refuses rather than queues when two of them race for the same ref or
/// for the index. Which one goes first does not matter, only that they do not
/// go together.
fn one_at_a_time(site: &Path) -> Arc<Mutex<()>> {
    static ON_THIS_WEBSITE: OnceLock<Mutex<BTreeMap<PathBuf, Arc<Mutex<()>>>>> = OnceLock::new();
    ON_THIS_WEBSITE
        .get_or_init(Default::default)
        .lock()
        .unwrap_or_else(|held| held.into_inner())
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

        // A save and a publication both sending the same website: git refuses
        // the second of two pushes racing for the same ref
        let sending = Arc::new(AtomicUsize::new(0));
        let together = Arc::new(AtomicUsize::new(0));
        let pushing = |site: &Path| {
            let lock = one_at_a_time(site);
            let sending = sending.clone();
            let together = together.clone();
            let site = site.to_path_buf();
            std::thread::spawn(move || {
                let _held = lock.lock().unwrap_or_else(|held| held.into_inner());
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

        assert!(
            !integrations.known.contains_key("git"),
            "the extra field makes it unknown"
        );
        assert!(
            integrations.has("git"),
            "but Silex must not look for it again"
        );

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
        assert!(
            integrations.program("tea").is_none(),
            "a broken one is not used"
        );

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
/// integration already looked for is left as it is.
pub fn load(data_dir: &Path) -> Integrations {
    let known_integrations = integrations();
    let mut integrations = read(data_dir);
    let mut changed = false;

    for provider in known_integrations {
        let id = provider.program();
        if integrations.has(id) {
            continue;
        }
        // Asking for a version is how a program that is there but does not run
        // is told apart from one Silex can use, git included.
        let version = found(id).and_then(|path| {
            match run::run(&path, &std::env::temp_dir(), provider.version_args()) {
                Ok(version) => Some((
                    path,
                    run::readable(version.lines().next().unwrap_or_default())
                        .trim()
                        .to_string(),
                )),
                Err(e) => {
                    tracing::warn!(
                        "Found {} at {} but could not run it: {}",
                        id,
                        path.display(),
                        e
                    );
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
fn look_again(known: &mut Integrations) -> bool {
    let mut changed = false;
    let asked: Vec<(String, &'static [&'static str])> = integrations()
        .into_iter()
        .map(|provider| (provider.program().to_string(), provider.version_args()))
        .collect();

    for (id, version_args) in asked {
        let Some(state) = known.known.get(&id) else {
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
            let state = known.known.get_mut(&id).expect("just read");
            state.path = None;
            state.version = None;
            state.broken = false;
            changed = true;
            continue;
        }

        let answered = run::run(&path, &std::env::temp_dir(), version_args);
        let state = known.known.get_mut(&id).expect("just read");
        match answered {
            Ok(said) => {
                let version = run::readable(said.lines().next().unwrap_or_default())
                    .trim()
                    .to_string();
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
    // Written beside the file and moved onto it: an app closing mid-write
    // leaves the file it had, never half of a new one
    let file = path(data_dir);
    let being_written = file.with_extension("json.writing");
    let written = std::fs::write(&being_written, content)
        .and_then(|_| std::fs::rename(&being_written, &file));
    if let Err(e) = written {
        tracing::warn!("Could not store the integrations: {}", e);
        let _ = std::fs::remove_file(&being_written);
    }
}
