/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

use std::path::Path;

use silex_server::{OptionsForm, PublicationOptions};

use super::git::Git;
use super::remote::Remote;

/// The addresses of a published website, as far as its host told them
#[derive(Default)]
pub struct Urls {
    /// Where the website is served
    pub site: Option<String>,
    /// Where the build can be watched
    pub ci: Option<String>,
    /// Where the user sets a domain of their own
    pub settings: Option<String>,
    /// What the user has to know about their published website, in their own
    /// words
    ///
    /// A build that worked does not always mean a website anybody can open.
    /// `settings` is where whatever is said here gets fixed.
    pub warning: Option<String>,
}

/// What became of the build a publication started
///
/// The website is built out of the files that were pushed, and that is the
/// step a user waits on: the push working says nothing about whether their
/// site is online. Silex keeps asking until it gets an answer.
pub enum Build {
    /// Silex has no way to ask this host about its builds
    ///
    /// Not a failure: the website was sent, and the user is told to look for
    /// themselves rather than promised a site nobody checked.
    Unknown,

    /// The host said it will not build this website, and why
    ///
    /// A repository with its build feature turned off is the case this exists
    /// for: waiting on a build that can never start would only end in a
    /// timeout, when the answer came right away.
    Refused(String),

    /// The host has nothing about this publication yet
    NotStarted,

    /// A build exists but no runner has taken it
    ///
    /// A queue a forge works through in seconds, or a build waiting for a
    /// runner that is never coming: the workflow names a label, and nothing on
    /// that forge answers to it. Only time tells them apart.
    Queued,

    /// A build is running, and where it can be watched
    Running(Option<String>),

    /// The build finished and the website is served
    Built,

    /// The build failed, where to read it and what was blamed
    Failed {
        url: Option<String>,
        reason: Option<String>,
    },
}

pub trait Deploy: Send + Sync {
    fn program(&self) -> &'static str;

    /// What to ask the user before publishing, when this program cannot say
    /// where the website is served
    ///
    /// None when it can, which is one question the user is spared.
    fn options_form(&self, site: &Path) -> Option<OptionsForm> {
        let _ = site;
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

    /// Whether this website is kept here
    ///
    /// Answered from the folder of the website and from what is configured on
    /// this machine, never from the network: this is asked before anything
    /// else and a user waits behind it. Two integrations answering yes for the
    /// same website is a mistake in their conditions, not a tie to break.
    fn keeps(&self, site: &Path) -> bool;

    /// Where the repository of this website can be read, as a user would open
    /// it
    ///
    /// Read from the disk alone, never over the network: a dashboard asks this
    /// of every website it lists at once, and `urls` costs a program and a
    /// round trip each time. None when the website is only on this computer.
    ///
    /// The default suits every forge that serves its repositories at
    /// `host/owner/repo`.
    fn repo(&self, site: &Path) -> Option<String> {
        let remote = Remote::of(site)?;
        Some(format!(
            "https://{}/{}/{}",
            remote.host, remote.owner, remote.repo
        ))
    }

    /// What is known of the website, once its program can be asked
    ///
    /// None when nobody is signed in: being signed in and being able to send
    /// are two different things, and a user with an ssh key and no account
    /// publishes perfectly well — Silex just has nothing to say about where it
    /// lands.
    ///
    /// An error means the program could not tell, which is not the same as
    /// knowing nothing.
    ///
    /// `options` is what the user answered to `options_form`, sent by the
    /// editor with the website it publishes and never read off the disk.
    /// Empty when nobody is publishing: the editor is then asking who serves
    /// this website, and it keeps the answers of the user itself.
    fn urls(
        &self,
        cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Option<Urls>, String>;

    /// Write what the build needs and version it, answering what the
    /// publication has to send along
    ///
    /// The files and the version stay in the website's own folder: sending is
    /// the caller's, done with the git of the user, and no integration pushes
    /// anything of its own. An integration may still ask a question over the
    /// network, to note what the builds looked like before the push.
    ///
    /// `options` is what the user answered, as it was handed to `urls`.
    fn deploy(
        &self,
        cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Prepared, String>;

    /// Send what was versioned to where the website is kept
    ///
    /// A host that takes a website another way — a bucket, an API — says so
    /// here, and it is the one place that has to change.
    fn push(&self, _cli: &Path, site: &Path, tag: Option<&str>) -> Result<(), String> {
        let git = Git::found().ok_or(
            "Silex could not find git on this computer, and it is git that sends a website to its host.",
        )?;
        git.push(site, tag)
    }

    /// Ask what became of the build this publication started
    ///
    /// Asked over and over while the user waits. An error means nothing could
    /// be asked this time, which is not an answer: the caller tries again.
    ///
    /// The default knows nothing, and an integration Silex cannot follow says
    /// so rather than failing a publication that worked.
    fn build(&self, cli: &Path, site: &Path, prepared: &Prepared) -> Result<Build, String> {
        let _ = (cli, site, prepared);
        Ok(Build::Unknown)
    }

    /// Where the user watches the build of the publication that just left
    ///
    /// An integration that can point at one build rather than at all of them
    /// says so here, from what `deploy` prepared. By default the user lands on
    /// the list of builds and finds theirs at the top.
    fn watch(&self, urls: &Urls, _prepared: &Prepared) -> Option<String> {
        urls.ci.clone()
    }
}

/// What this website had already built when a publication was pushed
///
/// For the integrations whose builds do not say which push they came from: a
/// build newer than the one named here is this publication's, and the one named
/// here is the last publication's. Without it, a build from last week would be
/// read as this publication succeeding.
#[derive(Default)]
pub enum EarlierBuild {
    /// The host says which push each of its builds came from, so what it had
    /// built before tells nothing apart
    #[default]
    NoNeedToKnow,

    /// The host had never built this website
    Nothing,

    /// This build was the newest one
    Run(String),

    /// The host could not be asked, so no build of this website can be called
    /// this publication's
    CouldNotAsk,
}

/// What `deploy` left for the publication to send and for `build` to recognise
#[derive(Default)]
pub struct Prepared {
    /// The integrations that start their build on a tag put theirs here
    pub tag: Option<String>,

    /// What this website had already built when the push left
    pub before: EarlierBuild,
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

#[cfg(test)]
mod tests {
    use super::*;

    /// A repository written by hand, so that no git has to make one
    fn a_website(name: &str, remote: &str) -> std::path::PathBuf {
        let site = std::env::temp_dir().join(format!("silex-repo-{}-{}", name, std::process::id()));
        let _ = std::fs::remove_dir_all(&site);
        std::fs::create_dir_all(site.join(".git/objects")).unwrap();
        std::fs::create_dir_all(site.join(".git/refs")).unwrap();
        std::fs::write(site.join(".git/HEAD"), "ref: refs/heads/main\n").unwrap();
        let config = format!(
            "[core]\n\trepositoryformatversion = 0\n[remote \"origin\"]\n\turl = {}\n",
            remote
        );
        std::fs::write(site.join(".git/config"), config).unwrap();
        site
    }

    #[test]
    fn the_repository_of_a_website_is_named_as_a_user_would_open_it() {
        let site = a_website("gitlab", "git@gitlab.com:lexoyo/a-site.git");
        assert_eq!(
            super::super::glab::Glab.repo(&site).as_deref(),
            Some("https://gitlab.com/lexoyo/a-site")
        );

        // The ssh port an instance answers on is not part of the address its
        // repositories are read at
        let site = a_website(
            "forgejo",
            "ssh://git@forge.example.org:2150/lexoyo/a-site.git",
        );
        assert_eq!(
            super::super::tea::Tea.repo(&site).as_deref(),
            Some("https://forge.example.org/lexoyo/a-site")
        );
    }

    #[test]
    fn sourcehut_keeps_the_tilde_its_owners_are_written_with() {
        let site = a_website("sourcehut", "git@git.sr.ht:~lexoyo/a-site");
        assert_eq!(
            super::super::hut::Hut.repo(&site).as_deref(),
            Some("https://git.sr.ht/~lexoyo/a-site")
        );
    }

    #[test]
    fn a_website_kept_on_this_computer_alone_has_no_repository() {
        let site = std::env::temp_dir().join(format!("silex-norepo-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&site);
        std::fs::create_dir_all(&site).unwrap();
        assert_eq!(super::super::glab::Glab.repo(&site), None);
    }
}
