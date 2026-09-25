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

use super::common::remote::Remote;

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

pub trait Deploy: Send + Sync {
    fn program(&self) -> &'static str;

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
    /// this. Two integrations answering yes for the same website is a mistake
    /// in their conditions, not a tie to break.
    fn keeps(&self, site: &Path) -> bool;

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
    ) -> Result<Option<Urls>, String>;

    /// Write what the build needs and version it, answering what the
    /// publication has to send along
    ///
    /// Nothing is sent here: that is the caller's, with the git of the user.
    /// An integration may ask the host what its builds looked like before the
    /// push.
    fn deploy(
        &self,
        cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Prepared, String>;

    /// Ask what became of the build this publication started
    ///
    /// Asked over and over while the user waits. An error means nothing could
    /// be asked this time, which is not an answer: the caller tries again.
    fn build(&self, cli: &Path, site: &Path, prepared: &Prepared) -> Result<Build, String> {
        let _ = (cli, site, prepared);
        Ok(Build::Unknown)
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

        // The ssh port is not part of the address repositories are read at
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
