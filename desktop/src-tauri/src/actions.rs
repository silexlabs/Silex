/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! What the server asks for, done on this machine
//!
//! The server writes files and asks for what it cannot do itself. Which
//! integration answers, and whether any does, is decided here: the server has
//! no idea git exists, and git has no idea whether the user enabled it.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use crate::integrations::git;
use crate::integrations::pipeline::ensure_build_files;
use crate::integrations::remote::without_secret;
use crate::integrations::Integrations;

pub struct SilexActions {
    /// Directory holding one sub directory per website
    data_path: PathBuf,
    integrations: Integrations,
    /// One lock per website, so that its folder has one git at a time
    ///
    /// Saving versions the website and publishing versions it too, and a save
    /// landing in the middle of a publication would find the index locked.
    /// Waiting for the other one is what a user expects; an error is not.
    busy: Mutex<HashMap<PathBuf, Arc<Mutex<()>>>>,
}

impl SilexActions {
    pub fn new(data_path: PathBuf, integrations: Integrations) -> Self {
        SilexActions {
            data_path,
            integrations,
            busy: Mutex::new(HashMap::new()),
        }
    }

    /// The lock of one website, made the first time that website is worked on
    fn busy(&self, site: &Path) -> Arc<Mutex<()>> {
        let mut busy = self.busy.lock().unwrap_or_else(|held| held.into_inner());
        busy.entry(site.to_path_buf()).or_default().clone()
    }

    /// The folder of a website, refusing anything that leads out of the data
    /// path
    ///
    /// A website id comes from a request, and `Path::join` on an absolute path
    /// forgets the folder it was joined to: without this, an id could name any
    /// repository on the machine and have git run in it.
    fn site_path(&self, website_id: &str) -> Option<PathBuf> {
        let site = self.data_path.join(website_id);
        let data_path = self.data_path.canonicalize().ok()?;
        let canonical = site.canonicalize().ok()?;
        canonical.starts_with(&data_path).then_some(canonical)
    }
}

impl silex_server::Actions for SilexActions {
    fn version(&self, website_id: &str, message: &str) -> Result<(), String> {
        let Some(site) = self.site_path(website_id) else {
            return Err(format!("Unknown website '{}'", website_id));
        };
        let busy = self.busy(&site);
        let _working_on_it = busy.lock().unwrap_or_else(|held| held.into_inner());
        git::version(&site, message)
    }

    /// Publish the website: whichever integration answers for it prepares the
    /// build and sends it, or git alone sends it as it is
    fn deploy(&self, website_id: &str) -> Option<silex_server::Deployed> {
        let Some(site) = self.site_path(website_id) else {
            tracing::warn!("Asked to publish a website that is not there: {}", website_id);
            return None;
        };
        // A website with nowhere to send it is a local one, which is a way of
        // working rather than something missing
        let remote_url = git::remote_url(&site)?;
        let busy = self.busy(&site);
        let _working_on_it = busy.lock().unwrap_or_else(|held| held.into_inner());

        let remote = without_secret(&remote_url).to_string();
        let result = (|| -> Result<silex_server::Deployed, String> {
            let remote = &remote;
            let git = git::Git::found().ok_or(
                "Silex could not find git on this computer, and it is git that sends a website to \
                 its forge.",
            )?;
            let Some((provider, cli, urls)) = self.integrations.resolve_deploy(&site)?.into_parts()
            else {
                ensure_build_files(&site)?;
                git::version(&site, "Publish website")?;
                git.push(&site, None)?;
                return Ok(silex_server::Deployed {
                    published: false,
                    message: Some(format!(
                        "Your website is saved and sent to {}. Silex does not know how to publish \
                         it there, so putting it online is up to you.",
                        remote
                    )),
                    ..Default::default()
                });
            };

            let prepared = provider.deploy(&cli, &site)?;
            provider.sync(&cli, &site, &git, &prepared)?;

            let program = provider.program();
            let message = match &urls {
                // Not signed in: the forge still builds what was pushed, Silex
                // just has no way to say where it lands
                None => format!(
                    "Sent to {remote} with {program}, the build is running. Sign in to {program} \
                     to see the build and the address of your website."
                ),
                // A forge only has an address for a website it published once,
                // so the first publication has none to give and says so
                Some(urls) if urls.site.is_none() => format!(
                    "Sent to {remote} with {program}, the build is running. Its address will be \
                     known once the build has published your website."
                ),
                Some(_) => format!("Sent to {remote} with {program}, the build is running"),
            };
            let urls = urls.unwrap_or_default();
            let ci_url = provider.watch(&urls, &prepared);
            Ok(silex_server::Deployed {
                published: true,
                url: urls.site,
                ci_url,
                settings_url: urls.settings,
                message: Some(message),
                ..Default::default()
            })
        })();

        match result {
            Ok(value) => Some(value),
            Err(message) => {
                tracing::warn!("Could not publish website {}: {}", website_id, message);
                let (told, said) = explain(&message, &remote);
                Some(silex_server::Deployed {
                    error: true,
                    message: Some(told),
                    details: said,
                    ..Default::default()
                })
            }
        }
    }
}

/// Say what went wrong in a sentence, keeping the words of the program apart
///
/// Publishing fails most often for one of two reasons, and both are things the
/// user can do something about. What git writes about them is four lines of its
/// own workings, which is not what somebody who never opened a terminal needs to
/// read first.
fn explain(failure: &str, remote: &str) -> (String, Option<String>) {
    let refused_us = [
        "Could not read from remote repository",
        "Permission denied",
        "Authentication failed",
        "authentication failures",
        "could not read Username",
        "403 Forbidden",
        "401 Unauthorized",
    ];
    let out_of_reach = [
        "Could not resolve host",
        "Connection timed out",
        "Connection refused",
        "Network is unreachable",
    ];

    let said = |sentence: String| (sentence, Some(failure.to_string()));

    if out_of_reach.iter().any(|shape| failure.contains(shape)) {
        return said(format!(
            "Silex could not reach {}. Check that you are online, and that the forge is up.",
            remote
        ));
    }
    if refused_us.iter().any(|shape| failure.contains(shape)) {
        return said(format!(
            "{} refused the connection. This computer needs to be allowed to write to that \
             repository: an SSH key the forge knows about, or a token that has not expired.",
            remote
        ));
    }
    (failure.to_string(), None)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tells_the_user_what_to_do_and_keeps_what_git_said() {
        // What a forge really answers when no key of this machine is known to
        // it, which is the failure a new user meets first
        let refused = "git failed: Received disconnect from 46.23.81.155 port 22:2: Too many \
                       authentication failures\r\nDisconnected from 46.23.81.155 port 22\r\nfatal: \
                       Could not read from remote repository.";
        let (told, said) = explain(refused, "git.sr.ht:~alex/site");
        assert!(told.starts_with("git.sr.ht:~alex/site refused the connection"), "{}", told);
        assert!(!told.contains("fatal:"), "the workings of git are not the first thing to read");
        assert_eq!(said.as_deref(), Some(refused), "and they are still there for whoever wants them");

        let unreachable = "git failed: fatal: unable to access: Could not resolve host: codeberg.org";
        let (told, _) = explain(unreachable, "codeberg.org/alex/site");
        assert!(told.contains("could not reach"), "{}", told);

        // Anything else is passed on as it came rather than guessed at
        let odd = "git failed: something nobody thought of";
        assert_eq!(explain(odd, "x"), (odd.to_string(), None));
    }
}




