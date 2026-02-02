/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Job management service
//!
//! Tracks async jobs like publication operations.
//! Jobs can be queried by ID to check their status.

use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use uuid::Uuid;

use crate::models::{JobId, JobStatus, PublicationJobData};

/// Job manager for tracking async operations
///
/// The job manager maintains a registry of active and completed jobs.
/// Jobs are automatically cleaned up after a timeout (configurable).
#[derive(Clone)]
pub struct JobManager {
    /// Map of job ID to job data
    /// Using RwLock for thread-safe access
    jobs: Arc<RwLock<HashMap<JobId, PublicationJobData>>>,
}

impl JobManager {
    /// Create a new job manager
    pub fn new() -> Self {
        JobManager {
            jobs: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Start a new job
    ///
    /// Creates a new job with a unique ID and IN_PROGRESS status.
    /// Returns the job data with the generated ID.
    pub fn start_job(&self, message: String) -> PublicationJobData {
        let job_id = Uuid::new_v4().to_string();
        let job = PublicationJobData::new(job_id.clone(), message);

        // Store the job in the registry
        let mut jobs = self.jobs.write().unwrap();
        jobs.insert(job_id, job.clone());

        job
    }

    /// Get a job by ID
    ///
    /// Returns None if the job doesn't exist.
    pub fn get_job(&self, job_id: &JobId) -> Option<PublicationJobData> {
        let jobs = self.jobs.read().unwrap();
        jobs.get(job_id).cloned()
    }

    /// Mark a job as completed
    pub fn complete_job(&self, job_id: &JobId) {
        let mut jobs = self.jobs.write().unwrap();
        if let Some(job) = jobs.get_mut(job_id) {
            job.base.status = JobStatus::Success;
            job.end_time = Some(chrono::Utc::now().timestamp_millis());
        }
    }

    /// Mark a job as failed
    pub fn fail_job(&self, job_id: &JobId, error: &str) {
        let mut jobs = self.jobs.write().unwrap();
        if let Some(job) = jobs.get_mut(job_id) {
            job.base.status = JobStatus::Error;
            job.base.message = error.to_string();
            job.error(error.to_string());
            job.end_time = Some(chrono::Utc::now().timestamp_millis());
        }
    }

}

impl Default for JobManager {
    fn default() -> Self {
        Self::new()
    }
}
