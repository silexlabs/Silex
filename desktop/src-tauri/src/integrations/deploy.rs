/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

use std::path::Path;

use silex_server::OptionsForm;

use super::git::Git;
use super::remote::Remote;

/// The addresses of a published website, as far as its forge told them
#[derive(Default)]
pub struct Urls {
    /// Where the website is served
    pub site: Option<String>,
    /// Where the build can be watched
    pub ci: Option<String>,
    /// Where the user sets a domain of their own
    pub settings: Option<String>,
}

/// What became of the build a publication started
///
/// A forge builds the website out of the files that were pushed, and that is
/// the step a user waits on: the push working says nothing about whether their
/// site is online. Silex asks the forge until it answers.
pub enum Build {
    /// Silex has no way to ask this forge about its builds
    ///
    /// Not a failure: the website was sent, and the user is told to look for
    /// themselves rather than promised a site nobody checked.
    Unknown,

    /// The forge said it will not build this website, and why
    ///
    /// A repository with its build feature turned off is the case this exists
    /// for: waiting on a build that can never start would only end in a
    /// timeout, when the forge answered right away.
    Refused(String),

    /// The forge has nothing about this publication yet
    NotStarted,

    /// A build is running, and where it can be watched
    Running(Option<String>),

    /// The build finished and the website is served
    Built,

    /// The build failed, where to read it and what the forge blamed
    Failed {
        url: Option<String>,
        reason: Option<String>,
    },
}

/// What an integration answers when asked about a website
pub enum Answer {
    /// Not one of its own
    No,
    /// One of its own, but the user is not signed in to that forge
    ///
    /// Publishing still saves and sends the website: signing in to a forge and
    /// being able to push are two different things, and a user with an ssh key
    /// and no forge account pushes perfectly well.
    NotSignedIn,
    /// One of its own, and what it knows about it
    Yes(Urls),
}

pub trait Deploy: Send + Sync {
    fn program(&self) -> &'static str;

    /// The name of the forge, as the user knows it
    ///
    /// Told apart from the program on purpose: somebody publishing to Codeberg
    /// has no reason to be shown the name of the command line Silex uses.
    fn display_name(&self) -> &'static str;

    /// What to ask the user before publishing, when this program cannot say
    /// where the website is served
    ///
    /// None when it can, which is one question the user is spared. `remote` is
    /// what git said about the website, handed over as it is to `urls`: none of
    /// them goes looking for git itself.
    fn options_form(&self, remote: Option<&Remote>) -> Option<OptionsForm> {
        let _ = remote;
        None
    }

    /// How this program is asked for its version
    ///
    /// Asked once, when the program is found: the answer says which version a
    /// user is running when they report something, and asking at all proves the
    /// file that was found actually runs.
    fn version_args(&self) -> &'static [&'static str] {
        &["--version"]
    }

    /// Whether this website is one of its own, and what it knows about it
    ///
    /// The program is asked in the website folder. An error means the program
    /// could not tell, which is not the same as a no and must not be taken for
    /// one.
    ///
    /// `remote` is what git said about this website, read once and handed
    /// over: none of them goes looking for git itself, so a git the user turned
    /// off is a git nothing starts.
    ///
    /// `website_url` is the address the user named, when they named one and
    /// when there is a publication to name it: the editor sends it with the
    /// website it publishes, and nothing here reads it off the disk.
    fn urls(
        &self,
        cli: &Path,
        site: &Path,
        remote: Option<&Remote>,
        website_url: Option<&str>,
    ) -> Result<Answer, String>;

    /// Write what the build needs and version it, answering what the
    /// publication has to send along
    ///
    /// All of it happens in the website's own folder, so none of it reaches a
    /// forge: sending is the caller's, done with the git of the user, and no
    /// integration pushes anything of its own.
    ///
    /// `website_url` is the address the user named, as it was handed to `urls`.
    fn deploy(&self, cli: &Path, site: &Path, website_url: Option<&str>)
        -> Result<Prepared, String>;

    /// Send what was versioned to the forge
    ///
    /// Git for every forge so far, which is why the default is all any of them
    /// needs. A host that takes a website another way — a bucket, an API — says
    /// so here, and it is the one place that has to change.
    fn push(&self, _cli: &Path, site: &Path, git: &Git, tag: Option<&str>) -> Result<(), String> {
        git.push(site, tag)
    }

    /// Ask the forge what became of the build this publication started
    ///
    /// Asked over and over while the user waits, so it stays one question to
    /// the forge and nothing more. An error means the forge could not be asked
    /// this time, which is not an answer: the caller tries again.
    ///
    /// The default knows nothing, and a forge Silex cannot follow says so
    /// rather than failing a publication that worked.
    fn build(
        &self,
        cli: &Path,
        site: &Path,
        remote: Option<&Remote>,
        prepared: &Prepared,
    ) -> Result<Build, String> {
        let _ = (cli, site, remote, prepared);
        Ok(Build::Unknown)
    }

    /// Where the user watches the build of the publication that just left
    ///
    /// A forge that can be pointed at one build rather than at all of them
    /// says so here, from what `deploy` prepared. By default the user lands on
    /// the list of builds and finds theirs at the top.
    fn watch(&self, urls: &Urls, _prepared: &Prepared) -> Option<String> {
        urls.ci.clone()
    }
}

/// What `deploy` left for the publication to send and for `build` to recognise
#[derive(Default)]
pub struct Prepared {
    /// The forges that start their build on a tag put theirs here
    pub tag: Option<String>,

    /// What the builds of this website looked like before the push
    ///
    /// For the forges whose builds do not say which push they came from: the
    /// newest build named here is one that was already there, so it is not the
    /// one this publication started. Without it, a build from last week would
    /// be read as this publication succeeding.
    pub before: Option<String>,
}

/// The tag name the SaaS uses, so that a history reads the same everywhere
///
/// The pipeline files only let a tag of this shape start a build: saving a
/// website is not publishing it, and a tag the user made for their own reasons
/// does not put a website online.
pub fn silex_tag() -> String {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|since| since.as_millis())
        .unwrap_or_default();
    format!("_silex_{}", timestamp)
}
