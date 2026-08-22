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
use std::time::{Duration, Instant};

use silex_server::{Hosting, Job, PublicationOptions};

use crate::integrations::deploy::{Build, Deploy, Prepared};
use crate::integrations::git;
use crate::integrations::remote::{without_secret, Remote};
use crate::integrations::Integrations;
use silex_server::message::{self, Button, FILES_ON_THIS_COMPUTER};

/// How long Silex waits on a host, and how often it asks
///
/// A value rather than four constants in the loop, so that a test can follow a
/// whole publication without waiting the minute a real one takes.
#[derive(Clone, Copy)]
struct Patience {
    /// How often the host is asked about a build that has not appeared yet
    looking_for_the_build: Duration,

    /// How long the host has to start a build before Silex says it never did
    ///
    /// A host that takes the push queues its build within seconds. Waiting
    /// longer only leaves the user in front of a progress bar for a website
    /// that was never going to come online.
    a_build_starts_within: Duration,

    /// How often the host is asked about a build that is running
    while_it_builds: Duration,

    /// How long Silex follows a build before it stops watching
    ///
    /// Building a website is a minute of work. Past this, something is wrong in
    /// a way Silex cannot name, and saying so beats watching forever.
    a_build_ends_within: Duration,
}

impl Default for Patience {
    fn default() -> Self {
        Patience {
            looking_for_the_build: Duration::from_secs(5),
            a_build_starts_within: Duration::from_secs(60),
            while_it_builds: Duration::from_secs(10),
            a_build_ends_within: Duration::from_secs(15 * 60),
        }
    }
}

/// How long the answer about what serves a website is reused
///
/// Answering starts the command line of an integration and reaches the network, and
/// the editor asks when it loads a website and again every time the publication
/// dialog opens. Long enough that one burst of questions costs one answer,
/// short enough that a user who just signed in sees it.
const WHAT_HOSTS_IT_KEPT: Duration = Duration::from_secs(10);

/// How long a website waits, after a save, before it is sent
///
/// Every save pushes the moment further: what is waited for is the author
/// stopping.
const SENT_AFTER: Duration = Duration::from_secs(5);

/// The website the editor has open, shared with the Tauri state
///
/// Written by `set_current_project`, read here: the editor asks for its hosting
/// connector without naming a website, so the only way to answer about the
/// right one is to know which one is open.
pub type CurrentWebsiteId = Arc<Mutex<Option<String>>>;

pub struct SilexActions {
    /// Directory holding one sub directory per website
    data_path: PathBuf,
    integrations: Arc<Integrations>,
    current_website_id: CurrentWebsiteId,
    syncer: Arc<Syncer>,
    /// What was last answered about who serves a website, and when
    ///
    /// Held across the asking on purpose: two questions arriving together cost
    /// one answer, the second waiting for the first instead of starting a
    /// second command line of its own.
    what_hosts_it: Mutex<Option<(String, Instant, Option<Hosting>)>>,
}

impl SilexActions {
    pub fn new(
        data_path: PathBuf,
        integrations: Integrations,
        current_website_id: CurrentWebsiteId,
    ) -> Self {
        let integrations = Arc::new(integrations);
        SilexActions {
            syncer: Arc::new(Syncer {
                syncs: {
                    let data_path = data_path.clone();
                    let integrations = integrations.clone();
                    Box::new(move |website_id| {
                        let site = site_path(&data_path, website_id)
                            .ok_or_else(|| format!("Unknown website '{}'", website_id))?;
                        integrations.sync(&site, None)
                    })
                },
                sent_after: SENT_AFTER,
                waiting: Mutex::new(HashMap::new()),
            }),
            data_path,
            integrations,
            current_website_id,
            what_hosts_it: Mutex::new(None),
        }
    }

    fn site_path(&self, website_id: &str) -> Option<PathBuf> {
        site_path(&self.data_path, website_id)
    }
}

/// The folder of a website, refusing anything that leads out of the data path
///
/// A website id comes from a request, and `Path::join` on an absolute path
/// forgets the folder it was joined to: without this, an id could name any
/// repository on the machine and have git run in it.
fn site_path(data_path: &Path, website_id: &str) -> Option<PathBuf> {
    let site = data_path.join(website_id);
    let data_path = data_path.canonicalize().ok()?;
    let canonical = site.canonicalize().ok()?;
    canonical.starts_with(&data_path).then_some(canonical)
}

/// Sends websites to their host, once their author has stopped saving them
struct Syncer {
    syncs: Box<dyn Fn(&str) -> Result<(), String> + Send + Sync>,
    sent_after: Duration,
    /// The websites a save asked to send, and the moment their wait is over
    ///
    /// An entry lives for as long as the thread looking after it, which keeps
    /// that to one thread per website.
    waiting: Mutex<HashMap<String, Instant>>,
}

impl Syncer {
    fn sync(self: &Arc<Self>, website_id: &str) {
        let leaves_at = Instant::now() + self.sent_after;
        let looked_after = {
            let mut waiting = self.waiting.lock().unwrap_or_else(|held| held.into_inner());
            waiting.insert(website_id.to_string(), leaves_at).is_some()
        };
        if looked_after {
            return;
        }

        let syncer = self.clone();
        let website_id = website_id.to_string();
        std::thread::spawn(move || {
            syncer.wait_and_send(&website_id);
        });
    }

    /// Wait out the saves, send, and start over if more came in meanwhile
    fn wait_and_send(&self, website_id: &str) {
        loop {
            let Some(leaves_at) = self.leaves_at(website_id) else {
                return;
            };
            if let Some(left) = leaves_at.checked_duration_since(Instant::now()) {
                std::thread::sleep(left);
                continue;
            }

            if let Err(e) = (self.syncs)(website_id) {
                tracing::warn!("Could not send website {}: {}", website_id, e);
            }

            // A save that landed while it was being sent is one this push did
            // not carry, so the wait starts over
            let mut waiting = self.waiting.lock().unwrap_or_else(|held| held.into_inner());
            if waiting.get(website_id) == Some(&leaves_at) {
                waiting.remove(website_id);
                return;
            }
        }
    }

    fn leaves_at(&self, website_id: &str) -> Option<Instant> {
        self.waiting
            .lock()
            .unwrap_or_else(|held| held.into_inner())
            .get(website_id)
            .copied()
    }

}


/// A website that left for its host, and what to ask about its build
struct Sent {
    provider: &'static dyn Deploy,
    cli: PathBuf,
    /// Where the website is kept, as the user knows it: the host of its remote
    host: String,
    prepared: Prepared,
    /// Where the website is served, when the host or the user named it
    site_url: Option<String>,
    /// Where the user sets an address of their own
    settings_url: Option<String>,
    /// Where the build of this publication can be watched
    build_url: Option<String>,
    /// Whether the user is signed in to that host, which is what lets Silex
    /// ask it anything at all
    signed_in: bool,
}

impl silex_server::Actions for SilexActions {
    /// A website that could not be caught up with is opened as it is: the user
    /// is waiting to work, and what is on this computer is a website
    fn catch_up(&self, website_id: &str) {
        let Some(site) = self.site_path(website_id) else {
            return;
        };
        if let Err(e) = self.integrations.catch_up(&site) {
            tracing::warn!("Could not catch up with website {}: {}", website_id, e);
        }
    }

    /// Nothing of it goes online: putting a website online is `deploy`
    fn sync(&self, website_id: &str) {
        self.syncer.sync(website_id);
    }

    /// Publish the website: whichever integration answers for it prepares the
    /// build and sends it
    ///
    /// Sending is not publishing. The host takes what was pushed and builds it,
    /// and until it says that build worked nobody knows whether the website is
    /// online: a repository with its builds turned off takes every push and
    /// serves nothing. So the job stays open until the host has answered.
    fn deploy(
        &self,
        website_id: &str,
        options: &silex_server::PublicationOptions,
        job: &Job,
    ) {
        let Some(site) = self.site_path(website_id) else {
            tracing::warn!("Asked to publish a website that is not there: {}", website_id);
            job.failed(message::told(
                "Silex could not find the folder of this website.",
                &[],
            ));
            return;
        };

        job.step("Your website is written on this computer");

        // The files the editor generated are on the disk already, so there is
        // something to open while the rest happens
        let files = silex_server::published_files_url(&self.data_path, website_id);
        let on_this_computer = || Button::secondary(FILES_ON_THIS_COMPUTER, &files);

        // A website with nowhere to send it is a local one, which is a way of
        // working rather than something missing. The server says so itself,
        // once, for whoever publishes without one.
        let Some(remote_url) = git::remote_url(&site) else {
            return;
        };

        let remote = without_secret(&remote_url).to_string();
        // One instance is not another, and a GitLab of one's own is not
        // gitlab.com: the user is told the host they push to, never the name of
        // the software it runs
        let host = Remote::host_of(&remote_url).unwrap_or_else(|| remote.clone());
        let sent = self
            .integrations
            .publish(&site, &host, options, &|step| job.step(step))
            .map(|published| {
                let signed_in = published.urls.is_some();
                let urls = published.urls.unwrap_or_default();
                Sent {
                    build_url: published.provider.watch(&urls, &published.prepared),
                    site_url: urls.site,
                    settings_url: urls.settings,
                    provider: published.provider,
                    cli: published.cli,
                    host: host.clone(),
                    prepared: published.prepared,
                    signed_in,
                }
            });

        match sent {
            Err(failure) => {
                tracing::warn!("Could not publish website {}: {}", website_id, failure);
                // What the program answered, and nothing read into it. Silex
                // knows the publication failed; why it failed is written in
                // words it did not choose, in a form that changes with the
                // version of git, the host and the language of the machine.
                // Reading a cause out of them means being wrong one day, and
                // being wrong here sends somebody looking in the wrong place.
                job.detail(failure.clone());
                job.failed(message::explained(
                    &format!("Silex could not send your website to {}.", remote),
                    &failure,
                    &[on_this_computer()],
                ));
            }
            // The website is taken but nobody is signed in, so there is no way
            // to ask what its build did
            Ok(sent) if !sent.signed_in => {
                let program = sent.provider.program();
                job.succeeded(message::explained(
                    &format!("Your website is sent to {}.", remote),
                    &format!(
                        "Sign in to {} to see the build and the address of your website.",
                        program
                    ),
                    &[on_this_computer()],
                ))
            }
            Ok(sent) => watch(job, &site, &sent, &files, Patience::default()),
        }
    }

    /// Where the website being edited is kept, named to the editor, with what
    /// its program answered about it and what it could not answer
    ///
    /// None as long as no website is open, and none for a website no
    /// integration speaks for: the editor then shows the file system hosting it
    /// showed before, which publishes just as well.
    fn hosting(&self) -> Option<Hosting> {
        let website_id = self
            .current_website_id
            .lock()
            .unwrap_or_else(|held| held.into_inner())
            .clone()?;

        let mut said = self
            .what_hosts_it
            .lock()
            .unwrap_or_else(|held| held.into_inner());
        if let Some((asked_about, when, answer)) = said.as_ref() {
            if asked_about == &website_id && when.elapsed() < WHAT_HOSTS_IT_KEPT {
                return answer.clone();
            }
        }

        let answer = self.who_hosts(&website_id);
        *said = Some((website_id, Instant::now(), answer.clone()));
        answer
    }
}

impl SilexActions {
    /// Who serves this website, asked of the programs of this machine
    fn who_hosts(&self, website_id: &str) -> Option<Hosting> {
        let site = self.site_path(website_id)?;

        // An integration that could not tell is not one that said no, but here
        // there is nothing to fail: the editor is told what it was told before.
        // No options handed over: nobody is publishing, and what the user
        // answered is with the editor, which keeps it saved and prefers it to
        // anything answered here
        let asked = self
            .integrations
            .resolve_deploy(&site, &PublicationOptions::default());
        let (provider, _cli, urls) = match asked {
            Ok(answered) => answered?,
            Err(e) => {
                tracing::warn!("Could not tell what serves website {}: {}", website_id, e);
                return None;
            }
        };
        let options_form = provider.options_form(&site);
        Some(Hosting {
            connector_id: "fs-hosting",
            display_name: Remote::of(&site)?.host,
            // Only what the program of the host answered by itself. A host that
            // asks instead is left to its form: an address worked out from a
            // field nobody has filled in yet would land in that very field and
            // stay there, whatever the user answers afterwards.
            options: options_form
                .is_none()
                .then(|| urls.and_then(|urls| urls.site))
                .flatten()
                .map(|url| serde_json::json!({ "websiteUrl": url })),
            options_form,
        })
    }
}

/// Ask what the build did, until it says, and tell the user
///
/// Nothing here ever calls a publication a success on its own: the website is
/// live when the host says its build worked, and not when a push returned.
fn watch(job: &Job, site: &Path, sent: &Sent, files: &str, patience: Patience) {
    let host = sent.host.as_str();
    let ask = || sent.provider.build(&sent.cli, site, &sent.prepared);
    let building = |build_url: &str| {
        message::told(
            &format!("Building your website on {}", host),
            &[
                Button::secondary("See the build", build_url),
                Button::secondary(FILES_ON_THIS_COMPUTER, files),
            ],
        )
    };
    let build_url = sent.build_url.clone().unwrap_or_default();
    job.progress(building(&build_url));
    job.step(format!("Waiting for {} to start the build", host));

    // Looking for the build this publication started. A host that has
    // nothing to show after a minute is one that will never build it.
    let started = Instant::now();
    let mut answered = false;
    let mut could_not_ask: Option<String> = None;
    let running = loop {
        match ask() {
            Ok(Build::Unknown) => {
                return job.succeeded(message::explained(
                    &format!("Your website is sent to {}.", host),
                    &format!(
                        "Silex cannot follow builds on {}, so check there that it worked.",
                        host
                    ),
                    &[
                        Button::secondary("See the builds", &build_url),
                        Button::secondary(FILES_ON_THIS_COMPUTER, files),
                    ],
                ))
            }
            Ok(Build::Refused(why)) => {
                return job.failed(message::explained(
                    &format!("{} did not build your website.", host),
                    &why,
                    &[
                        Button::secondary(
                            "Repository settings",
                            sent.settings_url.as_deref().unwrap_or_default(),
                        ),
                        Button::secondary(FILES_ON_THIS_COMPUTER, files),
                    ],
                ))
            }
            Ok(Build::NotStarted) => answered = true,
            Ok(build) => break build,
            // A host that could not be asked this time is asked again:
            // one refused request is not an answer about a build
            Err(e) => {
                tracing::warn!("Could not ask {} about the build: {}", host, e);
                could_not_ask = Some(e);
            }
        }
        if started.elapsed() >= patience.a_build_starts_within {
            // Never once got an answer: what is known is that the host
            // could not be asked, not that it built nothing
            let never_answered = if answered { None } else { could_not_ask };
            return nothing_built_it(job, host, sent, files, never_answered);
        }
        std::thread::sleep(patience.looking_for_the_build);
    };

    // The build exists: followed until the host says how it ended
    job.step(format!("{} started building your website", host));
    let mut build = running;
    let started = Instant::now();
    loop {
        match build {
            Build::Built => {
                job.step("The build finished");
                return job.succeeded(match sent.site_url.as_deref() {
                    Some(website) => message::told(
                        "Your website is now live!",
                        &[
                            Button::primary("View your website", website),
                            Button::secondary(
                                "Address and domain",
                                sent.settings_url.as_deref().unwrap_or_default(),
                            ),
                        ],
                    ),
                    None => message::explained(
                        "Your website is built.",
                        &format!("Silex does not know the address {} serves it at.", host),
                        &[Button::secondary(
                            "Address and domain",
                            sent.settings_url.as_deref().unwrap_or_default(),
                        )],
                    ),
                })
            }
            Build::Failed { ref url, ref reason } => {
                return job.failed(message::explained(
                    &format!("The build of your website failed on {}.", host),
                    reason.as_deref().unwrap_or(
                        "Read the build to see what went wrong, then publish again.",
                    ),
                    &[
                        Button::primary(
                            "See the build",
                            url.as_deref().unwrap_or(&build_url),
                        ),
                        Button::secondary(FILES_ON_THIS_COMPUTER, files),
                    ],
                ))
            }
            Build::Running(ref url) => {
                job.progress(building(url.as_deref().unwrap_or(&build_url)))
            }
            // A host that stops answering about a build it was answering
            // about is one to ask again, not one to draw a conclusion from
            Build::Unknown | Build::NotStarted | Build::Refused(_) => {}
        }
        if started.elapsed() >= patience.a_build_ends_within {
            return job.failed(message::explained(
                "The build is taking longer than expected.",
                &format!(
                    "Silex stopped following it after {} minutes. Your website may still come online.",
                    patience.a_build_ends_within.as_secs() / 60
                ),
                &[
                    Button::primary("See the build", &build_url),
                    Button::secondary(
                        "View your website",
                        sent.site_url.as_deref().unwrap_or_default(),
                    ),
                ],
            ));
        }
        std::thread::sleep(patience.while_it_builds);
        build = match ask() {
            Ok(build) => build,
            Err(e) => {
                tracing::warn!("Could not ask {} about the build: {}", host, e);
                Build::Unknown
            }
        };
    }
}

/// Say that no build ever started, which is what a website that looks
/// published and is nowhere really comes down to
fn nothing_built_it(
job: &Job,
    host: &str,
    sent: &Sent,
    files: &str,
    could_not_ask: Option<String>,
) {
    let build_url = sent.build_url.as_deref().unwrap_or_default();
    let settings_url = sent.settings_url.as_deref().unwrap_or_default();

    if let Some(why) = could_not_ask {
        job.detail(why);
        return job.failed(message::explained(
            &format!("Silex could not ask {} what became of the build.", host),
            "Your website was sent. Check the build yourself to see whether it worked.",
            &[
                Button::primary("See the builds", build_url),
                Button::secondary(FILES_ON_THIS_COMPUTER, files),
            ],
        ));
    }

    job.failed(message::explained(
        &format!("{} did not start a build.", host),
        "Your website was sent, but nothing built it, so it is not online. Check that builds are turned on for this repository, and that your account there is verified.",
        &[
            Button::primary("Repository settings", settings_url),
            Button::secondary("See the builds", build_url),
            Button::secondary(FILES_ON_THIS_COMPUTER, files),
        ],
    ))
}


#[cfg(test)]
mod sending {
    use super::*;

    /// A syncer that notes what it was asked to send instead of sending it
    fn watching(sent_after: Duration) -> (Arc<Syncer>, Arc<Mutex<Vec<String>>>) {
        let sent: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));
        let noted = sent.clone();
        let syncer = Arc::new(Syncer {
            syncs: Box::new(move |website_id| {
                noted.lock().unwrap().push(website_id.to_string());
                Ok(())
            }),
            sent_after,
            waiting: Mutex::new(HashMap::new()),
        });
        (syncer, sent)
    }

    fn pushed(noted: &Arc<Mutex<Vec<String>>>) -> Vec<String> {
        noted.lock().unwrap().clone()
    }

    /// Waits for what a thread does, without waiting the whole of it when it is
    /// already done
    fn until(done: impl Fn() -> bool) -> bool {
        for _ in 0..200 {
            if done() {
                return true;
            }
            std::thread::sleep(Duration::from_millis(10));
        }
        false
    }

    #[test]
    fn a_website_leaves_once_the_saves_stop_rather_than_at_every_save() {
        let (syncer, sent) = watching(Duration::from_millis(80));

        // Typing in the editor: one save after another, none of them far enough
        // apart to be the last
        for _ in 0..5 {
            syncer.sync("site");
            std::thread::sleep(Duration::from_millis(20));
        }
        assert!(pushed(&sent).is_empty(), "sent while its author was still working");

        assert!(until(|| !pushed(&sent).is_empty()), "never left once the saves stopped");
        std::thread::sleep(Duration::from_millis(120));
        assert_eq!(pushed(&sent), ["site"], "one pause, one push");
    }

}

#[cfg(test)]
mod publications {
    use super::*;
    use crate::integrations::deploy::Urls;
    use silex_server::{JobData, JobStatus, Jobs};
    use std::sync::atomic::{AtomicUsize, Ordering};

    /// What a host answers when it is asked about a build
    #[derive(Clone, Copy)]
    enum Says {
        /// It has nothing about this publication
        Nothing,
        /// It will not build this website at all
        Refuses,
        Running,
        Built,
        Failed,
        /// Silex has no way to follow builds there
        CannotBeFollowed,
        /// The question itself did not go through
        Unreachable,
    }

    /// A host that answers what the test lined up, in order, and keeps
    /// repeating the last answer
    struct Host {
        says: &'static [Says],
        asked: AtomicUsize,
    }

    impl Deploy for Host {
        fn program(&self) -> &'static str {
            "host"
        }

        fn keeps(&self, _site: &Path) -> bool {
            true
        }

        fn urls(
            &self,
            _cli: &Path,
            _site: &Path,
            _options: &PublicationOptions,
        ) -> Result<Option<Urls>, String> {
            Ok(Some(Urls::default()))
        }

        fn deploy(
            &self,
            _cli: &Path,
            _site: &Path,
            _options: &PublicationOptions,
        ) -> Result<Prepared, String> {
            Ok(Prepared::default())
        }

        fn build(&self, _cli: &Path, _site: &Path, _prepared: &Prepared) -> Result<Build, String> {
            let asked = self.asked.fetch_add(1, Ordering::SeqCst);
            Ok(match self.says[asked.min(self.says.len() - 1)] {
                Says::Nothing => Build::NotStarted,
                Says::Refuses => Build::Refused(
                    "Actions are turned off for this repository, so nothing built your website."
                        .to_string(),
                ),
                Says::Running => Build::Running(None),
                Says::Built => Build::Built,
                Says::Failed => Build::Failed {
                    url: Some("https://codeberg.org/alex/site/actions/runs/12".to_string()),
                    reason: Some("The page generator stopped on an error.".to_string()),
                },
                Says::CannotBeFollowed => Build::Unknown,
                Says::Unreachable => {
                    return Err("host failed: Could not resolve host: codeberg.org".to_string())
                }
            })
        }
    }

    const FILES: &str = "file:///data/site/public";

    /// A publication sent to a host that answers this
    fn sent(host: &'static Host) -> Sent {
        Sent {
            provider: host,
            cli: PathBuf::from("/nowhere"),
            host: "codeberg.org".to_string(),
            prepared: Prepared::default(),
            site_url: Some("https://alex.codeberg.page/site/".to_string()),
            settings_url: Some("https://codeberg.org/alex/site/settings".to_string()),
            build_url: Some("https://codeberg.org/alex/site/actions".to_string()),
            signed_in: true,
        }
    }

    /// The same waiting as a real publication, in milliseconds
    fn quickly() -> Patience {
        Patience {
            looking_for_the_build: Duration::from_millis(1),
            a_build_starts_within: Duration::from_millis(20),
            while_it_builds: Duration::from_millis(1),
            a_build_ends_within: Duration::from_millis(60),
        }
    }

    /// Follow one publication to its end and read what the user was told
    fn followed(host: &'static Host) -> JobData {
        let jobs = Jobs::default();
        let job = jobs.start("Publishing");
        watch(&job, Path::new("/nowhere"), &sent(host), FILES, quickly());
        jobs.read(job.id()).expect("the publication was just followed")
    }

    #[test]
    fn a_host_that_never_starts_a_build_is_not_a_publication_that_worked() {
        // Codeberg with its Actions off, and gitlab.com with an account it has
        // not verified: the push works, and the website is never built. This is
        // the failure Silex used to show as a green success.
        static NOTHING: Host = Host {
            says: &[Says::Nothing],
            asked: AtomicUsize::new(0),
        };
        let told = followed(&NOTHING);

        assert_eq!(told.status, JobStatus::Error);
        assert!(told.message.contains("did not start a build"), "{}", told.message);
        assert!(!told.message.contains("live"), "nothing built it: {}", told.message);
        // And the user is pointed at what to do about it, and at what is on
        // their own disk in the meantime
        assert!(told.message.contains("Repository settings"), "{}", told.message);
        assert!(told.message.contains(FILES), "{}", told.message);
    }

    #[test]
    fn a_build_the_host_says_worked_is_the_website_being_live() {
        static BUILDS: Host = Host {
            says: &[Says::Nothing, Says::Running, Says::Running, Says::Built],
            asked: AtomicUsize::new(0),
        };
        let told = followed(&BUILDS);

        assert_eq!(told.status, JobStatus::Success);
        assert!(told.message.contains("Your website is now live!"), "{}", told.message);
        assert!(
            told.message.contains("https://alex.codeberg.page/site/"),
            "the address it is served at: {}",
            told.message
        );
    }

    #[test]
    fn a_host_that_says_it_will_not_build_says_so_without_the_wait() {
        static REFUSES: Host = Host {
            says: &[Says::Refuses],
            asked: AtomicUsize::new(0),
        };
        let started = Instant::now();
        let told = followed(&REFUSES);

        assert_eq!(told.status, JobStatus::Error);
        assert!(told.message.contains("Actions are turned off"), "{}", told.message);
        assert!(
            started.elapsed() < quickly().a_build_starts_within,
            "a host that answered has nothing to be waited for"
        );
    }

    #[test]
    fn a_build_that_failed_is_told_with_where_to_read_it() {
        static FAILS: Host = Host {
            says: &[Says::Running, Says::Failed],
            asked: AtomicUsize::new(0),
        };
        let told = followed(&FAILS);

        assert_eq!(told.status, JobStatus::Error);
        assert!(told.message.contains("failed"), "{}", told.message);
        assert!(
            told.message.contains("actions/runs/12"),
            "the build itself, not the list: {}",
            told.message
        );
    }

    #[test]
    fn a_host_silex_cannot_follow_is_said_rather_than_called_a_success() {
        static UNFOLLOWED: Host = Host {
            says: &[Says::CannotBeFollowed],
            asked: AtomicUsize::new(0),
        };
        let told = followed(&UNFOLLOWED);

        // The website was sent, so the publication did not fail
        assert_eq!(told.status, JobStatus::Success);
        assert!(told.message.contains("cannot follow builds"), "{}", told.message);
        assert!(
            !told.message.contains("now live"),
            "nobody checked: {}",
            told.message
        );
    }

    #[test]
    fn a_host_that_could_not_be_asked_at_all_is_not_a_host_that_built_nothing() {
        static UNREACHABLE: Host = Host {
            says: &[Says::Unreachable],
            asked: AtomicUsize::new(0),
        };
        let jobs = Jobs::default();
        let job = jobs.start("Publishing");
        watch(&job, Path::new("/nowhere"), &sent(&UNREACHABLE), FILES, quickly());
        let told = jobs.read(job.id()).unwrap();

        assert_eq!(told.status, JobStatus::Error);
        assert!(told.message.contains("could not ask"), "{}", told.message);
        assert!(
            !told.message.contains("did not start a build"),
            "not knowing is not the host having built nothing: {}",
            told.message
        );
        // And what the program said is there for whoever wants to read it
        assert_eq!(told.errors[0].len(), 1);
        assert!(told.errors[0][0].contains("Could not resolve host"), "{:?}", told.errors);
    }

    #[test]
    fn what_silex_wrote_is_offered_while_the_host_is_still_building() {
        // The user waits on a build that is not theirs to speed up, and the
        // files the editor generated are on their disk already
        static BUILDING: Host = Host {
            says: &[Says::Running],
            asked: AtomicUsize::new(0),
        };
        let jobs = Jobs::default();
        let job = jobs.start("Publishing");
        let job_id = job.id().to_string();

        let following = std::thread::spawn(move || {
            watch(&job, Path::new("/nowhere"), &sent(&BUILDING), FILES, quickly());
        });
        std::thread::sleep(Duration::from_millis(10));

        let while_it_builds = jobs.read(&job_id).expect("the publication is still going");
        assert_eq!(while_it_builds.status, JobStatus::InProgress);
        assert!(while_it_builds.message.contains("Building"), "{}", while_it_builds.message);
        assert!(
            while_it_builds.message.contains(FILES),
            "the files are there to open while the host works: {}",
            while_it_builds.message
        );
        assert!(
            !while_it_builds.message.contains("now live"),
            "nothing is live until the host says so: {}",
            while_it_builds.message
        );

        // And a build that never ends is said to be one, not called a success
        following.join().unwrap();
        let told = jobs.read(&job_id).unwrap();
        assert_eq!(told.status, JobStatus::Error);
        assert!(told.message.contains("longer than expected"), "{}", told.message);
    }
}
