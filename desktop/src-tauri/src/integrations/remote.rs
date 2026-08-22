/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! What a remote URL says
//!
//! Kept as small as possible on purpose: an integration is asked what it knows
//! about a website rather than having Silex read it off a URL. Only the
//! programs that cannot be asked read this.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::SystemTime;

/// Host, owner and repository name of a git remote
#[derive(Clone)]
pub struct Remote {
    pub host: String,
    pub owner: String,
    pub repo: String,
}

/// What was read of a website, and what `.git/config` looked like then
type Remembered = HashMap<PathBuf, (Option<(SystemTime, u64)>, Option<Remote>)>;

fn remembered() -> &'static Mutex<Remembered> {
    static REMEMBERED: OnceLock<Mutex<Remembered>> = OnceLock::new();
    REMEMBERED.get_or_init(Mutex::default)
}

impl Remote {
    /// The remote of a website, asked by the integrations that work from one
    ///
    /// Reading it starts a git, and one publication asks several times, so the
    /// answer is kept against the file a remote is written in. The owner of a
    /// website who runs `git remote add` in a terminal changes that file, and
    /// the next question is read again rather than answered with a remembered
    /// "this website has none". Its date alone would not do: a file system
    /// that keeps dates to the second cannot tell that second apart.
    pub fn of(site: &Path) -> Option<Remote> {
        // A website with no repository has no such file, which is an answer
        // like any other rather than a failure
        let written = std::fs::metadata(site.join(".git/config"))
            .ok()
            .and_then(|file| Some((file.modified().ok()?, file.len())));

        let known = remembered()
            .lock()
            .unwrap_or_else(|held| held.into_inner())
            .get(site)
            .filter(|(when, _)| *when == written)
            .map(|(_, read)| read.clone());
        if let Some(known) = known {
            return known;
        }

        // Read outside the lock: this starts a program, and a website nobody
        // asked about should not wait for it
        let read = Remote::read(site);
        remembered()
            .lock()
            .unwrap_or_else(|held| held.into_inner())
            .insert(site.to_path_buf(), (written, read.clone()));
        read
    }

    fn read(site: &Path) -> Option<Remote> {
        let url = super::git::remote_url(site)?;
        let read = Remote::parse(&url);
        if read.is_none() {
            tracing::warn!(remote = %redact(&url), "This remote is written in a way Silex cannot read");
        }
        read
    }

    /// The host part of a URL, `https://codeberg.org/x/y` and `git@sr.ht:~x/y`
    /// alike
    pub fn host_of(url: &str) -> Option<String> {
        Remote::parse(url)
            .map(|remote| remote.host)
            .or_else(|| {
                let rest = url
                    .trim()
                    .split_once("://")
                    .map(|(_, rest)| rest)
                    .unwrap_or(url);
                let authority = rest.split(['/', ':']).next()?;
                let host = authority.rsplit_once('@').map(|(_, h)| h).unwrap_or(authority);
                (!host.is_empty()).then(|| host.to_string())
            })
    }

    /// A host without the ssh port it was given
    pub(super) fn without_port(authority: &str) -> &str {
        match authority.rsplit_once(':') {
            Some((host, port)) if !host.is_empty() && !port.is_empty() && port.bytes().all(|b| b.is_ascii_digit()) => host,
            _ => authority,
        }
    }

    /// Parse `https://host/owner/repo.git`, `git@host:owner/repo.git` and
    /// sourcehut's `~owner`
    pub fn parse(remote_url: &str) -> Option<Remote> {
        let url = remote_url.trim().trim_end_matches('/');
        let url = url.strip_suffix(".git").unwrap_or(url);

        let rest = if let Some(rest) = url
            .strip_prefix("https://")
            .or_else(|| url.strip_prefix("http://"))
        {
            let (authority, path) = rest.split_once('/')?;
            // Drop credentials, as in https://user:token@host/owner/repo
            let host = authority.rsplit_once('@').map(|(_, h)| h).unwrap_or(authority);
            format!("{} {}", host, path)
        } else if let Some(rest) = url.strip_prefix("ssh://") {
            let (authority, path) = rest.split_once('/')?;
            let host = authority.rsplit_once('@').map(|(_, h)| h).unwrap_or(authority);
            // An instance answering ssh somewhere other than 22 is the same
            // host as the one an integration was signed in to, and the same one
            // its pages are served from
            format!("{} {}", Remote::without_port(host), path)
        } else if url.split_once(':').is_some_and(|(before, _)| !before.contains('/')) {
            // `git@host:owner/repo`, and the same without a user, which git
            // takes just as well
            let rest = url.split_once('@').map(|(_, r)| r.to_string()).unwrap_or_else(|| url.to_string());
            rest.replacen(':', " ", 1)
        } else {
            return None;
        };

        let (host, path) = rest.split_once(' ')?;
        // A GitLab repository can live in nested groups, all of them are its
        // owner as far as an address is concerned
        let (owner, repo) = path.rsplit_once('/')?;
        let owner = owner.trim_start_matches('~');
        if owner.is_empty() || repo.is_empty() {
            return None;
        }
        Some(Remote {
            host: host.to_string(),
            owner: owner.to_string(),
            repo: repo.to_string(),
        })
    }
}

/// A remote URL as it can be shown: what a password could be in is dropped
pub fn without_secret(remote_url: &str) -> &str {
    remote_url.split('@').next_back().unwrap_or(remote_url)
}

/// The same, in the middle of a sentence a program wrote
///
/// A remote can carry a token, and git quotes the remote back in its errors.
/// Those errors are shown to the user and sent to telemetry, so every URL in
/// them loses what stands before its host.
pub fn redact(text: &str) -> String {
    let mut redacted = String::with_capacity(text.len());
    let mut rest = text;

    while let Some(scheme) = rest.find("://") {
        let (start, after) = rest.split_at(scheme + 3);
        redacted.push_str(start);

        let end = after
            .find(|c: char| c == '/' || c.is_whitespace())
            .unwrap_or(after.len());
        let (authority, tail) = after.split_at(end);
        match authority.rsplit_once('@') {
            Some((_, host)) => {
                redacted.push_str("***@");
                redacted.push_str(host);
            }
            None => redacted.push_str(authority),
        }
        rest = tail;
    }

    redacted.push_str(rest);
    redacted
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_the_shapes_a_remote_comes_in() {
        for (url, host, owner, repo) in [
            ("https://gitlab.com/lexoyo/site.git", "gitlab.com", "lexoyo", "site"),
            ("https://user:token@gitlab.com/lexoyo/site.git", "gitlab.com", "lexoyo", "site"),
            ("git@codeberg.org:alex/site.git", "codeberg.org", "alex", "site"),
            ("git@git.sr.ht:~alex/site", "git.sr.ht", "alex", "site"),
            ("ssh://alice@git.example.com/team/site.git", "git.example.com", "team", "site"),
            // git takes the scp form without a user just as well
            ("codeberg.org:alex/site.git", "codeberg.org", "alex", "site"),
            ("https://gitlab.com/group/subgroup/site.git", "gitlab.com", "group/subgroup", "site"),
            // A Forgejo of one's own often answers ssh somewhere other than 22,
            // and it is the same host the integration was signed in to
            ("ssh://git@v15.next.forgejo.org:2150/lexoyo/site.git", "v15.next.forgejo.org", "lexoyo", "site"),
            // A web port belongs to the address and stays
            ("https://gitlab.example.com:8443/team/site.git", "gitlab.example.com:8443", "team", "site"),
        ] {
            let remote = Remote::parse(url).unwrap_or_else(|| panic!("could not parse {}", url));
            assert_eq!((remote.host.as_str(), remote.owner.as_str(), remote.repo.as_str()), (host, owner, repo), "{}", url);
        }
    }

    #[test]
    fn a_remote_added_from_a_terminal_is_seen() {
        if crate::integrations::git::Git::found().is_none() {
            return;
        }

        let site = std::env::temp_dir().join(format!("silex-remote-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&site);
        std::fs::create_dir_all(site.join(".git/objects")).unwrap();
        std::fs::create_dir_all(site.join(".git/refs")).unwrap();
        std::fs::write(site.join(".git/HEAD"), "ref: refs/heads/main\n").unwrap();
        let alone = "[core]\n\trepositoryformatversion = 0\n";
        std::fs::write(site.join(".git/config"), alone).unwrap();

        assert!(Remote::of(&site).is_none());

        let added = format!("{}[remote \"origin\"]\n\turl = https://codeberg.org/alex/site.git\n", alone);
        std::fs::write(site.join(".git/config"), added).unwrap();

        let remote = Remote::of(&site).expect("a remote added after a first reading was not seen");
        assert_eq!((remote.host.as_str(), remote.repo.as_str()), ("codeberg.org", "site"));

        let _ = std::fs::remove_dir_all(&site);
    }

    #[test]
    fn reads_the_host_of_a_url() {
        assert_eq!(Remote::host_of("https://codeberg.org/x/y").as_deref(), Some("codeberg.org"));
        assert_eq!(Remote::host_of("https://git.example.com").as_deref(), Some("git.example.com"));
        assert_eq!(Remote::host_of("git@git.sr.ht:~x/y").as_deref(), Some("git.sr.ht"));
    }

    #[test]
    fn shows_a_url_without_its_password() {
        assert_eq!(without_secret("https://oauth2:secret@gitlab.com/x/y.git"), "gitlab.com/x/y.git");
        assert_eq!(without_secret("https://gitlab.com/x/y.git"), "https://gitlab.com/x/y.git");
    }

    #[test]
    fn drops_the_secrets_a_program_quotes_back() {
        let said = "remote: HTTP Basic: Access denied\nfatal: Authentication failed for 'https://lexoyo:glpat-abc123@gitlab.com/lexoyo/site.git/'";
        let shown = redact(said);
        assert!(!shown.contains("glpat-abc123"), "{}", shown);
        assert!(shown.contains("***@gitlab.com/lexoyo/site.git"), "{}", shown);

        // A URL with nothing to hide is left as it is, twice in a row included
        let plain = "could not read https://codeberg.org/a/b and https://sr.ht/~c/d";
        assert_eq!(redact(plain), plain);
        // And an error without any URL goes through untouched
        assert_eq!(redact("no such remote: origin"), "no such remote: origin");
    }
}

