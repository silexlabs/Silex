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
    /// `options` is what the editor sent with the publication, the address the
    /// user named among it. It comes from the request rather than from the
    /// website on the disk: publishing is not saving, and reading it back from
    /// a file would answer what the last save happened to hold.
    ///
    /// `job` is what the editor follows. Sending a website to a forge and
    /// waiting for it to build takes minutes, so the answer to the request left
    /// long ago: saying where the publication is, and above all how it ended,
    /// happens here. A job left open when this returns is ended by the server,
    /// which can only promise that the files were written.
    ///
    /// Nothing is deployed by default, which is how a local-only website runs.
    fn deploy(&self, website_id: &str, options: &PublicationOptions, job: &crate::jobs::Job) {
        let _ = (website_id, options, job);
    }

    /// Send a website to wherever it is kept, right after it was versioned.
    ///
    /// Returns at once and answers nothing: sending reaches somebody else's
    /// network, and a save must not wait on that. Nothing is sent by default.
    fn sync(&self, website_id: &str) {
        let _ = website_id;
    }

    /// What serves the website currently open, told to the editor as its
    /// hosting connector.
    ///
    /// No website id is passed: the editor asks for its connector without
    /// naming the website it has open, so the answer is about whichever
    /// website the host application knows is being edited. None when there is
    /// none, or when nothing is known of where it goes, and the editor is then
    /// told of a plain file system hosting.
    fn hosting(&self) -> Option<Hosting> {
        None
    }
}

/// What the editor sent along with a publication
///
/// Only what the server hands over is named; the rest is kept as it came, for
/// whoever knows what to do with it.
#[derive(Debug, Default, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicationOptions {
    /// Where the user says their website is served
    ///
    /// A forge that serves pages does not always say which of its addresses
    /// belongs to which repository, and a domain of one's own is never
    /// something to work out: it is asked of the user before publishing.
    pub website_url: Option<String>,

    /// Anything else the editor sent, relayed as it came
    #[serde(flatten)]
    pub more: serde_json::Map<String, serde_json::Value>,
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
    /// Kept untyped: these are the options of a connector, and the editor
    /// hands them back to the publication as they came.
    pub options: Option<serde_json::Value>,

    /// What the user is asked, when the host cannot say it itself
    pub options_form: Option<OptionsForm>,
}

/// A form the editor shows before publishing
///
/// The programs of the forges do not all know where a website is served: some
/// answer its address, others have no way to tie a repository to a site. What
/// they cannot say is asked of the user, and kept with the website.
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
    ///
    /// Never what they wrote: an address somebody typed is theirs, and a
    /// default worked out here must not take its place.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub help: Option<String>,

    pub required: bool,
}
