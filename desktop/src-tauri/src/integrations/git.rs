/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Versioning a website, and sending it somewhere
//!
//! Two different things, done two different ways. Making a version of a website
//! is reading and writing files in its own folder, and the library embedded in
//! Silex does it: it works whether or not the user has git, so a website always
//! has a history. Sending that version to a forge is somebody else's network,
//! somebody else's keys and somebody else's passwords — the git of the user
//! does that, because it already knows all three.
//!
//! Versions the website the way the SaaS server does on GitLab: one commit per
//! save, on one branch, everything in it. A website is a folder of files first.

use std::path::{Path, PathBuf};
use std::time::Duration;

use git2::{IndexAddOption, Repository, RepositoryInitOptions, RepositoryOpenFlags};

use super::run::{failure, run, run_transfer, run_transfer_verbatim, Ran};

/// The branch a website is versioned on
///
/// Not the one the user's git config would pick: publishing pushes to this one.
const BRANCH: &str = "main";

/// Who a website is committed as, when the user never told git who they are
const NOBODY: (&str, &str) = ("Silex", "silex@localhost");

// ---------------------------------------------------------------------------
// Versioning: the website's own folder, with no program to install
// ---------------------------------------------------------------------------

/// Add everything in the website folder to a new version of it
///
/// Nothing is left out but what the website's own `.gitignore` says: the
/// published files live in the website folder too, and the SaaS keeps sources
/// and publication in the same repository.
pub fn version(site: &Path, message: &str) -> Result<(), String> {
    patiently(|| {
        let repo = open_or_start(site)?;
        let mut index = repo.index().map_err(said)?;
        // What `git add -A` does, in the two halves libgit2 keeps apart: what
        // is already followed and may have been changed or deleted, then what
        // is new
        index.update_all(["*"], None).map_err(said)?;
        index.add_all(["*"], IndexAddOption::DEFAULT, None).map_err(said)?;
        index.write().map_err(said)?;

        let tree_id = index.write_tree().map_err(said)?;
        let last = repo.head().ok().and_then(|head| head.peel_to_commit().ok());

        // Saving a website that did not change is not a failure, it just has
        // nothing to version
        if last.as_ref().is_some_and(|last| last.tree_id() == tree_id) {
            return Ok(());
        }

        let tree = repo.find_tree(tree_id).map_err(said)?;
        let who = whoever(&repo)?;
        let parents: Vec<&git2::Commit> = last.iter().collect();
        repo.commit(Some("HEAD"), &who, &who, message, &tree, &parents)
            .map_err(said)?;
        Ok(())
    })
}

/// Name this version, so that a forge knows a publication when it sees one
pub fn tag(site: &Path, tag: &str) -> Result<(), String> {
    patiently(|| {
        let repo = open(site)?;
        let head = repo.head().and_then(|head| head.peel(git2::ObjectType::Commit)).map_err(said)?;
        repo.tag_lightweight(tag, &head, false).map_err(said)?;
        Ok(())
    })
}

/// Take back a name given to a version nobody else ever saw
pub fn untag(site: &Path, tag: &str) {
    if let Ok(repo) = open(site) {
        let _ = repo.tag_delete(tag);
    }
}

/// The remote this website is published to: `origin` when there is one, the
/// first the user configured otherwise
///
/// A repository somebody set up by hand does not always call it `origin`, and
/// reading that name alone made those websites publish nothing at all, without
/// a word.
pub fn remote_name(site: &Path) -> Option<String> {
    let repo = open(site).ok()?;
    let remotes = repo.remotes().ok()?;
    let named: Vec<&str> = remotes.iter().filter_map(|name| name.ok().flatten()).collect();
    if named.contains(&"origin") {
        return Some("origin".to_string());
    }
    named.first().map(|name| name.to_string())
}

/// The URL of that remote
///
/// The raw configured URL, not resolved through insteadOf rewrites: the forge
/// is told from what the user wrote, pushing still resolves them.
pub fn remote_url(site: &Path) -> Option<String> {
    let repo = open(site).ok()?;
    let remote = repo.find_remote(&remote_name(site)?).ok()?;
    let url = remote.url().ok()?.trim();
    (!url.is_empty()).then(|| url.to_string())
}

/// The branch a publication sends
fn branch_name(site: &Path) -> String {
    fn named(site: &Path) -> Option<String> {
        let repo = open(site).ok()?;
        let head = repo.head().ok()?;
        let name = head.shorthand().ok()?;
        Some(name.to_string())
    }
    named(site).unwrap_or_else(|| BRANCH.to_string())
}

/// The website's repository, without ever climbing out of its folder
///
/// A website folder can sit inside a repository of somebody else's, and
/// searching upwards would then version the wrong thing.
fn open(site: &Path) -> Result<Repository, String> {
    Repository::open_ext(site, RepositoryOpenFlags::NO_SEARCH, std::iter::empty::<&std::ffi::OsStr>())
        .map_err(said)
}

fn open_or_start(site: &Path) -> Result<Repository, String> {
    if let Ok(repo) = open(site) {
        return Ok(repo);
    }

    let mut how = RepositoryInitOptions::new();
    // The default branch name depends on the user's git config, and publishing
    // pushes to this one
    how.initial_head(BRANCH);
    let repo = Repository::init_opts(site, &how).map_err(said)?;

    // Committing needs a name and a mail address, and the user may never have
    // set any. Each is looked at on its own: a user with a name but no address
    // keeps their name. What is made up here is written in this repository, so
    // that their own git works in this folder too; the global config is left
    // alone.
    let mut config = repo.config().map_err(said)?;
    for (setting, made_up) in [("user.name", NOBODY.0), ("user.email", NOBODY.1)] {
        if config.get_string(setting).is_err() {
            config.set_str(setting, made_up).map_err(said)?;
        }
    }
    Ok(repo)
}

/// Who to commit as: the user, when they told git who they are
fn whoever(repo: &Repository) -> Result<git2::Signature<'static>, String> {
    repo.signature()
        .or_else(|_| git2::Signature::now(NOBODY.0, NOBODY.1))
        .map_err(said)
}

fn said(e: git2::Error) -> String {
    e.message().to_string()
}

/// Do it, waiting out another git that holds the repository
///
/// Two of them writing in the same repository at the same time: the second
/// finds a lock file and refuses. Silex takes a lock of its own per website,
/// but a git the user started themselves knows nothing of it, and so does a
/// tool watching the folder. Waiting is what a person would do.
fn patiently<T>(mut work: impl FnMut() -> Result<T, String>) -> Result<T, String> {
    let mut wait = Duration::from_millis(50);
    for _ in 0..4 {
        match work() {
            Err(refused) if holds_the_repository(&refused) => {
                std::thread::sleep(wait);
                wait *= 2;
            }
            answered => return answered,
        }
    }
    work()
}

/// Whether it refused because another git is working in this repository
///
/// It is not only the index: the same collision happens on `HEAD`, on a branch
/// and on the packed refs, and each says so its own way. What must not be
/// caught is a failure that merely says something close.
fn holds_the_repository(refused: &str) -> bool {
    (refused.contains(".lock") || refused.contains("failed to lock"))
        && (refused.contains("File exists")
            || refused.contains("cannot lock ref")
            || refused.contains("failed to lock"))
}

// ---------------------------------------------------------------------------
// Sending: the user's git, because it already knows their keys
// ---------------------------------------------------------------------------

/// The git program found on this machine
pub struct Git {
    program: PathBuf,
}

impl Git {
    /// The git of this machine, looked for when there is something to send
    ///
    /// Not an integration: nothing to turn on, nothing to remember. A machine
    /// with no git still saves and versions websites, only sending needs it.
    pub fn found() -> Option<Self> {
        super::candidates("git").into_iter().next().map(|program| Git { program })
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
                untag(site, tag);
            }
            return Err(e);
        }
        Ok(())
    }

    /// Send the branch, catching up with the remote when it moved on
    ///
    /// The folder is Silex's, the repository is the user's: they can have
    /// pushed from another machine, the forge can have added a README when the
    /// repository was created, a build can have committed something. Git
    /// refuses then, and a user with no terminal has nowhere to go. Catching up
    /// first is what a person would do.
    fn push_branch(&self, site: &Path, remote: &str) -> Result<(), String> {
        let ran = run_transfer_verbatim(&self.program, site, &["push", "--porcelain", remote, "HEAD"])?;
        if !ran.failed {
            return Ok(());
        }
        if !behind_remote(&ran) {
            return Err(failure(&self.program, &ran));
        }

        let branch = branch_name(site);
        self.send(site, &["pull", "--rebase", remote, &branch])
            .map_err(|e| {
                // A rebase left half done would keep the folder unusable, and
                // the user has no terminal to finish it in
                let _ = self.run(site, &["rebase", "--abort"]);
                format!(
                    "Your website could not be published: the repository it is sent to has \
                     changes Silex does not have, and they contradict yours. {}",
                    e
                )
            })?;
        self.send(site, &["push", remote, "HEAD"]).map(|_| ())
    }

    fn run(&self, dir: &Path, args: &[&str]) -> Result<String, String> {
        run(&self.program, dir, args)
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

    fn a_website(name: &str) -> PathBuf {
        let site = std::env::temp_dir().join(format!("silex-git-{}-{}", name, std::process::id()));
        let _ = std::fs::remove_dir_all(&site);
        std::fs::create_dir_all(&site).unwrap();
        site
    }

    #[test]
    fn versions_a_website_without_git_installed() {
        let site = a_website("version");
        std::fs::write(site.join("index.html"), "<h1>one</h1>").unwrap();

        version(&site, "Update website data from Silex").unwrap();
        let repo = open(&site).unwrap();
        let head = repo.head().unwrap().peel_to_commit().unwrap();
        assert_eq!(head.message().unwrap(), "Update website data from Silex");
        assert_eq!(repo.head().unwrap().shorthand().unwrap(), "main", "publishing pushes to main");

        // Saving a website that did not change has nothing to version
        version(&site, "again").unwrap();
        let repo = open(&site).unwrap();
        assert_eq!(repo.head().unwrap().peel_to_commit().unwrap().id(), head.id());

        // What changed, and what was deleted, both make it into the next one
        std::fs::write(site.join("index.html"), "<h1>two</h1>").unwrap();
        std::fs::write(site.join("about.html"), "<h1>about</h1>").unwrap();
        version(&site, "second").unwrap();
        std::fs::remove_file(site.join("about.html")).unwrap();
        version(&site, "third").unwrap();

        let repo = open(&site).unwrap();
        let head = repo.head().unwrap().peel_to_commit().unwrap();
        let tree = head.tree().unwrap();
        assert!(tree.get_name("index.html").is_some());
        assert!(tree.get_name("about.html").is_none(), "a deleted file is deleted in the version too");

        let _ = std::fs::remove_dir_all(&site);
    }

    #[test]
    fn what_the_gitignore_says_is_left_out() {
        let site = a_website("ignore");
        std::fs::write(site.join(".gitignore"), "_site/\n").unwrap();
        std::fs::create_dir_all(site.join("_site")).unwrap();
        std::fs::write(site.join("_site/index.html"), "built").unwrap();
        std::fs::write(site.join("index.html"), "source").unwrap();

        version(&site, "one").unwrap();
        let repo = open(&site).unwrap();
        let head = repo.head().unwrap().peel_to_commit().unwrap();
        let tree = head.tree().unwrap();
        assert!(tree.get_name("index.html").is_some());
        assert!(tree.get_name("_site").is_none(), "the built site is not part of the website");

        let _ = std::fs::remove_dir_all(&site);
    }

    #[test]
    fn names_a_version_and_takes_the_name_back() {
        let site = a_website("tag");
        std::fs::write(site.join("index.html"), "one").unwrap();
        version(&site, "one").unwrap();

        tag(&site, "_silex_1").unwrap();
        assert!(open(&site).unwrap().find_reference("refs/tags/_silex_1").is_ok());
        untag(&site, "_silex_1");
        assert!(open(&site).unwrap().find_reference("refs/tags/_silex_1").is_err());

        let _ = std::fs::remove_dir_all(&site);
    }

    #[test]
    fn a_folder_inside_another_repository_is_versioned_on_its_own() {
        let outer = a_website("outer");
        std::fs::write(outer.join("theirs.txt"), "not ours").unwrap();
        version(&outer, "theirs").unwrap();

        let site = outer.join("a-website");
        std::fs::create_dir_all(&site).unwrap();
        std::fs::write(site.join("index.html"), "ours").unwrap();
        version(&site, "ours").unwrap();

        // Two repositories, not one: searching upwards would have versioned
        // somebody else's folder
        assert!(site.join(".git").exists());
        let repo = open(&site).unwrap();
        let head = repo.head().unwrap().peel_to_commit().unwrap();
        let tree = head.tree().unwrap();
        assert!(tree.get_name("theirs.txt").is_none());

        let _ = std::fs::remove_dir_all(&outer);
    }

    #[test]
    fn waits_out_another_git_but_not_anything_that_looks_like_it() {
        assert!(holds_the_repository("fatal: Unable to create '/site/.git/index.lock': File exists."));
        assert!(holds_the_repository(
            "fatal: cannot lock ref 'HEAD': Unable to create '/site/.git/HEAD.lock': File exists."
        ));
        assert!(holds_the_repository("failed to lock file '/site/.git/index.lock' for writing"));
        // A failure that merely says something close is not one to wait out:
        // retrying would only make the user wait for the same refusal
        assert!(!holds_the_repository("error: could not write config file .git/config: File exists"));
        assert!(!holds_the_repository("fatal: pathspec 'package-lock.json' did not match any files"));
        assert!(!holds_the_repository("fatal: not a git repository"));
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
        // help, and retrying would hide what the forge is refusing
        assert!(!refused("!\tHEAD:refs/heads/main\t[remote rejected] (pre-receive hook declined)"));
        assert!(!refused("*\tHEAD:refs/heads/main\t[new branch]"));
        assert!(!refused(""));
    }
}
