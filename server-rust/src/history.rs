/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The history of a website: one version per save, in the website's own folder
//!
//! Writing a website and keeping a version of it are the same gesture, done in
//! the same place. The library doing it is embedded, so a website has a history
//! whether or not the user has git, and the server still starts no process.
//!
//! Versions a website the way the SaaS server does on GitLab: one commit per
//! save, on one branch, everything in it.

use std::path::Path;
use std::time::Duration;

use git2::{ErrorCode, IndexAddOption, Repository, RepositoryInitOptions, RepositoryOpenFlags};

/// The branch a website is versioned on
///
/// Not the one the user's git config would pick: publishing pushes to this one.
const BRANCH: &str = "main";

/// Who a website is committed as, when the user never told git who they are
const NOBODY: (&str, &str) = ("Silex", "silex@localhost");

/// What versioning a website came to
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Versioned {
    /// A version was created
    Created,
    /// The website had not changed since its last version
    Unchanged,
}

/// Add everything in the website folder to a new version of it
///
/// Nothing is left out but what the website's own `.gitignore` says: the
/// published files live in the website folder too, and the SaaS keeps sources
/// and publication in the same repository.
pub fn version(site: &Path, message: &str) -> Result<Versioned, String> {
    patiently(|| {
        let repo = open_or_start(site)?;
        let mut index = repo.index().map_err(said)?;
        // What `git add -A` does, in the two halves libgit2 keeps apart: what is
        // already followed and may have been changed or deleted, then what is new
        index.update_all(["*"], None).map_err(said)?;
        index.add_all(["*"], IndexAddOption::DEFAULT, None).map_err(said)?;
        index.write().map_err(said)?;

        let tree_id = index.write_tree().map_err(said)?;
        let last = repo.head().ok().and_then(|head| head.peel_to_commit().ok());

        // Saving a website that did not change is not a failure, it just has
        // nothing to version
        if last.as_ref().is_some_and(|last| last.tree_id() == tree_id) {
            return Ok(Versioned::Unchanged);
        }

        let tree = repo.find_tree(tree_id).map_err(said)?;
        let who = whoever(&repo)?;
        let parents: Vec<&git2::Commit> = last.iter().collect();
        repo.commit(Some("HEAD"), &who, &who, message, &tree, &parents)
            .map_err(said)?;
        Ok(Versioned::Created)
    })
}

/// Name this version, so that a build knows a publication when it sees one
pub fn tag(site: &Path, tag: &str) -> Result<(), String> {
    patiently(|| {
        let repo = open(site)?;
        let head = repo
            .head()
            .and_then(|head| head.peel(git2::ObjectType::Commit))
            .map_err(said)?;
        repo.tag_lightweight(tag, &head, false).map_err(said)?;
        Ok(())
    })
}

/// Take the remotes out of a repository, keeping everything else in it
///
/// Reading `.git/config` for them is not enough: `[remote "origin"]` and
/// `[remote.origin]` both name a remote and git honours both, so git is the
/// one asked.
pub fn drop_the_remotes(site: &Path) -> Result<(), String> {
    let Ok(repo) = open(site) else {
        return Ok(());
    };

    let remotes = repo.remotes().map_err(said)?;
    let mut named = Vec::new();
    for remote in remotes.iter() {
        // A remote left behind is the copy publishing over the website it was
        // copied from, so one Silex cannot name stops the copy
        match remote.map_err(said)? {
            Some(name) => named.push(name.to_string()),
            None => return Err("this website has a remote with an unreadable name".to_string()),
        }
    }

    for name in named {
        repo.remote_delete(&name).map_err(said)?;
    }

    Ok(())
}

/// Take back a name given to a version nobody else ever saw
pub fn untag(site: &Path, tag: &str) {
    if let Ok(repo) = open(site) {
        let _ = repo.tag_delete(tag);
    }
}

/// The website's repository, without ever climbing out of its folder
///
/// A website folder can sit inside a repository of somebody else's, and
/// searching upwards would then version the wrong thing.
fn open(site: &Path) -> Result<Repository, Refused> {
    let nowhere = std::iter::empty::<&std::ffi::OsStr>();
    Repository::open_ext(site, RepositoryOpenFlags::NO_SEARCH, nowhere).map_err(said)
}

fn open_or_start(site: &Path) -> Result<Repository, Refused> {
    if let Ok(repo) = open(site) {
        return Ok(repo);
    }

    let mut how = RepositoryInitOptions::new();
    // The default branch name depends on the user's git config, and publishing
    // pushes to this one
    how.initial_head(BRANCH);
    let repo = Repository::init_opts(site, &how).map_err(said)?;

    // Each is looked at on its own: a user with a name but no address keeps
    // their name. What is made up here is written in this repository, so that
    // their own git works in this folder too; the global config is left alone.
    let mut config = repo.config().map_err(said)?;
    for (setting, made_up) in [("user.name", NOBODY.0), ("user.email", NOBODY.1)] {
        if config.get_string(setting).is_err() {
            config.set_str(setting, made_up).map_err(said)?;
        }
    }
    Ok(repo)
}

/// Who to commit as: the user, when they told git who they are
fn whoever(repo: &Repository) -> Result<git2::Signature<'static>, Refused> {
    repo.signature()
        .or_else(|_| git2::Signature::now(NOBODY.0, NOBODY.1))
        .map_err(said)
}

/// Why work on a website's repository did not go through
///
/// git says a repository already held by another git with a code of its own,
/// and only says it in words as an afterthought: the words differ from one
/// lock to the next, the code does not.
#[derive(Debug)]
enum Refused {
    /// Another git is working in this repository
    Locked(String),
    /// Anything else git had to say
    Flatly(String),
}

impl Refused {
    fn holds_the_repository(&self) -> bool {
        matches!(self, Refused::Locked(_))
    }

    fn message(self) -> String {
        match self {
            Refused::Locked(said) | Refused::Flatly(said) => said,
        }
    }
}

impl From<Refused> for String {
    fn from(refused: Refused) -> Self {
        refused.message()
    }
}

fn said(e: git2::Error) -> Refused {
    let words = e.message().to_string();
    match e.code() {
        ErrorCode::Locked => Refused::Locked(words),
        _ => Refused::Flatly(words),
    }
}

/// Do it, waiting out another git that holds the repository
///
/// Two of them writing in the same repository at the same time: the second
/// finds a lock file and refuses. A git the user started themselves knows
/// nothing of the locks Silex takes, and so does a tool watching the folder.
/// Waiting is what a person would do.
fn patiently<T>(mut work: impl FnMut() -> Result<T, Refused>) -> Result<T, String> {
    let mut wait = Duration::from_millis(50);
    for _ in 0..4 {
        match work() {
            Err(refused) if refused.holds_the_repository() => {
                std::thread::sleep(wait);
                wait *= 2;
            }
            answered => return answered.map_err(Refused::message),
        }
    }
    work().map_err(Refused::message)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn a_website(name: &str) -> PathBuf {
        let name = format!("silex-history-{}-{}", name, std::process::id());
        let site = std::env::temp_dir().join(name);
        let _ = std::fs::remove_dir_all(&site);
        std::fs::create_dir_all(&site).unwrap();
        site
    }

    #[test]
    fn a_website_that_did_not_change_makes_no_version() {
        let site = a_website("unchanged");
        std::fs::write(site.join("index.html"), "<h1>one</h1>").unwrap();

        assert_eq!(version(&site, "one").unwrap(), Versioned::Created);
        assert_eq!(version(&site, "again").unwrap(), Versioned::Unchanged);

        std::fs::write(site.join("index.html"), "<h1>two</h1>").unwrap();
        assert_eq!(version(&site, "two").unwrap(), Versioned::Created);

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
        let tree = repo.head().unwrap().peel_to_commit().unwrap().tree().unwrap();
        assert!(tree.get_name("index.html").is_some());
        assert!(tree.get_name("_site").is_none(), "the built site is not part of the website");

        let _ = std::fs::remove_dir_all(&site);
    }

    #[test]
    fn waiting_for_another_git_does_not_read_what_it_said() {
        let tries = std::cell::Cell::new(0);
        let answer = patiently(|| {
            tries.set(tries.get() + 1);
            if tries.get() < 3 {
                Err(Refused::Locked("held, and this says nothing of it".to_string()))
            } else {
                Ok(tries.get())
            }
        });
        assert_eq!(answer.unwrap(), 3, "a held repository is waited out");

        let tries = std::cell::Cell::new(0);
        let refused = patiently(|| {
            tries.set(tries.get() + 1);
            Err::<(), Refused>(Refused::Flatly(
                "index.lock: File exists, cannot lock ref, failed to lock".to_string(),
            ))
        });
        assert!(refused.is_err());
        assert_eq!(tries.get(), 1, "a failure that only sounds like a lock is not waited out");
    }

    #[test]
    fn a_repository_another_git_holds_is_known_by_the_code_git_gives() {
        let site = a_website("held");
        std::fs::write(site.join("index.html"), "<h1>one</h1>").unwrap();
        version(&site, "one").unwrap();

        std::fs::write(site.join(".git/index.lock"), "").unwrap();
        let repo = open(&site).unwrap();
        let mut index = repo.index().unwrap();
        let refused = index.write().unwrap_err();

        assert_eq!(refused.code(), ErrorCode::Locked);
        assert!(said(refused).holds_the_repository());

        let _ = std::fs::remove_dir_all(&site);
    }
}
