/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

//! Websites made from the templates of the dashboard

use std::time::Duration;

use silex_server::said::{self, Said};
use silex_server::WebsiteId;

use crate::download::{download, not_downloaded};
use crate::WebsitesFolder;

/// Only the Silex group: any page served on localhost can call this command
const TEMPLATES_GROUP: &str = "https://gitlab.com/silex-templates/";

/// The largest template is under 2 MB, and gitlab.com does not say the size ahead
const MAX_ARCHIVE_BYTES: usize = 50 * 1024 * 1024;

fn archive_of(repo_url: &str) -> Option<String> {
    let project = repo_url
        .strip_prefix(TEMPLATES_GROUP)?
        .trim_end_matches('/')
        .trim_end_matches(".git");
    // `..` or a `/` would lead the URL out of the group
    let one_project = !project.is_empty()
        && !project.starts_with('.')
        && project
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "-_.".contains(c));
    one_project.then(|| format!("{TEMPLATES_GROUP}{project}/-/archive/HEAD/archive.tar.gz"))
}

/// Desktop only: the hosted Silex does not make websites from templates this way
#[tauri::command]
pub async fn create_website_from_template(
    folder: tauri::State<'_, WebsitesFolder>,
    name: String,
    repo_url: String,
) -> Result<WebsiteId, Said> {
    let archive = archive_of(&repo_url).ok_or_else(|| {
        Said::new(said::TEMPLATE_ELSEWHERE)
            .with("group", TEMPLATES_GROUP)
            .with("url", &repo_url)
    })?;
    let client = reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(120))
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            if attempt.url().scheme() == "https"
                && attempt.url().host_str() == Some("gitlab.com")
                && attempt.previous().len() < 10
            {
                attempt.follow()
            } else {
                attempt.error("the template is not on gitlab.com")
            }
        }))
        .build()
        .map_err(not_downloaded)?;
    let files = download(&client, &archive, MAX_ARCHIVE_BYTES, || {
        Said::new(said::ARCHIVE_TOO_LARGE).with_number("mb", MAX_ARCHIVE_BYTES / 1024 / 1024)
    })
    .await?;

    silex_server::create_website_from_template(&folder.0, name, files, repo_url)
        .await
        .map_err(Said::from)
}
