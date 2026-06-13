/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Job-related data models for tracking async operations

use serde::{Deserialize, Serialize};

/// Unique identifier for a job
pub type JobId = String;

/// Status of an async job
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum JobStatus {
    /// Job is currently running
    InProgress,

    /// Job completed successfully
    Success,

    /// Job failed with an error
    Error,
}

/// Basic job data for tracking progress
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobData {
    /// Unique job identifier
    pub job_id: JobId,

    /// Current status
    pub status: JobStatus,

    /// Human-readable status message
    pub message: String,
}

/// Extended job data for publication operations
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicationJobData {
    /// Base job data
    #[serde(flatten)]
    pub base: JobData,

    /// Log messages from the publication process
    /// Outer vec is per-connector, inner vec is messages
    pub logs: Vec<Vec<String>>,

    /// Error messages from the publication process
    pub errors: Vec<Vec<String>>,

    /// When the job started (Unix timestamp in milliseconds)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_time: Option<i64>,

    /// When the job ended (Unix timestamp in milliseconds)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<i64>,
}

impl PublicationJobData {
    /// Create a new publication job
    pub fn new(job_id: JobId, message: String) -> Self {
        PublicationJobData {
            base: JobData {
                job_id,
                status: JobStatus::InProgress,
                message: message.clone(),
            },
            logs: vec![vec![message]],
            errors: vec![vec![]],
            start_time: Some(chrono::Utc::now().timestamp_millis()),
            end_time: None,
        }
    }

    /// Add a log message
    pub fn log(&mut self, message: String) {
        if let Some(logs) = self.logs.first_mut() {
            logs.push(message);
        }
    }

    /// Add an error message
    pub fn error(&mut self, message: String) {
        if let Some(errors) = self.errors.first_mut() {
            errors.push(message);
        }
    }

    /// Mark the job as successful
    pub fn success(&mut self, message: String) {
        self.base.status = JobStatus::Success;
        self.base.message = message;
        self.end_time = Some(chrono::Utc::now().timestamp_millis());
    }

    /// Mark the job as failed
    pub fn fail(&mut self, message: String) {
        self.base.status = JobStatus::Error;
        self.base.message = message.clone();
        self.error(message);
        self.end_time = Some(chrono::Utc::now().timestamp_millis());
    }
}
