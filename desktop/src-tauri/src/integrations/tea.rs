/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The Forgejo command line

use std::path::Path;

use silex_server::{OptionsField, OptionsForm};

use super::deploy::{silex_tag, Answer, Build, Deploy, Prepared, Urls};
use super::pipeline::{ensure_build_files, ensure_pipeline_file};
use super::remote::Remote;
use super::run::run;

/// Codeberg publishes at an address its own documentation states. Another
/// Forgejo serves pages its own way, or not at all, and gets nothing rather
/// than a build failing against somebody else's server.
const CODEBERG: &str = "codeberg.org";

/// The git-pages server that serves what Codeberg publishes
const CODEBERG_PAGES: &str = "codeberg.page";

/// Codeberg names its runners itself, and a job asking for a label no runner
/// has waits forever. Another instance names its own.
///
/// The smallest one: Codeberg lends these machines and asks for the label that
/// matches what a job needs, no more. Building a website there took 45 seconds,
/// download of the build tool included, against the two minutes this label
/// allows. A website that outgrows it is a line to change in the workflow,
/// which the marker at the top of that file explains how to take over.
const CODEBERG_RUNNER: &str = "codeberg-tiny";

/// The repository Codeberg serves at the root of the subdomain of its owner,
/// rather than under a path of its own
const PAGES_REPO: &str = "pages";

const PIPELINE: &str = ".forgejo/workflows/pages.yml";

pub struct Tea;

impl Deploy for Tea {
    fn program(&self) -> &'static str {
        "tea"
    }

    fn display_name(&self) -> &'static str {
        "Codeberg"
    }

    /// tea has no way to ask Codeberg where a repository is served, so the
    /// user is shown the address the documentation states and left to change
    /// it when they have a domain of their own
    fn options_form(&self, site: &Path) -> Option<OptionsForm> {
        let remote = Remote::of(site);
        Some(OptionsForm {
            title: "Codeberg Pages".to_string(),
            fields: vec![OptionsField {
                name: "websiteUrl".to_string(),
                r#type: "url".to_string(),
                label: "Website address".to_string(),
                value: remote.as_ref().map(pages_url),
                help: Some(
                    "This is where Codeberg serves your website. Change it if you have a domain of your own."
                        .to_string(),
                ),
                required: false,
            }],
        })
    }

    fn urls(&self, cli: &Path, site: &Path, website_url: Option<&str>) -> Result<Answer, String> {
        let Some(remote) = Remote::of(site) else {
            return Ok(Answer::No);
        };
        if remote.host != CODEBERG {
            return Ok(Answer::No);
        }
        if login_for(cli, site, &remote.host)?.is_none() {
            return Ok(Answer::NotSignedIn);
        }

        Ok(Answer::Yes(Urls {
            // Codeberg serves a website at an address it decides, and nothing
            // asks it where. What the user named is the one address Silex can
            // be sure of; until they name one there is nothing to show rather
            // than something to guess.
            site: website_url.map(String::from),
            ci: Some(format!(
                "https://{}/{}/{}/actions",
                remote.host, remote.owner, remote.repo
            )),
            // The Units page rather than the settings landing page: Actions are
            // off by default on Codeberg and it is there that they are turned
            // on, which is the one thing that stops a website from being built.
            // Forgejo has no screen for pages: a domain of one's own goes in a
            // `.domains` file in the repository.
            settings: Some(format!(
                "https://{}/{}/{}/settings/units",
                remote.host, remote.owner, remote.repo
            )),
        }))
    }

    fn deploy(&self, cli: &Path, site: &Path, website_url: Option<&str>) -> Result<Prepared, String> {
        ensure_build_files(site)?;
        ensure_pipeline_file(
            site,
            Path::new(PIPELINE),
            &include_str!("pipelines/forgejo-pages.yml")
                .replace("{site_url}", &site_url(website_url))
                .replace("{pages_domain}", CODEBERG_PAGES)
                .replace("{runner}", CODEBERG_RUNNER),
        )?;
        super::git::version(site, "Publish website")?;

        // The workflow runs on a tag
        let tag = silex_tag();
        super::git::tag(site, &tag)?;
        Ok(Prepared {
            tag: Some(tag),
            // Forgejo does not say which push a run came from, so the run at
            // the top of the list before this one is pushed is the mark to tell
            // ours apart from the last publication's
            before: newest_run(&runs(cli, site).unwrap_or_default()),
        })
    }

    /// Forgejo lists the runs of the repository, newest first, and says nothing
    /// about which push each came from: the one this publication started is
    /// whichever is newer than the one that was on top before the push
    fn build(&self, cli: &Path, site: &Path, prepared: &Prepared) -> Result<Build, String> {
        let remote = Remote::of(site);
        // Asked of the forge rather than read out of an error message: whether
        // a repository builds anything is a field it answers, and the sentence
        // it writes when it does not is its own to change.
        if let Some(remote) = &remote {
            let repository = repository(cli, site, remote)?;
            if repository["has_actions"] == serde_json::Value::Bool(false) {
                return Ok(Build::Refused(
                    "Actions are turned off for this repository, so nothing built your website. Turn them on in the repository settings, then publish again."
                        .to_string(),
                ));
            }
            if repository["private"] == serde_json::Value::Bool(true) {
                return Ok(Build::Refused(
                    "Codeberg serves pages from public repositories only, so this website will not come online while its repository is private."
                        .to_string(),
                ));
            }
        }

        let listed = runs(cli, site)?;

        let Some(newest) = newest_run(&listed) else {
            return Ok(Build::NotStarted);
        };
        if Some(&newest) == prepared.before.as_ref() {
            return Ok(Build::NotStarted);
        }

        // No address for the run itself: Forgejo numbers a run inside its
        // repository and the API answers a number of its own, so the user is
        // taken to the list of runs, where theirs is the first
        Ok(match listed[0]["status"].as_str().unwrap_or_default() {
            "success" => Build::Built,
            "failure" | "cancelled" | "canceled" | "skipped" | "blocked" => Build::Failed {
                url: None,
                reason: None,
            },
            // waiting, running, and whatever Forgejo adds next
            _ => Build::Running(None),
        })
    }
}

/// The runs of this repository, newest first, as tea answers them
fn runs(cli: &Path, site: &Path) -> Result<Vec<serde_json::Value>, String> {
    let listed = run(cli, site, &["actions", "runs", "list", "--limit", "5", "-o", "json"])?;
    serde_json::from_str(&listed).map_err(|e| format!("Could not read the runs of tea: {}", e))
}

/// Which run was at the top of the list
fn newest_run(listed: &[serde_json::Value]) -> Option<String> {
    listed.first()?.get("id")?.as_str().map(String::from)
}


/// Where the workflow publishes to
///
/// The address the user named, when they named one. Otherwise the one Codeberg
/// builds from the repository, which the forge fills in itself so that a
/// repository being renamed does not stop it from publishing.
fn site_url(website_url: Option<&str>) -> String {
    match website_url.map(str::trim).filter(|url| !url.is_empty()) {
        // Codeberg serves the website under that address, so the trailing
        // slash is part of it: without it the pages server is told about a
        // file rather than about a site
        Some(url) if url.ends_with('/') => url.to_string(),
        Some(url) => format!("{}/", url),
        None => format!(
            "https://${{{{ forge.repository_owner }}}}.{}/${{{{ forge.event.repository.name }}}}/",
            CODEBERG_PAGES
        ),
    }
}

/// Where Codeberg serves a repository, as its documentation states it
///
/// A repository named `pages` is the site of its owner and is served at the
/// root of their subdomain; every other one is served under its own name.
fn pages_url(remote: &Remote) -> String {
    if remote.repo == PAGES_REPO {
        return format!("https://{}.{}/", remote.owner, CODEBERG_PAGES);
    }
    format!("https://{}.{}/{}/", remote.owner, CODEBERG_PAGES, remote.repo)
}

/// Whether the user signed in to that instance, read from the config of tea
fn login_for(cli: &Path, site: &Path, host: &str) -> Result<Option<String>, String> {
    let logins = run(cli, site, &["logins", "list", "-o", "json"])?;
    let logins: Vec<serde_json::Value> =
        serde_json::from_str(&logins).map_err(|e| format!("Could not read the logins of tea: {}", e))?;
    Ok(logins
        .iter()
        .find(|login| {
            login
                .get("url")
                .and_then(|url| url.as_str())
                .and_then(Remote::host_of)
                .is_some_and(|url_host| url_host == host)
        })
        .and_then(|login| login.get("name"))
        .and_then(|name| name.as_str())
        .map(String::from))
}

/// What the forge says of the repository
///
/// Named to tea, because without a login it answers about whichever instance
/// it fell back to rather than saying it could not tell.
fn repository(cli: &Path, site: &Path, remote: &Remote) -> Result<serde_json::Value, String> {
    let Some(login) = login_for(cli, site, &remote.host)? else {
        return Err(format!("Not signed in to {}", remote.host));
    };
    let said = run(
        cli,
        site,
        &[
            "api",
            "--login",
            &login,
            &format!("repos/{}/{}", remote.owner, remote.repo),
        ],
    )?;
    serde_json::from_str(&said)
        .map_err(|e| format!("Could not read what tea said of the repository: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_workflow_leaves_the_repository_to_the_forge() {
        let workflow = include_str!("pipelines/forgejo-pages.yml")
            .replace("{site_url}", &site_url(None))
            .replace("{pages_domain}", CODEBERG_PAGES)
            .replace("{runner}", CODEBERG_RUNNER);
        // Neither the owner nor the repository name comes from us: the forge
        // fills both, so a repository that is renamed keeps publishing
        assert!(
            workflow.contains(
                "site: https://${{ forge.repository_owner }}.codeberg.page/${{ forge.event.repository.name }}/"
            ),
            "{}",
            workflow
        );
        assert!(workflow.contains("server: codeberg.page"), "the pages server should be named: {}", workflow);
        assert!(workflow.contains("runs-on: codeberg-tiny"), "a runner Codeberg has, sized for the job: {}", workflow);
        // Publishing again without Silex, and one build at a time
        assert!(workflow.contains("workflow_dispatch:"), "{}", workflow);
        assert!(workflow.contains("cancel-in-progress: true"), "{}", workflow);
        assert!(workflow.contains("- '_silex_*'"), "only a Silex tag publishes: {}", workflow);
        // Every placeholder of ours is filled: once what the forge reads
        // itself is taken out, no brace is left
        let ours = workflow.replace("${{", "").replace("}}", "");
        assert!(!ours.contains('{'), "a placeholder was left: {}", ours);
    }

    #[test]
    fn the_address_the_user_named_is_what_the_workflow_publishes_to() {
        // Nobody named one: the forge works out its own address
        assert!(site_url(None).contains("${{ forge.repository_owner }}"));
        // An empty field is nobody having named one either
        assert!(site_url(Some("  ")).contains("${{ forge.repository_owner }}"));

        // Codeberg serves the website under that address, so it ends on a
        // slash whether or not the user typed one
        assert_eq!(site_url(Some("https://blog.example.com")), "https://blog.example.com/");
        assert_eq!(site_url(Some("https://blog.example.com/")), "https://blog.example.com/");

        let workflow = include_str!("pipelines/forgejo-pages.yml")
            .replace("{site_url}", &site_url(Some("https://blog.example.com")))
            .replace("{pages_domain}", CODEBERG_PAGES)
            .replace("{runner}", CODEBERG_RUNNER);
        assert!(workflow.contains("site: https://blog.example.com/"), "{}", workflow);
        // The pages server still has to be named, or the certificate is never
        // asked for
        assert!(workflow.contains("server: codeberg.page"), "{}", workflow);
    }

    #[test]
    fn offers_the_address_codeberg_serves_the_repository_at() {
        let of = |url: &str| pages_url(&Remote::parse(url).unwrap());
        assert_eq!(of("git@codeberg.org:alex/mysite.git"), "https://alex.codeberg.page/mysite/");
        // A repository named `pages` is the site of its owner, served at the
        // root of their subdomain and not under a path of its own
        assert_eq!(of("git@codeberg.org:alex/pages.git"), "https://alex.codeberg.page/");
    }

    #[test]
    fn a_login_on_another_instance_is_not_this_one() {
        // What `tea logins list -o json` gives, cut down to what is read
        let logins = r#"[{"name":"codeberg","url":"https://codeberg.org","ssh_host":"codeberg.org"}]"#;
        let logins: Vec<serde_json::Value> = serde_json::from_str(logins).unwrap();
        let host_of = |host: &str| {
            logins.iter().any(|login| {
                login
                    .get("url")
                    .and_then(|url| url.as_str())
                    .and_then(Remote::host_of)
                    .is_some_and(|url_host| url_host == host)
            })
        };
        assert!(host_of("codeberg.org"));
        assert!(!host_of("v15.next.forgejo.org"));
    }
}
