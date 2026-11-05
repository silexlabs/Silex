/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

use std::path::Path;
use std::sync::atomic::AtomicBool;

use serde::Serialize;
use silex_server::said::Said;
use silex_server::{OptionsForm, PublicationOptions};

use super::common::install::Release;
use super::common::remote::Remote;

/// What an integration can do for a website
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Capacity {
    /// Keep a website the same here and where it is kept
    Sync,
    /// Put a website online
    Deploy,
}

/// What a website gains from an integration, the way the catalog sorts them
#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Tag {
    Hosting,
    Storage,
    Team,
}

/// How open the service an integration relies on is: its license, what of it
/// is closed, and who decides. The service, not the program, which is free
/// software in every case
#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
// The whole scale, before an integration of each kind is there
#[allow(dead_code)]
pub enum Openness {
    DigitalCommons,
    FreeSoftware,
    OpenSource,
    OpenCore,
    SourceAvailable,
    Proprietary,
}

/// What a user may not want of the service, after the Anti-Features of F-Droid
#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum AntiFeature {
    Tracking,
    ProprietaryCloud,
    IdentityVerification,
    FreeLicenseRequired,
}

pub fn not_provided(program: &str, capacity: Capacity) -> String {
    format!("{} does not provide {:?}", program, capacity)
}

/// Where a website stands with the place it is sent to
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Synced {
    /// A sentence, in the words of the integration
    pub label: Said,
    /// What the user can do about it, when there is something to do
    pub action: Option<Said>,
    /// Where the changes made elsewhere can be seen, when they keep it from syncing
    pub changes_url: Option<String>,
}

/// Why a website could not be sent or taken in, with what the program said
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", content = "why", rename_all = "camelCase")]
pub enum SyncError {
    /// The repository has changes this computer does not have
    ChangedElsewhere(String),
    /// The host took the push in, then said no
    RefusedByHost(String),
    Other(String),
}

impl std::fmt::Display for SyncError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SyncError::ChangedElsewhere(why) => write!(
                f,
                "This website was changed somewhere else, and those changes are not on this computer. {}",
                why
            ),
            SyncError::RefusedByHost(why) => write!(f, "The host refused this push. {}", why),
            SyncError::Other(why) => f.write_str(why),
        }
    }
}

impl std::error::Error for SyncError {}

#[derive(Default)]
pub struct Urls {
    /// Where the build can be watched
    pub ci: Option<String>,
    /// Where the user sets a domain of their own
    pub settings: Option<String>,
    /// What the user has to know about their published website, in their own
    /// words: a build that worked is not always a website anybody can open
    pub warning: Option<String>,
}

pub struct Refusal {
    pub sentence: &'static str,
    pub why: &'static str,
    /// Where the user sets it right
    pub button: (&'static str, &'static str),
}

/// What became of the build a publication started
///
/// The push working says nothing about whether the site is online, so Silex
/// keeps asking until it gets an answer.
pub enum Build {
    /// Silex has no way to ask this host about its builds
    ///
    /// Not a failure: the user is told to look rather than promised a site
    /// nobody checked.
    Unknown,

    /// The host said it will not build this website, and why
    ///
    /// A repository with its builds turned off answers right away, and waiting
    /// on it would only end in a timeout.
    Refused(String),

    NotStarted,

    /// A build exists but no runner has taken it
    ///
    /// A queue worked through in seconds, or a label nothing on that forge
    /// answers to. Only time tells them apart.
    Queued,

    /// Where it can be watched
    Running(Option<String>),

    Built,

    /// Where to read it, and what was blamed
    Failed {
        url: Option<String>,
        reason: Option<String>,
    },
}

/// A website on an account, that this computer can copy
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteWebsite {
    /// What `fetch_website` is given back, never an address: the dashboard
    /// does not choose what is copied
    pub id: String,
    pub name: String,
    /// Where it is on its host, as the user knows it
    pub place: String,
    /// When it last changed, as the host writes it
    pub changed_at: Option<String>,
    pub private: bool,
}

/// One of the accounts or servers an integration was set up with, kept by its
/// program rather than by Silex
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub id: String,
    pub name: String,
    /// What tells it apart for the user, like the server it is on
    pub summary: Option<String>,
}

/// What the server of an account said of its sign-in
#[derive(Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SignIn {
    Accepted,
    Refused,
}

pub trait Integration: Send + Sync {
    fn program(&self) -> &'static str;

    /// What it is known by in integrations.json and to the dashboard, as
    /// several integrations can run one program
    fn id(&self) -> &'static str {
        self.program()
    }

    /// The service the user knows, not the program
    fn name(&self) -> &'static str;

    fn summary(&self) -> &'static str;

    /// What the user gets, in one line on the card
    fn tagline(&self) -> &'static str;

    fn tags(&self) -> &'static [Tag];

    fn openness(&self) -> Openness;

    fn anti_features(&self) -> &'static [AntiFeature] {
        &[]
    }

    /// The official page on installing the program, when Silex cannot find it
    fn install_url(&self) -> &'static str;

    /// The version of the program Silex installs itself, for a user who has none
    fn release(&self) -> Option<&'static Release> {
        None
    }

    /// Once Silex installed the program, before it is looked for again
    fn installed(&self) {}

    /// Whether the program can be installed on this system: one that cannot
    /// is still shown, so that a user who read about it learns why it is not
    /// there for them
    fn runs_here(&self) -> bool {
        true
    }

    /// Only those are asked of it: a method of another capacity answers
    /// `not_provided`
    fn capacities(&self) -> &'static [Capacity];

    /// The servers offered when the user adds an account, before any other
    /// they type in
    fn servers(&self) -> Vec<&'static str> {
        Vec::new()
    }

    fn accounts(&self, cli: &Path) -> Result<Vec<Account>, Said> {
        let _ = cli;
        Ok(Vec::new())
    }

    /// Waits as long as the user takes to sign in, in their browser, and
    /// answers the id of the account signed in to
    ///
    /// `client_id` is the OAuth application the user made on a server Silex
    /// does not know.
    fn connect(
        &self,
        cli: &Path,
        server: &str,
        client_id: Option<&str>,
        given_up: &AtomicBool,
        open: &dyn Fn(String),
    ) -> Result<String, String> {
        let _ = (cli, server, client_id, given_up, open);
        Err(format!(
            "Silex cannot connect an account to {}",
            self.name()
        ))
    }

    /// What the user fills in to add an account, for an integration whose
    /// accounts are not signed in to in the browser
    fn account_form(&self) -> Option<OptionsForm> {
        None
    }

    /// Kept by its program only once the server took what the user answered
    /// to `account_form`, and answers the id of the account
    fn add_account(&self, cli: &Path, values: &PublicationOptions) -> Result<String, Said> {
        let _ = (cli, values);
        Err(Said::raw(format!(
            "Silex cannot add an account to {}",
            self.name()
        )))
    }

    /// Signs the account out of its program too, not just out of Silex
    fn disconnect(&self, cli: &Path, id: &str) -> Result<(), Said> {
        let _ = (cli, id);
        Err(Said::raw(format!(
            "Silex cannot disconnect an account from {}",
            self.name()
        )))
    }

    /// The websites on an account, those changed last first
    fn remote_websites(&self, cli: &Path, account: &str) -> Result<Vec<RemoteWebsite>, String> {
        let _ = (cli, account);
        Err(not_provided(self.program(), Capacity::Sync))
    }

    /// Copy one of `remote_websites` into a folder that does not exist yet, and
    /// answer its name
    fn fetch_website(
        &self,
        cli: &Path,
        account: &str,
        id: &str,
        into: &Path,
    ) -> Result<String, String> {
        let _ = (cli, account, id, into);
        Err(not_provided(self.program(), Capacity::Sync))
    }

    /// Whether the website is already sent somewhere
    fn has_destination(&self, site: &Path) -> bool {
        let _ = site;
        false
    }

    /// Make a new private place on an account for a website of this computer
    /// that is sent nowhere yet, send the website there and sync with it from
    /// then on
    fn link_website(&self, cli: &Path, account: &str, name: &str, site: &Path) -> Result<(), Said> {
        let _ = (cli, account, name, site);
        Err(Said::raw(not_provided(self.program(), Capacity::Sync)))
    }

    /// Whether the server still takes this account, asked over the network
    /// when the user wants to know
    ///
    /// An error means the server could not be asked.
    fn check_account(&self, cli: &Path, id: &str) -> Result<SignIn, Said> {
        let _ = (cli, id);
        Err(Said::raw(format!(
            "Silex cannot check an account of {}",
            self.name()
        )))
    }

    /// What to ask the user before publishing, when this program cannot say
    /// where the website is served
    fn options_form(&self, site: &Path) -> Option<OptionsForm> {
        let _ = site;
        None
    }

    /// How this program is asked for its version
    ///
    /// Asked once, when the program is found: it also proves the file that was
    /// found actually runs.
    fn version_args(&self) -> &'static [&'static str] {
        &["--version"]
    }

    /// Answered from the disk, never from the network: a user waits behind
    /// this. Every integration answering yes that can sync sends the website,
    /// even when two send it to the same remote.
    fn answers_for(&self, site: &Path) -> bool;

    /// The account a website goes through, among those `accounts` lists
    fn account_of(&self, site: &Path) -> Option<String> {
        let _ = site;
        None
    }

    /// Why it does not answer for a website on one of its hosts, when the
    /// account it would need is not on this computer
    fn missing_account(&self, site: &Path) -> Option<String> {
        let _ = site;
        None
    }

    /// Where the website goes, as the user knows it
    fn place(&self, site: &Path) -> Option<String> {
        let _ = site;
        None
    }

    /// The logo of the place, an SVG of one `currentColor` shape on a square
    /// that reads at the size of text
    fn icon(&self) -> Option<&'static str> {
        None
    }

    /// Where the repository of this website can be read, as a user would open
    /// it
    ///
    /// Read from the disk alone: a dashboard asks this of every website it
    /// lists at once, and `urls` costs a program and a round trip each time.
    /// None when the website is only on this computer.
    fn repo(&self, site: &Path) -> Option<String> {
        let remote = Remote::of(site)?;
        Some(format!(
            "https://{}/{}/{}",
            remote.host, remote.owner, remote.repo
        ))
    }

    /// What is known of the website, once its program can be asked
    ///
    /// None when nobody is signed in, which does not stop a user with an ssh
    /// key from publishing. An error means the program could not tell, which
    /// is not the same as knowing nothing.
    ///
    /// `options` is what the user answered to `options_form`, and is empty
    /// when nobody is publishing.
    fn urls(
        &self,
        cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Option<Urls>, String> {
        let _ = (cli, site, options);
        Err(not_provided(self.program(), Capacity::Deploy))
    }

    /// Where the website is served, asked once the host has it
    ///
    /// Before a first build GitLab has no address to give.
    fn address(&self, cli: &Path, site: &Path, options: &PublicationOptions) -> Option<String> {
        let _ = (cli, site, options);
        None
    }

    /// Why the host will build nothing for this account, known before
    /// anything is written, so that nothing is sent for nothing
    ///
    /// None when it would, and when the host could not be asked. `say` is told
    /// when the host is asked, for whoever is waiting on it.
    fn refuses(&self, cli: &Path, site: &Path, say: &dyn Fn(String)) -> Option<Refusal> {
        let _ = (cli, site, say);
        None
    }

    /// Write what the build needs and version it, answering what the
    /// publication has to send along
    ///
    /// Sends nothing when the integration can sync: `push` does, with the tag
    /// answered here. One that cannot sync sends the website here. An
    /// integration may ask the host what its builds looked like before the
    /// push.
    fn deploy(
        &self,
        cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Prepared, String> {
        let _ = (cli, site, options);
        Err(not_provided(self.program(), Capacity::Deploy))
    }

    /// Ask what became of the build this publication started
    ///
    /// Asked over and over while the user waits. An error means nothing could
    /// be asked this time, which is not an answer: the caller tries again.
    fn build(&self, cli: &Path, site: &Path, prepared: &Prepared) -> Result<Build, String> {
        let _ = (cli, site, prepared);
        Ok(Build::Unknown)
    }

    /// Send what was saved, with the tag of a publication when there is one
    ///
    /// Never touches the files of the website: the editor may have it open.
    fn push(&self, cli: &Path, site: &Path, tag: Option<&str>) -> Result<(), SyncError> {
        let _ = (cli, site, tag);
        Err(SyncError::Other(not_provided(
            self.program(),
            Capacity::Sync,
        )))
    }

    /// Take in what was sent from somewhere else, before the editor reads the
    /// website, and say whether work done here is left to push
    ///
    /// Never makes a merge: a website that moved on both here and there is
    /// left to its user.
    fn sync(&self, cli: &Path, site: &Path) -> Result<bool, SyncError> {
        let _ = (cli, site);
        Err(SyncError::Other(not_provided(
            self.program(),
            Capacity::Sync,
        )))
    }

    /// Where a website stands with the place it is sent to, read on this
    /// computer only: the dashboard asks it for every website it shows
    fn synced(&self, site: &Path) -> Option<Synced> {
        let _ = site;
        None
    }

    /// Where the user watches the build of the publication that just left
    ///
    /// By default the list of builds, where theirs is at the top.
    fn watch(&self, urls: &Urls, _prepared: &Prepared) -> Option<String> {
        urls.ci.clone()
    }
}

/// What `deploy` left for the publication to send and for `build` to recognise
#[derive(Default)]
pub struct Prepared {
    /// The integrations that start their build on a tag put theirs here
    pub tag: Option<String>,
}

/// The tag name the SaaS uses, so that a history reads the same everywhere
///
/// The pipeline files only let a tag of this shape start a build: a tag the
/// user made for their own reasons does not put a website online.
pub fn silex_tag() -> String {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|since| since.as_millis())
        .unwrap_or_default();
    format!("_silex_{}", timestamp)
}
