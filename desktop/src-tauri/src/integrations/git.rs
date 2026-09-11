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
//! and the git of the user already knows all three. Silex carries no git of its
//! own. Making versions of a website is the server's, not this.

use std::path::{Path, PathBuf};

use super::run::{failure, run, run_sync_pull, run_transfer_verbatim, Ran};

/// The branch assumed when git cannot say which one HEAD is on
const BRANCH: &str = "main";

/// Ask git about the repository of the website, and nothing over the network
///
/// Only the repository in the website folder: git climbs up to an enclosing
/// one when the folder has none, and would answer for the wrong repository.
fn asked(site: &Path, args: &[&str]) -> Option<String> {
    if !site.join(".git").exists() {
        return None;
    }
    run(&Git::found()?.program, site, args).ok()
}

/// Every remote of the repository, with the URL it was given
///
/// Read from the config rather than from `git remote get-url`, which resolves
/// insteadOf rewrites: the host is told from what the user wrote.
fn remotes(site: &Path) -> Vec<(String, String)> {
    // -z: one entry per NUL, name and value parted by a newline, so that a URL
    // holding a space or a newline is read whole
    let Some(configured) = asked(
        site,
        &[
            "config",
            "--local",
            "-z",
            "--get-regexp",
            r"^remote\..*\.url$",
        ],
    ) else {
        return Vec::new();
    };

    let mut found: Vec<(String, String)> = Vec::new();
    for entry in configured.split('\0') {
        let Some((setting, url)) = entry.split_once('\n') else {
            continue;
        };
        let name = setting
            .strip_prefix("remote.")
            .and_then(|rest| rest.strip_suffix(".url"));
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
/// A repository set up by hand does not always call it `origin`, and reading
/// that name alone leaves those websites publishing nothing at all.
fn published_to(site: &Path) -> Option<(String, String)> {
    let remotes = remotes(site);
    remotes
        .iter()
        .find(|(name, _)| name == "origin")
        .or_else(|| remotes.first())
        .cloned()
}

pub fn remote_name(site: &Path) -> Option<String> {
    published_to(site).map(|(name, _)| name)
}

/// As the user wrote it
pub fn remote_url(site: &Path) -> Option<String> {
    published_to(site).map(|(_, url)| url)
}

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
    /// Not an integration: nothing to turn on, nothing to remember. Asked its
    /// version rather than taken on sight, because a file being there does not
    /// mean it runs.
    pub fn found() -> Option<Self> {
        static FOUND: std::sync::OnceLock<Option<PathBuf>> = std::sync::OnceLock::new();
        FOUND
            .get_or_init(|| {
                super::programs::found("git")
                    .filter(|program| run(program, &std::env::temp_dir(), &["--version"]).is_ok())
            })
            .clone()
            .map(|program| Git { program })
    }

    /// Push the branch, and the tag when there is one
    ///
    /// A tag nothing was pushed with would be left behind at every failed
    /// attempt, so it goes with the failure.
    pub fn push(&self, site: &Path, tag: Option<&str>) -> Result<(), String> {
        let remote = remote_name(site).ok_or(NOWHERE_TO_SEND_IT)?;
        let pushed = self.push_branch(site, &remote, tag);
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
    /// Nothing is merged or rebased here: a merge Silex started would leave
    /// the folder in a state its user has no terminal to get out of.
    fn push_branch(&self, site: &Path, remote: &str, tag: Option<&str>) -> Result<(), String> {
        // Together, because two pushes mean two handshakes with the host
        let mut sending = vec!["push", "--porcelain", remote, "HEAD"];
        sending.extend(tag);
        let ran = run_transfer_verbatim(&self.program, site, &sending)?;
        if !ran.failed {
            return Ok(());
        }
        if !behind_remote(&ran) {
            return Err(failure(&self.program, &ran));
        }
        Err(format!(
            "This website was changed somewhere else, and those changes are not on this computer. Open it again from the list of websites to take them in, then publish again. {}",
            failure(&self.program, &ran)
        ))
    }

    /// Take in what was pushed from somewhere else, and only that
    ///
    /// Fast-forward only: a website that moved on both here and there is left
    /// to its user and the git client they already have.
    pub fn pull(&self, site: &Path) -> Result<(), String> {
        let Some(remote) = remote_name(site) else {
            return Ok(());
        };
        let branch = branch_name(site);
        // Fetched then merged rather than pulled: only the fetch reaches a
        // network, and `pull` reads settings of the user that are not Silex's
        // business to inherit.
        run_sync_pull(&self.program, site, &["fetch", &remote, &branch])?;
        run(&self.program, site, &["merge", "--ff-only", "FETCH_HEAD"]).map(|_| ())
    }
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

/// Whether a send that broke down could work later, read from what git said
///
/// Anything unrecognised counts as permanent: trying a wrong password again
/// fails the same way, quietly, and the user never learns what is in the way.
/// A network coming back is the one case worth waiting for.
pub fn worth_another_try(why: &str) -> bool {
    const BREAKS: [&str; 20] = [
        "could not resolve host",
        "temporary failure in name resolution",
        "name or service not known",
        "connection timed out",
        "operation timed out",
        "timed out after",
        "connection refused",
        "connection reset",
        "network is unreachable",
        "no route to host",
        "failed to connect to",
        "couldn't connect to server",
        "the remote end hung up",
        "early eof",
        "broken pipe",
        "http 5",
        "returned error: 5",
        "gateway time-out",
        // Silex's own words, when it stopped waiting for git: a slow network
        // rather than a closed one
        "took more than",
        // The git of the user, running in their own terminal on the same
        // folder, held a lock file. index.lock, HEAD.lock and the rest all end
        // the same way.
        ".lock': file exists",
    ];
    let why = why.to_lowercase();
    BREAKS.iter().any(|break_down| why.contains(break_down))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tells_what_can_work_later_from_what_never_will() {
        for later in [
            "fatal: unable to access 'https://gitlab.com/a/b.git/': Could not resolve host: gitlab.com",
            "ssh: connect to host codeberg.org port 22: Connection timed out",
            "ssh: connect to host git.sr.ht port 22: Network is unreachable",
            "fatal: unable to access 'https://x/y.git/': Failed to connect to x port 443 after 130276 ms: Couldn't connect to server",
            "fatal: unable to access 'https://x/y.git/': Operation timed out after 300000 milliseconds with 0 out of 0 bytes received",
            "error: RPC failed; HTTP 502 curl 22 The requested URL returned error: 502",
            "fatal: unable to access 'https://x/y.git/': The requested URL returned error: 503",
            "fatal: the remote end hung up unexpectedly",
            "error: RPC failed; curl 56 Recv failure: Connection reset by peer",
            "fatal: early EOF",
            "send-pack: unexpected disconnect while reading sideband packet: Broken pipe",
            "ssh: connect to host codeberg.org port 22: Connection refused",
            "fatal: unable to access 'https://x/y.git/': Could not resolve host: x, Temporary failure in name resolution",
        ] {
            assert!(worth_another_try(later), "given up on: {}", later);
        }

        for never in [
            "fatal: Authentication failed for 'https://gitlab.com/a/b.git/'",
            "remote: HTTP Basic: Access denied. The provided password or token is incorrect",
            "git@github.com: Permission denied (publickey).",
            "remote: Repository not found.",
            "fatal: repository 'https://github.com/a/b.git/' not found",
            "ERROR: The project you were looking for could not be found or you don't have permission to view it.",
            "The repository this website is sent to has versions Silex does not have. git failed: ! refs/heads/main:refs/heads/main [rejected] (fetch first)",
            "! HEAD:refs/heads/main [remote rejected] (pre-receive hook declined)",
            "fatal: could not read Username for 'https://github.com': terminal prompts disabled",
            NOWHERE_TO_SEND_IT,
        ] {
            assert!(!worth_another_try(never), "kept trying: {}", never);
        }
    }

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
    fn a_remote_url_written_across_two_lines_is_read_whole() {
        if Git::found().is_none() {
            return;
        }

        let site = a_website(
            "across",
            "[remote \"origin\"]\n\turl = \"https://example.org/a\\nb.git\"\n",
        );
        assert_eq!(
            remote_url(&site).as_deref(),
            Some("https://example.org/a\nb.git")
        );
        let _ = std::fs::remove_dir_all(&site);
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
        assert_eq!(
            remote_url(&site).as_deref(),
            Some("https://gitlab.com/lexoyo/site.git")
        );
        assert_eq!(branch_name(&site), "main");
        let _ = std::fs::remove_dir_all(&site);

        // A repository set up by hand does not always call it origin
        let site = a_website(
            "named",
            "[remote \"backup\"]\n\turl = git@codeberg.org:alex/site.git\n",
        );
        assert_eq!(remote_name(&site).as_deref(), Some("backup"));
        assert_eq!(
            remote_url(&site).as_deref(),
            Some("git@codeberg.org:alex/site.git")
        );
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
            behind_remote(&Ran {
                stdout: stdout.to_string(),
                stderr: String::new(),
                failed: true,
            })
        };
        assert!(refused(
            "To gitlab.com/x/y.git\n!\trefs/heads/main:refs/heads/main\t[rejected] (non-fast-forward)\nDone"
        ));
        assert!(refused("!\tHEAD:refs/heads/main\t[rejected] (fetch first)"));
        // A hook that said no is not a remote that moved on
        assert!(!refused(
            "!\tHEAD:refs/heads/main\t[remote rejected] (pre-receive hook declined)"
        ));
        assert!(!refused("*\tHEAD:refs/heads/main\t[new branch]"));
        assert!(!refused(""));
    }
}
