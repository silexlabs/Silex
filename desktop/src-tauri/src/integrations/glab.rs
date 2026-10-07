/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The GitLab command line

use std::path::{Path, PathBuf};

use silex_server::PublicationOptions;

use super::common::git;
use super::common::pipeline::{ensure_pipeline_file, rebase_lines, write_build_files};
use super::common::remote::Remote;
use super::common::run::run;
use super::integration::{
    silex_tag, Build, Capacity, Integration, Prepared, SyncError, Synced, Urls,
};

/// The instance GitLab runs itself
///
/// Anywhere else the host says nothing on its own, and what glab was signed in
/// to is what tells a GitLab of one's own from any other forge.
const GITLAB: &str = "gitlab.com";

/// The GitLab logo as Simple Icons draws it: a trademark with no license,
/// shown only to name the service the website is sent to
const GITLAB_LOGO: &str = r#"<svg viewBox="0 0 24 24" fill="currentColor"><path d="m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z"/></svg>"#;

pub struct Glab;

impl Integration for Glab {
    fn program(&self) -> &'static str {
        "glab"
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
        Some(GITLAB_LOGO)
    }

    fn answers_for(&self, site: &Path) -> bool {
        Remote::of(site).is_some_and(|remote| remote.host == GITLAB || signed_in_to(&remote.host))
    }

    fn urls(
        &self,
        cli: &Path,
        site: &Path,
        _options: &PublicationOptions,
    ) -> Result<Option<Urls>, String> {
        let Some(remote) = Remote::of(site).filter(|remote| signed_in_to(&remote.host)) else {
            return Ok(None);
        };

        // GitLab answers 404 rather than 403 about a private repository
        let repo = run(cli, site, &["repo", "view", "-F", "json"]).map_err(|e| {
            if not_found(&e) {
                format!(
                    "glab is signed in to {} with an account that cannot open this repository.",
                    remote.host
                )
            } else {
                e
            }
        })?;
        let web_url = json_string(&repo, "web_url")
            .ok_or_else(|| format!("{} did not say where the repository is", self.program()))?;

        Ok(Some(Urls {
            ci: Some(format!("{}/-/pipelines", web_url)),
            settings: Some(format!("{}/pages", web_url)),
            warning: kept_from_visitors(&repo).then(|| {
                "Your website is online, but only the members of its repository can open it. GitLab keeps Pages private until you say otherwise, under \"Address and domain\".".to_string()
            }),
        }))
    }

    fn address(&self, cli: &Path, site: &Path, _options: &PublicationOptions) -> Option<String> {
        run(cli, site, &["api", "projects/:fullpath/pages"])
            .ok()
            .and_then(|pages| json_string(&pages, "url"))
    }

    fn deploy(
        &self,
        _cli: &Path,
        site: &Path,
        _options: &PublicationOptions,
    ) -> Result<Prepared, String> {
        // Without a unique domain the site is served from the folder CI_PAGES_URL ends with
        write_build_files(
            site,
            &rebase_lines("$(echo \"$CI_PAGES_URL\" | sed -E 's#^https?://[^/]*##; s#/$##')/"),
        )?;
        ensure_pipeline_file(
            site,
            Path::new(".gitlab-ci.yml"),
            include_str!("pipelines/gitlab-ci.yml"),
        )?;
        silex_server::version(site, "Publish website")?;

        // GitLab Pages starts on a tag
        let tag = silex_tag();
        silex_server::tag(site, &tag)?;
        Ok(Prepared { tag: Some(tag) })
    }

    /// GitLab says which ref each of its jobs ran on
    fn build(&self, cli: &Path, site: &Path, prepared: &Prepared) -> Result<Build, String> {
        // Nothing was tagged, so there is nothing to recognise a job by
        let Some(tag) = prepared.tag.as_deref() else {
            return Ok(Build::Unknown);
        };

        let jobs = run(cli, site, &["api", "projects/:fullpath/jobs"])?;
        let jobs: serde_json::Value = serde_json::from_str(&jobs).map_err(|e| {
            format!(
                "Could not read what {} said about the builds: {}",
                self.program(),
                e
            )
        })?;
        let Some(jobs) = jobs.as_array() else {
            return Err(format!("{} did not list the builds", self.program()));
        };
        // Builds turned off and an unverified account both list nothing at
        // all, and only waiting tells them from a build that is on its way
        let Some(job) = jobs.iter().find(|job| job["ref"].as_str() == Some(tag)) else {
            return Ok(Build::NotStarted);
        };

        let url = job["web_url"].as_str().map(String::from);
        Ok(match job["status"].as_str().unwrap_or_default() {
            "success" => Build::Built,
            "failed" | "canceled" | "cancelled" | "skipped" => Build::Failed {
                url,
                reason: why_it_failed(job["failure_reason"].as_str()),
            },
            // created, waiting_for_resource, preparing, pending, running, and
            // whatever GitLab adds next
            _ => Build::Running(url),
        })
    }

    /// GitLab lists the pipelines of one ref, so the user lands on the
    /// publication that just left
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

/// glab says it on a line of its own, `404 Not Found` or `404 Project Not Found`,
/// and exits with 1 as for any other error
fn not_found(error: &str) -> bool {
    error.lines().any(|line| {
        line.contains("Not Found")
            && line
                .split(|c: char| !c.is_ascii_alphanumeric())
                .any(|word| word == "404")
    })
}

/// Read from what glab keeps rather than from `glab auth status`, which calls
/// the instance and costs a third of a second per website opened
fn signed_in_to(host: &str) -> bool {
    config_file()
        .and_then(|file| std::fs::read_to_string(file).ok())
        .and_then(|config| host_block(&config, host))
        .is_some_and(|block| holds_a_login(&block))
}

/// In the home of the user on every platform, and that one wins over the XDG
/// folder when both exist
fn config_file() -> Option<PathBuf> {
    if let Some(named) = std::env::var_os("GLAB_CONFIG_DIR") {
        return Some(PathBuf::from(named).join("config.yml"));
    }
    dirs::home_dir()
        .map(|home| home.join(".config"))
        .into_iter()
        .chain(std::env::var_os("XDG_CONFIG_HOME").map(PathBuf::from))
        .map(|folder| folder.join("glab-cli").join("config.yml"))
        .find(|file| file.is_file())
}

/// What the configuration of glab holds for one host
///
/// Its `hosts:` section has one block per host. Read by hand rather than as
/// YAML: it is one section of one file of another program.
fn host_block(config: &str, host: &str) -> Option<String> {
    let mut lines = config
        .lines()
        .skip_while(|line| line.trim_end() != "hosts:");
    lines.next()?;

    let mut names_at = None;
    let mut block = Vec::new();
    let mut theirs = false;
    for line in lines {
        let content = line.trim();
        if content.is_empty() || content.starts_with('#') {
            continue;
        }
        let depth = line.len() - line.trim_start().len();
        let names = *names_at.get_or_insert(depth);
        if depth < names {
            break;
        }
        if depth == names {
            if theirs {
                break;
            }
            theirs = content
                .strip_suffix(':')
                .map(|name| name.trim_matches(['"', '\'']))
                == Some(host);
            continue;
        }
        if theirs {
            block.push(content);
        }
    }
    theirs.then(|| block.join("\n"))
}

/// What GitLab said of a build that failed, in words a user can act on
///
/// GitLab answers a code of its own, `script_failure` above all. None for a
/// code nobody wrote a sentence for: the caller then says something plain.
fn why_it_failed(reason: Option<&str>) -> Option<String> {
    let said = match reason? {
        "script_failure" => "Something in your website could not be built. Open the build to read its last lines, then publish again.",
        "stuck_or_timeout_failure" | "job_execution_timeout" => "The build was stopped because it took too long. Publish again to start a new one.",
        "runner_system_failure" | "quota_exceeded" => "GitLab could not run the build this time. Try again in a few minutes.",
        _ => return None,
    };
    Some(said.to_string())
}

/// Whether GitLab is keeping this website to the members of its repository
///
/// The setting is `private` on a new repository, so a user who changed nothing
/// has a published website nobody else can open.
fn kept_from_visitors(repo: &str) -> bool {
    json_string(repo, "pages_access_level").is_some_and(|level| level != "public")
}

/// glab writes the block of gitlab.com from its defaults, signed in or not,
/// so it is what the block holds that answers rather than the block being
/// there
fn holds_a_login(block: &str) -> bool {
    ["token", "oauth2_refresh_token"]
        .iter()
        .any(|key| value_of(block, key).is_some())
        // The token is in the keyring of the system, where glab reads it
        || value_of(block, "use_keyring").is_some_and(|kept| kept == "true" || kept == "1")
}

fn value_of(block: &str, key: &str) -> Option<String> {
    block
        .lines()
        .find_map(|line| line.trim().strip_prefix(&format!("{}:", key)))
        .map(|value| value.trim().trim_matches(['"', '\'']).to_string())
        .filter(|value| !value.is_empty())
}
