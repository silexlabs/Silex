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
//! once, the first time the app runs, or when the user asks.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc, LazyLock, Mutex, PoisonError, RwLock};

use serde::{Deserialize, Serialize};
use silex_server::PublicationOptions;

use common::git;
use common::programs::{self, found};
use common::run;
use integration::{
    Account, AntiFeature, Capacity, Integration, Openness, RemoteWebsite, SignIn, Tag,
};

use crate::held::held;

pub mod common;
mod glab;
pub mod integration;
// Back in the catalog with the other forges
#[allow(dead_code)]
mod hut;
#[allow(dead_code)]
mod tea;

/// What is known of one integration
///
/// Whatever a later version wrote and this one knows nothing of travels in
/// `rest`, so downgrading once and saving does not lose it.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct IntegrationState {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub path: Option<PathBuf>,
    /// What it answered when asked for its version
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,

    /// The accounts of its program the user chose to use in Silex
    ///
    /// The one thing of the accounts kept here: a program may be signed in to
    /// accounts that are not the user's, like those of a colleague.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub accounts: Vec<String>,

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

fn catalog() -> [&'static dyn Integration; 1] {
    [&glab::Glab]
}

fn by_program(program: &str) -> Option<&'static dyn Integration> {
    catalog()
        .into_iter()
        .find(|integration| integration.program() == program)
}

/// An integration as the integrations screen shows it, with what is known of
/// it on this machine
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogEntry {
    program: &'static str,
    name: &'static str,
    summary: &'static str,
    tags: &'static [Tag],
    openness: Openness,
    anti_features: &'static [AntiFeature],
    install_url: &'static str,
    icon: Option<&'static str>,
    runs_here: bool,
    servers: Vec<&'static str>,
    capacities: &'static [Capacity],
    /// Whether the user chose an account of it
    enabled: bool,
    /// The accounts the user chose, among those of the program
    accounts: Vec<String>,
    found: bool,
    broken: bool,
    version: Option<String>,
}

pub struct Publishing {
    pub integration: &'static dyn Integration,
    pub cli: PathBuf,
    pub prepared: integration::Prepared,
    /// None when nobody is signed in to the host, and why when it could not be asked
    pub urls: Result<Option<integration::Urls>, String>,
}

impl Integrations {
    /// The integrations the user uses that can do this for this website,
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
                (integration.answers_for(site) && self.chose_account_of(integration, site))
                    .then_some((integration, cli))
            })
    }

    /// Whether the account the website goes through is one the user chose
    fn chose_account_of(&self, integration: &dyn Integration, site: &Path) -> bool {
        let Some(account) = integration.account_of(site) else {
            return true;
        };
        self.known
            .get(integration.program())
            .is_some_and(|state| state.accounts.contains(&account))
    }

    /// The integrations found here that would do this for this website
    /// if an account of the user were on this computer and chosen, with why
    /// it is not
    pub fn wanting_an_account<'a>(
        &'a self,
        capacity: Capacity,
        site: &'a Path,
    ) -> impl Iterator<Item = (&'static dyn Integration, String)> + 'a {
        catalog()
            .into_iter()
            .filter(move |integration| integration.capacities().contains(&capacity))
            // Used or not: a website on a server the user has an account on is
            // told to use it
            .filter(|integration| self.found_path(integration.program()).is_some())
            .filter_map(move |integration| {
                if !integration.answers_for(site) {
                    return Some((integration, integration.missing_account(site)?));
                }
                if self.chose_account_of(integration, site) {
                    return None;
                }
                let account = integration.account_of(site)?;
                Some((
                    integration,
                    format!(
                        "Your {} account on {} is not used in Silex. Choose it in Integrations.",
                        integration.name(),
                        account
                    ),
                ))
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
                        .push(&cli, site, prepared.tag.as_deref())
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

    pub fn catalog_entries(&self) -> Vec<CatalogEntry> {
        catalog()
            .into_iter()
            .map(|integration| {
                let state = self
                    .known
                    .get(integration.program())
                    .cloned()
                    .unwrap_or_default();
                CatalogEntry {
                    program: integration.program(),
                    name: integration.name(),
                    summary: integration.summary(),
                    tags: integration.tags(),
                    openness: integration.openness(),
                    anti_features: integration.anti_features(),
                    install_url: integration.install_url(),
                    icon: integration.icon(),
                    runs_here: integration.runs_here(),
                    servers: integration.servers(),
                    capacities: integration.capacities(),
                    enabled: !state.accounts.is_empty(),
                    accounts: state.accounts,
                    found: state.path.is_some_and(|path| path.is_file()),
                    broken: state.broken,
                    version: state.version,
                }
            })
            .collect()
    }

    /// The programs Silex can use here, and what version each answered
    pub fn at_hand(&self) -> impl Iterator<Item = (&str, Option<&str>)> {
        self.known
            .iter()
            .filter(|(_, state)| !state.accounts.is_empty() && state.path.is_some())
            .map(|(id, state)| (id.as_str(), state.version.as_deref()))
    }

    fn program_path(&self, id: &str) -> Option<PathBuf> {
        self.known
            .get(id)
            .filter(|state| !state.accounts.is_empty())
            .and(self.found_path(id))
    }

    /// Where the program is, whether the user uses it or not
    fn found_path(&self, id: &str) -> Option<PathBuf> {
        let state = self.known.get(id)?;
        if state.broken {
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

        // One the user does not use is left alone rather than started at every
        // launch
        if known
            .as_ref()
            .is_some_and(|state| state.accounts.is_empty())
        {
            continue;
        }

        let path = match &known {
            Some(state) => state.path.clone(),
            None => found(id),
        };
        changed |= known.is_none();
        let mut state = known.unwrap_or_default();
        changed |= looked_at(integration, &mut state, path);
        integrations.known.insert(id.to_string(), state);
    }

    if changed {
        write(data_dir, &integrations);
    }
    integrations
}

/// What is known of a program, from where it is now and from what it answers
/// when asked its version, and whether that changed
fn looked_at(
    integration: &dyn Integration,
    state: &mut IntegrationState,
    path: Option<PathBuf>,
) -> bool {
    let id = integration.program();
    let Some(path) = path.filter(|path| path.is_file()) else {
        // Gone from the disk since it was found: keeping the path would fail
        // every publication
        if let Some(was) = &state.path {
            tracing::info!("{} is no longer at {}", id, was.display());
        }
        let changed = state.path.is_some() || state.version.is_some() || state.broken;
        state.path = None;
        state.version = None;
        state.broken = false;
        return changed;
    };
    let mut changed = state.path.as_ref() != Some(&path);
    state.path = Some(path.clone());

    // Asking for a version tells a program that is there but does not run
    // from one Silex can use
    match run::run(&path, &std::env::temp_dir(), integration.version_args()) {
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
    changed
}

fn in_use(loading: &Loading, program: &str) -> Result<(&'static dyn Integration, PathBuf), String> {
    let integration =
        by_program(program).ok_or_else(|| format!("{} is not an integration of Silex", program))?;
    // Found is enough: an account is signed in to before it is used
    let cli = snapshot(loading)
        .found_path(program)
        .ok_or_else(|| format!("{} is not on this computer", integration.program()))?;
    Ok((integration, cli))
}

pub fn accounts(loading: &Loading, program: &str) -> Result<Vec<Account>, String> {
    let (integration, cli) = in_use(loading, program)?;
    integration.accounts(&cli)
}

/// One sign-in at a time: glab waits for the browser on one port
static SIGNING_IN: Mutex<()> = Mutex::new(());

/// What the sign-in under way is stopped with
static GIVE_UP: Mutex<Option<Arc<AtomicBool>>> = Mutex::new(None);

/// The accounts once the user signed in, or stopped
///
/// A sign-in started again stops the one before: the user closed the tab of
/// the first and the program would wait for it until it times out.
/// The accounts once the user signed in or stopped, and the one signed in to
#[derive(Serialize)]
pub struct Connected {
    accounts: Vec<Account>,
    /// None once stopped
    account: Option<String>,
}

pub fn connect(
    loading: &Loading,
    program: &str,
    server: &str,
    client_id: Option<&str>,
    open: &dyn Fn(String),
) -> Result<Connected, String> {
    let (integration, cli) = in_use(loading, program)?;
    let given_up = Arc::new(AtomicBool::new(false));
    if let Some(before) = held(&GIVE_UP).replace(given_up.clone()) {
        before.store(true, Ordering::Relaxed);
    }
    let _alone = held(&SIGNING_IN);
    let open = |page: String| {
        if let Err(e) = run::open_detached(&page) {
            tracing::warn!("Could not open {}: {}", page, e);
            open(page);
        }
    };
    let connected = integration.connect(&cli, server, client_id, &given_up, &open);
    let mut give_up = held(&GIVE_UP);
    if give_up
        .as_ref()
        .is_some_and(|it| Arc::ptr_eq(it, &given_up))
    {
        *give_up = None;
    }
    drop(give_up);
    let account = match connected {
        Err(_) if given_up.load(Ordering::Relaxed) => None,
        connected => Some(connected?),
    };
    Ok(Connected {
        accounts: integration.accounts(&cli)?,
        account,
    })
}

pub fn stop_connecting() {
    if let Some(given_up) = held(&GIVE_UP).take() {
        given_up.store(true, Ordering::Relaxed);
    }
}

pub fn disconnect(loading: &Loading, program: &str, id: &str) -> Result<Vec<Account>, String> {
    let (integration, cli) = in_use(loading, program)?;
    integration.disconnect(&cli, id)?;
    integration.accounts(&cli)
}

/// Only the accounts the user chose: glab may be signed in to a colleague's
fn chosen_account(loading: &Loading, program: &str, account: &str) -> Result<(), String> {
    let chosen = snapshot(loading)
        .known
        .get(program)
        .is_some_and(|state| state.accounts.iter().any(|other| other == account));
    if chosen {
        Ok(())
    } else {
        Err(format!("{} is not used in Silex", account))
    }
}

pub fn remote_websites(
    loading: &Loading,
    program: &str,
    account: &str,
) -> Result<Vec<RemoteWebsite>, String> {
    chosen_account(loading, program, account)?;
    let (integration, cli) = in_use(loading, program)?;
    integration.remote_websites(&cli, account)
}

pub fn fetch_website(
    loading: &Loading,
    program: &str,
    account: &str,
    id: &str,
    into: &Path,
) -> Result<String, String> {
    chosen_account(loading, program, account)?;
    let (integration, cli) = in_use(loading, program)?;
    integration.fetch_website(&cli, account, id, into)
}

pub fn check_account(loading: &Loading, program: &str, id: &str) -> Result<SignIn, String> {
    let (integration, cli) = in_use(loading, program)?;
    integration.check_account(&cli, id)
}

/// What the integrations screen asks of one integration
#[derive(Deserialize)]
#[serde(tag = "kind", content = "account", rename_all = "camelCase")]
pub enum Asked {
    CheckAgain,
    UseAccount(String),
    StopUsing(String),
}

/// Done, written down and the catalog as it is now, or None for a program
/// that is not in the catalog
pub fn asked(
    loading: &Loading,
    data_dir: &Path,
    program: &str,
    asked: Asked,
) -> Option<Vec<CatalogEntry>> {
    let integration = by_program(program)?;
    // Searched for without the lock, which every save takes
    let looked = matches!(asked, Asked::CheckAgain).then(|| {
        programs::forget();
        git::forget();
        let mut looked = snapshot(loading).known.remove(program).unwrap_or_default();
        looked_at(integration, &mut looked, found(program));
        looked
    });
    let mut integrations = loading.write().unwrap_or_else(PoisonError::into_inner);
    let state = integrations.known.entry(program.to_string()).or_default();
    match asked {
        Asked::UseAccount(account) if !state.accounts.contains(&account) => {
            state.accounts.push(account);
        }
        Asked::StopUsing(account) => state.accounts.retain(|other| *other != account),
        _ => {}
    }
    // Only what was looked at, so that a choice made during the search holds
    if let Some(looked) = looked {
        state.path = looked.path;
        state.version = looked.version;
        state.broken = looked.broken;
    }
    write(data_dir, &integrations);
    Some(integrations.catalog_entries())
}

/// The integrations of `load`, waited for by whoever first needs them
pub type Loading = LazyLock<RwLock<Integrations>, Box<dyn FnOnce() -> RwLock<Integrations> + Send>>;

/// A copy, so that a publication taking minutes does not hold back a change
pub fn snapshot(loading: &Loading) -> Integrations {
    loading
        .read()
        .unwrap_or_else(PoisonError::into_inner)
        .clone()
}

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
        RwLock::new(waited_for.recv().unwrap_or_else(|_| read(&data_dir)))
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
            // Starting over forgets what the user chose, so the file they had
            // is kept to be read and put back by hand
            let kept = file.with_extension("json.unreadable");
            let _ = std::fs::rename(&file, &kept);
            tracing::error!(
                "Could not read {}: {}. Kept it as {}, and looking for the programs again: the accounts chosen there are not used anymore",
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
