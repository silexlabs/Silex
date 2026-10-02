/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The Forgejo command line

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use silex_server::{OptionsField, OptionsForm, PublicationOptions, WEBSITE_URL};

use super::common::git;
use super::common::pipeline::{ensure_build_files, ensure_pipeline_file};
use super::common::remote::Remote;
use super::common::run::run;
use super::integration::{
    silex_tag, Build, Capacity, EarlierBuild, Integration, Prepared, SyncError, Urls,
};
use crate::held::held;

const CODEBERG: &str = "codeberg.org";

const CODEBERG_PAGES: &str = "codeberg.page";
const PAGES_DOMAIN: &str = "pagesDomain";
const RUNNER_LABEL: &str = "runnerLabel";

/// A job asking for a label no runner has waits forever
const CODEBERG_RUNNER: &str = "codeberg-tiny";

/// Served at the root of the subdomain of its owner, not under a path
const PAGES_REPO: &str = "pages";

const PIPELINE: &str = ".forgejo/workflows/pages.yml";

pub struct Tea;

impl Integration for Tea {
    fn program(&self) -> &'static str {
        "tea"
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

    fn options_form(&self, site: &Path) -> Option<OptionsForm> {
        let host = Remote::of(site).map(|remote| remote.host);
        Some(OptionsForm {
            title: format!("{} Pages", host.as_deref().unwrap_or("Forgejo")),
            fields: vec![
                OptionsField {
                    name: PAGES_DOMAIN.to_string(),
                    r#type: "text".to_string(),
                    label: "Pages server domain".to_string(),
                    value: Some(CODEBERG_PAGES.to_string()),
                    help: Some(
                        "This is the domain that serves your pages. Codeberg serves them at codeberg.page. Another Forgejo serves them at a domain of its own."
                            .to_string(),
                    ),
                    required: true,
                },
                OptionsField {
                    name: RUNNER_LABEL.to_string(),
                    r#type: "text".to_string(),
                    label: "Build machine name".to_string(),
                    value: Some(CODEBERG_RUNNER.to_string()),
                    help: Some(
                        "Silex asks a machine on this server to build your website. Codeberg calls its machines codeberg-tiny. On another server the name is different: ask the person who runs it. A wrong name here means your website is never built."
                            .to_string(),
                    ),
                    required: true,
                },
                OptionsField {
                    name: WEBSITE_URL.to_string(),
                    r#type: "url".to_string(),
                    label: "Your own domain".to_string(),
                    value: None,
                    help: Some(
                        "Leave this empty unless you point a domain of your own at your pages. Silex works out the address of your website from the domain above."
                            .to_string(),
                    ),
                    required: false,
                },
            ],
        })
    }

    fn answers_for(&self, site: &Path) -> bool {
        let Some(remote) = Remote::of(site) else {
            return false;
        };
        if remote.host == CODEBERG {
            return true;
        }
        // Forgejo is not one address: a login for that host is what tells it
        // from a GitLab or a sourcehut
        signed_in_to(&remote.host)
    }

    fn urls(
        &self,
        cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Option<Urls>, String> {
        let Some(remote) = Remote::of(site) else {
            return Ok(None);
        };
        if login_for(cli, site, &remote.host)?.is_none() {
            return Ok(None);
        }

        Ok(Some(Urls {
            site: Some(website_url(&remote, options)),
            ci: Some(format!(
                "https://{}/{}/{}/actions",
                remote.host, remote.owner, remote.repo
            )),
            // Actions are off by default and turned on there
            settings: Some(format!(
                "https://{}/{}/{}/settings/units",
                remote.host, remote.owner, remote.repo
            )),
            warning: None,
        }))
    }

    fn deploy(
        &self,
        cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Prepared, String> {
        ensure_build_files(site)?;
        ensure_pipeline_file(
            site,
            Path::new(PIPELINE),
            &include_str!("pipelines/forgejo-pages.yml")
                .replace("{site_url}", &site_url(options))
                .replace("{pages_domain}", pages_domain(options))
                .replace("{runner}", runner_label(options)),
        )?;
        silex_server::version(site, "Publish website")?;

        // The workflow runs on a tag
        let tag = silex_tag();
        silex_server::tag(site, &tag)?;
        Ok(Prepared {
            tag: Some(tag),
            // Forgejo does not say which push a run came from: the run on top
            // before this push is the mark that tells ours from the last one
            before: match runs(cli, site) {
                Ok(listed) => match listed.first().and_then(run_id) {
                    Some(run) => EarlierBuild::Run(run),
                    None => EarlierBuild::Nothing,
                },
                Err(e) => {
                    tracing::warn!("Could not read the runs before publishing: {}", e);
                    EarlierBuild::CouldNotAsk
                }
            },
        })
    }

    fn build(&self, cli: &Path, site: &Path, prepared: &Prepared) -> Result<Build, String> {
        let remote = Remote::of(site);
        if let Some(remote) = &remote {
            let repository = repository(cli, site, remote)?;
            if repository["has_actions"] == serde_json::Value::Bool(false) {
                return Ok(Build::Refused(
                    "Actions are turned off for this repository, so nothing built your website. Turn them on in the repository settings, then publish again."
                        .to_string(),
                ));
            }
            if repository["private"] == serde_json::Value::Bool(true) {
                return Ok(Build::Refused(format!(
                    "{} serves pages from public repositories only, so this website will not come online while its repository is private.",
                    remote.host
                )));
            }
        }

        build_of(&prepared.before, || runs(cli, site))
    }
}

/// The build this publication started, among the runs of the repository
///
/// Without a mark to tell ours from the last publication's, the runs are not
/// even asked for: the user is sent to look rather than promised a website.
fn build_of(
    before: &EarlierBuild,
    runs: impl FnOnce() -> Result<Vec<serde_json::Value>, String>,
) -> Result<Build, String> {
    let mark = match before {
        EarlierBuild::CouldNotAsk => return Ok(Build::Unknown),
        EarlierBuild::Run(run) => Some(run.as_str()),
        EarlierBuild::Nothing => None,
    };

    let listed = runs()?;
    let Some(ours) = listed.first() else {
        return Ok(Build::NotStarted);
    };

    // Still the run that was on top before the push: this publication has not
    // started building yet, and that one is the last publication's
    if run_id(ours).as_deref() == mark {
        return Ok(Build::NotStarted);
    }

    // No address for the run itself: Forgejo numbers it inside the repository
    // and the API answers another number, so the user is sent to the list
    Ok(match ours["status"].as_str().unwrap_or_default() {
        "waiting" => Build::Queued,
        "success" => Build::Built,
        "failure" | "cancelled" | "canceled" | "skipped" | "blocked" => Build::Failed {
            url: None,
            reason: None,
        },
        // running, and whatever Forgejo adds next
        _ => Build::Running(None),
    })
}

/// The runs of this repository, newest first
fn runs(cli: &Path, site: &Path) -> Result<Vec<serde_json::Value>, String> {
    read_runs(&run(
        cli,
        site,
        &["actions", "runs", "list", "--limit", "5", "-o", "json"],
    )?)
}

/// A repository nothing ever built answers a sentence rather than an empty list
fn read_runs(listed: &str) -> Result<Vec<serde_json::Value>, String> {
    if !listed.trim_start().starts_with('[') {
        return Ok(Vec::new());
    }
    serde_json::from_str(listed).map_err(|e| format!("Could not read the runs of tea: {}", e))
}

/// The id comes back as a number on some Forgejo versions and as a string on
/// others
fn run_id(run: &serde_json::Value) -> Option<String> {
    match run.get("id")? {
        serde_json::Value::String(id) => Some(id.clone()),
        serde_json::Value::Number(id) => Some(id.to_string()),
        _ => None,
    }
}

fn pages_domain(options: &PublicationOptions) -> &str {
    options.named(PAGES_DOMAIN).unwrap_or(CODEBERG_PAGES)
}

fn runner_label(options: &PublicationOptions) -> &str {
    options.named(RUNNER_LABEL).unwrap_or(CODEBERG_RUNNER)
}

/// Where the workflow publishes to
///
/// Left to the forge when the user named no address, so that renaming the
/// repository does not stop it from publishing.
fn site_url(options: &PublicationOptions) -> String {
    match options.named(WEBSITE_URL) {
        // Without the trailing slash the pages server is told about a file
        Some(url) if url.ends_with('/') => url.to_string(),
        Some(url) => format!("{}/", url),
        None => format!(
            "https://${{{{ forge.repository_owner }}}}.{}/${{{{ forge.event.repository.name }}}}/",
            pages_domain(options)
        ),
    }
}

/// git-pages serves a repository under the subdomain of its owner, except the
/// one named `pages`, which sits at the root of that subdomain.
fn website_url(remote: &Remote, options: &PublicationOptions) -> String {
    if let Some(named) = options.named(WEBSITE_URL) {
        return named.to_string();
    }
    let domain = pages_domain(options);
    if remote.repo == PAGES_REPO {
        return format!("https://{}.{}/", remote.owner, domain);
    }
    format!("https://{}.{}/{}/", remote.owner, domain, remote.repo)
}

fn login_for(cli: &Path, site: &Path, host: &str) -> Result<Option<String>, String> {
    // Asked again every ten seconds while a publication is followed. Only a
    // login that was found is kept: signing in while Silex is open has to show.
    static KNOWN: Mutex<BTreeMap<String, String>> = Mutex::new(BTreeMap::new());
    if let Some(login) = held(&KNOWN).get(host) {
        return Ok(Some(login.clone()));
    }

    let logins = run(cli, site, &["logins", "list", "-o", "json"])?;
    let logins: Vec<serde_json::Value> = serde_json::from_str(&logins)
        .map_err(|e| format!("Could not read the logins of tea: {}", e))?;
    let login = login_named(&logins, host);
    if let Some(login) = &login {
        held(&KNOWN).insert(host.to_string(), login.clone());
    }
    Ok(login)
}

fn login_named(logins: &[serde_json::Value], host: &str) -> Option<String> {
    logins
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
        .map(String::from)
}

/// Read from the file rather than asked of the program: this is answered at
/// every save, and spawning a process there is felt.
fn signed_in_to(host: &str) -> bool {
    config_file()
        .and_then(|file| std::fs::read_to_string(file).ok())
        .is_some_and(|config| names_the_host(&config, host))
}

fn config_file() -> Option<PathBuf> {
    std::env::var_os("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .into_iter()
        .chain(dirs::home_dir().map(|home| home.join(".config")))
        .map(|folder| folder.join("tea").join("config.yml"))
        .find(|file| file.is_file())
}

/// Read line by line rather than parsed: it is the file of another program.
fn names_the_host(config: &str, host: &str) -> bool {
    config.lines().any(|line| {
        let Some((key, value)) = line.split_once(':') else {
            return false;
        };
        let key = key.trim_start().trim_start_matches("- ").trim();
        let value = value.trim();
        match key {
            "url" => Remote::host_of(value).is_some_and(|named| named == host),
            "ssh_host" => Remote::without_port(value) == host,
            _ => false,
        }
    })
}

/// The login is named, because without one tea answers about whichever
/// instance it fell back to.
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
    fn a_repository_nothing_ever_built_has_no_runs_rather_than_an_error() {
        // What tea answers on the first publication of a website
        assert_eq!(read_runs("No workflow runs found").unwrap().len(), 0);
        assert_eq!(read_runs("").unwrap().len(), 0);
        assert_eq!(read_runs("[]").unwrap().len(), 0);
        assert_eq!(
            read_runs(r#"[{"id": "6560402", "status": "waiting"}]"#)
                .unwrap()
                .len(),
            1
        );
        assert!(read_runs("[{oops").is_err());
    }

    #[test]
    fn a_publication_whose_earlier_runs_could_not_be_read_is_never_called_built() {
        let successful = || Ok(serde_json::from_str(r#"[{"id":842,"status":"success"}]"#).unwrap());

        // That run finished, but nothing says it is not the last publication's
        let unread = build_of(&EarlierBuild::CouldNotAsk, || {
            panic!("the runs tell nothing apart here, so they are not asked")
        });
        assert!(matches!(unread.unwrap(), Build::Unknown));

        // The same run, known to be newer than what was there, and then known
        // to be what was there
        let ours = build_of(&EarlierBuild::Run("841".to_string()), successful);
        assert!(matches!(ours.unwrap(), Build::Built));
        let theirs = build_of(&EarlierBuild::Run("842".to_string()), successful);
        assert!(matches!(theirs.unwrap(), Build::NotStarted));

        let first = build_of(&EarlierBuild::Nothing, successful);
        assert!(matches!(first.unwrap(), Build::Built));
        assert!(matches!(
            build_of(&EarlierBuild::Nothing, || Ok(Vec::new())).unwrap(),
            Build::NotStarted
        ));
    }
}
