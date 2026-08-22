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
//! Sending a website somewhere is somebody else's network, somebody else's keys
//! and somebody else's passwords, and the git of the user already knows all
//! three. How a repository is set up is read through that same program, so that
//! Silex carries no git of its own. Making versions of a website is not done
//! here at all: a history is files in the website folder, and the server keeps
//! it.

use std::path::{Path, PathBuf};

use super::run::{failure, run, run_catch_up, run_transfer, run_transfer_verbatim, Ran};

/// The branch assumed when git cannot say which one HEAD is on
const BRANCH: &str = "main";

/// Ask git about the repository of the website, and nothing over the network
///
/// Only the repository in the website folder is read. A website can sit inside
/// a repository of somebody else's, and git climbs up to that one when the
/// folder has none, which would answer for the wrong repository.
fn asked(site: &Path, args: &[&str]) -> Option<String> {
    if !site.join(".git").exists() {
        return None;
    }
    run(&Git::found()?.program, site, args).ok()
}

/// Every remote of the repository, with the URL it was given
///
/// Read from the config rather than from `git remote get-url`, which resolves
/// insteadOf rewrites: the host of a website is told from what the user wrote,
/// and pushing resolves them anyway.
fn remotes(site: &Path) -> Vec<(String, String)> {
    let Some(configured) = asked(site, &["config", "--local", "--get-regexp", r"^remote\..*\.url$"]) else {
        return Vec::new();
    };

    let mut found: Vec<(String, String)> = Vec::new();
    for line in configured.lines() {
        let Some((setting, url)) = line.split_once(' ') else {
            continue;
        };
        let name = setting.strip_prefix("remote.").and_then(|rest| rest.strip_suffix(".url"));
        let Some(name) = name else {
            continue;
        };
        let url = url.trim();
        // A remote can be given several URLs, and git sends to the first
        if name.is_empty() || url.is_empty() || found.iter().any(|(known, _)| known == name) {
            continue;
        }
        found.push((name.to_string(), url.to_string()));
    }
    found
}

/// The remote a website is published to: `origin` when there is one, the first
/// the user configured otherwise
///
/// A repository somebody set up by hand does not always call it `origin`, and
/// reading that name alone made those websites publish nothing at all, without
/// a word.
fn published_to(site: &Path) -> Option<(String, String)> {
    let remotes = remotes(site);
    remotes
        .iter()
        .find(|(name, _)| name == "origin")
        .or_else(|| remotes.first())
        .cloned()
}

/// The name of that remote
pub fn remote_name(site: &Path) -> Option<String> {
    published_to(site).map(|(name, _)| name)
}

/// Its URL, as the user wrote it
pub fn remote_url(site: &Path) -> Option<String> {
    published_to(site).map(|(_, url)| url)
}

/// The branch catching up pulls from
fn branch_name(site: &Path) -> String {
    asked(site, &["symbolic-ref", "--short", "HEAD"])
        .map(|name| name.trim().to_string())
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| BRANCH.to_string())
}

/// The git program found on this machine
pub struct Git {
    program: PathBuf,
}

impl Git {
    /// The git of this machine, looked for once and kept
    ///
    /// Not an integration: nothing to turn on, nothing to remember. A machine
    /// with no git still saves and versions websites, only sending needs it.
    ///
    /// Every candidate is asked its version rather than the first being taken:
    /// a file being there does not mean it runs, and a broken install first in
    /// the PATH would otherwise hide a working one further down.
    pub fn found() -> Option<Self> {
        static FOUND: std::sync::OnceLock<Option<PathBuf>> = std::sync::OnceLock::new();
        FOUND
            .get_or_init(|| {
                super::programs::candidates("git")
                    .into_iter()
                    .find(|program| run(program, &std::env::temp_dir(), &["--version"]).is_ok())
            })
            .clone()
            .map(|program| Git { program })
    }

    /// Push the branch, and the tag when there is one
    ///
    /// A tag nothing was pushed with is of no use to anybody and would be left
    /// behind at every failed attempt, so it goes with the failure.
    pub fn push(&self, site: &Path, tag: Option<&str>) -> Result<(), String> {
        let remote = remote_name(site).ok_or("This website has no remote to publish to")?;
        let pushed = self.push_branch(site, &remote).and_then(|_| match tag {
            Some(tag) => self.send(site, &["push", &remote, tag]).map(|_| ()),
            None => Ok(()),
        });
        if let Err(e) = pushed {
            if let Some(tag) = tag {
                silex_server::untag(site, tag);
            }
            return Err(e);
        }
        Ok(())
    }

    /// Send the branch, saying so plainly when the remote moved on
    ///
    /// Nothing is merged and nothing is rebased here. Silex does not resolve
    /// conflicts, and a merge it started would leave the folder half done in a
    /// state its user has no terminal to get out of. Catching up is a pull of
    /// its own, on opening the website.
    fn push_branch(&self, site: &Path, remote: &str) -> Result<(), String> {
        let ran = run_transfer_verbatim(&self.program, site, &["push", "--porcelain", remote, "HEAD"])?;
        if !ran.failed {
            return Ok(());
        }
        if !behind_remote(&ran) {
            return Err(failure(&self.program, &ran));
        }
        Err(format!(
            "The repository this website is sent to has versions Silex does not have. {}",
            failure(&self.program, &ran)
        ))
    }

    /// Take in what was pushed from somewhere else, and only that
    ///
    /// Fast-forward only: a website whose versions here and there have both
    /// moved on is one Silex leaves alone, for its user to sort out in the git
    /// client they already have.
    pub fn pull(&self, site: &Path) -> Result<(), String> {
        let Some(remote) = remote_name(site) else {
            return Ok(());
        };
        let branch = branch_name(site);
        run_catch_up(&self.program, site, &["pull", "--ff-only", &remote, &branch]).map(|_| ())
    }

    /// A push carries the whole website the first time, and gets the time
    /// that takes
    fn send(&self, dir: &Path, args: &[&str]) -> Result<String, String> {
        run_transfer(&self.program, dir, args)
    }
}

/// Whether git refused because the remote has commits this repository has not
///
/// Read from `--porcelain`, which writes one line per ref as
/// `<flag> \t <from>:<to> \t <summary> (<reason>)`. `!` is a ref that was
/// refused, and only the reason tells a remote that moved on from a hook that
/// said no — pulling helps with the first, never with the second.
fn behind_remote(ran: &Ran) -> bool {
    ran.stdout
        .lines()
        .any(|line| line.starts_with('!') && (line.contains("non-fast-forward") || line.contains("fetch first")))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A repository written by hand, so that no git has to run to make one
    fn a_website(name: &str, remotes: &str) -> PathBuf {
        let site = std::env::temp_dir().join(format!("silex-git-{}-{}", name, std::process::id()));
        let _ = std::fs::remove_dir_all(&site);
        std::fs::create_dir_all(site.join(".git/objects")).unwrap();
        std::fs::create_dir_all(site.join(".git/refs")).unwrap();
        std::fs::write(site.join(".git/HEAD"), "ref: refs/heads/main\n").unwrap();
        let config = format!("[core]\n\trepositoryformatversion = 0\n{}", remotes);
        std::fs::write(site.join(".git/config"), config).unwrap();
        site
    }

    #[test]
    fn the_remote_is_origin_or_the_first_one_configured() {
        if Git::found().is_none() {
            return;
        }

        let site = a_website(
            "origin",
            "[remote \"backup\"]\n\turl = git@codeberg.org:alex/site.git\n[remote \"origin\"]\n\turl = https://gitlab.com/lexoyo/site.git\n",
        );
        assert_eq!(remote_name(&site).as_deref(), Some("origin"));
        assert_eq!(remote_url(&site).as_deref(), Some("https://gitlab.com/lexoyo/site.git"));
        assert_eq!(branch_name(&site), "main");
        let _ = std::fs::remove_dir_all(&site);

        // A repository set up by hand does not always call it origin, and
        // those websites used to publish nothing at all
        let site = a_website("named", "[remote \"backup\"]\n\turl = git@codeberg.org:alex/site.git\n");
        assert_eq!(remote_name(&site).as_deref(), Some("backup"));
        assert_eq!(remote_url(&site).as_deref(), Some("git@codeberg.org:alex/site.git"));
        let _ = std::fs::remove_dir_all(&site);

        let site = a_website("none", "");
        assert_eq!(remote_name(&site), None);
        let _ = std::fs::remove_dir_all(&site);

        // A website with no repository is a website nothing can be read of
        let site = std::env::temp_dir().join(format!("silex-git-bare-{}", std::process::id()));
        std::fs::create_dir_all(&site).unwrap();
        assert_eq!(remote_url(&site), None);
        assert_eq!(branch_name(&site), BRANCH);
        let _ = std::fs::remove_dir_all(&site);
    }

    #[test]
    fn reads_the_refusal_git_writes_in_porcelain() {
        let refused = |stdout: &str| {
            behind_remote(&Ran { stdout: stdout.to_string(), stderr: String::new(), failed: true })
        };
        assert!(refused(
            "To gitlab.com/x/y.git\n!\trefs/heads/main:refs/heads/main\t[rejected] (non-fast-forward)\nDone"
        ));
        assert!(refused("!\tHEAD:refs/heads/main\t[rejected] (fetch first)"));
        // A hook that said no is not a remote that moved on: pulling would not
        // help, and retrying would hide what the remote is refusing
        assert!(!refused("!\tHEAD:refs/heads/main\t[remote rejected] (pre-receive hook declined)"));
        assert!(!refused("*\tHEAD:refs/heads/main\t[new branch]"));
        assert!(!refused(""));
    }
}
