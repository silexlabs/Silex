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

use silex_server::{PublicationOptions, WEBSITE_URL};

use super::deploy::{silex_tag, Build, Deploy, Prepared, Urls};
use super::pipeline::{ensure_build_files, ensure_pipeline_file};
use super::remote::Remote;
use super::run::run;

/// The instance GitLab runs itself
///
/// A repository there is on GitLab whether or not the user signed in. Anywhere
/// else the host says nothing on its own, and what glab was signed in to is
/// what tells a GitLab of one's own from any other forge.
const GITLAB: &str = "gitlab.com";

pub struct Glab;

impl Deploy for Glab {
    fn program(&self) -> &'static str {
        "glab"
    }

    fn keeps(&self, site: &Path) -> bool {
        Remote::of(site).is_some_and(|remote| remote.host == GITLAB || signed_in_to(&remote.host))
    }

    fn urls(
        &self,
        cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Option<Urls>, String> {
        if !Remote::of(site).is_some_and(|remote| signed_in_to(&remote.host)) {
            return Ok(None);
        }

        let repo = run(cli, site, &["repo", "view", "-F", "json"])?;
        let web_url = json_string(&repo, "web_url")
            .ok_or_else(|| format!("{} did not say where the repository is", self.program()))?;

        // The address the user named is the one to show: they are the ones who
        // know where their domain points, and asking GitLab for its own would
        // cost a request whose answer is only used when nobody named one. A
        // Pages address exists once the site has been published, so before that
        // there is nothing to ask for anyway.
        let site_url = match options.named(WEBSITE_URL) {
            Some(url) => Some(url.to_string()),
            None => run(cli, site, &["api", "projects/:fullpath/pages"])
                .ok()
                .and_then(|pages| json_string(&pages, "url")),
        };

        Ok(Some(Urls {
            site: site_url,
            ci: Some(format!("{}/-/pipelines", web_url)),
            settings: Some(format!("{}/pages", web_url)),
            warning: kept_from_visitors(&repo).then(|| {
                "Your website is online, but only the members of its repository can open it. GitLab keeps Pages private until you say otherwise, under \"Address and domain\".".to_string()
            }),
        }))
    }

    fn deploy(
        &self,
        _cli: &Path,
        site: &Path,
        _options: &PublicationOptions,
    ) -> Result<Prepared, String> {
        ensure_build_files(site)?;
        ensure_pipeline_file(
            site,
            Path::new(".gitlab-ci.yml"),
            include_str!("pipelines/gitlab-ci.yml"),
        )?;
        silex_server::version(site, "Publish website")?;

        // GitLab Pages starts on a tag
        let tag = silex_tag();
        silex_server::tag(site, &tag)?;
        Ok(Prepared {
            tag: Some(tag),
            ..Default::default()
        })
    }

    /// GitLab says which ref each of its jobs ran on, so the one this
    /// publication started is the one on the tag it was given
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

/// Whether the user signed in to that host, read from what glab keeps here
///
/// Asking glab itself means `glab auth status`, which calls the instance:
/// close to a third of a second, spent before a user is told anything, and
/// spent again for every website they open.
fn signed_in_to(host: &str) -> bool {
    config_file()
        .and_then(|file| std::fs::read_to_string(file).ok())
        .and_then(|config| host_block(&config, host))
        .is_some_and(|block| holds_a_login(&block))
}

/// Where glab keeps what it knows
///
/// In the home of the user rather than where the system puts configuration,
/// on every platform, and that one wins over the XDG folder when both exist.
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
/// Its `hosts:` section has one block per host, named by the host itself. Read
/// by hand rather than as YAML: this is one section of one file of another
/// program, and reading it wrong is a website Silex says nothing about.
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

/// Whether GitLab is keeping this website to the members of its repository
///
/// The setting is `private` on a new repository, public or not, so a user who
/// changed nothing has a published website nobody else can open.
fn kept_from_visitors(repo: &str) -> bool {
    json_string(repo, "pages_access_level").is_some_and(|level| level != "public")
}

/// Whether the block of a host holds a way to sign in
///
/// glab writes the block of gitlab.com from its defaults, signed in or not, so
/// it is what the block holds that answers rather than the block being there.
fn holds_a_login(block: &str) -> bool {
    ["token", "oauth2_refresh_token"]
        .iter()
        .any(|key| value_of(block, key).is_some())
        // The token is in the keyring of the system, out of reach here and
        // none of Silex's business: glab reads it when it needs it.
        || value_of(block, "use_keyring").is_some_and(|kept| kept == "true" || kept == "1")
}

fn value_of(block: &str, key: &str) -> Option<String> {
    block
        .lines()
        .find_map(|line| line.trim().strip_prefix(&format!("{}:", key)))
        .map(|value| value.trim().trim_matches(['"', '\'']).to_string())
        .filter(|value| !value.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A published website nobody but its owner can open is worth saying,
    /// and GitLab starts every repository that way
    #[test]
    fn pages_kept_to_the_members_of_a_repository_are_worth_a_word() {
        assert!(kept_from_visitors(r#"{"pages_access_level": "private"}"#));
        assert!(kept_from_visitors(r#"{"pages_access_level": "enabled"}"#));
        assert!(!kept_from_visitors(r#"{"pages_access_level": "public"}"#));

        // Said nothing rather than warned about nothing: an older GitLab that
        // leaves the setting out is not one keeping a website from anybody
        assert!(!kept_from_visitors(
            r#"{"web_url": "https://gitlab.com/a/b"}"#
        ));
    }

    /// What glab writes, shortened: a host of one's own, and gitlab.com as it
    /// stands before anybody signs in
    const CONFIG: &str = r#"
git_protocol: ssh
host: gitlab.com
hosts:
    gitlab.com:
        api_host: gitlab.com
        # Your GitLab access token.
        token:
        use_keyring:
    gitlab.example.com:
        token: glpat-abc123
        user: alex
    keyring.example.com:
        token:
        use_keyring: "true"
"#;

    #[test]
    fn reads_which_hosts_glab_was_signed_in_to() {
        let signed_in = |host| host_block(CONFIG, host).is_some_and(|block| holds_a_login(&block));
        assert!(signed_in("gitlab.example.com"));
        // The token is in the keyring, and the block says so
        assert!(signed_in("keyring.example.com"));
        // glab writes this block whether or not anybody signed in
        assert!(!signed_in("gitlab.com"));
        // A host nobody ever named to glab
        assert!(!signed_in("codeberg.org"));
    }

    #[test]
    fn watches_the_publication_that_just_left_and_not_every_other_one() {
        let pipelines = |project: &str| Urls {
            ci: Some(format!("{project}/-/pipelines")),
            ..Default::default()
        };
        let watched = Glab
            .watch(
                &pipelines("https://gitlab.com/lexoyo/site"),
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

        // Nothing tagged: the user lands on the list and finds theirs at the top
        let every_one = Glab
            .watch(
                &pipelines("https://gitlab.com/lexoyo/site"),
                &Prepared::default(),
            )
            .unwrap();
        assert_eq!(every_one, "https://gitlab.com/lexoyo/site/-/pipelines");
    }
}
