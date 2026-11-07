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
use std::sync::atomic::AtomicBool;

use silex_server::PublicationOptions;

use super::common::git;
use super::common::pipeline::{ensure_pipeline_file, rebase_lines, write_build_files};
use super::common::remote::Remote;
use super::common::run::{run, run_waiting, Waiting};
use super::integration::{
    silex_tag, Account, AntiFeature, Build, Capacity, Integration, Openness, Prepared, SyncError,
    Synced, Tag, Urls,
};
use crate::locales::key;

/// The instance GitLab runs itself
///
/// Anywhere else the host says nothing on its own, and what glab was signed in
/// to is what tells a GitLab of one's own from any other forge.
const GITLAB: &str = "gitlab.com";

/// The OAuth applications Silex Labs made for Silex, by server
///
/// gitlab.com has none: glab signs in there with its own, whatever it is told.
const OAUTH_APPLICATIONS: &[(&str, &str)] = &[(
    "framagit.org",
    "3405aaa4e2090b499ee15fc763e093cc6304a82ca34a2cee032f19811fed7bbe",
)];

/// What glab writes when it could not open the browser itself
const COULD_NOT_OPEN: &str = "Failed opening a browser at ";

/// The GitLab logo as Simple Icons draws it: a trademark with no license,
/// shown only to name the service the website is sent to
const GITLAB_LOGO: &str = r#"<svg viewBox="0 0 24 24" fill="currentColor"><path d="m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z"/></svg>"#;

pub struct Glab;

impl Integration for Glab {
    fn program(&self) -> &'static str {
        "glab"
    }

    fn name(&self) -> &'static str {
        "GitLab"
    }

    fn summary(&self) -> &'static str {
        key!("Back up your websites in a project on GitLab, with the history of every change. Publish them online with GitLab Pages: free hosting in the US, fast builds, and your own domain name if you have one.")
    }

    fn tags(&self) -> &'static [Tag] {
        &[Tag::Hosting, Tag::Storage, Tag::Team]
    }

    fn openness(&self) -> Openness {
        Openness::OpenCore
    }

    fn anti_features(&self) -> &'static [AntiFeature] {
        &[
            AntiFeature::Tracking,
            AntiFeature::ProprietaryCloud,
            AntiFeature::IdentityVerification,
        ]
    }

    fn install_url(&self) -> &'static str {
        "https://gitlab.com/gitlab-org/cli#installation"
    }

    fn capacities(&self) -> &'static [Capacity] {
        &[Capacity::Sync, Capacity::Deploy]
    }

    fn accounts(&self, _cli: &Path) -> Result<Vec<Account>, String> {
        Ok(config().as_deref().map(accounts).unwrap_or_default())
    }

    fn connect(
        &self,
        cli: &Path,
        server: &str,
        client_id: Option<&str>,
        given_up: &AtomicBool,
        open: &dyn Fn(String),
    ) -> Result<(), String> {
        let host = host_of(server)?;
        if host != GITLAB {
            make_known(cli, &host, client_id)?;
        }
        let heard = |line: &str| {
            if let Some(page) = line.trim().strip_prefix(COULD_NOT_OPEN) {
                open(page.to_string());
            }
        };
        // Without a terminal glab asks nothing, and leaves git alone
        run_waiting(
            cli,
            &std::env::temp_dir(),
            &["auth", "login", &format!("--hostname={}", host), "--web"],
            &Waiting {
                given_up,
                heard: &heard,
            },
        )
        .map(|_| ())
    }

    fn disconnect(&self, cli: &Path, id: &str) -> Result<(), String> {
        if !self.accounts(cli)?.iter().any(|account| account.id == id) {
            return Err(format!("glab is not signed in to {}", id));
        }
        run(
            cli,
            &std::env::temp_dir(),
            &["auth", "logout", &format!("--hostname={}", id)],
        )
        .map(|_| ())
    }

    fn push(&self, cli: &Path, site: &Path, tag: Option<&str>) -> Result<(), SyncError> {
        let config = over_https(cli, site);
        git::push(site, tag, &config).map_err(|error| signed_out(error, site, &config))
    }

    fn sync(&self, cli: &Path, site: &Path) -> Result<bool, SyncError> {
        let config = over_https(cli, site);
        git::sync(site, &config).map_err(|error| signed_out(error, site, &config))
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

    fn missing_account(&self, site: &Path) -> Option<String> {
        let host = Remote::of(site)?.host;
        let block = config().and_then(|config| host_block(&config, &host));
        let known = OAUTH_APPLICATIONS.iter().any(|(server, _)| *server == host) || block.is_some();
        let signed_in = block.is_some_and(|block| holds_a_login(&block));
        (known && !signed_in).then(|| {
            format!(
                "No GitLab account for {host} on this computer. Sign in to {host} in Integrations."
            )
        })
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

/// git signed in by glab, for this command only and this server only
///
/// So that a user without an ssh key can send their website. A remote over
/// ssh was set by its user, and stays as it is. Nothing is written to the
/// configuration of git: the terminal of the user keeps working as it did.
fn over_https(cli: &Path, site: &Path) -> Vec<String> {
    let Some(host) = Remote::of(site)
        .map(|remote| remote.host)
        // Written into a `-c name=value` of git, where it could move the `=`
        .filter(|host| is_plain_host(host))
        .filter(|host| signed_in_to(host))
    else {
        return Vec::new();
    };
    // git hands the helper to a shell
    let glab = format!("'{}'", cli.display().to_string().replace('\'', r"'\''"));
    vec![
        // The helpers of the user would answer first, with a token of their
        // own, and keep the one of glab once it worked
        format!("credential.https://{host}.helper="),
        format!("credential.https://{host}.helper=!{glab} auth git-credential"),
    ]
}

/// git only says that it got no credentials, or that the host refused them:
/// a token that expired, was revoked or left the configuration of glab, or a
/// remote that names another account
fn signed_out(error: SyncError, site: &Path, config: &[String]) -> SyncError {
    let SyncError::Other(why) = error else {
        return error;
    };
    if config.is_empty() {
        return SyncError::Other(why);
    }
    let host = Remote::of(site)
        .map(|remote| remote.host)
        .unwrap_or_default();
    if why.contains("doesn't match the one that is configured") {
        return SyncError::Other(format!(
            "The address of this website names another account on {host} than the GitLab account you signed in with. Remove that name from the address, or sign in to {host} with that account in Integrations."
        ));
    }
    let refused = [
        "Authentication failed",
        "could not read Username",
        "could not read Password",
    ];
    if refused.iter().any(|said| why.contains(said)) {
        return SyncError::Other(format!(
            "{host} did not accept your GitLab account: it may have expired or been revoked. Sign in to {host} again in Integrations."
        ));
    }
    SyncError::Other(why)
}

fn is_plain_host(host: &str) -> bool {
    host.starts_with(|c: char| c.is_ascii_alphanumeric())
        && host
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || ".-:_".contains(c))
}

/// The host glab is given, from what the user typed or pasted
fn host_of(server: &str) -> Result<String, String> {
    let typed = server.trim();
    let host = typed
        .strip_prefix("https://")
        .or_else(|| typed.strip_prefix("http://"))
        .unwrap_or(typed);
    // A link to a project is pasted as often as the address of the server
    let host = host.split('/').next().unwrap_or_default().to_lowercase();
    if !is_plain_host(&host) {
        return Err(format!("{} is not the address of a server", typed));
    }
    Ok(host)
}

/// Tells glab which OAuth application to sign in to a server other than
/// gitlab.com with
///
/// The one the user gives wins, then the one glab already has, which the user
/// may have made, then the one of Silex.
fn make_known(cli: &Path, host: &str, client_id: Option<&str>) -> Result<(), String> {
    let kept = config()
        .and_then(|config| host_block(&config, host))
        .and_then(|block| value_of(&block, "client_id"));
    let wanted = match client_id.map(str::trim) {
        Some(given) if !given.is_empty() => given,
        _ if kept.is_some() => return Ok(()),
        _ => OAUTH_APPLICATIONS
            .iter()
            .find(|(server, _)| *server == host)
            .map(|(_, id)| *id)
            .ok_or_else(|| {
                format!(
                    "Silex needs the client ID of an OAuth application on {}",
                    host
                )
            })?,
    };
    if kept.as_deref() == Some(wanted) {
        return Ok(());
    }
    if !wanted.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err(format!("{} is not a client ID", wanted));
    }
    run(
        cli,
        &std::env::temp_dir(),
        &[
            "config",
            "set",
            "--global",
            &format!("--host={}", host),
            "client_id",
            wanted,
        ],
    )
    .map(|_| ())
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
    config()
        .and_then(|config| host_block(&config, host))
        .is_some_and(|block| holds_a_login(&block))
}

fn config() -> Option<String> {
    config_file().and_then(|file| std::fs::read_to_string(file).ok())
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
fn host_block(config: &str, host: &str) -> Option<String> {
    host_blocks(config)
        .into_iter()
        .find(|(name, _)| name == host)
        .map(|(_, block)| block)
}

/// Each host of the configuration of glab, with what it holds for it
///
/// Its `hosts:` section has one block per host. Read by hand rather than as
/// YAML: it is one section of one file of another program.
fn host_blocks(config: &str) -> Vec<(String, String)> {
    let mut lines = config
        .lines()
        .skip_while(|line| line.trim_end() != "hosts:");
    if lines.next().is_none() {
        return Vec::new();
    }

    let mut names_at = None;
    let mut hosts: Vec<(String, Vec<&str>)> = Vec::new();
    let mut in_a_host = false;
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
            let name = content.strip_suffix(':');
            in_a_host = name.is_some();
            if let Some(name) = name {
                hosts.push((name.trim_matches(['"', '\'']).to_string(), Vec::new()));
            }
            continue;
        }
        if let (true, Some((_, block))) = (in_a_host, hosts.last_mut()) {
            block.push(content);
        }
    }
    hosts
        .into_iter()
        .map(|(name, block)| (name, block.join("\n")))
        .collect()
}

/// The hosts glab is signed in to, one account each: glab keeps no more
fn accounts(config: &str) -> Vec<Account> {
    host_blocks(config)
        .into_iter()
        .filter(|(_, block)| holds_a_login(block))
        .map(|(host, block)| {
            let user = value_of(&block, "user");
            Account {
                name: user
                    .as_ref()
                    .map_or_else(|| host.clone(), |user| format!("@{}", user)),
                summary: user.map(|_| host.clone()),
                id: host,
            }
        })
        .collect()
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
