/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Publications the editor follows, kept in memory
//!
//! Sending a website to its host and waiting for it to build takes minutes, and
//! an HTTP request held open for that long is one a proxy or a laptop lid
//! closes. So publishing answers straight away with a job, the editor asks
//! about that job every couple of seconds, and whoever does the work says where
//! it is. This is the same contract as the hosted version, which the editor was
//! written against.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::Serialize;

/// How long a finished publication is still answered
///
/// The editor stops asking as soon as a job is over, so this is only for the
/// window where its last question crosses our answer.
const KEPT_AFTER_END: Duration = Duration::from_secs(10 * 60);

/// How long a publication nobody ever finished is kept
///
/// Whoever does the work always ends its job, so reaching this means something
/// went wrong in a way nobody caught. Forgetting it beats holding it forever.
const KEPT_UNFINISHED: Duration = Duration::from_secs(2 * 60 * 60);

/// Where a publication is, as the editor reads it
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum JobStatus {
    InProgress,
    Success,
    Error,
}

/// A publication as the editor expects it, `PublicationJobData` in its types
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobData {
    pub job_id: String,
    pub status: JobStatus,

    /// What the user reads, written as HTML
    ///
    /// The editor puts it in the dialog as it comes, so a sentence can carry
    /// the buttons that go with it: where the build is, where the website is
    /// once it is served. The hosted version writes its messages the same way.
    pub message: String,

    /// The lines the editor shows under "Logs", empty here
    pub logs: Vec<Vec<String>>,

    /// The words of the programs that failed, shown under "Errors"
    ///
    /// Kept apart from the message: a user reads one sentence they can act on,
    /// and what the programs really said is there underneath for the times
    /// when that sentence is not enough.
    pub errors: Vec<Vec<String>>,

    pub start_time: u64,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<u64>,
}

impl JobData {
    fn is_over(&self) -> bool {
        self.status != JobStatus::InProgress
    }
}

/// The publications this server knows about
///
/// Owned by the server, and handed to whoever embeds the crate so that they
/// can follow one of their own publications in a test.
#[derive(Clone, Default)]
pub struct Jobs {
    known: Arc<Mutex<HashMap<String, JobData>>>,
}

impl Jobs {
    /// Open a publication, answered to the editor and reported on afterwards
    pub fn start(&self, message: impl Into<String>) -> Job {
        let job_id = uuid::Uuid::new_v4().to_string();
        let job = JobData {
            job_id: job_id.clone(),
            status: JobStatus::InProgress,
            message: message.into(),
            logs: vec![Vec::new()],
            errors: vec![Vec::new()],
            start_time: now(),
            end_time: None,
        };

        let mut known = self.known.lock().unwrap_or_else(|held| held.into_inner());
        forget_the_old(&mut known);
        known.insert(job_id.clone(), job);
        Job {
            job_id,
            jobs: self.clone(),
        }
    }

    /// Where a publication is, or nothing when it is not one we opened
    pub fn read(&self, job_id: &str) -> Option<JobData> {
        let known = self.known.lock().unwrap_or_else(|held| held.into_inner());
        known.get(job_id).cloned()
    }

    fn change(&self, job_id: &str, change: impl FnOnce(&mut JobData)) {
        let mut known = self.known.lock().unwrap_or_else(|held| held.into_inner());
        match known.get_mut(job_id) {
            Some(job) => change(job),
            // Nothing to do about it, and the publication itself is unaffected:
            // it is only what the editor is told that is lost
            None => tracing::warn!("Nobody is following the publication {}", job_id),
        }
    }
}

/// One publication, as whoever does the work reports on it
///
/// A job is ended once. Saying something after that is refused rather than
/// applied: an answer arriving late must not turn a publication the user was
/// told had failed into a success.
pub struct Job {
    job_id: String,
    jobs: Jobs,
}

impl Job {
    pub fn id(&self) -> &str {
        &self.job_id
    }

    /// Say where the publication is, leaving it open
    pub fn progress(&self, message: impl Into<String>) {
        let message = message.into();
        self.jobs.change(&self.job_id, |job| {
            if !job.is_over() {
                job.message = message;
            }
        });
    }

    /// Note a step of the publication, for whoever opens the logs
    ///
    /// Written as it happens rather than at the end: a publication waits for
    /// minutes, and a bar that moves without saying anything leaves the user
    /// wondering whether it is doing something at all.
    pub fn step(&self, step: impl Into<String>) {
        let step = step.into();
        self.jobs.change(&self.job_id, |job| {
            job.logs[0].push(step);
        });
    }

    /// Say what a program said, for whoever wants to read it
    pub fn detail(&self, said: impl Into<String>) {
        let said = said.into();
        self.jobs.change(&self.job_id, |job| {
            job.errors[0].push(said);
        });
    }

    pub fn succeeded(&self, message: impl Into<String>) {
        self.end(JobStatus::Success, message.into());
    }

    pub fn failed(&self, message: impl Into<String>) {
        self.end(JobStatus::Error, message.into());
    }

    fn end(&self, status: JobStatus, message: String) {
        self.jobs.change(&self.job_id, |job| {
            if job.is_over() {
                return;
            }
            job.status = status;
            job.message = message;
            job.end_time = Some(now());
        });
    }
}

/// Drop the publications nobody can be asking about any more
fn forget_the_old(known: &mut HashMap<String, JobData>) {
    let now = now();
    let older_than = |since: u64, age: Duration| now.saturating_sub(since) > age.as_millis() as u64;
    known.retain(|_, job| match job.end_time {
        Some(ended) => !older_than(ended, KEPT_AFTER_END),
        None => !older_than(job.start_time, KEPT_UNFINISHED),
    });
}

/// The time as the editor reads it, milliseconds since the epoch
fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|since| since.as_millis() as u64)
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_publication_is_answered_until_somebody_ends_it() {
        let jobs = Jobs::default();
        let job = jobs.start("Publishing");

        let answered = jobs.read(job.id()).expect("the editor asks about it right away");
        assert_eq!(answered.status, JobStatus::InProgress);
        assert_eq!(answered.message, "Publishing");
        assert_eq!(answered.end_time, None);

        job.progress("Building");
        assert_eq!(jobs.read(job.id()).unwrap().message, "Building");

        job.succeeded("Your website is now live!");
        let over = jobs.read(job.id()).unwrap();
        assert_eq!(over.status, JobStatus::Success);
        assert!(over.end_time.is_some(), "the editor stops asking on an end time");
    }

    #[test]
    fn what_is_answered_late_does_not_undo_what_the_user_was_told() {
        let jobs = Jobs::default();
        let job = jobs.start("Publishing");
        job.failed("Codeberg did not start a build");

        job.progress("Building");
        job.succeeded("Your website is now live!");

        let over = jobs.read(job.id()).unwrap();
        assert_eq!(over.status, JobStatus::Error);
        assert_eq!(over.message, "Codeberg did not start a build");
    }

    #[test]
    fn the_words_of_a_program_are_kept_beside_the_sentence_the_user_reads() {
        let jobs = Jobs::default();
        let job = jobs.start("Publishing");
        job.detail("git failed: Could not read from remote repository.");
        job.failed("codeberg.org refused the connection.");

        let over = jobs.read(job.id()).unwrap();
        assert_eq!(over.message, "codeberg.org refused the connection.");
        assert_eq!(over.errors[0], ["git failed: Could not read from remote repository."]);
        assert!(!over.message.contains("git failed"), "one sentence to act on, no more");
    }

    #[test]
    fn a_publication_nobody_is_following_any_more_is_forgotten() {
        let jobs = Jobs::default();
        let job = jobs.start("Publishing");
        job.succeeded("Done");

        // Ended long enough ago that the editor cannot still be asking
        {
            let mut known = jobs.known.lock().unwrap();
            let ended = known.get_mut(job.id()).unwrap();
            ended.end_time = Some(now() - KEPT_AFTER_END.as_millis() as u64 - 1);
        }
        let next = jobs.start("Publishing again");

        assert!(jobs.read(job.id()).is_none(), "the old one is gone");
        assert!(jobs.read(next.id()).is_some(), "and the new one is there");
    }

    #[test]
    fn the_editor_reads_the_names_it_was_written_against() {
        let jobs = Jobs::default();
        let job = jobs.start("Publishing");
        let written = serde_json::to_value(jobs.read(job.id()).unwrap()).unwrap();

        // What `PublicationJobData` names in common/types.ts, field for field
        assert!(written["jobId"].is_string());
        assert_eq!(written["status"], "IN_PROGRESS");
        assert_eq!(written["message"], "Publishing");
        assert!(written["logs"].is_array());
        assert!(written["errors"].is_array());
        assert!(written["startTime"].is_number());
        assert!(written.get("endTime").is_none(), "no end until there is one");

        job.failed("Nothing built it");
        let over = serde_json::to_value(jobs.read(job.id()).unwrap()).unwrap();
        assert_eq!(over["status"], "ERROR");
        assert!(over["endTime"].is_number());
    }
}
