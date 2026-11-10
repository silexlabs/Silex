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

use super::common::address::{host_of, is_plain_host};
use super::common::git;
use super::common::install::{Archive, Release};
use super::common::pipeline::{ensure_pipeline_file, rebase_lines, write_build_files};
use super::common::remote::{redact, Remote};
use super::common::run::{run, run_fetch, run_waiting, Waiting};
use super::integration::{
    silex_tag, Account, AntiFeature, Build, Capacity, Integration, Openness, Prepared,
    RemoteWebsite, SignIn, SyncError, Synced, Tag, Urls,
};
use crate::locales::key;
use silex_server::said::Said;

/// The instance GitLab runs itself
///
/// Anywhere else the host says nothing on its own, and what glab was signed in
/// to is what tells a GitLab of one's own from any other forge.
const GITLAB: &str = "gitlab.com";

/// What the hosted Silex starts the name of the project of a website with
const SAAS_PREFIX: &str = "silex_";

/// The OAuth applications Silex Labs made for Silex, by server
///
/// gitlab.com has none: glab signs in there with its own, whatever it is told.
const OAUTH_APPLICATIONS: &[(&str, &str)] = &[(
    "framagit.org",
    "3405aaa4e2090b499ee15fc763e093cc6304a82ca34a2cee032f19811fed7bbe",
)];

/// The glab Silex installs, with the checksums GitLab published for it
const RELEASE: Release = Release {
    version: "1.130.0",
    archives: &[
        Archive {
            os: "linux",
            arch: "x86_64",
            url: "https://gitlab.com/gitlab-org/cli/-/releases/v1.130.0/downloads/glab_1.130.0_linux_amd64.tar.gz",
            sha256: "ce06313b2075af25180cd195ab3496d42bc5857c85a1c12ba996838dfe9d822c",
            inside: Some("bin/glab"),
        },
        Archive {
            os: "macos",
            arch: "x86_64",
            url: "https://gitlab.com/gitlab-org/cli/-/releases/v1.130.0/downloads/glab_1.130.0_darwin_amd64.tar.gz",
            sha256: "ea0e53754ed6b38fc92eb8ddaee5b103a5e2bd54db654686f39512022be5744f",
            inside: Some("bin/glab"),
        },
        Archive {
            os: "macos",
            arch: "aarch64",
            url: "https://gitlab.com/gitlab-org/cli/-/releases/v1.130.0/downloads/glab_1.130.0_darwin_arm64.tar.gz",
            sha256: "5791b652e774e4eca85afba1ebfd9db8498138c3311e0ed0a39d19590311f232",
            inside: Some("bin/glab"),
        },
        Archive {
            os: "windows",
            arch: "x86_64",
            url: "https://gitlab.com/gitlab-org/cli/-/releases/v1.130.0/downloads/glab_1.130.0_windows_amd64.zip",
            sha256: "583e51e052d09960b8f1b33a787c50dab8498fb0529d22046c4a2fd94c22e4c8",
            inside: Some("bin/glab"),
        },
    ],
    max_bytes: 100 * 1024 * 1024,
};

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

    fn tagline(&self) -> &'static str {
        key!("Free hosting in the US, fast builds.")
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

    fn release(&self) -> Option<&'static Release> {
        Some(&RELEASE)
    }

    // glab sends with git: better the dialog of Apple now than a failed first send
    fn installed(&self) {
        #[cfg(target_os = "macos")]
        git::offer_apple_developer_tools();
    }

    fn capacities(&self) -> &'static [Capacity] {
        &[Capacity::Sync, Capacity::Deploy]
    }

    fn accounts(&self, _cli: &Path) -> Result<Vec<Account>, Said> {
        Ok(config().as_deref().map(accounts).unwrap_or_default())
    }

    fn servers(&self) -> Vec<&'static str> {
        std::iter::once(GITLAB)
            .chain(OAUTH_APPLICATIONS.iter().map(|(server, _)| *server))
            .collect()
    }

    fn connect(
        &self,
        cli: &Path,
        server: &str,
        client_id: Option<&str>,
        given_up: &AtomicBool,
        open: &dyn Fn(String),
    ) -> Result<String, String> {
        let host = host_of(server, &["https://", "http://"])?;
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
        .map(|_| host)
    }

    fn disconnect(&self, cli: &Path, id: &str) -> Result<(), Said> {
        if !self.accounts(cli)?.iter().any(|account| account.id == id) {
            return Err(Said::raw(format!("glab is not signed in to {}", id)));
        }
        run(
            cli,
            &std::env::temp_dir(),
            &["auth", "logout", &format!("--hostname={}", id)],
        )
        .map(|_| ())
        .map_err(Said::raw)
    }

    fn remote_websites(&self, cli: &Path, account: &str) -> Result<Vec<RemoteWebsite>, String> {
        Ok(projects(cli, account)?
            .into_iter()
            .map(|(website, _)| website)
            .collect())
    }

    fn fetch_website(
        &self,
        cli: &Path,
        account: &str,
        id: &str,
        into: &Path,
    ) -> Result<String, String> {
        // Asked again rather than taken from the dashboard: any page on
        // localhost could name another address to copy
        let (website, url) = projects(cli, account)?
            .into_iter()
            .find(|(website, _)| website.id == id)
            .ok_or_else(|| format!("No Silex website {} on {}", id, account))?;
        git::clone(&url, into, &credentials(cli, account))?;
        Ok(website.name)
    }

    fn has_destination(&self, site: &Path) -> bool {
        git::remote_name(site).is_some()
    }

    fn link_website(&self, cli: &Path, account: &str, name: &str, site: &Path) -> Result<(), Said> {
        if !signed_in_to(account) {
            return Err(Said::raw(format!("glab is not signed in to {}", account)));
        }
        // Before anything is made on the server, where it would stay
        if let Some(sent_to) = git::remote_url(site) {
            return Err(Said::raw(format!(
                "This website is already sent to {}",
                redact(&sent_to)
            )));
        }
        // A website made a moment ago has no version yet, and there would be
        // nothing to send
        silex_server::version(site, "Create website").map_err(Said::raw)?;
        // Named as the hosted Silex names them, and private whatever the
        // server makes by default
        let said = run_fetch(
            cli,
            &std::env::temp_dir(),
            &[
                "api",
                &format!("--hostname={}", account),
                "-X",
                "POST",
                "projects",
                "-f",
                &format!("name={}{}", SAAS_PREFIX, name),
                "-f",
                "visibility=private",
            ],
        )
        .map_err(|why| {
            if why.contains("has already been taken") {
                Said::new(key!(
                    "A project for a website named “{name}” already exists on {server}. Rename this website, then sync it again."
                ))
                    .with("name", name)
                    .with("server", account)
            } else if why.contains("can contain only") {
                Said::new(key!(
                    "GitLab does not accept the name “{name}”. Rename this website with letters, digits, dots, dashes or spaces, then sync it again."
                ))
                .with("name", name)
            } else {
                Said::raw(why)
            }
        })?;
        let created: serde_json::Value =
            serde_json::from_str(&said).map_err(|e| Said::raw(format!("{}: {}", e, said)))?;
        let url = created["http_url_to_repo"].as_str().ok_or_else(|| {
            Said::raw(format!(
                "GitLab did not say which project it made: {}",
                said
            ))
        })?;
        git::set_origin(site, url).map_err(Said::raw)?;
        self.push(cli, site, None)
            .map_err(|error| Said::raw(error.to_string()))
    }

    fn check_account(&self, cli: &Path, id: &str) -> Result<SignIn, Said> {
        if !self.accounts(cli)?.iter().any(|account| account.id == id) {
            return Err(Said::raw(format!("glab is not signed in to {}", id)));
        }
        match run_fetch(
            cli,
            &std::env::temp_dir(),
            &["auth", "status", &format!("--hostname={}", id)],
        ) {
            Ok(_) => Ok(SignIn::Accepted),
            Err(why) if refused(id, &why) => Ok(SignIn::Refused),
            Err(why) => Err(Said::raw(why)),
        }
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
        Remote::of(site).is_some_and(|remote| signed_in_to(&remote.host))
    }

    fn account_of(&self, site: &Path) -> Option<String> {
        Remote::of(site).map(|remote| remote.host)
    }

    fn missing_account(&self, site: &Path) -> Option<String> {
        let host = Remote::of(site)?.host;
        let block = config().and_then(|config| host_block(&config, &host));
        let known = self.servers().contains(&host.as_str()) || block.is_some();
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
        let address = format!("https://{}/{}/{}", remote.host, remote.owner, remote.repo);
        let repo = run(cli, site, &["repo", "view", &address, "-F", "json"]).map_err(|e| {
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
        let (host, project) = project_of(site)?;
        run(cli, site, &["api", &host, &format!("{project}/pages")])
            .ok()
            .and_then(|pages| json_string(&pages, "url"))
    }

    fn deploy(
        &self,
        _cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Prepared, String> {
        // Without a unique domain the site is served from the folder CI_PAGES_URL ends with
        write_build_files(
            site,
            options.ssg,
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

        let (host, project) =
            project_of(site).ok_or_else(|| "This website has no repository".to_string())?;
        let jobs = run(cli, site, &["api", &host, &format!("{project}/jobs")])?;
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

/// Named rather than left to glab, which would pick the remote `upstream` of a
/// website made from a template over the one the website is sent to
fn project_of(site: &Path) -> Option<(String, String)> {
    let remote = Remote::of(site)?;
    Some((
        format!("--hostname={}", remote.host),
        format!(
            "projects/{}%2F{}",
            remote.owner.replace('/', "%2F"),
            remote.repo
        ),
    ))
}

/// git signed in by glab, for this command only and this server only
///
/// So that a user without an ssh key can send their website. A remote over
/// ssh was set by its user, and stays as it is. Nothing is written to the
/// configuration of git: the terminal of the user keeps working as it did.
fn over_https(cli: &Path, site: &Path) -> Vec<String> {
    Remote::of(site)
        .map(|remote| credentials(cli, &remote.host))
        .unwrap_or_default()
}

/// The account glab is signed in to on a host, as git asks for it
fn credentials(cli: &Path, host: &str) -> Vec<String> {
    // Written into a `-c name=value` of git, where it could move the `=`
    if !is_plain_host(host) || !signed_in_to(host) {
        return Vec::new();
    }
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

/// Whether `glab auth status` says the server turned the account down
///
/// glab has no output a program can read: one line per server tells what
/// went wrong, `x <host>: API call failed: <why>`. A token turned down ends
/// it with `401 Unauthorized`, a sign-in in the browser whose renewal was
/// turned down with `invalid_grant`; anything else did not reach the server.
fn refused(host: &str, said: &str) -> bool {
    let failed = format!("x {}: API call failed:", host);
    said.lines()
        .filter_map(|line| line.trim().strip_prefix(&failed))
        .any(|why| {
            (why.contains("Unauthorized")
                && why
                    .split(|c: char| !c.is_ascii_alphanumeric())
                    .any(|word| word == "401"))
                || why.contains("\"invalid_grant\"")
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

/// In the home of the user first, which wins over the XDG folder and the
/// folder of the system when they exist too
fn config_file() -> Option<PathBuf> {
    if let Some(named) = std::env::var_os("GLAB_CONFIG_DIR") {
        return Some(PathBuf::from(named).join("config.yml"));
    }
    dirs::home_dir()
        .map(|home| home.join(".config"))
        .into_iter()
        .chain(std::env::var_os("XDG_CONFIG_HOME").map(PathBuf::from))
        .chain(dirs::config_local_dir())
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

/// The websites of the user on a host, as the hosted Silex lists them, with
/// the address each is copied from
fn projects(cli: &Path, account: &str) -> Result<Vec<(RemoteWebsite, String)>, String> {
    if !signed_in_to(account) {
        return Err(format!("glab is not signed in to {}", account));
    }
    let mut websites = Vec::new();
    // 100 at a time, as many as GitLab gives; a user with more than a
    // thousand websites sees those changed last
    for page in 1..=10 {
        let said = run_fetch(
            cli,
            &std::env::temp_dir(),
            &[
                "api",
                &format!("--hostname={}", account),
                &format!(
                    "projects?owned=true&order_by=last_activity_at&per_page=100&page={}&search={}",
                    page, SAAS_PREFIX
                ),
            ],
        )?;
        let projects: Vec<serde_json::Value> =
            serde_json::from_str(&said).map_err(|e| format!("{}: {}", e, account))?;
        let last = projects.len() < 100;
        websites.extend(projects.iter().filter_map(|project| {
            let deleted = !project["marked_for_deletion_on"].is_null()
                || !project["marked_for_deletion_at"].is_null();
            // `owned` also answers the projects of the groups the user owns
            let personal = project["namespace"]["kind"].as_str() == Some("user");
            let name = project["name"].as_str()?.strip_prefix(SAAS_PREFIX)?;
            (personal && !deleted).then_some(())?;
            Some((
                RemoteWebsite {
                    id: project["id"].as_u64()?.to_string(),
                    name: name.to_string(),
                    place: project["path_with_namespace"].as_str()?.to_string(),
                    changed_at: project["last_activity_at"].as_str().map(String::from),
                    private: project["visibility"].as_str() != Some("public"),
                },
                project["http_url_to_repo"].as_str()?.to_string(),
            ))
        }));
        if last {
            break;
        }
    }
    Ok(websites)
}

#[cfg(test)]
mod tests {
    use super::refused;
    use super::{run, Path, RELEASE};

    // Downloads 19 MB from gitlab.com: cargo test -- --ignored installs_the_glab_of_this_system
    #[test]
    #[ignore]
    fn installs_the_glab_of_this_system() {
        let data_dir = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("target")
            .join("glab-install-test");
        let program =
            crate::integrations::common::install::install(&data_dir, "glab", &RELEASE).unwrap();
        let said = run(&program, &data_dir, &["--version"]).unwrap();
        assert!(said.contains(RELEASE.version), "{said}");
        std::fs::remove_dir_all(&data_dir).unwrap();
    }

    // What glab 1.114 said, run in a VM with a token and a sign-in made wrong
    // on purpose, and with a server that does not exist

    #[test]
    fn tells_a_turned_down_token() {
        let said = "framagit.org\n  x framagit.org: API call failed: GET https://framagit.org/api/v4/user: 401 {message: 401 Unauthorized}\n  ✓ Git operations for framagit.org configured to use ssh protocol.";
        assert!(refused("framagit.org", said));
    }

    #[test]
    fn tells_a_renewal_turned_down() {
        let said = "framagit.org\n  x framagit.org: API call failed: oauth2: \"invalid_grant\" \"The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.\"";
        assert!(refused("framagit.org", said));
    }

    #[test]
    fn does_not_take_a_server_out_of_reach_for_a_refusal() {
        let said = "framagit.invalid\n  x framagit.invalid: API call failed: Get \"https://framagit.invalid/api/v4/user\": dial tcp: lookup framagit.invalid: no such host";
        assert!(!refused("framagit.invalid", said));
    }

    #[test]
    fn reads_only_the_line_of_the_server() {
        let said = "  x gitlab.com: API call failed: GET https://gitlab.com/api/v4/user: 401 {message: 401 Unauthorized}\n  x framagit.org: API call failed: dial tcp: i/o timeout";
        assert!(!refused("framagit.org", said));
    }
}
