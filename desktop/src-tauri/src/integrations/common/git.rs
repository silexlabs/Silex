/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The git of the user, and what it knows about a website
//!
//! Sending a website somewhere is somebody else's network, keys and passwords,
//! and the git of the user already knows all three: only sending and taking in
//! start it. What the repository says is read without starting a program, a
//! save asks it every time. Making versions of a website is
//! the server's, not this.

use std::path::{Path, PathBuf};

use git2::{ConfigLevel, ErrorCode};
use silex_server::{repository, TEMPLATE_REMOTE};

use super::run::{failure, run, run_fetch, run_transfer_verbatim, Ran};
use crate::integrations::integration::SyncError;

/// Every remote of the repository, with the URL it was given
///
/// Read from the config rather than with `Repository::find_remote`, which
/// applies insteadOf rewrites: the host is told from what the user wrote.
fn remotes(site: &Path) -> Vec<(String, String)> {
    let Some(config) = repository(site)
        .ok()
        .and_then(|repo| repo.config().ok())
        .and_then(|config| config.open_level(ConfigLevel::Local).ok())
    else {
        return Vec::new();
    };
    let Ok(configured) = config.entries(Some(r"^remote\..*\.url$")) else {
        return Vec::new();
    };

    let mut found: Vec<(String, String)> = Vec::new();
    let _ = configured.for_each(|entry| {
        let (Ok(setting), Ok(url)) = (entry.name(), entry.value()) else {
            return;
        };
        let name = setting
            .strip_prefix("remote.")
            .and_then(|rest| rest.strip_suffix(".url"));
        let Some(name) = name else {
            return;
        };
        let url = url.trim();
        // A remote can be given several URLs, and git sends to the first
        if name.is_empty() || url.is_empty() || found.iter().any(|(known, _)| known == name) {
            return;
        }
        found.push((name.to_string(), url.to_string()));
    });
    found
}

/// The remote a website is published to: `origin` when there is one, the first
/// the user configured otherwise, never `upstream`
///
/// A repository set up by hand does not always call it `origin`, and reading
/// that name alone leaves those websites publishing nothing at all. `upstream`
/// is the template a website was made from, which publishing must not replace.
fn published_to(site: &Path) -> Option<(String, String)> {
    let remotes = remotes(site);
    remotes
        .iter()
        .find(|(name, _)| name == "origin")
        .or_else(|| remotes.iter().find(|(name, _)| name != TEMPLATE_REMOTE))
        .cloned()
}

pub fn remote_name(site: &Path) -> Option<String> {
    published_to(site).map(|(name, _)| name)
}

/// As the user wrote it
pub fn remote_url(site: &Path) -> Option<String> {
    published_to(site).map(|(_, url)| url)
}

/// The git of this machine, looked for once and kept
///
/// Not an integration: nothing to turn on, nothing to remember. Asked its
/// version rather than taken on sight, because a file being there does not
/// mean it runs.
fn git_path() -> Option<PathBuf> {
    static FOUND: std::sync::OnceLock<Option<PathBuf>> = std::sync::OnceLock::new();
    FOUND
        .get_or_init(|| {
            super::programs::found("git")
                .filter(|program| run(program, &std::env::temp_dir(), &["--version"]).is_ok())
        })
        .clone()
}

/// Push the branch, and the tag when there is one
///
/// A tag nothing was pushed with would be left behind at every failed
/// attempt, so it goes with the failure.
pub fn push(site: &Path, tag: Option<&str>) -> Result<(), SyncError> {
    let (git, remote) = git_and_remote(site)?;
    let pushed = push_branch(&git, site, &remote, tag);
    if pushed.is_err() {
        if let Some(tag) = tag {
            silex_server::untag(site, tag);
        }
    }
    pushed
}

/// Fast-forward only: a website that moved on both here and there is left
/// to its user and the git client they already have.
///
/// False only once it is known that nothing is left to push: what could not be
/// compared is an error.
pub fn sync(site: &Path) -> Result<bool, SyncError> {
    let (git, remote) = git_and_remote(site)?;
    // Fetched then merged rather than pulled: only the fetch reaches a
    // network, and `pull` reads settings of the user that are not Silex's
    // business to inherit.
    run_fetch(&git, site, &["fetch", "--end-of-options", &remote]).map_err(SyncError::Other)?;
    let other = |e: git2::Error| SyncError::Other(e.message().to_string());
    let repo = repository(site).map_err(other)?;
    let head = match repo.head() {
        Ok(head) => head,
        // No commit yet: nothing here to send, nothing to take in on top of
        Err(e) if e.code() == ErrorCode::UnbornBranch => return Ok(false),
        Err(e) => return Err(other(e)),
    };
    let (true, Some(local), Ok(branch)) = (head.is_branch(), head.target(), head.shorthand())
    else {
        return Err(SyncError::Other(format!(
            "{} is not on a branch",
            site.display()
        )));
    };
    // Rather than `@{u}`, which a website published before Silex set it, or
    // whose first push failed, does not have
    let Ok(upstream) = repo.revparse_single(&format!("refs/remotes/{}/{}", remote, branch)) else {
        // Never sent: all of it is left to push
        return Ok(true);
    };
    let (ahead, behind) = repo
        .graph_ahead_behind(local, upstream.id())
        .map_err(other)?;
    if behind == 0 {
        return Ok(ahead > 0);
    }
    run(
        &git,
        site,
        &["merge", "--ff-only", &upstream.id().to_string()],
    )
    .map_err(|why| {
        if ahead > 0 {
            SyncError::ChangedElsewhere(why)
        } else {
            SyncError::Other(why)
        }
    })?;
    Ok(false)
}

fn git_and_remote(site: &Path) -> Result<(PathBuf, String), SyncError> {
    let git = git_path().ok_or_else(|| {
        SyncError::Other(
            "Silex could not find git on this computer, and it is git that sends a website to its host."
                .to_string(),
        )
    })?;
    let remote =
        remote_name(site).ok_or_else(|| SyncError::Other(NOWHERE_TO_SEND_IT.to_string()))?;
    Ok((git, remote))
}

/// Send the branch, saying so plainly when the remote moved on
///
/// Nothing is merged or rebased here: a merge Silex started would leave the
/// folder in a state its user has no terminal to get out of.
fn push_branch(git: &Path, site: &Path, remote: &str, tag: Option<&str>) -> Result<(), SyncError> {
    let mut args = vec!["push", "--porcelain", "--set-upstream"];
    // A tag that leaves without its branch starts a build of a commit the
    // branch does not have
    if tag.is_some() {
        args.push("--atomic");
    }
    // The remote's name comes from .git/config: never read as an option
    args.extend(["--end-of-options", remote, "HEAD"]);
    // Together, because two pushes mean two handshakes with the host
    args.extend(tag);
    let ran = run_transfer_verbatim(git, site, &args).map_err(SyncError::Other)?;
    if !ran.failed {
        return Ok(());
    }
    let why = failure(git, &ran);
    if behind_remote(&ran) {
        return Err(SyncError::ChangedElsewhere(why));
    }
    Err(SyncError::Other(why))
}

/// Whether git refused because the remote has commits this repository has not
///
/// Read from `--porcelain`, which writes one line per ref as
/// `<flag> \t <from>:<to> \t <summary> (<reason>)`. Only the reason tells a
/// remote that moved on from a hook that said no.
fn behind_remote(ran: &Ran) -> bool {
    ran.stdout.lines().any(|line| {
        line.starts_with('!') && (line.contains("non-fast-forward") || line.contains("fetch first"))
    })
}

/// Said when a website has no repository to go to
///
/// One sentence for one situation, and none of the words the user cannot see
/// in Silex. "Remote" least of all.
pub const NOWHERE_TO_SEND_IT: &str =
    "Silex does not know where to send this website. Open it again from the list of websites, or check where it is kept.";
