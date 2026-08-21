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

use silex_server::{Hosting, Job};

use crate::integrations::deploy::{Build, Deploy, Prepared};
use crate::integrations::git;
use crate::integrations::remote::without_secret;
use crate::integrations::Integrations;
use crate::message::{self, Button, FILES_ON_THIS_COMPUTER};

/// How long Silex waits on a forge, and how often it asks
///
/// A value rather than four constants in the loop, so that a test can follow a
/// whole publication without waiting the minute a real one takes.
#[derive(Clone, Copy)]
struct Patience {
    /// How often a forge is asked about a build that has not appeared yet
    looking_for_the_build: Duration,

    /// How long a forge has to start a build before Silex says it never did
    ///
    /// A forge that takes the push queues its build within seconds. Waiting
    /// longer only leaves the user in front of a progress bar for a website
    /// that was never going to come online.
    a_build_starts_within: Duration,

    /// How often a forge is asked about a build that is running
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
/// Answering starts the command line of a forge and reaches the network, and
/// the editor asks when it loads a website and again every time the publication
/// dialog opens. Long enough that one burst of questions costs one answer,
/// short enough that a user who just signed in to their forge sees it.
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

/// Sends websites to their forge, once their author has stopped saving them
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
    fn asked(self: &Arc<Self>, website_id: &str) {
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

    /// Wait out the saves, sync, and start over if more came in meanwhile
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
                tracing::warn!("Could not send website {} to its forge: {}", website_id, e);
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


/// A website that left for its forge, and what to ask about its build
struct Sent {
    provider: &'static dyn Deploy,
    cli: PathBuf,
    prepared: Prepared,
    /// Where the website is served, when the forge or the user named it
    site_url: Option<String>,
    /// Where the user sets an address of their own
    settings_url: Option<String>,
    /// Where the build of this publication can be watched
    build_url: Option<String>,
    /// Whether the user is signed in to that forge, which is what lets Silex
    /// ask it anything at all
    signed_in: bool,
}

impl silex_server::Actions for SilexActions {
    fn version(&self, website_id: &str, message: &str) -> Result<(), String> {
        let Some(site) = self.site_path(website_id) else {
            return Err(format!("Unknown website '{}'", website_id));
        };
        git::version(&site, message)
    }

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
        self.syncer.asked(website_id);
    }

    /// Publish the website: whichever integration answers for it prepares the
    /// build and sends it, or git alone sends it as it is
    ///
    /// Sending is not publishing. A forge takes what was pushed and builds it,
    /// and until it says that build worked nobody knows whether the website is
    /// online: a repository with its builds turned off takes every push and
    /// serves nothing. So the job stays open until the forge has answered.
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
        // once, for whoever publishes without a forge.
        let Some(remote_url) = git::remote_url(&site) else {
            return;
        };

        // Where the user says their website is served, as the editor sent it
        // with this publication. Trimmed of the spaces a field collects, and an
        // empty one is nobody having named an address.
        let website_url = options
            .website_url
            .as_deref()
            .map(str::trim)
            .filter(|url| !url.is_empty());

        let remote = without_secret(&remote_url).to_string();
        // None when no integration recognises the website: it is versioned and
        // sent all the same, and building it is up to whoever hosts it
        let sent = self
            .integrations
            .publish(&site, website_url, &|step| job.step(step))
            .map(|published| {
                published.map(|published| {
                    let signed_in = published.urls.is_some();
                    let urls = published.urls.unwrap_or_default();
                    Sent {
                        build_url: published.provider.watch(&urls, &published.prepared),
                        site_url: urls.site,
                        settings_url: urls.settings,
                        provider: published.provider,
                        cli: published.cli,
                        prepared: published.prepared,
                        signed_in,
                    }
                })
            });

        match sent {
            Err(failure) => {
                tracing::warn!("Could not publish website {}: {}", website_id, failure);
                // What the program answered, and nothing read into it. Silex
                // knows the publication failed; why it failed is written in
                // words it did not choose, in a form that changes with the
                // version of git, the forge and the language of the machine.
                // Reading a cause out of them means being wrong one day, and
                // being wrong here sends somebody looking in the wrong place.
                job.detail(failure.clone());
                job.failed(message::explained(
                    &format!("Silex could not send your website to {}.", remote),
                    &failure,
                    &[on_this_computer()],
                ));
            }
            // Nobody Silex knows publishes there, and the website was pushed as
            // it is: what happens to it next is not something to guess at
            Ok(None) => job.succeeded(message::explained(
                &format!("Your website is saved and sent to {}.", remote),
                "Silex does not know how to publish it there, so putting it online is up to you.",
                &[on_this_computer()],
            )),
            // The forge takes the website but nobody is signed in to it, so
            // there is no way to ask what its build did
            Ok(Some(sent)) if !sent.signed_in => {
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
            Ok(Some(sent)) => watch(job, &site, &sent, &files, Patience::default()),
        }
    }

    /// The forge the website being edited is on, named to the editor, with what
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
        // No address handed over: nobody is publishing, and what the user
        // named is with the editor, which keeps it saved and prefers it to
        // anything answered here
        let (provider, _cli, urls) = match self.integrations.resolve_deploy(&site, None) {
            Ok(resolved) => resolved.into_parts()?,
            Err(e) => {
                tracing::warn!("Could not tell what serves website {}: {}", website_id, e);
                return None;
            }
        };
        let options_form = provider.options_form(&site);
        Some(Hosting {
            connector_id: "fs-hosting",
            display_name: provider.display_name().to_string(),
            // No form, no options. A forge whose program knows where it
            // serves a website says so again when it publishes it.
            options: options_form.as_ref().and(
                urls.and_then(|urls| urls.site)
                    .map(|url| serde_json::json!({ "websiteUrl": url })),
            ),
            options_form,
        })
    }
}

/// Ask the forge what its build did, until it says, and tell the user
///
/// Nothing here ever calls a publication a success on its own: the website is
/// live when the forge says its build worked, and not when a push returned.
fn watch(job: &Job, site: &Path, sent: &Sent, files: &str, patience: Patience) {
    let forge = sent.provider.display_name();
    let ask = || sent.provider.build(&sent.cli, site, &sent.prepared);
    let building = |build_url: &str| {
        message::told(
            &format!("Building your website on {}", forge),
            &[
                Button::secondary("See the build", build_url),
                Button::secondary(FILES_ON_THIS_COMPUTER, files),
            ],
        )
    };
    let build_url = sent.build_url.clone().unwrap_or_default();
    job.progress(building(&build_url));
    job.step(format!("Waiting for {} to start the build", forge));

    // Looking for the build this publication started. A forge that has
    // nothing to show after a minute is one that will never build it.
    let started = Instant::now();
    let mut answered = false;
    let mut could_not_ask: Option<String> = None;
    let running = loop {
        match ask() {
            Ok(Build::Unknown) => {
                return job.succeeded(message::explained(
                    &format!("Your website is sent to {}.", forge),
                    &format!(
                        "Silex cannot follow builds on {}, so check there that it worked.",
                        forge
                    ),
                    &[
                        Button::secondary("See the builds", &build_url),
                        Button::secondary(FILES_ON_THIS_COMPUTER, files),
                    ],
                ))
            }
            Ok(Build::Refused(why)) => {
                return job.failed(message::explained(
                    &format!("{} did not build your website.", forge),
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
            // A forge that could not be asked this time is asked again:
            // one refused request is not an answer about a build
            Err(e) => {
                tracing::warn!("Could not ask {} about the build: {}", forge, e);
                could_not_ask = Some(e);
            }
        }
        if started.elapsed() >= patience.a_build_starts_within {
            // Never once got an answer: what is known is that the forge
            // could not be asked, not that it built nothing
            let never_answered = if answered { None } else { could_not_ask };
            return nothing_built_it(job, forge, sent, files, never_answered);
        }
        std::thread::sleep(patience.looking_for_the_build);
    };

    // The build exists: followed until the forge says how it ended
    job.step(format!("{} started building your website", forge));
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
                        &format!("Silex does not know the address {} serves it at.", forge),
                        &[Button::secondary(
                            "Address and domain",
                            sent.settings_url.as_deref().unwrap_or_default(),
                        )],
                    ),
                })
            }
            Build::Failed { ref url, ref reason } => {
                return job.failed(message::explained(
                    &format!("The build of your website failed on {}.", forge),
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
            // A forge that stops answering about a build it was answering
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
                tracing::warn!("Could not ask {} about the build: {}", forge, e);
                Build::Unknown
            }
        };
    }
}

/// Say that the forge never started a build, which is what a website that looks
/// published and is nowhere really comes down to
fn nothing_built_it(
job: &Job,
    forge: &str,
    sent: &Sent,
    files: &str,
    could_not_ask: Option<String>,
) {
    let build_url = sent.build_url.as_deref().unwrap_or_default();
    let settings_url = sent.settings_url.as_deref().unwrap_or_default();

    if let Some(why) = could_not_ask {
        job.detail(why);
        return job.failed(message::explained(
            &format!("Silex could not ask {} what became of the build.", forge),
            "Your website was sent. Check the build yourself to see whether it worked.",
            &[
                Button::primary("See the builds", build_url),
                Button::secondary(FILES_ON_THIS_COMPUTER, files),
            ],
        ));
    }

    job.failed(message::explained(
        &format!("{} did not start a build.", forge),
        "Your website was sent, but nothing built it, so it is not online. Check that builds are turned on for this repository, and that your account on the forge is verified.",
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

    /// A syncer that notes what it was asked to send instead of reaching a forge
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
            syncer.asked("site");
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
    use crate::integrations::deploy::{Answer, Urls};
    use silex_server::{JobData, JobStatus, Jobs};
    use std::sync::atomic::{AtomicUsize, Ordering};

    /// What a forge answers when it is asked about a build
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

    /// A forge that answers what the test lined up, in order, and keeps
    /// repeating the last answer
    struct Forge {
        says: &'static [Says],
        asked: AtomicUsize,
    }

    impl Deploy for Forge {
        fn program(&self) -> &'static str {
            "forge"
        }

        fn display_name(&self) -> &'static str {
            "Codeberg"
        }

        fn urls(&self, _cli: &Path, _site: &Path, _website_url: Option<&str>) -> Result<Answer, String> {
            Ok(Answer::Yes(Urls::default()))
        }

        fn deploy(
            &self,
            _cli: &Path,
            _site: &Path,
            _website_url: Option<&str>,
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
                    return Err("forge failed: Could not resolve host: codeberg.org".to_string())
                }
            })
        }
    }

    const FILES: &str = "file:///data/site/public";

    /// A publication that has been sent to a forge which answers this
    fn sent(forge: &'static Forge) -> Sent {
        Sent {
            provider: forge,
            cli: PathBuf::from("/nowhere"),
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
    fn followed(forge: &'static Forge) -> JobData {
        let jobs = Jobs::default();
        let job = jobs.start("Publishing");
        watch(&job, Path::new("/nowhere"), &sent(forge), FILES, quickly());
        jobs.read(job.id()).expect("the publication was just followed")
    }

    #[test]
    fn a_forge_that_never_starts_a_build_is_not_a_publication_that_worked() {
        // Codeberg with its Actions off, and gitlab.com with an account it has
        // not verified: the push works, and the website is never built. This is
        // the failure Silex used to show as a green success.
        static NOTHING: Forge = Forge {
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
    fn a_build_the_forge_says_worked_is_the_website_being_live() {
        static BUILDS: Forge = Forge {
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
    fn a_forge_that_says_it_will_not_build_says_so_without_the_wait() {
        static REFUSES: Forge = Forge {
            says: &[Says::Refuses],
            asked: AtomicUsize::new(0),
        };
        let started = Instant::now();
        let told = followed(&REFUSES);

        assert_eq!(told.status, JobStatus::Error);
        assert!(told.message.contains("Actions are turned off"), "{}", told.message);
        assert!(
            started.elapsed() < quickly().a_build_starts_within,
            "a forge that answered has nothing to be waited for"
        );
    }

    #[test]
    fn a_build_that_failed_is_told_with_where_to_read_it() {
        static FAILS: Forge = Forge {
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
    fn a_forge_silex_cannot_follow_is_said_rather_than_called_a_success() {
        static UNFOLLOWED: Forge = Forge {
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
    fn a_forge_that_could_not_be_asked_at_all_is_not_a_forge_that_built_nothing() {
        static UNREACHABLE: Forge = Forge {
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
            "not knowing is not the forge having built nothing: {}",
            told.message
        );
        // And what the program said is there for whoever wants to read it
        assert_eq!(told.errors[0].len(), 1);
        assert!(told.errors[0][0].contains("Could not resolve host"), "{:?}", told.errors);
    }

    #[test]
    fn what_silex_wrote_is_offered_while_the_forge_is_still_building() {
        // The user waits on a build that is not theirs to speed up, and the
        // files the editor generated are on their disk already
        static BUILDING: Forge = Forge {
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
            "the files are there to open while the forge works: {}",
            while_it_builds.message
        );
        assert!(
            !while_it_builds.message.contains("now live"),
            "nothing is live until the forge says so: {}",
            while_it_builds.message
        );

        // And a build that never ends is said to be one, not called a success
        following.join().unwrap();
        let told = jobs.read(&job_id).unwrap();
        assert_eq!(told.status, JobStatus::Error);
        assert!(told.message.contains("longer than expected"), "{}", told.message);
    }
}
