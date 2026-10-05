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
//! Kept small on purpose: an integration is asked what it knows about a
//! website rather than having Silex read it off a URL.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::SystemTime;

use crate::held::held;

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
    /// Reading it opens the repository, so the answer is kept against the file a remote
    /// is written in: `git remote add` in a terminal changes that file and the
    /// question is asked again. Its date alone would not do, a file system that
    /// keeps dates to the second cannot tell that second apart.
    pub fn of(site: &Path) -> Option<Remote> {
        // A website with no repository has no such file
        let written = std::fs::metadata(site.join(".git/config"))
            .ok()
            .and_then(|file| Some((file.modified().ok()?, file.len())));

        let known = held(remembered())
            .get(site)
            .filter(|(when, _)| *when == written)
            .map(|(_, read)| read.clone());
        if let Some(known) = known {
            return known;
        }

        // Read outside the lock, because this reads the disk
        let read = Remote::read(site);
        held(remembered()).insert(site.to_path_buf(), (written, read.clone()));
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
        Remote::parse(url).map(|remote| remote.host).or_else(|| {
            let rest = url
                .trim()
                .split_once("://")
                .map(|(_, rest)| rest)
                .unwrap_or(url);
            let authority = rest.split(['/', ':']).next()?;
            let host = authority
                .rsplit_once('@')
                .map(|(_, h)| h)
                .unwrap_or(authority);
            (!host.is_empty()).then(|| host.to_string())
        })
    }

    /// A host without the ssh port it was given
    pub(in crate::integrations) fn without_port(authority: &str) -> &str {
        match authority.rsplit_once(':') {
            Some((host, port))
                if !host.is_empty()
                    && !port.is_empty()
                    && port.bytes().all(|b| b.is_ascii_digit()) =>
            {
                host
            }
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
            let host = authority
                .rsplit_once('@')
                .map(|(_, h)| h)
                .unwrap_or(authority);
            format!("{} {}", host, path)
        } else if let Some(rest) = url.strip_prefix("ssh://") {
            let (authority, path) = rest.split_once('/')?;
            let host = authority
                .rsplit_once('@')
                .map(|(_, h)| h)
                .unwrap_or(authority);
            // An instance answering ssh somewhere other than 22 is the same
            // host an integration was signed in to
            format!("{} {}", Remote::without_port(host), path)
        } else if url
            .split_once(':')
            .is_some_and(|(before, _)| !before.contains('/'))
        {
            // `git@host:owner/repo`, and the same without a user
            let rest = url
                .split_once('@')
                .map(|(_, r)| r.to_string())
                .unwrap_or_else(|| url.to_string());
            rest.replacen(':', " ", 1)
        } else {
            return None;
        };

        let (host, path) = rest.split_once(' ')?;
        // A GitLab repository can live in nested groups, all of them its owner
        // as far as an address is concerned
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

/// The remote URLs in a sentence a program wrote, without what a password
/// could be in
///
/// git quotes the remote back in its errors, token included, and those errors
/// are shown to the user and sent to telemetry.
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
