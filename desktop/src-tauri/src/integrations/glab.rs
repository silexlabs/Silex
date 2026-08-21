/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The GitLab command line

use std::path::Path;

use super::deploy::{silex_tag, Answer, Build, Deploy, Prepared, Urls};
use super::pipeline::{ensure_build_files, ensure_pipeline_file};
use super::remote::Remote;
use super::run::run;

/// The instance GitLab runs itself
///
/// A repository there is on GitLab whether or not the user signed in, so not
/// being signed in can be told apart from not being GitLab at all. Anywhere
/// else, a host glab does not know could be any forge, and it says so.
const GITLAB: &str = "gitlab.com";

pub struct Glab;

impl Deploy for Glab {
    fn program(&self) -> &'static str {
        "glab"
    }

    fn display_name(&self) -> &'static str {
        "GitLab"
    }

    fn urls(
        &self,
        cli: &Path,
        site: &Path,
        remote: Option<&Remote>,
        website_url: Option<&str>,
    ) -> Result<Answer, String> {
        // Being signed in to that host is what makes a website one of glab's,
        // and glab answers that without reaching the network
        if let Some(remote) = remote {
            if run(cli, site, &["auth", "status", "--hostname", &remote.host]).is_err() {
                return Ok(if remote.host == GITLAB {
                    Answer::NotSignedIn
                } else {
                    Answer::No
                });
            }
        }

        // From here on glab speaks for this website, and what it cannot do is
        // a failure rather than a no. Unless nothing could be read of the
        // remote: glab reads it itself, so it is asked rather than given up on,
        // and it saying no is a no.
        let repo = match run(cli, site, &["repo", "view", "-F", "json"]) {
            Ok(repo) => repo,
            Err(_) if remote.is_none() => return Ok(Answer::No),
            Err(e) => return Err(e),
        };
        let web_url = json_string(&repo, "web_url")
            .ok_or_else(|| format!("{} did not say where the repository is", self.program()))?;

        // The address the user named is the one to show: they are the ones who
        // know where their domain points, and asking GitLab for its own would
        // cost a request whose answer is only used when nobody named one. A
        // Pages address exists once the site has been published, so before that
        // there is nothing to ask for anyway.
        let site_url = match website_url {
            Some(url) => Some(url.to_string()),
            None => run(cli, site, &["api", "projects/:fullpath/pages"])
                .ok()
                .and_then(|pages| json_string(&pages, "url")),
        };

        Ok(Answer::Yes(Urls {
            site: site_url,
            ci: Some(format!("{}/-/pipelines", web_url)),
            settings: Some(format!("{}/pages", web_url)),
        }))
    }

    fn deploy(&self, _cli: &Path, site: &Path, _website_url: Option<&str>) -> Result<Prepared, String> {
        ensure_build_files(site)?;
        ensure_pipeline_file(
            site,
            Path::new(".gitlab-ci.yml"),
            include_str!("pipelines/gitlab-ci.yml"),
        )?;
        super::git::version(site, "Publish website")?;

        // GitLab Pages starts on a tag
        let tag = silex_tag();
        super::git::tag(site, &tag)?;
        Ok(Prepared {
            tag: Some(tag),
            ..Default::default()
        })
    }

    /// GitLab says which ref each of its jobs ran on, so the one this
    /// publication started is the one on the tag it was given
    fn build(
        &self,
        cli: &Path,
        site: &Path,
        _remote: Option<&Remote>,
        prepared: &Prepared,
    ) -> Result<Build, String> {
        // Nothing was tagged, so there is nothing to recognise a job by
        let Some(tag) = prepared.tag.as_deref() else {
            return Ok(Build::Unknown);
        };

        let jobs = run(cli, site, &["api", "projects/:fullpath/jobs"])?;
        let jobs: serde_json::Value = serde_json::from_str(&jobs)
            .map_err(|e| format!("Could not read what {} said about the builds: {}", self.program(), e))?;
        let Some(jobs) = jobs.as_array() else {
            return Err(format!("{} did not list the builds", self.program()));
        };
        // A project whose builds are turned off, and an account GitLab has not
        // verified, both list nothing at all: waiting is what tells them apart
        // from a build that has not appeared yet
        let Some(job) = jobs.iter().find(|job| job["ref"].as_str() == Some(tag)) else {
            return Ok(Build::NotStarted);
        };

        let url = job["web_url"].as_str().map(String::from);
        Ok(match job["status"].as_str().unwrap_or_default() {
            "success" => Build::Built,
            "failed" | "canceled" | "cancelled" | "skipped" => Build::Failed {
                url,
                reason: job["failure_reason"].as_str().map(String::from),
            },
            // created, waiting_for_resource, preparing, pending, running, and
            // whatever GitLab adds next: still going
            _ => Build::Running(url),
        })
    }

    /// GitLab lists the pipelines of one ref, so the user sees the publication
    /// that just left instead of every one that ever ran
    fn watch(&self, urls: &Urls, prepared: &Prepared) -> Option<String> {
        match (urls.ci.as_deref(), prepared.tag.as_deref()) {
            (Some(pipelines), Some(tag)) => Some(format!("{pipelines}?ref={tag}")),
            _ => urls.ci.clone(),
        }
    }
}

fn json_string(output: &str, key: &str) -> Option<String> {
    let value: serde_json::Value = serde_json::from_str(output).ok()?;
    value.get(key)?.as_str().map(String::from)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pipelines_of(project: &str) -> Urls {
        Urls {
            ci: Some(format!("{project}/-/pipelines")),
            ..Default::default()
        }
    }

    #[test]
    fn watches_the_publication_that_just_left_and_not_every_other_one() {
        let watched = Glab
            .watch(
                &pipelines_of("https://gitlab.com/lexoyo/site"),
                &Prepared {
                    tag: Some("_silex_1755773700000".into()),
                    ..Default::default()
                },
            )
            .unwrap();
        assert_eq!(
            watched,
            "https://gitlab.com/lexoyo/site/-/pipelines?ref=_silex_1755773700000"
        );
    }

    #[test]
    fn watches_every_build_when_no_tag_named_one_of_them() {
        let watched = Glab
            .watch(&pipelines_of("https://gitlab.com/lexoyo/site"), &Prepared::default())
            .unwrap();
        assert_eq!(watched, "https://gitlab.com/lexoyo/site/-/pipelines");
    }
}
