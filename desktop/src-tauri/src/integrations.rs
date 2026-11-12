/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
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
use silex_server::said::Said;
use silex_server::{Hosting, OptionsField, OptionsForm, PublicationOptions};

use common::git;
use common::install;
use common::programs;
use common::run;
use integration::{
    Account, AntiFeature, Capacity, Integration, Openness, RemoteWebsite, SignIn, Tag,
};

use crate::held::held;
use crate::locales::tr;

pub mod common;
mod ftp;
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

/// The editor has no catalog for what the desktop says
fn translated(form: OptionsForm) -> OptionsForm {
    OptionsForm {
        title: tr(&form.title),
        fields: form
            .fields
            .into_iter()
            .map(|field| OptionsField {
                label: tr(&field.label),
                help: field.help.as_deref().map(tr),
                placeholder: field.placeholder.as_deref().map(tr),
                ..field
            })
            .collect(),
    }
}

fn catalog() -> [&'static dyn Integration; 2] {
    [&glab::Glab, &ftp::Ftp]
}

fn by_id(id: &str) -> Option<&'static dyn Integration> {
    catalog()
        .into_iter()
        .find(|integration| integration.id() == id)
}

/// An integration as the integrations screen shows it, with what is known of
/// it on this machine
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogEntry {
    id: &'static str,
    program: &'static str,
    name: &'static str,
    summary: &'static str,
    tagline: &'static str,
    tags: &'static [Tag],
    openness: Openness,
    anti_features: &'static [AntiFeature],
    install_url: &'static str,
    /// Whether Silex can install the program itself on this system
    installable: bool,
    icon: Option<&'static str>,
    runs_here: bool,
    servers: Vec<&'static str>,
    /// Filled in to add an account, in place of signing in in the browser
    account_form: Option<OptionsForm>,
    capacities: &'static [Capacity],
    /// Whether the user chose an account of it
    enabled: bool,
    /// The accounts the user chose, among those of the program
    accounts: Vec<String>,
    found: bool,
    broken: bool,
    /// The version Silex needs, when the one found is older
    needs: Option<&'static str>,
    version: Option<String>,
}

pub struct Publishing {
    pub integration: &'static dyn Integration,
    pub cli: PathBuf,
    pub prepared: integration::Prepared,
    /// None when nobody is signed in to the host, and why when it could not be asked
    pub urls: Result<Option<integration::Urls>, String>,
}

/// A place a website is published on, and what publishes it there
pub struct Host {
    /// What the editor names it by
    pub id: String,
    pub integration: &'static dyn Integration,
    pub cli: PathBuf,
    /// The account it is published on, as the user knows it
    pub account: String,
}

impl Integrations {
    /// The hosting the editor names, among those of this website
    pub fn host(&self, id: &str, site: &Path) -> Option<Host> {
        self.hosts(site).find(|host| host.id == id)
    }

    /// Where this website can be published, then where it could be with an
    /// account, and why it cannot yet
    pub fn hostings(&self, site: &Path) -> Vec<Hosting> {
        let available = self.hosts(site).map(|host| Hosting {
            connector_id: host.id,
            display_name: host.account,
            options_form: host.integration.options_form(site).map(translated),
            unavailable: None,
        });
        let wanting_an_account =
            self.wanting_an_account(Capacity::Deploy, site)
                .filter_map(|(integration, why)| {
                    Some(Hosting {
                        connector_id: integration.id().to_string(),
                        display_name: integration.account_of(site)?,
                        options_form: integration.options_form(site).map(translated),
                        unavailable: Some(why),
                    })
                });
        available.chain(wanting_an_account).collect()
    }

    /// A website tied to an account is published there, one tied to none on
    /// each account the user chose
    fn hosts<'a>(&'a self, site: &'a Path) -> impl Iterator<Item = Host> + 'a {
        self.get(Capacity::Deploy, site)
            .flat_map(move |(integration, cli)| {
                let host = |id: String, account: String| Host {
                    id,
                    integration,
                    cli: cli.clone(),
                    account,
                };
                match integration.account_of(site) {
                    Some(account) => vec![host(integration.id().to_string(), account)],
                    None => self.known[integration.id()]
                        .accounts
                        .iter()
                        .map(|account| {
                            host(format!("{}:{}", integration.id(), account), account.clone())
                        })
                        .collect(),
                }
            })
    }

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
                let cli = self.path_if_used(integration.id())?;
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
            .get(integration.id())
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
            .filter(|integration| self.usable_path(integration.id()).is_some())
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
    /// `say` is told each step as it starts, and `told` what the user reads
    /// meanwhile, for whoever is waiting on it.
    pub fn publish(
        &self,
        host: &Host,
        site: &Path,
        files: &Path,
        options: &PublicationOptions,
        say: &dyn Fn(String),
        told: &dyn Fn(Said),
    ) -> Result<Publishing, Said> {
        let Host {
            integration,
            cli,
            account,
            ..
        } = host;
        // git pushes with what the user set it up with, which does not need
        // the host to answer
        let urls = integration.urls(cli, site, options);
        // Scoped rather than set: this runs on a pool thread that the next
        // website to sync inherits
        sentry::with_scope(
            |scope| scope.set_tag("forge", integration.id()),
            || {
                say(format!("Getting your website ready for {}", account));
                let prepared = integration.deploy(cli, site, account, files, options, told)?;
                if integration.capacities().contains(&Capacity::Sync) {
                    say(format!("Sending your website to {}", account));
                    integration
                        .push(cli, site, prepared.tag.as_deref())
                        .map_err(Said::raw)?;
                }
                Ok(Publishing {
                    integration: *integration,
                    cli: cli.clone(),
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
                    .get(integration.id())
                    .cloned()
                    .unwrap_or_default();
                CatalogEntry {
                    id: integration.id(),
                    program: integration.program(),
                    name: integration.name(),
                    summary: integration.summary(),
                    tagline: integration.tagline(),
                    tags: integration.tags(),
                    openness: integration.openness(),
                    anti_features: integration.anti_features(),
                    install_url: integration.install_url(),
                    installable: integration.release().is_some_and(install::has_archive_here),
                    icon: integration.icon(),
                    runs_here: integration.runs_here(),
                    servers: integration.servers(),
                    account_form: integration.account_form(),
                    capacities: integration.capacities(),
                    enabled: !state.accounts.is_empty(),
                    accounts: state.accounts,
                    found: state.path.is_some_and(|path| path.is_file()),
                    broken: state.broken,
                    needs: integration.minimum_version().filter(|_| {
                        state
                            .version
                            .as_deref()
                            .is_some_and(|version| too_old(integration, version))
                    }),
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

    fn path_if_used(&self, id: &str) -> Option<PathBuf> {
        self.known
            .get(id)
            .filter(|state| !state.accounts.is_empty())
            .and(self.usable_path(id))
    }

    /// Where the program is, whether the user uses it or not
    fn usable_path(&self, id: &str) -> Option<PathBuf> {
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
        let id = integration.id();
        let known = integrations.known.get(id).cloned();

        // One the user does not use is left alone rather than started at every
        // launch
        if known
            .as_ref()
            .is_some_and(|state| state.accounts.is_empty())
        {
            continue;
        }

        let path = located(data_dir, integration, known.as_ref());
        changed |= known.is_none();
        let mut state = known.unwrap_or_default();
        changed |= checked(integration, &mut state, path);
        integrations.known.insert(id.to_string(), state);
    }

    if changed {
        write(data_dir, &integrations);
    }
    integrations
}

/// The path remembered, else the program of the user, else the copy of Silex
fn located(
    data_dir: &Path,
    integration: &dyn Integration,
    remembered: Option<&IntegrationState>,
) -> Option<PathBuf> {
    if let Some(state) = remembered {
        return state.path.clone();
    }
    let id = integration.program();
    let ours = integration
        .release()
        .and_then(|release| install::silex_copy(data_dir, id, release));
    match (programs::users_own(id), ours) {
        (Some(theirs), Some(ours)) if !fits(integration, &theirs) => Some(ours),
        (theirs, ours) => theirs.or(ours),
    }
}

/// Whether the program runs, in a version Silex works with
fn fits(integration: &dyn Integration, path: &Path) -> bool {
    run::run(path, &std::env::temp_dir(), integration.version_args())
        .is_ok_and(|said| !too_old(integration, &said))
}

/// Whether what the program answered when asked its version is older than
/// the version the integration needs
fn too_old(integration: &dyn Integration, version: &str) -> bool {
    integration.minimum_version().is_some_and(|needed| {
        let found = numbers(version);
        !found.is_empty() && found < numbers(needed)
    })
}

/// The numbers of the first word that starts with one, like 1, 89 and 0 in
/// `glab 1.89.0 (c6fca530)` or `rclone v1.76.0`
fn numbers(version: &str) -> Vec<u32> {
    version
        .split_whitespace()
        .map(|word| word.trim_start_matches('v'))
        .find(|word| word.starts_with(|c: char| c.is_ascii_digit()))
        .map(|word| word.split('.').map_while(|n| n.parse().ok()).collect())
        .unwrap_or_default()
}

/// The version of this Silex, or the program of the user when it starts, in
/// place of the copy an older one installed, without a word: the older copy
/// keeps working until then
pub fn update_silex_copies(loading: &Loading, data_dir: &Path) {
    for (id, state) in snapshot(loading).known {
        let (Some(integration), Some(path)) = (by_id(&id), state.path) else {
            continue;
        };
        let Some(release) = integration.release() else {
            continue;
        };
        let program = integration.program();
        if state.accounts.is_empty()
            || !install::is_old_silex_copy(data_dir, program, release, &path)
        {
            continue;
        }
        // A program the user installed after the copy of Silex replaces it
        let theirs = programs::users_own(program).is_some_and(|theirs| fits(integration, &theirs));
        if !theirs {
            if let Err(e) = install::install(data_dir, program, release) {
                tracing::warn!("Could not update the {} of Silex: {:?}", program, e);
                continue;
            }
        }
        asked(loading, data_dir, &id, Asked::CheckAgain);
    }
}

/// Downloads the program into the folder of Silex, then looks for it again
pub fn install_silex_copy(
    loading: &Loading,
    data_dir: &Path,
    integration: &str,
) -> Result<Vec<CatalogEntry>, Said> {
    let not_installable = || Said::raw(format!("Silex cannot install {integration}"));
    let integration = by_id(integration).ok_or_else(not_installable)?;
    let release = integration.release().ok_or_else(not_installable)?;
    install::install(data_dir, integration.program(), release)?;
    integration.installed();
    asked(loading, data_dir, integration.id(), Asked::CheckAgain).ok_or_else(not_installable)
}

/// What is known of a program, from where it is now and from what it answers
/// when asked its version, and whether that changed
fn checked(
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

fn usable(loading: &Loading, id: &str) -> Result<(&'static dyn Integration, PathBuf), String> {
    let integration = by_id(id).ok_or_else(|| format!("{} is not an integration of Silex", id))?;
    // Found is enough: an account is signed in to before it is used
    let cli = snapshot(loading)
        .usable_path(id)
        .ok_or_else(|| format!("{} is not on this computer", integration.program()))?;
    Ok((integration, cli))
}

pub fn accounts(loading: &Loading, integration: &str) -> Result<Vec<Account>, Said> {
    let (integration, cli) = usable(loading, integration).map_err(Said::raw)?;
    integration.accounts(&cli)
}

/// One sign-in at a time: glab waits for the browser on one port
static SIGNING_IN: Mutex<()> = Mutex::new(());

/// What the sign-in under way is stopped with
static GIVE_UP: Mutex<Option<Arc<AtomicBool>>> = Mutex::new(None);

/// The accounts once the user signed in or stopped, and the one signed in to
#[derive(Serialize)]
pub struct Connected {
    accounts: Vec<Account>,
    /// None once stopped
    account: Option<String>,
}

/// A sign-in started again stops the one before: the user closed the tab of
/// the first and the program would wait for it until it times out.
pub fn connect(
    loading: &Loading,
    integration: &str,
    server: &str,
    client_id: Option<&str>,
    open: &dyn Fn(String),
) -> Result<Connected, Said> {
    let (integration, cli) = usable(loading, integration).map_err(Said::raw)?;
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
        connected => Some(connected.map_err(Said::raw)?),
    };
    Ok(Connected {
        accounts: integration.accounts(&cli)?,
        account,
    })
}

/// Answered like `connect`, once the server took the account
pub fn add_account(
    loading: &Loading,
    integration: &str,
    values: &BTreeMap<String, String>,
) -> Result<Connected, Said> {
    let (integration, cli) = usable(loading, integration).map_err(Said::raw)?;
    let account = integration.add_account(&cli, values)?;
    Ok(Connected {
        accounts: integration.accounts(&cli)?,
        account: Some(account),
    })
}

pub fn stop_connecting() {
    if let Some(given_up) = held(&GIVE_UP).take() {
        given_up.store(true, Ordering::Relaxed);
    }
}

pub fn disconnect(loading: &Loading, integration: &str, id: &str) -> Result<Vec<Account>, Said> {
    let (integration, cli) = usable(loading, integration).map_err(Said::raw)?;
    integration.disconnect(&cli, id)?;
    integration.accounts(&cli)
}

/// Only the accounts the user chose: glab may be signed in to a colleague's
fn chosen_account(loading: &Loading, integration: &str, account: &str) -> Result<(), String> {
    let chosen = snapshot(loading)
        .known
        .get(integration)
        .is_some_and(|state| state.accounts.iter().any(|other| other == account));
    if chosen {
        Ok(())
    } else {
        Err(format!("{} is not used in Silex", account))
    }
}

pub fn remote_websites(
    loading: &Loading,
    integration: &str,
    account: &str,
) -> Result<Vec<RemoteWebsite>, String> {
    chosen_account(loading, integration, account)?;
    let (integration, cli) = usable(loading, integration)?;
    integration.remote_websites(&cli, account)
}

pub fn fetch_website(
    loading: &Loading,
    integration: &str,
    account: &str,
    id: &str,
    into: &Path,
) -> Result<String, String> {
    chosen_account(loading, integration, account)?;
    let (integration, cli) = usable(loading, integration)?;
    integration.fetch_website(&cli, account, id, into)
}

pub fn has_destination(site: &Path) -> bool {
    catalog()
        .iter()
        .any(|integration| integration.has_destination(site))
}

pub fn link_website(
    loading: &Loading,
    integration: &str,
    account: &str,
    name: &str,
    site: &Path,
) -> Result<(), Said> {
    chosen_account(loading, integration, account).map_err(Said::raw)?;
    let (integration, cli) = usable(loading, integration).map_err(Said::raw)?;
    integration.link_website(&cli, account, name, site)
}

pub fn check_account(loading: &Loading, integration: &str, id: &str) -> Result<SignIn, Said> {
    let (integration, cli) = usable(loading, integration).map_err(Said::raw)?;
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

/// Done, written down and the catalog as it is now, or None for an
/// integration that is not in the catalog
pub fn asked(
    loading: &Loading,
    data_dir: &Path,
    id: &str,
    asked: Asked,
) -> Option<Vec<CatalogEntry>> {
    let integration = by_id(id)?;
    // Searched for without the lock, which every save takes
    let looked = matches!(asked, Asked::CheckAgain).then(|| {
        programs::forget();
        git::forget();
        let mut looked = snapshot(loading).known.remove(id).unwrap_or_default();
        checked(
            integration,
            &mut looked,
            located(data_dir, integration, None),
        );
        looked
    });
    let mut integrations = loading.write().unwrap_or_else(PoisonError::into_inner);
    let state = integrations.known.entry(id.to_string()).or_default();
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tells_a_version_too_old() {
        assert!(too_old(&glab::Glab, "glab 1.89.0 (c6fca530)"));
        assert!(!too_old(&glab::Glab, "glab 1.130.0 (c6fca530)"));
        assert!(too_old(&ftp::Ftp, "rclone v1.74.3"));
        assert!(!too_old(&ftp::Ftp, "rclone v1.75.0"));
    }
}
