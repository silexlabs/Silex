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
//! The server writes the files of a website and its history. Anything reaching
//! further out - running a program, going on a network - is named here and left
//! to whoever embeds the crate. Served alone, nobody listens and nothing happens.

/// Actions the server asks its host application to perform
pub trait Actions: Send + Sync {
    /// Deploy a website, right after its published files were written.
    ///
    /// `options` is what the editor sent with the publication. It comes from
    /// the request rather than from the disk: reading it back from a file
    /// would answer what the last save happened to hold.
    ///
    /// `job` is what the editor follows, and where this says how the
    /// publication ended. A job left open when this returns is ended by the
    /// server, which can only promise that the files were written.
    ///
    /// Nothing is deployed by default, which is how a local-only website runs.
    fn deploy(&self, website_id: &str, options: &PublicationOptions, job: &crate::jobs::Job) {
        let _ = (website_id, options, job);
    }

    /// Take in the versions of a website made somewhere else, before it is read.
    ///
    /// The read waits for it, because after the editor loaded the website
    /// would be too late. Nothing is taken in by default.
    fn sync_pull(&self, website_id: &str) {
        let _ = website_id;
    }

    /// Send a website to wherever it is kept, right after it was versioned.
    ///
    /// Returns at once and answers nothing: a save must not wait on somebody
    /// else's network. Nothing is sent by default, and what was pushed from
    /// elsewhere comes back through `sync_pull`.
    fn sync(&self, website_id: &str) {
        let _ = website_id;
    }

    /// Where the repository of a website is, when the host application knows
    /// of one.
    ///
    /// Asked once per website in a listing, so it is answered without going on
    /// a network. None leaves the folder the server named.
    fn repo_url(&self, website_id: &str) -> Option<String> {
        let _ = website_id;
        None
    }

    /// What serves the website currently open, told to the editor as its
    /// hosting connector.
    ///
    /// No website id is passed: the editor asks without naming the website it
    /// has open. None when nothing is known of where it goes, and the editor
    /// is then told of a plain file system hosting.
    fn hosting(&self) -> Option<Hosting> {
        None
    }
}

/// The key the address of a website is asked and kept under
///
/// Named here because it travels: the form asks for it, the editor keeps it,
/// and the publication sends it back.
pub const WEBSITE_URL: &str = "websiteUrl";

/// What the editor sent along with a publication
///
/// Only what the server hands over is named, the rest is kept as it came.
#[derive(Debug, Default, serde::Deserialize)]
pub struct PublicationOptions {
    /// Every field of the form, under the name the editor sent it with
    #[serde(flatten)]
    pub more: serde_json::Map<String, serde_json::Value>,
}

impl PublicationOptions {
    /// What the user answered to the field of that name
    ///
    /// One way in for every field of an `OptionsForm`, wherever it landed. A
    /// field the user cleared comes back as an empty string, which is nobody
    /// having answered.
    pub fn named(&self, name: &str) -> Option<&str> {
        self.more
            .get(name)
            .and_then(serde_json::Value::as_str)
            .map(str::trim)
            .filter(|answer| !answer.is_empty())
    }
}

/// Where a website is served, as far as its host application knows
#[derive(Debug, Clone)]
pub struct Hosting {
    /// Which connector publishes it, the only one this server answers for
    pub connector_id: &'static str,

    /// The name of the host, as the user knows it
    pub display_name: String,

    /// What publishing already knows, `websiteUrl` among it
    ///
    /// Kept untyped: the editor hands them back to the publication as they
    /// came.
    pub options: Option<serde_json::Value>,

    /// What the user is asked, when the host cannot say it itself
    pub options_form: Option<OptionsForm>,
}

/// A form the editor shows before publishing
///
/// Not every host can tie a repository to the site it serves. What it cannot
/// say is asked of the user, and kept with the website.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OptionsForm {
    pub title: String,
    pub fields: Vec<OptionsField>,
}

/// One thing the user is asked for
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OptionsField {
    /// The key it is kept under in the options of the publication
    pub name: String,

    /// What the browser makes of it: `text`, `url`, `checkbox` or `select`
    pub r#type: String,

    pub label: String,

    /// What to start from, until the user writes something of their own
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub help: Option<String>,

    pub required: bool,
}
