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
use super::common::pipeline::{ensure_pipeline_file, rebase_lines, write_build_files};
use super::common::remote::Remote;
use super::common::run::run;
use super::integration::{
    silex_tag, Build, Capacity, Integration, Prepared, SyncError, Synced, Urls,
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

/// The Forgejo logo by Caesar Schinas, CC BY-SA 4.0, without the holes that
/// vanish at the size of text
const FORGEJO_LOGO: &str = r#"<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.7773 0c1.6018 0 2.9004 1.2986 2.9004 2.9005s-1.2986 2.9004-2.9004 2.9004c-1.0854 0-2.0315-.596-2.5288-1.4787H12.91c-2.3322 0-4.2272 1.8718-4.2649 4.195l-.0007 2.1175a7.0759 7.0759 0 0 1 4.148-1.4205l.1176-.001 1.3385.0002c.4973-.8827 1.4434-1.4788 2.5288-1.4788 1.6018 0 2.9004 1.2986 2.9004 2.9005s-1.2986 2.9004-2.9004 2.9004c-1.0854 0-2.0315-.596-2.5288-1.4787H12.91c-2.3322 0-4.2272 1.8718-4.2649 4.195l-.0007 2.319c.8827.4973 1.4788 1.4434 1.4788 2.5287 0 1.602-1.2986 2.9005-2.9005 2.9005-1.6018 0-2.9004-1.2986-2.9004-2.9005 0-1.0853.596-2.0314 1.4788-2.5287l-.0002-9.9831c0-3.887 3.1195-7.0453 6.9915-7.108l.1176-.001h1.3385C14.7458.5962 15.692 0 16.7773 0Z"/></svg>"#;

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

    fn synced(&self, site: &Path) -> Option<Synced> {
        git::synced(site, self.repo(site))
    }

    fn place(&self, site: &Path) -> Option<String> {
        git::place(site)
    }

    fn icon(&self) -> Option<&'static str> {
        Some(FORGEJO_LOGO)
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
                    placeholder: None,
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
                    placeholder: None,
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
                    placeholder: Some("https://www.example.com/".to_string()),
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
        _options: &PublicationOptions,
    ) -> Result<Option<Urls>, String> {
        let Some(remote) = Remote::of(site) else {
            return Ok(None);
        };
        if login_for(cli, site, &remote.host)?.is_none() {
            return Ok(None);
        }

        Ok(Some(Urls {
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

    fn address(&self, _cli: &Path, site: &Path, options: &PublicationOptions) -> Option<String> {
        Remote::of(site).map(|remote| website_url(&remote, options))
    }

    fn deploy(
        &self,
        _cli: &Path,
        site: &Path,
        options: &PublicationOptions,
    ) -> Result<Prepared, String> {
        // Only in the CI, so that a local build stays at the root
        let after_build = match base_path(Remote::of(site).as_ref(), options) {
            Some(path) if path == "/" => vec![],
            Some(path) => rebase_lines(&format!("${{FORGEJO_REPOSITORY:+{path}}}")),
            None => rebase_lines("${FORGEJO_REPOSITORY:+/${FORGEJO_REPOSITORY#*/}/}"),
        };
        write_build_files(site, &after_build)?;
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
        Ok(Prepared { tag: Some(tag) })
    }

    fn build(&self, cli: &Path, site: &Path, prepared: &Prepared) -> Result<Build, String> {
        // Nothing was tagged, so there is nothing to recognise a run by
        let (Some(tag), Some(remote)) = (prepared.tag.as_deref(), Remote::of(site)) else {
            return Ok(Build::Unknown);
        };
        let repository = repository(cli, site, &remote)?;
        if repository["has_actions"] == serde_json::Value::Bool(false) {
            return Ok(Build::Refused(
                "Actions are turned off for this repository, so nothing built your website. Turn them on in the repository settings, then publish again."
                    .to_string(),
            ));
        }

        Ok(build_of(&runs(cli, site, &remote)?, tag))
    }
}

/// The run of this publication, recognised by the tag it ran on
fn build_of(runs: &[serde_json::Value], tag: &str) -> Build {
    let Some(ours) = runs
        .iter()
        .find(|run| run["prettyref"].as_str() == Some(tag))
    else {
        return Build::NotStarted;
    };
    let url = ours["html_url"].as_str().map(String::from);
    match ours["status"].as_str().unwrap_or_default() {
        "waiting" => Build::Queued,
        "success" => Build::Built,
        "failure" | "cancelled" | "canceled" | "skipped" | "blocked" => {
            Build::Failed { url, reason: None }
        }
        // running, and whatever Forgejo adds next
        _ => Build::Running(url),
    }
}

/// The latest runs of this repository
///
/// Through the API rather than `tea actions runs list`, which leaves out the
/// address of each run and the tag it ran on.
fn runs(cli: &Path, site: &Path, remote: &Remote) -> Result<Vec<serde_json::Value>, String> {
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
            &format!(
                "repos/{}/{}/actions/runs?limit=20",
                remote.owner, remote.repo
            ),
        ],
    )?;
    let listed: serde_json::Value = serde_json::from_str(&said)
        .map_err(|e| format!("Could not read what tea said of the runs: {}", e))?;
    Ok(listed["workflow_runs"]
        .as_array()
        .cloned()
        .unwrap_or_default())
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

/// The folder the site is served from, when Silex knows it
///
/// Otherwise it is the name of the repository, which the build reads from the
/// CI so that it still holds after a rename.
fn base_path(remote: Option<&Remote>, options: &PublicationOptions) -> Option<String> {
    if let Some(named) = options.named(WEBSITE_URL) {
        return Some(named_base_path(named));
    }
    match remote {
        Some(remote) if remote.repo == PAGES_REPO => Some("/".to_string()),
        _ => None,
    }
}

/// The folder part of an address the user typed
///
/// It ends up in build.sh, so anything but plain path characters gives the root
/// rather than a line of shell.
fn named_base_path(url: &str) -> String {
    let path = tauri::Url::parse(url)
        .map(|url| url.path().to_string())
        .unwrap_or_default();
    let folder = match path.rsplit_once('/') {
        Some((folder, file)) if file.contains('.') => format!("{folder}/"),
        _ => path,
    };
    let plain = folder
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || "._~%/-".contains(c));
    if plain && folder.starts_with('/') {
        folder
    } else {
        "/".to_string()
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
    fn the_run_of_a_publication_is_the_one_on_its_tag() {
        let runs = serde_json::json!([
            {"prettyref": "_silex_2", "status": "failure", "html_url": "https://codeberg.org/a/b/actions/runs/7"},
            {"prettyref": "_silex_1", "status": "success", "html_url": "https://codeberg.org/a/b/actions/runs/6"}
        ]);
        let runs = runs.as_array().unwrap();
        assert!(matches!(build_of(runs, "_silex_1"), Build::Built));
        assert!(matches!(
            build_of(runs, "_silex_2"),
            Build::Failed { url: Some(url), .. } if url.ends_with("/runs/7")
        ));
        assert!(matches!(build_of(runs, "_silex_3"), Build::NotStarted));
    }

    #[test]
    fn the_base_path_of_a_typed_address() {
        assert_eq!(named_base_path("https://example.com/blog/"), "/blog/");
        assert_eq!(named_base_path("https://example.com/blog"), "/blog");
        assert_eq!(
            named_base_path("https://example.com/blog/index.html"),
            "/blog/"
        );
        assert_eq!(named_base_path("https://example.com"), "/");
        assert_eq!(named_base_path("https://example.com/$(id)/"), "/");
        assert_eq!(named_base_path("not an address"), "/");
    }
}
