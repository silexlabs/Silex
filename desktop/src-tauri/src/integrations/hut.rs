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

use super::deploy::{silex_tag, Deploy, Prepared, Urls};
use super::pipeline::{ensure_build_files, ensure_pipeline_file};
use super::remote::Remote;
use super::run::run;

pub struct Hut;

impl Deploy for Hut {
    fn program(&self) -> &'static str {
        "hut"
    }

    /// hut lists the sites of a user and nothing ties one of them to a
    /// repository, so the address is asked rather than guessed: publishing to
    /// the wrong site of one's own would overwrite another website
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

    fn keeps(&self, site: &Path) -> bool {
        Remote::of(site).is_some_and(|remote| is_sourcehut(&remote.host))
    }

    fn urls(
        &self,
        cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Option<Urls>, String> {
        // Listing the sites is what proves the user set hut up. Without a
        // config hut says so and stops, which is nobody signed in rather than
        // a failure.
        if let Err(e) = run(cli, site, &["pages", "list"]) {
            if never_set_up(&e) {
                return Ok(None);
            }
            return Err(e);
        }

        let remote = Remote::of(site).ok_or("Silex could not read the remote of this website")?;

        Ok(Some(Urls {
            // Only what the user named. pages.sr.ht ties no site to a
            // repository, so a site hut lists is a site of theirs, not this
            // one's.
            site: options.named(WEBSITE_URL).map(String::from),
            ci: Some(format!("https://builds.sr.ht/~{}", remote.owner)),
            settings: Some("https://pages.sr.ht".to_string()),
        }))
    }

    fn deploy(
        &self,
        _cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Prepared, String> {
        let remote = Remote::of(site).ok_or("No remote to publish to")?;
        // `hut pages publish` is given a domain, where the user named an
        // address: what stands before the first slash is the site it belongs
        // to. Naming none leaves the manifest with where pages.sr.ht puts a
        // user who never published.
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
        // Silex tag through: saving a website is not publishing it
        let tag = silex_tag();
        silex_server::tag(site, &tag)?;
        // No `build`: hut lists the builds of an account without saying which
        // repository or which push each came from, so the one this publication
        // started cannot be told from anybody else's. The user is sent to
        // builds.sr.ht instead of being promised something nobody checked.
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

/// Where pages.sr.ht publishes a user by default, which the build manifest has
/// to name before there is anything to list
fn default_site(remote: &Remote) -> String {
    format!("{}.srht.site", remote.owner)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_manifest_clones_over_https_without_a_token() {
        let remote = Remote::parse("https://oauth2:secret@git.sr.ht/~alex/mysite.git").unwrap();
        let manifest = include_str!("pipelines/sourcehut.build.yml")
            .replace("{clone_url}", &clone_url(&remote))
            .replace("{site_host}", &default_site(&remote))
            .replace("{repo}", &remote.repo);
        assert!(
            manifest.contains("- https://git.sr.ht/~alex/mysite"),
            "{}",
            manifest
        );
        assert!(
            manifest.contains("site: alex.srht.site"),
            "where pages.sr.ht serves this user: {}",
            manifest
        );
        assert!(
            !manifest.contains("secret"),
            "the manifest is committed: {}",
            manifest
        );
        assert!(
            manifest.contains("image: alpine/latest"),
            "the stable Alpine: {}",
            manifest
        );
        assert!(
            manifest.contains("refs/tags/_silex_*"),
            "only a Silex tag builds: {}",
            manifest
        );
        assert!(
            !manifest.contains("tar -cvz"),
            "the file list does not belong in the log"
        );
        assert!(
            !manifest.contains('{'),
            "a placeholder was left: {}",
            manifest
        );
    }

    #[test]
    fn asks_for_the_address_without_offering_one() {
        let form = Hut.options_form(Path::new("/nowhere")).unwrap();
        assert_eq!(form.title, "SourceHut Pages");
        let [field] = &form.fields[..] else {
            panic!("one field, the address: {:?}", form.fields)
        };
        assert_eq!(field.name, WEBSITE_URL);
        assert_eq!(field.r#type, "url");
        // Nothing ties a site of pages.sr.ht to a repository, and a wrong
        // guess would publish over another website of the same user
        assert_eq!(field.value, None);
    }

    #[test]
    fn a_hut_that_was_never_set_up_is_not_a_failure() {
        // What hut writes itself, before anything else, then exits
        assert!(never_set_up(
            "hut failed: Looks like hut's config file hasn't been set up yet.\nRun `hut init` to configure it."
        ));
        assert!(!never_set_up(
            "hut failed: failed to list sites: connection refused"
        ));
    }
}
