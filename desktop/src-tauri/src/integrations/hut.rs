/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The SourceHut command line

use std::path::Path;

use silex_server::{OptionsField, OptionsForm, PublicationOptions, WEBSITE_URL};

use super::common::git;
use super::common::pipeline::{ensure_build_files, ensure_pipeline_file};
use super::common::remote::Remote;
use super::common::run::run;
use super::integration::{silex_tag, Capacity, Integration, Prepared, SyncError, Synced, Urls};

/// The SourceHut logo, CC0, with a thicker ring that reads at the size of text
const SOURCEHUT_LOGO: &str = r#"<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.371 0 0 5.371 0 12s5.371 12 12 12 12-5.371 12-12S18.629 0 12 0Zm0 20a8 8 0 1 1 0-16 8 8 0 1 1 0 16Z"/></svg>"#;

pub struct Hut;

impl Integration for Hut {
    fn program(&self) -> &'static str {
        "hut"
    }

    fn capacities(&self) -> &'static [Capacity] {
        &[Capacity::Sync, Capacity::Deploy]
    }

    fn push(&self, site: &Path, tag: Option<&str>) -> Result<(), SyncError> {
        git::push(site, tag)
    }

    fn sync(&self, site: &Path) -> Result<bool, SyncError> {
        git::sync(site)
    }

    fn synced(&self, site: &Path) -> Option<Synced> {
        git::synced(site, self.repo(site))
    }

    fn place(&self, site: &Path) -> Option<String> {
        git::place(site)
    }

    fn icon(&self) -> Option<&'static str> {
        Some(SOURCEHUT_LOGO)
    }

    /// Nothing ties a site of pages.sr.ht to a repository, so the address is
    /// asked rather than guessed: a wrong guess overwrites another website
    fn options_form(&self, _site: &Path) -> Option<OptionsForm> {
        Some(OptionsForm {
            title: "SourceHut Pages".to_string(),
            fields: vec![OptionsField {
                name: WEBSITE_URL.to_string(),
                r#type: "url".to_string(),
                label: "Website address".to_string(),
                value: None,
                help: Some(
                    "This is the address pages.sr.ht serves your website at. It is your site on sr.ht, or a domain of your own."
                        .to_string(),
                ),
                required: false,
            }],
        })
    }

    /// hut has a command for it, and refuses the flag the others take
    fn version_args(&self) -> &'static [&'static str] {
        &["version"]
    }

    fn answers_for(&self, site: &Path) -> bool {
        Remote::of(site).is_some_and(|remote| is_sourcehut(&remote.host))
    }

    /// sourcehut writes the owner with a leading `~`, which `Remote` drops
    fn repo(&self, site: &Path) -> Option<String> {
        let remote = Remote::of(site)?;
        Some(format!(
            "https://{}/~{}/{}",
            remote.host, remote.owner, remote.repo
        ))
    }

    fn urls(
        &self,
        cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Option<Urls>, String> {
        // Without a config hut says so and stops, which is nobody signed in
        // rather than a failure
        if let Err(e) = run(cli, site, &["pages", "list"]) {
            if never_set_up(&e) {
                return Ok(None);
            }
            return Err(e);
        }

        let remote = Remote::of(site).ok_or(super::common::git::NOWHERE_TO_SEND_IT)?;

        Ok(Some(Urls {
            // Only what the user named: a site hut lists is one of theirs,
            // not this website's
            site: options.named(WEBSITE_URL).map(String::from),
            ci: Some(format!("https://builds.sr.ht/~{}", remote.owner)),
            warning: None,
            settings: Some("https://pages.sr.ht".to_string()),
        }))
    }

    fn deploy(
        &self,
        _cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Prepared, String> {
        let remote = Remote::of(site).ok_or(super::common::git::NOWHERE_TO_SEND_IT)?;
        // `hut pages publish` is given a domain, where the user named an
        // address: what stands before the first slash is the site
        let site_host = options
            .named(WEBSITE_URL)
            .and_then(Remote::host_of)
            .unwrap_or_else(|| default_site(&remote));

        ensure_build_files(site)?;
        ensure_pipeline_file(
            site,
            Path::new(".build.yml"),
            &include_str!("pipelines/sourcehut.build.yml")
                .replace("{clone_url}", &clone_url(&remote))
                .replace("{site_host}", &site_host)
                .replace("{repo}", &remote.repo),
        )?;
        silex_server::version(site, "Publish website")?;

        // builds.sr.ht would start on any push, so the manifest only lets a
        // Silex tag through
        let tag = silex_tag();
        silex_server::tag(site, &tag)?;
        // No `build`: hut lists the builds of an account without saying which
        // repository or push each came from, so ours cannot be told apart
        Ok(Prepared {
            tag: Some(tag),
            ..Default::default()
        })
    }
}

fn is_sourcehut(host: &str) -> bool {
    host == "sr.ht" || host.ends_with(".sr.ht")
}

/// Whether hut stopped because the user never ran `hut init`
fn never_set_up(error: &str) -> bool {
    error.contains("hasn't been set up") || error.contains("hut init")
}

/// Where the build clones the website from
///
/// Built from the parts of the remote rather than passed along: a remote can
/// carry a token, and this address is committed and pushed.
fn clone_url(remote: &Remote) -> String {
    format!("https://{}/~{}/{}", remote.host, remote.owner, remote.repo)
}

/// Where pages.sr.ht publishes a user by default, which the build manifest has
/// to name before there is anything to list
fn default_site(remote: &Remote) -> String {
    format!("{}.srht.site", remote.owner)
}
