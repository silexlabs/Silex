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
//! The library doing it is embedded, so a website has a history whether or not
//! the user has git, and the server still starts no process. One commit per
//! save on one branch, the way the SaaS server does on GitLab.

use std::path::Path;
use std::time::Duration;

use git2::{ErrorCode, IndexAddOption, Repository, RepositoryInitOptions, RepositoryOpenFlags};

/// The branch a website is versioned on
///
/// Not the one the user's git config would pick: publishing pushes to this one.
const BRANCH: &str = "main";

/// Committed as, when the user never told git who they are
const NOBODY: (&str, &str) = ("Silex", "silex@localhost");

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Versioned {
    /// A version was created
    Created,
    /// The website had not changed since its last version
    Unchanged,
}

/// Add everything in the website folder to a new version of it
///
/// Nothing is left out but what its own `.gitignore` says: the SaaS keeps
/// sources and publication in the same repository.
pub fn version(site: &Path, message: &str) -> Result<Versioned, String> {
    patiently(|| {
        let repo = open_or_start(site)?;
        let mut index = repo.index()?;
        // What `git add -A` does, in the two halves libgit2 keeps apart
        index.update_all(["*"], None)?;
        index.add_all(["*"], IndexAddOption::DEFAULT, None)?;
        index.write()?;

        let tree_id = index.write_tree()?;
        let last = repo.head().ok().and_then(|head| head.peel_to_commit().ok());

        // Saving a website that did not change is not a failure
        if last.as_ref().is_some_and(|last| last.tree_id() == tree_id) {
            return Ok(Versioned::Unchanged);
        }

        let tree = repo.find_tree(tree_id)?;
        let who = whoever(&repo)?;
        let parents: Vec<&git2::Commit> = last.iter().collect();
        repo.commit(Some("HEAD"), &who, &who, message, &tree, &parents)?;
        Ok(Versioned::Created)
    })
}

/// Name this version, so that a build knows a publication when it sees one
pub fn tag(site: &Path, tag: &str) -> Result<(), String> {
    patiently(|| {
        let repo = open(site)?;
        let head = repo
            .head()
            .and_then(|head| head.peel(git2::ObjectType::Commit))?;
        repo.tag_lightweight(tag, &head, false)?;
        Ok(())
    })
}

/// Take the remotes out of a repository, keeping everything else in it
///
/// git is asked rather than `.git/config` read: `[remote "origin"]` and
/// `[remote.origin]` both name a remote and git honours both.
pub fn drop_the_remotes(site: &Path) -> Result<(), String> {
    let Ok(repo) = open(site) else {
        return Ok(());
    };

    let remotes = repo.remotes().map_err(words_of)?;
    let mut named = Vec::new();
    for remote in remotes.iter() {
        // A remote left behind is the copy publishing over the website it was
        // copied from
        match remote.map_err(words_of)? {
            Some(name) => named.push(name.to_string()),
            None => return Err("this website has a remote with an unreadable name".to_string()),
        }
    }

    for name in named {
        repo.remote_delete(&name).map_err(words_of)?;
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
/// Searching upwards would version the repository the folder sits in.
fn open(site: &Path) -> Result<Repository, git2::Error> {
    let nowhere = std::iter::empty::<&std::ffi::OsStr>();
    Repository::open_ext(site, RepositoryOpenFlags::NO_SEARCH, nowhere)
}

fn open_or_start(site: &Path) -> Result<Repository, git2::Error> {
    if let Ok(repo) = open(site) {
        return Ok(repo);
    }

    let mut how = RepositoryInitOptions::new();
    // The default branch name depends on the user's git config, and publishing
    // pushes to this one
    how.initial_head(BRANCH);
    let repo = Repository::init_opts(site, &how)?;

    // Each on its own, so that a user with a name but no address keeps their
    // name. Written in this repository, never in the global config.
    let mut config = repo.config()?;
    for (setting, made_up) in [("user.name", NOBODY.0), ("user.email", NOBODY.1)] {
        if config.get_string(setting).is_err() {
            config.set_str(setting, made_up)?;
        }
    }
    Ok(repo)
}

/// Who to commit as: the user, when they told git who they are
fn whoever(repo: &Repository) -> Result<git2::Signature<'static>, git2::Error> {
    repo.signature()
        .or_else(|_| git2::Signature::now(NOBODY.0, NOBODY.1))
}

/// Do it, waiting out another git that holds the repository
///
/// A git the user started themselves knows nothing of the locks Silex takes,
/// and neither does a tool watching the folder. git answers a code of its own
/// for a held repository; its words differ from one lock to the next, the code
/// does not.
fn patiently<T>(mut work: impl FnMut() -> Result<T, git2::Error>) -> Result<T, String> {
    let mut wait = Duration::from_millis(50);
    for _ in 0..4 {
        match work() {
            Err(e) if e.code() == ErrorCode::Locked => {
                std::thread::sleep(wait);
                wait *= 2;
            }
            answered => return answered.map_err(words_of),
        }
    }
    work().map_err(words_of)
}

/// What git said, without the code it said it with
fn words_of(e: git2::Error) -> String {
    e.message().to_string()
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
        let tree = repo
            .head()
            .unwrap()
            .peel_to_commit()
            .unwrap()
            .tree()
            .unwrap();
        assert!(tree.get_name("index.html").is_some());
        assert!(
            tree.get_name("_site").is_none(),
            "the built site is not part of the website"
        );

        let _ = std::fs::remove_dir_all(&site);
    }

    #[test]
    fn waiting_for_another_git_does_not_read_what_it_said() {
        let tries = std::cell::Cell::new(0);
        let answer = patiently(|| {
            tries.set(tries.get() + 1);
            if tries.get() < 3 {
                Err(git2::Error::new(
                    ErrorCode::Locked,
                    git2::ErrorClass::Index,
                    "held, and this says nothing of it",
                ))
            } else {
                Ok(tries.get())
            }
        });
        assert_eq!(answer.unwrap(), 3, "a held repository is waited out");

        let tries = std::cell::Cell::new(0);
        let refused = patiently(|| {
            tries.set(tries.get() + 1);
            Err::<(), git2::Error>(git2::Error::new(
                ErrorCode::NotFound,
                git2::ErrorClass::Index,
                "index.lock: File exists, cannot lock ref, failed to lock",
            ))
        });
        assert!(refused.is_err());
        assert_eq!(
            tries.get(),
            1,
            "a failure that only sounds like a lock is not waited out"
        );
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

        let _ = std::fs::remove_dir_all(&site);
    }
}
