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
use super::common::pipeline::{ensure_pipeline_file, write_build_files};
use super::common::remote::Remote;
use super::common::run::{run, run_with_input};
use super::integration::{
    silex_tag, Build, Capacity, Integration, Prepared, Refusal, SyncError, Synced, Urls,
};

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
    fn options_form(&self, site: &Path) -> Option<OptionsForm> {
        Some(OptionsForm {
            title: "SourceHut Pages".to_string(),
            fields: vec![OptionsField {
                name: WEBSITE_URL.to_string(),
                r#type: "url".to_string(),
                label: "Website address".to_string(),
                value: Remote::of(site).map(|remote| format!("https://{}/", default_site(&remote))),
                help: Some(
                    "This is the address pages.sr.ht serves your website at. It is your site on sr.ht, or a domain of your own. SourceHut builds websites only for paid accounts."
                        .to_string(),
                ),
                placeholder: None,
                required: true,
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
        _options: &PublicationOptions,
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
            ci: Some(format!("https://builds.sr.ht/~{}", remote.owner)),
            warning: None,
            settings: Some("https://pages.sr.ht".to_string()),
        }))
    }

    /// Where `deploy` sent it rather than a site hut lists: those are the
    /// account's, not this website's
    fn address(&self, _cli: &Path, site: &Path, options: &PublicationOptions) -> Option<String> {
        if let Some(named) = options.named(WEBSITE_URL) {
            return Some(named.to_string());
        }
        Remote::of(site).map(|remote| format!("https://{}/", default_site(&remote)))
    }

    /// builds.sr.ht takes no job from an unpaid account, and git.sr.ht says
    /// nothing of it: the push works and no build ever comes
    fn refuses(&self, cli: &Path, site: &Path, say: &dyn Fn(String)) -> Option<Refusal> {
        let remote = Remote::of(site)?;
        say(format!("Checking your account on {}", remote.host));
        let answer = run_with_input(
            cli,
            site,
            &["graphql", "meta"],
            "query { me { receivesPaidServices } }",
        )
        .ok()?;
        (!receives_paid_services(&answer)?).then_some(Refusal {
            sentence: "SourceHut builds websites only for paid accounts.",
            why: "Your account on sr.ht is not paid, so nothing was sent.",
            button: ("Billing on SourceHut", "https://meta.sr.ht/billing"),
        })
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

        write_build_files(site, &[])?;
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
        Ok(Prepared {
            tag: Some(tag),
            ..Default::default()
        })
    }

    /// git.sr.ht tags the builds it starts with the repository, and writes the
    /// commit pushed in their note: the commit of our tag tells ours apart
    fn build(&self, cli: &Path, site: &Path, prepared: &Prepared) -> Result<Build, String> {
        let (Some(tag), Some(remote)) = (prepared.tag.as_deref(), Remote::of(site)) else {
            return Ok(Build::Unknown);
        };
        let commit = git2::Repository::open(site)
            .and_then(|repo| {
                repo.revparse_single(&format!("refs/tags/{}^{{commit}}", tag))
                    .map(|commit| commit.id().to_string())
            })
            .map_err(|e| e.message().to_string())?;
        let listed = run(
            cli,
            site,
            &[
                "builds",
                "list",
                "--count",
                "20",
                "--tags",
                &format!("{}/commits/", remote.repo),
            ],
        )?;
        Ok(build_of(&listed, &commit[..7], &remote.owner))
    }
}

/// Our build among those `hut builds list` printed, newest first
///
/// Each starts with a line `#<id> - <tags>: <icon> <STATUS>`, and its note
/// follows, indented, starting with `[<short commit>][0]`.
fn build_of(listed: &str, commit: &str, owner: &str) -> Build {
    let note = format!("[{}]", commit);
    let ours = listed
        .split("\n#")
        .map(|job| job.trim_start_matches('#'))
        .find(|job| job.contains(&note));
    let Some(job) = ours else {
        return Build::NotStarted;
    };
    let header = job.lines().next().unwrap_or_default();
    let id = header.split([' ', ':']).next().unwrap_or_default();
    let url = Some(format!("https://builds.sr.ht/~{}/job/{}", owner, id));
    let status = header.rsplit(' ').next().unwrap_or_default();
    match status.to_ascii_lowercase().as_str() {
        "pending" | "queued" => Build::Queued,
        "success" => Build::Built,
        "failed" | "timeout" | "cancelled" => Build::Failed { url, reason: None },
        // running, and whatever builds.sr.ht adds next
        _ => Build::Running(url),
    }
}

fn receives_paid_services(answer: &str) -> Option<bool> {
    let answer: serde_json::Value = serde_json::from_str(answer).ok()?;
    answer["me"]["receivesPaidServices"].as_bool()
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
