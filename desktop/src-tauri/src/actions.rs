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

use std::collections::{BTreeMap, HashMap};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Condvar, Mutex};
use std::time::{Duration, Instant};

use serde::Serialize;
use tokio::sync::watch;

use silex_server::{Hosting, Job, PublicationOptions};

use crate::integrations::deploy::{Build, Deploy, Prepared};
use crate::integrations::git;
use crate::integrations::remote::{without_secret, Remote};
use crate::integrations::Integrations;
use silex_server::message::{self, Button, FILES_ON_THIS_COMPUTER};

/// How long Silex waits on a host, and how often it asks
///
/// A value rather than constants, so that a test can follow a whole
/// publication without waiting the minute a real one takes.
#[derive(Clone, Copy)]
struct Patience {
    looking_for_the_build: Duration,

    /// How long the host has to start a build before Silex says it never did
    ///
    /// A host that takes the push queues its build within seconds.
    a_build_starts_within: Duration,

    while_it_builds: Duration,

    /// Building a website is a minute of work
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
/// Answering runs a program and reaches the network. Long enough that one
/// burst of questions costs one answer, short enough that a user who just
/// signed in sees it.
const WHAT_HOSTS_IT_KEPT: Duration = Duration::from_secs(10);

/// How long a website that is already on its way waits before it goes again
///
/// The first save of a burst leaves at once, so that one keystroke after
/// another is not one push after another.
const SENT_AFTER: Duration = Duration::from_secs(5);

/// How long Silex leaves a send that broke down before trying it again
///
/// The last one is kept repeating, so a machine that stays off the network is
/// tried once an hour rather than never again.
const TRIED_AGAIN_AFTER: [Duration; 4] = [
    Duration::from_secs(60),
    Duration::from_secs(5 * 60),
    Duration::from_secs(15 * 60),
    Duration::from_secs(60 * 60),
];

/// The website the editor has open, shared with the Tauri state
///
/// The editor asks for its hosting connector without naming a website.
pub type CurrentWebsiteId = Arc<Mutex<Option<String>>>;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Sending {
    pub state: State,
    /// What the last attempt that failed said, until one works
    ///
    /// Apart from `state` on purpose: held in it, the error would leave the
    /// screen as soon as the user typed something.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<Failure>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum State {
    Waiting,
    Sending,
    Sent,
    Failed,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Failure {
    pub why: String,
    /// Tells a break Silex will try again from one it will not
    pub retrying: bool,
}

/// What becomes of the error a website carried, when it moves to a new state
///
/// Three answers and not two: an attempt that starts must neither drop the
/// error before it nor claim it as its own.
enum LastFailure {
    Kept,
    /// Something worked, so there is nothing left to explain
    Cleared,
    Told(Failure),
}
use crate::held::held;
use LastFailure::{Cleared, Kept, Told};

impl Sending {
    fn at(state: State) -> Sending {
        Sending {
            state,
            last_failure: None,
        }
    }

    pub fn on_its_way(&self) -> bool {
        matches!(self.state, State::Waiting | State::Sending)
    }
}

/// Where every website is, as it changes
///
/// A watch and not a stream of events: whoever asks later has to be told
/// without having had to listen all along.
pub type Sendings = watch::Receiver<BTreeMap<String, Sending>>;

/// Told by the editor once it has finished saving, whether or not it had
/// anything to save
///
/// A count and not a flag: what waits on this needs one more save since it
/// started waiting, not that any ever happened.
pub type Saves = watch::Sender<u64>;
pub type Saved = watch::Receiver<u64>;

pub struct SilexActions {
    /// Directory holding one sub directory per website
    data_path: PathBuf,
    integrations: Arc<Integrations>,
    current_website_id: CurrentWebsiteId,
    syncer: Arc<Syncer>,
    /// What was last answered about who serves a website, and when
    ///
    /// Held across the asking, so that two questions arriving together cost
    /// one answer rather than two programs.
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
                        integrations.sync(&site)
                    })
                },
                sent_after: SENT_AFTER,
                tried_again_after: TRIED_AGAIN_AFTER.to_vec(),
                queue: Mutex::new(HashMap::new()),
                wake: Condvar::new(),
                state: watch::Sender::new(BTreeMap::new()),
            }),
            data_path,
            integrations,
            current_website_id,
            what_hosts_it: Mutex::new(None),
        }
    }

    pub fn sending(&self) -> Sendings {
        self.syncer.state.subscribe()
    }

    fn site_path(&self, website_id: &str) -> Option<PathBuf> {
        site_path(&self.data_path, website_id)
    }
}

/// The folder of a website, refusing anything that leads out of the data path
///
/// A website id comes from a request, and `Path::join` on an absolute path
/// forgets the folder it was joined to: an id could then name any repository
/// on the machine and have git run in it.
fn site_path(data_path: &Path, website_id: &str) -> Option<PathBuf> {
    let site = data_path.join(website_id);
    let data_path = data_path.canonicalize().ok()?;
    let canonical = site.canonicalize().ok()?;
    canonical.starts_with(&data_path).then_some(canonical)
}

struct Syncer {
    syncs: Box<dyn Fn(&str) -> Result<(), String> + Send + Sync>,
    sent_after: Duration,
    tried_again_after: Vec<Duration>,
    /// The websites a thread is looking after, and what is left to do
    ///
    /// An entry lives as long as that thread, which keeps it to one per website.
    queue: Mutex<HashMap<String, Queued>>,
    /// Wakes the thread of a website whose turn a save moved closer
    wake: Condvar,
    state: watch::Sender<BTreeMap<String, Sending>>,
}

struct Queued {
    due: Instant,
    /// A save landed since the attempt in flight started, so it does not carry
    /// it and another one is needed
    again: bool,
}

impl Syncer {
    fn sync(self: &Arc<Self>, website_id: &str) {
        let looked_after = {
            let mut queue = held(&self.queue);
            match queue.get_mut(website_id) {
                Some(queued) => {
                    queued.again = true;
                    queued.due = Instant::now() + self.sent_after;
                    true
                }
                None => {
                    queue.insert(
                        website_id.to_string(),
                        Queued {
                            due: Instant::now(),
                            again: true,
                        },
                    );
                    false
                }
            }
        };
        self.queues(website_id);

        if looked_after {
            self.wake.notify_all();
            return;
        }

        let syncer = self.clone();
        let website_id = website_id.to_string();
        std::thread::spawn(move || {
            syncer.sends(&website_id);
        });
    }

    /// Send this website, and again for as long as there is a reason to
    ///
    /// The first save leaves at once and the ones that land while it goes
    /// leave together after it: waiting out every save left a single change
    /// sitting on this computer for five seconds.
    fn sends(&self, website_id: &str) {
        let mut broke_down = 0;
        loop {
            if !self.waits_for_its_turn(website_id) || !self.takes(website_id) {
                return;
            }
            self.publishes(website_id, State::Sending, Kept);

            let (state, failure, tried_again) = match (self.syncs)(website_id) {
                Ok(()) => {
                    broke_down = 0;
                    (State::Sent, Cleared, None)
                }
                Err(why) => {
                    let retrying = git::worth_another_try(&why);
                    if retrying {
                        tracing::warn!("Could not send website {}: {}", website_id, why);
                    } else {
                        tracing::error!("Could not send website {}: {}", website_id, why);
                    }
                    let after = retrying.then(|| {
                        let after = self.tried_again_after
                            [broke_down.min(self.tried_again_after.len() - 1)];
                        broke_down += 1;
                        after
                    });
                    (State::Failed, Told(Failure { why, retrying }), after)
                }
            };

            {
                let mut queue = held(&self.queue);
                let Some(queued) = queue.get_mut(website_id) else {
                    self.publishes(website_id, state, failure);
                    return;
                };
                match tried_again {
                    Some(after) => {
                        queued.due = Instant::now() + after;
                        queued.again = true;
                    }
                    None => queued.due = Instant::now() + self.sent_after,
                }
            }
            self.publishes(website_id, state, failure);
        }
    }

    /// Sleep until this website is due, waking if a save moves its turn
    /// closer. False when nothing is left to do for it.
    fn waits_for_its_turn(&self, website_id: &str) -> bool {
        let mut queue = held(&self.queue);
        loop {
            let Some(queued) = queue.get(website_id) else {
                return false;
            };
            let Some(left) = queued.due.checked_duration_since(Instant::now()) else {
                return true;
            };
            queue = self
                .wake
                .wait_timeout(queue, left)
                .unwrap_or_else(|held| held.into_inner())
                .0;
        }
    }

    /// Whether the attempt about to start has anything to carry
    ///
    /// Once a whole wait goes by with nothing, the website stops being looked
    /// after and the next save leaves at once again.
    fn takes(&self, website_id: &str) -> bool {
        let mut queue = held(&self.queue);
        if let Some(queued) = queue.get_mut(website_id) {
            if queued.again {
                queued.again = false;
                return true;
            }
        }
        queue.remove(website_id);
        false
    }

    /// Say a save is waiting, unless one is being sent right now
    fn queues(&self, website_id: &str) {
        self.state
            .send_if_modified(|websites| match websites.get_mut(website_id) {
                Some(website) if website.on_its_way() => false,
                Some(website) => {
                    website.state = State::Waiting;
                    true
                }
                None => {
                    websites.insert(website_id.to_string(), Sending::at(State::Waiting));
                    true
                }
            });
    }

    /// Move a website to a state, and say what became of the error it carried
    fn publishes(&self, website_id: &str, state: State, failure: LastFailure) {
        self.state.send_modify(|websites| {
            let website = websites
                .entry(website_id.to_string())
                .or_insert(Sending::at(state));
            website.state = state;
            match failure {
                Kept => {}
                Cleared => website.last_failure = None,
                Told(failure) => website.last_failure = Some(failure),
            }
        });
    }
}

struct Sent {
    provider: &'static dyn Deploy,
    cli: PathBuf,
    /// The host of its remote, as the user knows it
    host: String,
    prepared: Prepared,
    site_url: Option<String>,
    settings_url: Option<String>,
    build_url: Option<String>,
    signed_in: bool,
    warning: Option<String>,
}

impl silex_server::Actions for SilexActions {
    /// A website that could not be caught up with is opened as it is: the
    /// user is waiting to work
    fn sync_pull(&self, website_id: &str) {
        let Some(site) = self.site_path(website_id) else {
            return;
        };
        if let Err(e) = self.integrations.sync_pull(&site) {
            tracing::error!("Could not pull website {}: {}", website_id, e);
        }
    }

    /// Nothing of it goes online: putting a website online is `deploy`
    fn sync(&self, website_id: &str) {
        self.syncer.sync(website_id);
    }

    /// Sending is not publishing: a repository with its builds turned off
    /// takes every push and serves nothing. The job stays open until the host
    /// has answered.
    fn deploy(&self, website_id: &str, options: &silex_server::PublicationOptions, job: &Job) {
        let Some(site) = self.site_path(website_id) else {
            tracing::error!(
                "Asked to publish a website that is not there: {}",
                website_id
            );
            job.failed(message::told(
                "Silex could not find the folder of this website.",
                &[],
            ));
            return;
        };

        job.step("Your website is written on this computer");

        // On the disk already, so there is something to open while the rest
        // happens
        // An id the storage refuses leaves the button without an address, and
        // a button without an address is not shown
        let files = website_id
            .parse()
            .map(|website_id| silex_server::published_files_url(&self.data_path, &website_id))
            .unwrap_or_default();
        let on_this_computer = || Button::secondary(FILES_ON_THIS_COMPUTER, &files);

        // A local website is a way of working rather than something missing,
        // and the server says so itself
        let Some(remote_url) = git::remote_url(&site) else {
            return;
        };

        let remote = without_secret(&remote_url).to_string();
        // The user is told the host they push to, never the software it runs
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
                    warning: urls.warning,
                    provider: published.provider,
                    cli: published.cli,
                    host: host.clone(),
                    prepared: published.prepared,
                    signed_in,
                }
            });

        match sent {
            Err(failure) => {
                tracing::error!("Could not publish website {}: {}", website_id, failure);
                // What the program answered, and nothing read into it: those
                // words change with the version of git, the host and the
                // language of the machine
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
                        "Silex cannot tell whether {} built it, because nobody is signed in there. Sign in with the {} command to see the build and the address of your website.",
                        host, program
                    ),
                    &[on_this_computer()],
                ))
            }
            Ok(sent) => watch(job, &site, &sent, &files, Patience::default()),
        }
    }

    /// A listing asks this of every website, so no program is run.
    fn repo_url(&self, website_id: &str) -> Option<String> {
        let site = self.site_path(website_id)?;
        let (integration, _) = self.integrations.answering_for(&site)?;
        integration.repo(&site)
    }

    /// Where the website being edited is kept, named to the editor
    ///
    /// None for a website no integration speaks for: the editor then shows the
    /// file system hosting it showed before, which publishes just as well.
    fn hosting(&self) -> Option<Hosting> {
        let website_id = held(&self.current_website_id).clone()?;

        let mut said = held(&self.what_hosts_it);
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
    /// Asked of the programs of this machine
    fn who_hosts(&self, website_id: &str) -> Option<Hosting> {
        let site = self.site_path(website_id)?;

        // No options handed over: nobody is publishing, and the editor keeps
        // what the user answered
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
            // A host that asks is left to its form: an address worked out
            // from an empty field would land in that field and stay there
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
/// The website is live when the host says its build worked, not when a push
/// returned.
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
    job.step(format!("Waiting for {} to build your website", host));

    // A host that has nothing to show after a minute will never build it
    let started = Instant::now();
    let mut answered = false;
    let mut queued = false;
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
            // Leaving the loop here would follow a job that is not moving for
            // the fifteen minutes a real build is given
            Ok(Build::Queued) => {
                if !queued {
                    queued = true;
                    job.step("Waiting for a build machine");
                }
                answered = true;
            }
            Ok(build) => break build,
            // One refused request is not an answer about a build
            Err(e) => {
                tracing::warn!("Could not ask {} about the build: {}", host, e);
                could_not_ask = Some(e);
            }
        }
        if started.elapsed() >= patience.a_build_starts_within {
            if queued {
                return job.failed(message::explained(
                    &format!("Nothing on {} built your website.", host),
                    "Silex asks for a build machine by name, and no machine there has that name. Publish again and change \"Build machine name\": on Codeberg it is codeberg-tiny, and on another server the person who runs it can tell you.",
                    &[
                        Button::secondary("See the build", &build_url),
                        Button::secondary(FILES_ON_THIS_COMPUTER, files),
                    ],
                ));
            }
            // Never once got an answer: the host could not be asked, which is
            // not it having built nothing
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
                let seen_by_everyone = |website: &str| {
                    let buttons = [
                        Button::primary("View your website", website),
                        Button::secondary(
                            "Address and domain",
                            sent.settings_url.as_deref().unwrap_or_default(),
                        ),
                    ];
                    match sent.warning.as_deref() {
                        Some(warning) => {
                            message::explained("Your website is now live!", warning, &buttons)
                        }
                        None => message::told("Your website is now live!", &buttons),
                    }
                };
                return job.succeeded(match sent.site_url.as_deref() {
                    Some(website) => seen_by_everyone(website),
                    None => message::explained(
                        "Your website is built.",
                        &format!("Silex does not know the address {} serves it at.", host),
                        &[Button::secondary(
                            "Address and domain",
                            sent.settings_url.as_deref().unwrap_or_default(),
                        )],
                    ),
                });
            }
            Build::Failed {
                ref url,
                ref reason,
            } => {
                return job.failed(message::explained(
                    &format!("The build of your website failed on {}.", host),
                    reason
                        .as_deref()
                        .unwrap_or("Read the build to see what went wrong, then publish again."),
                    &[
                        Button::primary("See the build", url.as_deref().unwrap_or(&build_url)),
                        Button::secondary(FILES_ON_THIS_COMPUTER, files),
                    ],
                ))
            }
            Build::Running(ref url) => job.progress(building(url.as_deref().unwrap_or(&build_url))),
            // A build that went back to waiting was taken and given up, which
            // a runner coming back picks up again
            Build::Queued => job.progress(building(&build_url)),
            // Asked again rather than drawn a conclusion from
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
    use std::sync::atomic::{AtomicUsize, Ordering};

    /// A syncer that notes what it was asked to send instead of sending it
    fn watching(sent_after: Duration) -> (Arc<Syncer>, Arc<Mutex<Vec<String>>>) {
        let sent: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));
        let noted = sent.clone();
        let syncer = answering(sent_after, move |website_id| {
            noted.lock().unwrap().push(website_id.to_string());
            Ok(())
        });
        (syncer, sent)
    }

    /// A syncer that answers what the test wants, and gives up quickly
    fn answering(
        sent_after: Duration,
        syncs: impl Fn(&str) -> Result<(), String> + Send + Sync + 'static,
    ) -> Arc<Syncer> {
        Arc::new(Syncer {
            syncs: Box::new(syncs),
            sent_after,
            tried_again_after: vec![Duration::from_millis(40)],
            queue: Mutex::new(HashMap::new()),
            wake: Condvar::new(),
            state: watch::Sender::new(BTreeMap::new()),
        })
    }

    fn pushed(noted: &Arc<Mutex<Vec<String>>>) -> Vec<String> {
        noted.lock().unwrap().clone()
    }

    /// Waits for what a thread does, no longer than it takes
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
    fn a_lone_save_leaves_at_once_rather_than_waiting_for_more() {
        let (syncer, sent) = watching(Duration::from_millis(80));

        syncer.sync("site");
        std::thread::sleep(Duration::from_millis(20));
        assert_eq!(
            pushed(&sent),
            ["site"],
            "waited for saves that were never coming"
        );

        std::thread::sleep(Duration::from_millis(200));
        assert_eq!(pushed(&sent), ["site"], "went twice for one save");

        // The wait went by with nothing in it, so the next save is a first one
        syncer.sync("site");
        std::thread::sleep(Duration::from_millis(20));
        assert_eq!(pushed(&sent), ["site", "site"], "the pause did not count");
    }

    #[test]
    fn saves_that_land_while_a_website_is_leaving_go_together_after_it() {
        let (syncer, sent) = watching(Duration::from_millis(80));

        // Typing in the editor: saves close enough that only the first is on
        // its own
        for _ in 0..5 {
            syncer.sync("site");
            std::thread::sleep(Duration::from_millis(20));
        }
        assert_eq!(pushed(&sent), ["site"], "the first save waited its turn");

        assert!(
            until(|| pushed(&sent).len() == 2),
            "what was typed after the first push never left"
        );
        std::thread::sleep(Duration::from_millis(200));
        assert_eq!(
            pushed(&sent),
            ["site", "site"],
            "one burst, one push at each end of it"
        );
    }

    #[test]
    fn a_break_in_the_network_is_tried_again_and_a_closed_door_is_not() {
        let tries = Arc::new(AtomicUsize::new(0));
        let counted = tries.clone();
        let syncer = answering(Duration::from_millis(20), move |_| {
            counted.fetch_add(1, Ordering::SeqCst);
            Err("fatal: unable to access 'https://gitlab.com/a/b.git/': Could not resolve host: gitlab.com".to_string())
        });
        syncer.sync("site");
        assert!(
            until(|| tries.load(Ordering::SeqCst) >= 3),
            "a network that came back would have found nobody trying"
        );

        let tries = Arc::new(AtomicUsize::new(0));
        let counted = tries.clone();
        let syncer = answering(Duration::from_millis(20), move |_| {
            counted.fetch_add(1, Ordering::SeqCst);
            Err("fatal: Authentication failed for 'https://gitlab.com/a/b.git/'".to_string())
        });
        syncer.sync("site");
        assert!(until(|| tries.load(Ordering::SeqCst) == 1));
        std::thread::sleep(Duration::from_millis(200));
        assert_eq!(
            tries.load(Ordering::SeqCst),
            1,
            "kept knocking on a door that stays shut"
        );
        assert!(
            matches!(
                sending(&syncer, "site"),
                Some(Sending {
                    state: State::Failed,
                    last_failure: Some(Failure {
                        retrying: false,
                        ..
                    }),
                })
            ),
            "left nothing for the user to read"
        );
    }

    #[test]
    fn a_website_that_left_is_told_apart_from_one_still_on_its_way() {
        let (syncer, _) = watching(Duration::from_millis(20));
        assert_eq!(sending(&syncer, "site"), None);

        syncer.sync("site");
        assert!(until(|| state(&syncer, "site") == Some(State::Sent)));
    }

    #[test]
    fn a_save_waiting_its_turn_does_not_hide_the_failure_before_it() {
        let (syncer, _) = watching(Duration::from_millis(20));
        syncer.state.send_modify(|websites| {
            websites.insert(
                "site".to_string(),
                Sending {
                    state: State::Failed,
                    last_failure: Some(Failure {
                        why: "no network".to_string(),
                        retrying: true,
                    }),
                },
            );
        });

        syncer.queues("site");

        let website = sending(&syncer, "site").expect("website went missing");
        assert_eq!(website.state, State::Waiting);
        assert_eq!(
            website.last_failure.map(|failure| failure.why),
            Some("no network".to_string())
        );
    }

    fn sending(syncer: &Arc<Syncer>, website_id: &str) -> Option<Sending> {
        syncer.state.borrow().get(website_id).cloned()
    }

    fn state(syncer: &Arc<Syncer>, website_id: &str) -> Option<State> {
        sending(syncer, website_id).map(|website| website.state)
    }
}

#[cfg(test)]
mod publications {
    use super::*;
    use crate::integrations::deploy::Urls;
    use silex_server::{JobData, JobStatus, Jobs};
    use std::sync::atomic::{AtomicUsize, Ordering};

    #[derive(Clone, Copy)]
    enum Says {
        Nothing,
        Refuses,
        Running,
        Built,
        Failed,
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

    fn sent(host: &'static Host) -> Sent {
        Sent {
            provider: host,
            cli: PathBuf::from("/nowhere"),
            host: "codeberg.org".to_string(),
            warning: None,
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
        jobs.read(job.id())
            .expect("the publication was just followed")
    }

    #[test]
    fn a_host_that_never_starts_a_build_is_not_a_publication_that_worked() {
        // Codeberg with its Actions off, or an account GitLab has not
        // verified: the push works and the website is never built
        static NOTHING: Host = Host {
            says: &[Says::Nothing],
            asked: AtomicUsize::new(0),
        };
        let told = followed(&NOTHING);

        assert_eq!(told.status, JobStatus::Error);
        assert!(
            told.message.contains("did not start a build"),
            "{}",
            told.message
        );
        assert!(
            !told.message.contains("live"),
            "nothing built it: {}",
            told.message
        );
        // And pointed at what to do about it
        assert!(
            told.message.contains("Repository settings"),
            "{}",
            told.message
        );
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
        assert!(
            told.message.contains("Your website is now live!"),
            "{}",
            told.message
        );
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
        assert!(
            told.message.contains("Actions are turned off"),
            "{}",
            told.message
        );
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
        assert!(
            told.message.contains("cannot follow builds"),
            "{}",
            told.message
        );
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
        watch(
            &job,
            Path::new("/nowhere"),
            &sent(&UNREACHABLE),
            FILES,
            quickly(),
        );
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
        assert!(
            told.errors[0][0].contains("Could not resolve host"),
            "{:?}",
            told.errors
        );
    }

    #[test]
    fn what_silex_wrote_is_offered_while_the_host_is_still_building() {
        static BUILDING: Host = Host {
            says: &[Says::Running],
            asked: AtomicUsize::new(0),
        };
        let jobs = Jobs::default();
        let job = jobs.start("Publishing");
        let job_id = job.id().to_string();

        let following = std::thread::spawn(move || {
            watch(
                &job,
                Path::new("/nowhere"),
                &sent(&BUILDING),
                FILES,
                quickly(),
            );
        });
        std::thread::sleep(Duration::from_millis(10));

        let while_it_builds = jobs.read(&job_id).expect("the publication is still going");
        assert_eq!(while_it_builds.status, JobStatus::InProgress);
        assert!(
            while_it_builds.message.contains("Building"),
            "{}",
            while_it_builds.message
        );
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
        assert!(
            told.message.contains("longer than expected"),
            "{}",
            told.message
        );
    }
}
