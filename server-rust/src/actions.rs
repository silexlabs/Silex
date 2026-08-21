/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! What the server asks for, once it has written to the disk
//!
//! The server only ever touches files. Anything happening outside of its data
//! path - running a program, versioning a website - is named here and left to
//! whoever embeds the crate. Served alone, nobody listens and nothing happens.

/// Actions the server asks its host application to perform
pub trait Actions: Send + Sync {
    /// Create a version of a website, right after it was saved.
    ///
    /// The save waits for it: a website is only answered for once its version
    /// exists. An error here does not fail the save, the website is on the
    /// disk either way.
    fn version(&self, website_id: &str, message: &str) -> Result<(), String>;

    /// Deploy a website, right after its published files were written.
    ///
    /// None when there is nowhere to deploy to, which is how a local-only
    /// website runs.
    fn deploy(&self, website_id: &str) -> Option<Deployed> {
        let _ = website_id;
        None
    }
}

/// What deploying a website led to, as the editor is told it
#[derive(Debug, Default, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Deployed {
    /// Whether a forge took the website to build and serve it
    pub published: bool,

    /// Where the website is served, once its forge has an address to give
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,

    /// Where the build can be watched
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ci_url: Option<String>,

    /// Where the user sets a domain of their own
    #[serde(skip_serializing_if = "Option::is_none")]
    pub settings_url: Option<String>,

    /// What to tell the user
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,

    /// What the program said, for whoever wants to read it
    ///
    /// Kept apart from the message: a user reads one sentence they can act on,
    /// and the words of git or of a forge program are there underneath for the
    /// times when that sentence is not enough.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,

    /// Whether what is being told is a failure
    #[serde(default, skip_serializing_if = "is_false")]
    pub error: bool,

    /// Anything else the app has to say, relayed as it came
    ///
    /// Naming the fields above is what keeps the editor and the server from
    /// disagreeing on a key. This one is so that saying something new does not
    /// mean it is dropped on the way.
    #[serde(flatten)]
    pub more: serde_json::Map<String, serde_json::Value>,
}

fn is_false(value: &bool) -> bool {
    !*value
}
