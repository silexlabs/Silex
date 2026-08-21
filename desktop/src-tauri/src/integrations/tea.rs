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

use super::deploy::{published_domain, silex_tag, Answer, Deploy, Prepared, Urls};
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

const PIPELINE: &str = ".forgejo/workflows/pages.yml";

pub struct Tea;

impl Deploy for Tea {
    fn program(&self) -> &'static str {
        "tea"
    }

    fn urls(&self, cli: &Path, site: &Path, remote: Option<&Remote>) -> Result<Answer, String> {
        let Some(remote) = remote else {
            return Ok(Answer::No);
        };
        if remote.host != CODEBERG {
            return Ok(Answer::No);
        }
        if !signed_in(cli, site, &remote.host)? {
            return Ok(Answer::NotSignedIn);
        }

        Ok(Answer::Yes(Urls {
            // Codeberg serves a website at an address it decides, and nothing
            // asks it where. What the user named is the one address Silex can
            // be sure of; until they name one there is nothing to show rather
            // than something to guess.
            site: published_domain(site).map(|domain| format!("https://{}/", domain)),
            ci: Some(format!(
                "https://{}/{}/{}/actions",
                remote.host, remote.owner, remote.repo
            )),
            settings: Some("https://docs.codeberg.org/codeberg-pages/using-custom-domain/".to_string()),
        }))
    }

    fn deploy(&self, _cli: &Path, site: &Path) -> Result<Prepared, String> {
        ensure_build_files(site)?;
        ensure_pipeline_file(
            site,
            Path::new(PIPELINE),
            &include_str!("pipelines/forgejo-pages.yml")
                .replace("{site_url}", &site_url(site))
                .replace("{pages_domain}", CODEBERG_PAGES)
                .replace("{runner}", CODEBERG_RUNNER),
        )?;
        super::git::version(site, "Publish website")?;

        // The workflow runs on a tag
        let tag = silex_tag();
        super::git::tag(site, &tag)?;
        Ok(Prepared { tag: Some(tag) })
    }
}

/// Where the workflow publishes to
///
/// The address the user named, when they named one. Otherwise the one Codeberg
/// builds from the repository, which the forge fills in itself so that a
/// repository being renamed does not stop it from publishing.
fn site_url(site: &Path) -> String {
    match published_domain(site) {
        Some(domain) => format!("https://{}/", domain),
        None => format!(
            "https://${{{{ forge.repository_owner }}}}.{}/${{{{ forge.event.repository.name }}}}/",
            CODEBERG_PAGES
        ),
    }
}

/// Whether the user signed in to that instance, read from the config of tea
fn signed_in(cli: &Path, site: &Path, host: &str) -> Result<bool, String> {
    let logins = run(cli, site, &["logins", "list", "-o", "json"])?;
    let logins: Vec<serde_json::Value> =
        serde_json::from_str(&logins).map_err(|e| format!("Could not read the logins of tea: {}", e))?;
    Ok(logins.iter().any(|login| {
        login
            .get("url")
            .and_then(|url| url.as_str())
            .and_then(Remote::host_of)
            .is_some_and(|url_host| url_host == host)
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_workflow_leaves_the_repository_to_the_forge() {
        let nowhere_named = std::env::temp_dir().join("silex-no-such-website");
        let workflow = include_str!("pipelines/forgejo-pages.yml")
            .replace("{site_url}", &site_url(&nowhere_named))
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
        let site = std::env::temp_dir().join(format!("silex-tea-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&site);
        std::fs::create_dir_all(&site).unwrap();

        // Nobody named one: the forge works out its own address
        assert!(site_url(&site).contains("${{ forge.repository_owner }}"));

        std::fs::write(
            site.join("website.json"),
            r#"{ "settings": { "publishDomain": "blog.example.com" } }"#,
        )
        .unwrap();
        assert_eq!(site_url(&site), "https://blog.example.com/");
        let workflow = include_str!("pipelines/forgejo-pages.yml")
            .replace("{site_url}", &site_url(&site))
            .replace("{pages_domain}", CODEBERG_PAGES)
            .replace("{runner}", CODEBERG_RUNNER);
        assert!(workflow.contains("site: https://blog.example.com/"), "{}", workflow);
        // The pages server still has to be named, or the certificate is never
        // asked for
        assert!(workflow.contains("server: codeberg.page"), "{}", workflow);

        let _ = std::fs::remove_dir_all(&site);
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
