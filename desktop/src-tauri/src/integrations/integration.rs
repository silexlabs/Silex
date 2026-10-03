/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

use std::path::Path;

use serde::Serialize;
use silex_server::said::Said;
use silex_server::{OptionsForm, PublicationOptions};

use super::common::remote::Remote;

/// What an integration can do for a website
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Capacity {
    /// Keep a website the same here and where it is kept
    Sync,
    /// Put a website online
    Deploy,
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
    pub site: Option<String>,
    /// Where the build can be watched
    pub ci: Option<String>,
    /// Where the user sets a domain of their own
    pub settings: Option<String>,
    /// What the user has to know about their published website, in their own
    /// words: a build that worked is not always a website anybody can open
    pub warning: Option<String>,
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

pub trait Integration: Send + Sync {
    fn program(&self) -> &'static str;

    /// Only those are asked of it: a method of another capacity answers
    /// `not_provided`
    fn capacities(&self) -> &'static [Capacity];

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
    fn push(&self, site: &Path, tag: Option<&str>) -> Result<(), SyncError> {
        let _ = (site, tag);
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
    fn sync(&self, site: &Path) -> Result<bool, SyncError> {
        let _ = site;
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

/// What this website had already built when a publication was pushed
///
/// For the integrations whose builds do not say which push they came from: a
/// build newer than the one named here is this publication's. Without it, a
/// build from last week would be read as this publication succeeding.
#[derive(Default)]
pub enum EarlierBuild {
    /// The host had never built this website, or does not need telling apart
    #[default]
    Nothing,

    /// The newest build at the time
    Run(String),

    /// The host could not be asked, so no build here can be called ours
    CouldNotAsk,
}

/// What `deploy` left for the publication to send and for `build` to recognise
#[derive(Default)]
pub struct Prepared {
    /// The integrations that start their build on a tag put theirs here
    pub tag: Option<String>,
    pub before: EarlierBuild,
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
