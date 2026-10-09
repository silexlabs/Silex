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

use crate::integrations::common::remote::Remote;
use crate::integrations::integration::{Build, Capacity, Integration, Prepared, SyncError, Synced};
use crate::integrations::Loading;
use crate::locales::{CHANGED_ELSEWHERE, REFUSED_BY_HOST, SEND_FAILED};
use silex_server::message::{self, Button, FILES_ON_THIS_COMPUTER};
use silex_server::said::Said;

const LOOKING_FOR_THE_BUILD: Duration = Duration::from_secs(5);

/// How long the host has to start a build before Silex says it never did
///
/// A host that takes the push queues its build within seconds.
const A_BUILD_STARTS_WITHIN: Duration = Duration::from_secs(60);

const WHILE_IT_BUILDS: Duration = Duration::from_secs(10);

/// Building a website is a minute of work
const A_BUILD_ENDS_WITHIN: Duration = Duration::from_secs(15 * 60);

/// The website the editor has open, shared with the Tauri state
///
/// The editor asks for its hosting connector without naming a website.
pub type CurrentWebsiteId = Arc<Mutex<Option<String>>>;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SyncStatus {
    pub state: SyncState,
    /// What the last attempt that failed said, until one works
    ///
    /// Apart from `state` on purpose: held in it, the error would leave the
    /// screen as soon as the user typed something.
    pub sync_failure: Option<Failure>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SyncState {
    Waiting,
    Pushing,
    Pushed,
    Failed,
}

/// What becomes of the error a website carried, when it moves to a new state
///
/// Three answers and not two: an attempt that starts must neither drop the
/// error before it nor claim it as its own.
enum SyncErrorChange {
    Kept,
    /// Something worked, so there is nothing left to explain
    Cleared,
    Told(Failure),
}
use crate::held::held;
use SyncErrorChange::{Cleared, Kept, Told};

impl SyncStatus {
    fn at(state: SyncState) -> SyncStatus {
        SyncStatus {
            state,
            sync_failure: None,
        }
    }

    pub fn on_its_way(&self) -> bool {
        matches!(self.state, SyncState::Waiting | SyncState::Pushing)
    }
}

/// Where every website is, as it changes
///
/// A watch and not a stream of events: whoever asks later has to be told
/// without having had to listen all along.
pub type SyncStatuses = watch::Receiver<BTreeMap<String, SyncStatus>>;

/// Told by the editor once it has finished saving, whether or not it had
/// anything to save, true when the save failed
///
/// Every telling counts, even of the same value: what waits on this needs one
/// more save since it started waiting, not that any ever happened.
pub type SaveEnds = watch::Sender<bool>;
pub type SaveEnded = watch::Receiver<bool>;

pub struct SilexActions {
    /// Directory holding one sub directory per website
    data_path: PathBuf,
    integrations: Arc<Loading>,
    current_website_id: CurrentWebsiteId,
    syncer: Arc<Syncer>,
}

impl SilexActions {
    pub fn new(
        data_path: PathBuf,
        integrations: Loading,
        current_website_id: CurrentWebsiteId,
        tells: impl Fn(&str, &Failure) + Send + Sync + 'static,
    ) -> Self {
        let integrations = Arc::new(integrations);
        let on_its_folder = |does: fn(&dyn Integration, &Path) -> Result<bool, SyncError>| {
            let data_path = data_path.clone();
            let integrations = integrations.clone();
            Box::new(move |website_id: &str| {
                let site = site_path(&data_path, website_id).ok_or_else(|| Failure {
                    program: None,
                    place: None,
                    error: SyncError::Other(format!("Unknown website '{}'", website_id)),
                    url: None,
                })?;
                let done = integrations
                    .get(Capacity::Sync, &site)
                    .map(|(integration, _)| {
                        does(integration, &site).map_err(|error| failed(integration, &site, error))
                    });
                first_error(&site, done.collect())
            }) as OnAWebsite
        };
        SilexActions {
            syncer: Arc::new(Syncer {
                pushes: on_its_folder(|integration, site| {
                    integration.push(site, None).map(|()| true)
                }),
                syncs: on_its_folder(|integration, site| integration.sync(site)),
                tells: Box::new(tells),
                busy: Mutex::new(HashMap::new()),
                freed: Condvar::new(),
                statuses: watch::Sender::new(BTreeMap::new()),
            }),
            data_path,
            integrations,
            current_website_id,
        }
    }

    pub fn sync_statuses(&self) -> SyncStatuses {
        self.syncer.statuses.subscribe()
    }

    pub fn sync_places(&self, website_id: &str) -> Vec<SyncPlace> {
        let Some(site) = self.site_path(website_id) else {
            return Vec::new();
        };
        let status = self.syncer.statuses.borrow().get(website_id).cloned();
        let on_its_way = status.as_ref().is_some_and(SyncStatus::on_its_way);
        let failure = status.and_then(|status| status.sync_failure);
        self.integrations
            .get(Capacity::Sync, &site)
            .filter_map(|(integration, _)| {
                let failure = failure
                    .clone()
                    .filter(|failure| failure.program == Some(integration.program()));
                let mut synced = integration.synced(&site)?;
                // What a save left is being sent: nothing to ask of the user
                if on_its_way {
                    synced.action = None;
                }
                Some(SyncPlace {
                    place: integration.place(&site)?,
                    icon: integration.icon(),
                    synced,
                    failure: failure.as_ref().map(Failure::what_happened),
                })
            })
            .collect()
    }

    /// What opening the website does, waited for: the dashboard opens the
    /// editor only once it is done, so taking changes in risks no work
    pub async fn sync_now(&self, website_id: &str) -> Result<(), Said> {
        let mut statuses = self.syncer.statuses.subscribe();
        let (syncer, id) = (self.syncer.clone(), website_id.to_string());
        tokio::task::spawn_blocking(move || syncer.sync(&id))
            .await
            .map_err(Said::raw)?
            .map_err(|failure| failure.what_happened())?;
        let ended = statuses
            .wait_for(|websites| !websites.get(website_id).is_some_and(SyncStatus::on_its_way))
            .await
            .map(|websites| websites.get(website_id).cloned());
        let Ok(Some(SyncStatus {
            state: SyncState::Failed,
            sync_failure,
        })) = ended
        else {
            return Ok(());
        };
        Err(sync_failure.map_or_else(|| Said::new(SEND_FAILED), |failure| failure.what_happened()))
    }

    fn site_path(&self, website_id: &str) -> Option<PathBuf> {
        site_path(&self.data_path, website_id)
    }
}

/// The folder of a website, refusing anything but a folder right in the data path
///
/// A website id comes from a request, and `Path::join` on an absolute path
/// forgets the folder it was joined to: an id could then name any repository
/// on the machine and have git run in it. An empty id or `a/..` names the data
/// path itself, and putting that in the trash takes every website with it.
pub(crate) fn site_path(data_path: &Path, website_id: &str) -> Option<PathBuf> {
    let site = data_path.join(website_id);
    let data_path = data_path.canonicalize().ok()?;
    let canonical = site.canonicalize().ok()?;
    (canonical.parent() == Some(data_path.as_path())).then_some(canonical)
}

/// What went wrong, and the web address of where it happened
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Failure {
    /// The program of the integration that failed
    pub program: Option<&'static str>,
    /// Where it was going, as the user knows it
    pub place: Option<String>,
    pub error: SyncError,
    pub url: Option<String>,
}

impl Failure {
    /// The same words in the editor and on the dashboard
    pub fn what_happened(&self) -> Said {
        let (said, why) = match (&self.error, &self.place) {
            (SyncError::ChangedElsewhere(why), _) => (Said::new(CHANGED_ELSEWHERE), why),
            (SyncError::RefusedByHost(why), Some(host)) => {
                (Said::new(REFUSED_BY_HOST).with("host", host), why)
            }
            (SyncError::RefusedByHost(why) | SyncError::Other(why), _) => {
                (Said::new(SEND_FAILED), why)
            }
        };
        said.because(why)
    }
}

/// Where a website stands with one of the integrations that send it
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPlace {
    place: String,
    icon: Option<&'static str>,
    #[serde(flatten)]
    synced: Synced,
    /// What the last failed sending through this integration said, until one works
    failure: Option<Said>,
}

type OnAWebsite = Box<dyn Fn(&str) -> Result<bool, Failure> + Send + Sync>;
type TellsFailure = Box<dyn Fn(&str, &Failure) + Send + Sync>;

/// The editor follows web addresses only
fn failed(integration: &dyn Integration, site: &Path, error: SyncError) -> Failure {
    let url = integration
        .repo(site)
        .filter(|url| url.starts_with("https://") || url.starts_with("http://"));
    Failure {
        program: Some(integration.program()),
        place: integration.place(site),
        error,
        url,
    }
}

/// Every integration acts, and the first failure is the one told; false when
/// nobody answered true
fn first_error(site: &Path, results: Vec<Result<bool, Failure>>) -> Result<bool, Failure> {
    let any = results.contains(&Ok(true));
    let mut failures = results.into_iter().filter_map(Result::err);
    let Some(first) = failures.next() else {
        return Ok(any);
    };
    for later in failures {
        tracing::warn!("Could not sync {}: {}", site.display(), later.error);
    }
    Err(first)
}

/// What the integrations do with each website, one thing at a time per website
///
/// git, the one there is, refuses rather than queues when a save, a
/// publication and a sync race for the same ref or index.
struct Syncer {
    /// False when no integration answers for the website
    pushes: OnAWebsite,
    /// True when work done here is left to push
    syncs: OnAWebsite,
    tells: TellsFailure,
    /// The websites an integration is busy with, and whether a save landed
    /// since, so that another push is needed
    ///
    /// An entry lives as long as that work, which keeps it to one per website.
    busy: Mutex<HashMap<String, bool>>,
    /// Told each time a website leaves `busy`
    freed: Condvar,
    statuses: watch::Sender<BTreeMap<String, SyncStatus>>,
}

impl Syncer {
    fn push(self: &Arc<Self>, website_id: &str) {
        let mut busy = held(&self.busy);
        let looked_after = busy.insert(website_id.to_string(), true).is_some();
        self.marks_waiting(website_id);
        drop(busy);
        if !looked_after {
            self.lets_go(website_id);
        }
    }

    /// Skipped while an integration is busy with this website: a push can
    /// wait minutes on a network, and the user is waiting to open it.
    fn sync(self: &Arc<Self>, website_id: &str) -> Result<(), Failure> {
        let Some(_claimed) = self.claims(website_id, false) else {
            return Ok(());
        };
        match (self.syncs)(website_id) {
            Ok(true) => self.push(website_id),
            Ok(false) => self.statuses.send_modify(|websites| {
                websites.remove(website_id);
            }),
            Err(why) => {
                tracing::warn!("Could not sync website {}: {}", website_id, why.error);
                // Offline would otherwise show the user an error at every opening
                if matches!(why.error, SyncError::ChangedElsewhere(_)) {
                    self.moves_to(website_id, SyncState::Failed, Told(why.clone()));
                }
                return Err(why);
            }
        }
        Ok(())
    }

    /// Waits for whatever an integration is doing with this website, and
    /// pushes what was saved meanwhile after it
    fn alone<T>(self: &Arc<Self>, website_id: &str, work: impl FnOnce() -> T) -> T {
        let _claimed = self.claims(website_id, true);
        work()
    }

    fn claims<'a>(self: &'a Arc<Self>, website_id: &'a str, waits: bool) -> Option<Claimed<'a>> {
        let mut busy = held(&self.busy);
        while busy.contains_key(website_id) {
            if !waits {
                return None;
            }
            busy = self
                .freed
                .wait(busy)
                .unwrap_or_else(|panicked| panicked.into_inner());
        }
        busy.insert(website_id.to_string(), false);
        Some(Claimed(self, website_id))
    }

    fn lets_go(self: &Arc<Self>, website_id: &str) {
        let syncer = self.clone();
        let website_id = website_id.to_string();
        std::thread::spawn(move || {
            let pushing = std::panic::AssertUnwindSafe(|| syncer.keeps_pushing(&website_id));
            if std::panic::catch_unwind(pushing).is_err() {
                held(&syncer.busy).remove(&website_id);
                syncer.freed.notify_all();
                syncer.moves_to(&website_id, SyncState::Failed, Kept);
            }
        });
    }

    /// A publication sent everything: what failed before is behind
    fn published(&self, website_id: &str) {
        self.statuses.send_modify(|websites| {
            if let Some(website) = websites.get_mut(website_id) {
                if website.state == SyncState::Failed {
                    website.state = SyncState::Pushed;
                }
                website.sync_failure = None;
            }
        });
    }

    /// Push this website, and again for as long as saves land while it goes
    fn keeps_pushing(&self, website_id: &str) {
        while self.takes(website_id) {
            self.moves_to(website_id, SyncState::Pushing, Kept);
            let ended = match (self.pushes)(website_id) {
                Ok(true) => Some((SyncState::Pushed, Cleared)),
                Ok(false) => None,
                Err(why) => {
                    tracing::warn!("Could not send website {}: {}", website_id, why.error);
                    Some((SyncState::Failed, Told(why)))
                }
            };
            // Under the lock a save takes to land: one that landed during the
            // attempt must not read as nothing left to send, which Save and quit
            // would believe
            let busy = held(&self.busy);
            match ended {
                Some((_, change)) if busy.get(website_id) == Some(&true) => {
                    self.moves_to(website_id, SyncState::Waiting, change)
                }
                Some((state, change)) => self.moves_to(website_id, state, change),
                None => {
                    self.statuses.send_modify(|websites| {
                        websites.remove(website_id);
                    });
                }
            }
        }
    }

    /// Whether a save is waiting to be pushed, the website being let go otherwise
    fn takes(&self, website_id: &str) -> bool {
        let mut busy = held(&self.busy);
        if let Some(again) = busy.get_mut(website_id) {
            if *again {
                *again = false;
                return true;
            }
        }
        busy.remove(website_id);
        self.freed.notify_all();
        false
    }

    /// Say a save is waiting, unless one is being pushed right now
    fn marks_waiting(&self, website_id: &str) {
        self.statuses
            .send_if_modified(|websites| match websites.get_mut(website_id) {
                Some(website) if website.on_its_way() => false,
                Some(website) => {
                    website.state = SyncState::Waiting;
                    true
                }
                None => {
                    websites.insert(website_id.to_string(), SyncStatus::at(SyncState::Waiting));
                    true
                }
            });
    }

    /// Move a website to a state, and say what became of the error it carried
    fn moves_to(&self, website_id: &str, state: SyncState, change: SyncErrorChange) {
        if let Told(failed) = &change {
            (self.tells)(website_id, failed);
        }
        self.statuses.send_modify(|websites| {
            let website = websites
                .entry(website_id.to_string())
                .or_insert(SyncStatus::at(state));
            website.state = state;
            match change {
                Kept => {}
                Cleared => website.sync_failure = None,
                Told(failure) => website.sync_failure = Some(failure),
            }
        });
    }
}

/// A website held by `claims`, let go however the work ends
///
/// A panic included: an entry left in `busy` would hold the website from every
/// push and publication until Silex quits.
struct Claimed<'a>(&'a Arc<Syncer>, &'a str);

impl Drop for Claimed<'_> {
    fn drop(&mut self) {
        self.0.lets_go(self.1);
    }
}

struct Sent {
    integration: &'static dyn Integration,
    cli: PathBuf,
    /// The host of its remote, as the user knows it
    host: String,
    prepared: Prepared,
    settings_url: Option<String>,
    build_url: Option<String>,
    /// Or why the host could not be asked
    signed_in: Result<bool, String>,
    warning: Option<String>,
}

impl silex_server::Actions for SilexActions {
    /// A website that could not be caught up with is opened as it is, and
    /// what is left to push goes in the background: the user is waiting to
    /// work
    fn website_loading(&self, website_id: &str) {
        let _ = self.syncer.sync(website_id);
    }

    /// Nothing of it goes online: putting a website online is `deploy`
    fn website_saved(&self, website_id: &str) {
        self.syncer.push(website_id);
    }

    /// Sending is not publishing: a repository with its builds turned off
    /// takes every push and serves nothing. The job stays open until the host
    /// has answered.
    fn deploy(&self, website_id: &str, options: &PublicationOptions, job: &Job) {
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

        let Some(remote) = Remote::of(&site) else {
            return;
        };
        job.step("Looking for where your website is kept");
        let Some((answering, repo)) = self
            .integrations
            .get(Capacity::Deploy, &site)
            .next()
            .and_then(|answering| {
                let repo = answering.0.repo(&site)?;
                Some((answering, repo))
            })
        else {
            job.succeeded(message::explained(
                "Your website is written on this computer.",
                &format!(
                    "No integration on this computer handles {}: your website stays on this computer.",
                    remote.host
                ),
                &[on_this_computer()],
            ));
            return;
        };
        // The user is told the host they push to, never the software it runs
        let host = Remote::host_of(&repo).unwrap_or_else(|| repo.clone());
        if let Some(refusal) = answering
            .0
            .refuses(&answering.1, &site, &|step| job.step(step))
        {
            let (label, url) = refusal.button;
            job.failed(message::explained(
                refusal.sentence,
                refusal.why,
                &[Button::secondary(label, url), on_this_computer()],
            ));
            return;
        }
        let sent = self
            .syncer
            .alone(website_id, || {
                let published =
                    self.integrations
                        .publish(answering, &site, &host, options, &|step| job.step(step));
                if published.is_ok() {
                    self.syncer.published(website_id);
                }
                published
            })
            .map(|published| {
                let signed_in = published
                    .urls
                    .as_ref()
                    .map(Option::is_some)
                    .map_err(Clone::clone);
                let urls = published.urls.ok().flatten().unwrap_or_default();
                Sent {
                    build_url: published.integration.watch(&urls, &published.prepared),
                    settings_url: urls.settings,
                    warning: urls.warning,
                    integration: published.integration,
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
                    &format!("Silex could not send your website to {}.", repo),
                    &failure,
                    &[on_this_computer()],
                ));
            }
            Ok(Sent {
                signed_in: Err(why),
                ..
            }) => job.succeeded(message::explained(
                &format!("Your website is sent to {}.", repo),
                &format!("Silex cannot tell whether {} built it: {}", host, why),
                &[on_this_computer()],
            )),
            // The website is taken but nobody is signed in, so there is no way
            // to ask what its build did
            Ok(sent) if sent.signed_in == Ok(false) => {
                let program = sent.integration.program();
                job.succeeded(message::explained(
                    &format!("Your website is sent to {}.", repo),
                    &format!(
                        "Silex cannot tell whether {} built it, because nobody is signed in there. Sign in with the {} command to see the build and the address of your website.",
                        host, program
                    ),
                    &[on_this_computer()],
                ))
            }
            Ok(sent) => watch(job, &site, options, &sent, &files),
        }
    }

    /// A listing asks this of every website, so no program is run.
    fn repo_url(&self, website_id: &str) -> Option<String> {
        let site = self.site_path(website_id)?;
        let (integration, _) = self.integrations.get(Capacity::Sync, &site).next()?;
        integration.repo(&site)
    }

    /// Where the website being edited is kept, named to the editor
    ///
    /// None for a website no integration speaks for: the editor then shows the
    /// file system hosting it showed before, which publishes just as well.
    fn hosting(&self) -> Option<Hosting> {
        let website_id = held(&self.current_website_id).clone()?;
        self.who_hosts(&website_id)
    }
}

impl SilexActions {
    /// Read on this computer, without running a program: the editor asks
    /// each time its publication dialog opens
    fn who_hosts(&self, website_id: &str) -> Option<Hosting> {
        let site = self.site_path(website_id)?;
        let (integration, _) = self.integrations.get(Capacity::Deploy, &site).next()?;
        Some(Hosting {
            connector_id: "fs-hosting",
            display_name: Remote::of(&site)?.host,
            options_form: integration.options_form(&site),
        })
    }
}

/// Ask what the build did, until it says, and tell the user
///
/// The website is live when the host says its build worked, not when a push
/// returned.
fn watch(job: &Job, site: &Path, options: &PublicationOptions, sent: &Sent, files: &str) {
    let host = sent.host.as_str();
    let ask = || sent.integration.build(&sent.cli, site, &sent.prepared);
    let address = || sent.integration.address(&sent.cli, site, options);
    let waiting = |build_url: &str| {
        message::told(
            &format!("Waiting for a build machine on {}", host),
            &[
                Button::secondary("See the build", build_url),
                Button::secondary(FILES_ON_THIS_COMPUTER, files),
            ],
        )
    };
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
    job.progress(waiting(&build_url));
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
                    job.progress(waiting(&build_url));
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
        // A busy forge and a wrong machine name look the same from here, so
        // a queued build gets the time of a real one before Silex gives up
        if queued && started.elapsed() >= A_BUILD_ENDS_WITHIN {
            return job.failed(message::explained(
                &format!("No machine on {} took the build of your website.", host),
                &format!(
                    "{} may be busy, or no machine there has the name in \"Build machine name\". See the build: if it is still waiting, it can start later. On Codeberg the name is codeberg-tiny, and on another server the person who runs it can tell you.",
                    host
                ),
                &[
                    Button::secondary("See the build", &build_url),
                    Button::secondary(FILES_ON_THIS_COMPUTER, files),
                ],
            ));
        }
        if !queued && started.elapsed() >= A_BUILD_STARTS_WITHIN {
            // Never once got an answer: the host could not be asked, which is
            // not it having built nothing
            let never_answered = if answered { None } else { could_not_ask };
            return nothing_built_it(job, host, sent, files, never_answered);
        }
        std::thread::sleep(LOOKING_FOR_THE_BUILD);
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
                return job.succeeded(match address().as_deref() {
                    Some(website) => {
                        job.live_at(website);
                        seen_by_everyone(website)
                    }
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
                        Button::secondary("See the build", url.as_deref().unwrap_or(&build_url)),
                        Button::secondary(FILES_ON_THIS_COMPUTER, files),
                    ],
                ))
            }
            Build::Running(ref url) => job.progress(building(url.as_deref().unwrap_or(&build_url))),
            // A build that went back to waiting was taken and given up, which
            // a runner coming back picks up again
            Build::Queued => job.progress(waiting(&build_url)),
            // Asked again rather than drawn a conclusion from
            Build::Unknown | Build::NotStarted | Build::Refused(_) => {}
        }
        if started.elapsed() >= A_BUILD_ENDS_WITHIN {
            let website = address();
            let mut buttons = vec![Button::secondary("See the build", &build_url)];
            if let Some(website) = website.as_deref() {
                buttons.push(Button::secondary("View your website", website));
            }
            return job.failed(message::explained(
                "The build is taking longer than expected.",
                &format!(
                    "Silex stopped following it after {} minutes. Your website may still come online.",
                    A_BUILD_ENDS_WITHIN.as_secs() / 60
                ),
                &buttons,
            ));
        }
        std::thread::sleep(WHILE_IT_BUILDS);
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
                Button::secondary("See the builds", build_url),
                Button::secondary(FILES_ON_THIS_COMPUTER, files),
            ],
        ));
    }

    job.failed(message::explained(
        &format!("{} did not start a build.", host),
        "Your website was sent, but nothing built it, so it is not online. Check that builds are turned on for this repository, and that your account there is verified.",
        &[
            Button::secondary("Repository settings", settings_url),
            Button::secondary("See the builds", build_url),
            Button::secondary(FILES_ON_THIS_COMPUTER, files),
        ],
    ))
}
