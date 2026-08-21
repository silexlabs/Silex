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

use super::deploy::{published_domain, silex_tag, Answer, Deploy, Prepared, Urls};
use super::pipeline::{ensure_build_files, ensure_pipeline_file};
use super::remote::Remote;
use super::run::run;

pub struct Hut;

impl Deploy for Hut {
    fn program(&self) -> &'static str {
        "hut"
    }

    /// hut has a command for it, and refuses the flag the others take
    fn version_args(&self) -> &'static [&'static str] {
        &["version"]
    }

    fn urls(&self, cli: &Path, site: &Path, remote: Option<&Remote>) -> Result<Answer, String> {
        let Some(remote) = remote else {
            return Ok(Answer::No);
        };
        if !is_sourcehut(&remote.host) {
            return Ok(Answer::No);
        }

        // Listing the sites is what proves the user set hut up. Without a
        // config hut says so and stops, which is a no rather than a failure.
        let sites = match run(cli, site, &["pages", "list"]) {
            Ok(sites) => sites,
            Err(e) if never_set_up(&e) => return Ok(Answer::NotSignedIn),
            Err(e) => return Err(e),
        };

        Ok(Answer::Yes(Urls {
            // What the user named, and failing that only a site hut listed:
            // the one this repository will publish to may not exist yet
            site: published_domain(site)
                .or_else(|| published_site(&sites, &remote))
                .map(|host| format!("https://{}", host)),
            ci: Some(format!("https://builds.sr.ht/~{}", remote.owner)),
            settings: Some("https://pages.sr.ht".to_string()),
        }))
    }

    fn deploy(&self, cli: &Path, site: &Path) -> Result<Prepared, String> {
        // git is the one that reads it, and it is the git the user allowed
        let remote = super::git::remote_url(site)
            .and_then(|url| Remote::parse(&url))
            .ok_or("No remote to publish to")?;
        // A hut that was never set up cannot list anything, and the manifest
        // still has to name a site: the default one is where pages.sr.ht puts
        // a user who never published
        let sites = run(cli, site, &["pages", "list"]).unwrap_or_default();
        let site_host = published_domain(site)
            .or_else(|| published_site(&sites, &remote))
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
        super::git::version(site, "Publish website")?;

        // builds.sr.ht would start on any push, so the manifest only lets a
        // Silex tag through: saving a website is not publishing it
        let tag = silex_tag();
        super::git::tag(site, &tag)?;
        Ok(Prepared { tag: Some(tag) })
    }
}

fn is_sourcehut(host: &str) -> bool {
    host == "sr.ht" || host.ends_with(".sr.ht")
}

/// Whether hut stopped because the user never ran `hut init`
///
/// hut writes that one itself, before anything else, and exits. Any other
/// failure is a failure.
fn never_set_up(error: &str) -> bool {
    error.contains("hasn't been set up") || error.contains("hut init")
}

/// Where the build clones the website from
///
/// Built from the parts of the remote rather than passed along as it is: a
/// remote can carry a token, and this address goes into a file that is
/// committed and pushed.
fn clone_url(remote: &Remote) -> String {
    format!("https://{}/~{}/{}", remote.host, remote.owner, remote.repo)
}

/// The site of this user hut already knows about
///
/// hut writes one site per line, as `domain (PROTOCOL)`, so the domain is what
/// comes before the space.
fn published_site(sites: &str, remote: &Remote) -> Option<String> {
    sites
        .lines()
        .map(str::trim)
        .find(|line| line.starts_with(&format!("{}.", remote.owner)))
        .and_then(|line| line.split_whitespace().next())
        .map(String::from)
}

/// Where pages.sr.ht publishes a user by default, which the build manifest has
/// to name before there is anything to list
fn default_site(remote: &Remote) -> String {
    format!("{}.srht.site", remote.owner)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_the_domain_out_of_what_hut_prints() {
        let remote = Remote::parse("git@git.sr.ht:~alex/mysite").unwrap();
        // What `hut pages list` writes: `fmt.Fprintf(p, "%s (%s)\n", domain, protocol)`
        let listed = "alex.srht.site (HTTPS)\nalex.example.com (HTTPS)\n";
        assert_eq!(published_site(listed, &remote).as_deref(), Some("alex.srht.site"));
        // Nothing of this user listed yet: the default is what the manifest names
        assert_eq!(published_site("someone.srht.site (HTTPS)\n", &remote), None);
        assert_eq!(default_site(&remote), "alex.srht.site");
    }

    #[test]
    fn the_manifest_clones_over_https_without_a_token() {
        let remote = Remote::parse("https://oauth2:secret@git.sr.ht/~alex/mysite.git").unwrap();
        let manifest = include_str!("pipelines/sourcehut.build.yml")
            .replace("{clone_url}", &clone_url(&remote))
            .replace("{site_host}", &default_site(&remote))
            .replace("{repo}", &remote.repo);
        assert!(manifest.contains("- https://git.sr.ht/~alex/mysite"), "{}", manifest);
        assert!(!manifest.contains("secret"), "the manifest is committed: {}", manifest);
        assert!(manifest.contains("image: alpine/latest"), "the stable Alpine: {}", manifest);
        assert!(manifest.contains("refs/tags/_silex_*"), "only a Silex tag builds: {}", manifest);
        assert!(!manifest.contains("tar -cvz"), "the file list does not belong in the log");
        assert!(!manifest.contains('{'), "a placeholder was left: {}", manifest);
    }

    #[test]
    fn a_hut_that_was_never_set_up_is_a_no_not_a_failure() {
        // What hut writes itself, before anything else, then exits
        assert!(never_set_up(
            "hut failed: Looks like hut's config file hasn't been set up yet.\nRun `hut init` to configure it."
        ));
        assert!(!never_set_up("hut failed: failed to list sites: connection refused"));
    }
}
