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

use super::deploy::{silex_tag, Build, Deploy, EarlierBuild, Prepared, Urls};
use super::pipeline::{ensure_build_files, ensure_pipeline_file};
use super::remote::Remote;
use super::run::run;

/// A repository there runs on Forgejo whether or not the user signed in.
/// Anywhere else, a login is what says so.
const CODEBERG: &str = "codeberg.org";

/// The domain Codeberg serves pages at, which the field starts from
///
/// Another Forgejo serves them somewhere else, and nothing says where: it is
/// the one thing the user has to name.
const CODEBERG_PAGES: &str = "codeberg.page";

/// The key the pages domain is asked and kept under
const PAGES_DOMAIN: &str = "pagesDomain";

/// The key the label of the runner is asked and kept under
const RUNNER_LABEL: &str = "runnerLabel";

/// Codeberg names its runners itself, and a job asking for a label no runner
/// has waits forever. Another instance names its own.
///
/// The smallest one: Codeberg lends these machines and asks for the label that
/// matches what a job needs, no more. Building a website there took 45 seconds,
/// download of the build tool included, against the two minutes this label
/// allows. A website that outgrows it is a line to change in the workflow,
/// which the marker at the top of that file explains how to take over.
const CODEBERG_RUNNER: &str = "codeberg-tiny";

/// The repository a pages server serves at the root of the subdomain of its
/// owner, rather than under a path of its own
const PAGES_REPO: &str = "pages";

const PIPELINE: &str = ".forgejo/workflows/pages.yml";

pub struct Tea;

impl Deploy for Tea {
    fn program(&self) -> &'static str {
        "tea"
    }

    /// The address of the website follows from the domain its pages are served
    /// at, so that domain is what is asked. A domain of one's own follows from
    /// nothing, so it is asked too, and left empty by the users who have none.
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

    fn keeps(&self, site: &Path) -> bool {
        let Some(remote) = Remote::of(site) else {
            return false;
        };
        if remote.host == CODEBERG {
            return true;
        }
        // Forgejo is not one address: anywhere else, a login tea was given for
        // that host is what says this is a Forgejo at all, and what keeps a
        // GitLab or a sourcehut from being answered for here.
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
            // The Units page rather than the settings landing page: Actions are
            // off by default and it is there that they are turned on, which is
            // the one thing that stops a website from being built.
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
            // Forgejo does not say which push a run came from, so the run at
            // the top of the list before this one is pushed is the mark to tell
            // ours apart from the last publication's
            before: match runs(cli, site) {
                Ok(listed) => match newest_run(&listed) {
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

    /// Forgejo lists the runs of the repository, newest first, and says nothing
    /// about which push each came from: the one this publication started is
    /// whichever is newer than the one that was on top before the push
    fn build(&self, cli: &Path, site: &Path, prepared: &Prepared) -> Result<Build, String> {
        let remote = Remote::of(site);
        // Asked of the forge rather than read out of an error message: whether
        // a repository builds anything is a field it answers, and the sentence
        // it writes when it does not is its own to change.
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

        // Asked after the repository, which answers what is wrong when nothing
        // builds at all
        build_of(&prepared.before, prepared.tag.as_deref(), || {
            runs(cli, site)
        })
    }
}

/// What the runs of the repository say of the publication that was pushed
///
/// The runs are only asked for once they can answer: without a mark to tell
/// ours apart from the last publication's, no run here is this publication's
/// and the user is sent to look rather than promised a website.
fn build_of(
    before: &EarlierBuild,
    tag: Option<&str>,
    runs: impl FnOnce() -> Result<Vec<serde_json::Value>, String>,
) -> Result<Build, String> {
    let mark = match before {
        EarlierBuild::CouldNotAsk => return Ok(Build::Unknown),
        EarlierBuild::Run(run) => Some(run.as_str()),
        EarlierBuild::Nothing | EarlierBuild::NoNeedToKnow => None,
    };

    let listed = runs()?;

    // The run of this publication is the one built from the tag it pushed.
    // Taking the newest instead would call somebody else's push ours: a
    // colleague publishing at the same minute, or a run the repository starts
    // on a timer.
    let ours = match tag {
        Some(tag) => listed
            .iter()
            .find(|run| run["prettyref"].as_str() == Some(tag)),
        None => listed.first(),
    };
    let Some(ours) = ours else {
        return Ok(Build::NotStarted);
    };

    let Some(newest) = newest_run(&listed) else {
        return Ok(Build::NotStarted);
    };
    if Some(newest.as_str()) == mark {
        return Ok(Build::NotStarted);
    }

    // No address for the run itself: Forgejo numbers a run inside its
    // repository and the API answers a number of its own, so the user is
    // taken to the list of runs, where theirs is the first
    Ok(match ours["status"].as_str().unwrap_or_default() {
        // Nobody has taken this build yet, which on a forge whose runners
        // answer to another label is where it stays
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

/// The runs of this repository, newest first, as tea answers them
///
/// A repository nothing ever built gets a sentence rather than an empty list,
/// which is what a website being published for the first time answers.
fn runs(cli: &Path, site: &Path) -> Result<Vec<serde_json::Value>, String> {
    read_runs(&run(
        cli,
        site,
        &["actions", "runs", "list", "--limit", "5", "-o", "json"],
    )?)
}

fn read_runs(listed: &str) -> Result<Vec<serde_json::Value>, String> {
    if !listed.trim_start().starts_with('[') {
        return Ok(Vec::new());
    }
    serde_json::from_str(listed).map_err(|e| format!("Could not read the runs of tea: {}", e))
}

/// Which run was at the top of the list
///
/// Forgejo numbers a run, and answers that number as a number on some versions
/// and as a string on others. Reading only one of the two shapes would have
/// every build read as never started.
fn newest_run(listed: &[serde_json::Value]) -> Option<String> {
    match listed.first()?.get("id")? {
        serde_json::Value::String(id) => Some(id.clone()),
        serde_json::Value::Number(id) => Some(id.to_string()),
        _ => None,
    }
}

/// The domain the pages of this instance are served at
fn pages_domain(options: &PublicationOptions) -> &str {
    options.named(PAGES_DOMAIN).unwrap_or(CODEBERG_PAGES)
}

/// The label the runners of this forge answer to, as the user named it
fn runner_label(options: &PublicationOptions) -> &str {
    options.named(RUNNER_LABEL).unwrap_or(CODEBERG_RUNNER)
}

/// Where the workflow publishes to
///
/// The address the user named, when they named one. Otherwise the one the
/// pages server works out from the repository, which the forge fills in itself
/// so that a repository being renamed does not stop it from publishing.
fn site_url(options: &PublicationOptions) -> String {
    match options.named(WEBSITE_URL) {
        // The website is served under that address, so the trailing slash is
        // part of it: without it the pages server is told about a file rather
        // than about a site
        Some(url) if url.ends_with('/') => url.to_string(),
        Some(url) => format!("{}/", url),
        None => format!(
            "https://${{{{ forge.repository_owner }}}}.{}/${{{{ forge.event.repository.name }}}}/",
            pages_domain(options)
        ),
    }
}

/// Where the website is served
///
/// A domain of one's own points wherever its owner made it point, so it wins
/// over anything worked out here. Without one, git-pages serves a repository
/// under the subdomain of its owner, except the repository named `pages`,
/// which is the site of that owner and sits at the root of the subdomain.
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

/// Whether the user signed in to that instance, read from the config of tea
fn login_for(cli: &Path, site: &Path, host: &str) -> Result<Option<String>, String> {
    // Asked again every ten seconds while a publication is followed, for an
    // answer that is a file on this machine. Only a login that was found is
    // kept: somebody signing in while Silex is open has to be seen.
    static KNOWN: Mutex<BTreeMap<String, String>> = Mutex::new(BTreeMap::new());
    if let Some(login) = KNOWN
        .lock()
        .unwrap_or_else(|held| held.into_inner())
        .get(host)
    {
        return Ok(Some(login.clone()));
    }

    let logins = run(cli, site, &["logins", "list", "-o", "json"])?;
    let logins: Vec<serde_json::Value> = serde_json::from_str(&logins)
        .map_err(|e| format!("Could not read the logins of tea: {}", e))?;
    let login = login_named(&logins, host);
    if let Some(login) = &login {
        KNOWN
            .lock()
            .unwrap_or_else(|held| held.into_inner())
            .insert(host.to_string(), login.clone());
    }
    Ok(login)
}

/// The name tea gave the login it has on that host, among the ones it listed
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

/// Whether tea was given a login for that host
///
/// Read out of the file tea keeps rather than asked of the program: this
/// answers whether a website is ours at all, a user waits behind it, and
/// running a program for it costs a process at every save.
fn signed_in_to(host: &str) -> bool {
    config_file()
        .and_then(|file| std::fs::read_to_string(file).ok())
        .is_some_and(|config| names_the_host(&config, host))
}

/// Where tea keeps what it knows
fn config_file() -> Option<PathBuf> {
    std::env::var_os("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .into_iter()
        .chain(dirs::home_dir().map(|home| home.join(".config")))
        .map(|folder| folder.join("tea").join("config.yml"))
        .find(|file| file.is_file())
}

/// Whether one of the logins of that file is for this host
///
/// Read line by line rather than parsed: this is the file of another program,
/// and the two keys that name a host are the two this reads.
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

/// What the forge says of the repository
///
/// Named to tea, because without a login it answers about whichever instance
/// it fell back to rather than saying it could not tell.
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

    /// The options as the editor sends them, which is JSON
    fn answered(json: &str) -> PublicationOptions {
        serde_json::from_str(json).expect("options of a publication")
    }

    fn workflow(options: &PublicationOptions) -> String {
        include_str!("pipelines/forgejo-pages.yml")
            .replace("{site_url}", &site_url(options))
            .replace("{pages_domain}", pages_domain(options))
            .replace("{runner}", runner_label(options))
    }

    /// A forge whose runners answer to a label of their own still gets a
    /// workflow that runs: the label is asked of the user, like the domain
    #[test]
    fn the_workflow_names_the_runner_the_user_said_they_have() {
        let mine = workflow(&answered(r#"{"runnerLabel": "ubuntu-latest"}"#));
        assert!(mine.contains("runs-on: ubuntu-latest"), "{}", mine);

        // Codeberg is what most users publish to, so its label is what the
        // form offers before anybody answers
        let untouched = workflow(&answered("{}"));
        assert!(
            untouched.contains("runs-on: codeberg-tiny"),
            "{}",
            untouched
        );

        // A field the user emptied is nobody having answered, not a workflow
        // that runs on nothing
        let cleared = workflow(&answered(r#"{"runnerLabel": "  "}"#));
        assert!(cleared.contains("runs-on: codeberg-tiny"), "{}", cleared);
    }

    /// Somebody else pushing at the same minute must not be announced as this
    /// publication going live
    #[test]
    fn the_build_of_this_publication_is_the_one_built_from_its_tag() {
        let both = || {
            Ok(vec![
                serde_json::json!({"id": 9, "prettyref": "main", "status": "success"}),
                serde_json::json!({"id": 8, "prettyref": "_silex_1", "status": "waiting"}),
            ])
        };

        let ours = build_of(&EarlierBuild::Nothing, Some("_silex_1"), both).unwrap();
        assert!(
            matches!(ours, Build::Queued),
            "took the newest run for ours"
        );
    }

    /// A build nobody has taken says so, instead of passing for one that runs
    #[test]
    fn a_build_waiting_for_a_runner_is_not_a_build_that_started() {
        let queued = build_of(&EarlierBuild::Nothing, None, || {
            Ok(vec![serde_json::json!({"id": 1, "status": "waiting"})])
        })
        .unwrap();
        assert!(matches!(queued, Build::Queued));

        let running = build_of(&EarlierBuild::Nothing, None, || {
            Ok(vec![serde_json::json!({"id": 1, "status": "running"})])
        })
        .unwrap();
        assert!(matches!(running, Build::Running(_)));
    }

    #[test]
    fn a_login_of_tea_is_read_from_its_file_without_running_it() {
        // The shape tea writes: a list of logins, each naming its instance
        let config = "logins:\n- name: codeberg\n  url: https://codeberg.org\n  ssh_host: codeberg.org\n  user: alex\n  token: secret\n- name: forgejo-next\n  url: https://v15.next.forgejo.org\n  ssh_host: v15.next.forgejo.org:2150\n  user: alex\n  token: secret\n";
        assert!(names_the_host(config, "codeberg.org"));
        // An instance answering ssh on a port of its own is the same host
        assert!(names_the_host(config, "v15.next.forgejo.org"));
        assert!(!names_the_host(config, "gitlab.com"));
        assert!(!names_the_host(config, "git.sr.ht"));
        // A host named inside a value that is not one of the two keys says
        // nothing about a login
        assert!(!names_the_host(
            "logins:\n- name: github.com\n  url: https://codeberg.org\n",
            "github.com"
        ));
        assert!(!names_the_host("", "codeberg.org"));
    }

    #[test]
    fn a_repository_nothing_ever_built_has_no_runs_rather_than_an_error() {
        // What tea answers on the first publication of a website, where the
        // list of runs it was asked for is a sentence and not a list
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
    fn the_workflow_leaves_the_repository_to_the_forge() {
        let workflow = workflow(&answered("{}"));
        // Neither the owner nor the repository name comes from us: the forge
        // fills both, so a repository that is renamed keeps publishing
        assert!(
            workflow.contains(
                "site: https://${{ forge.repository_owner }}.codeberg.page/${{ forge.event.repository.name }}/"
            ),
            "{}",
            workflow
        );
        assert!(
            workflow.contains("server: codeberg.page"),
            "the pages server should be named: {}",
            workflow
        );
        assert!(
            workflow.contains("runs-on: codeberg-tiny"),
            "a runner Codeberg has, sized for the job: {}",
            workflow
        );
        // Publishing again without Silex, and one build at a time
        assert!(workflow.contains("workflow_dispatch:"), "{}", workflow);
        assert!(
            workflow.contains("cancel-in-progress: true"),
            "{}",
            workflow
        );
        assert!(
            workflow.contains("- '_silex_*'"),
            "only a Silex tag publishes: {}",
            workflow
        );
        // Every placeholder of ours is filled: once what the forge reads
        // itself is taken out, no brace is left
        let ours = workflow.replace("${{", "").replace("}}", "");
        assert!(!ours.contains('{'), "a placeholder was left: {}", ours);
    }

    #[test]
    fn the_domain_the_user_named_is_the_pages_server_of_the_workflow() {
        let elsewhere = workflow(&answered(r#"{"pagesDomain":"pages.example.org"}"#));
        assert!(
            elsewhere.contains("server: pages.example.org"),
            "{}",
            elsewhere
        );
        // Worked out by the forge from the domain it was given, so that a
        // repository being renamed keeps publishing
        assert!(
            elsewhere.contains("${{ forge.repository_owner }}.pages.example.org/"),
            "{}",
            elsewhere
        );

        // Nobody named one: Codeberg, which is what the field starts from
        let untouched = workflow(&answered(r#"{"pagesDomain":"   "}"#));
        assert!(untouched.contains("server: codeberg.page"), "{}", untouched);
    }

    #[test]
    fn the_address_the_user_named_is_what_the_workflow_publishes_to() {
        // Nobody named one: the forge works out its own address
        let site_url = |json: &str| site_url(&answered(json));
        assert!(site_url("{}").contains("${{ forge.repository_owner }}"));
        // An empty field is nobody having named one either
        assert!(site_url(r#"{"websiteUrl":"  "}"#).contains("${{ forge.repository_owner }}"));

        // The website is served under that address, so it ends on a slash
        // whether or not the user typed one
        assert_eq!(
            site_url(r#"{"websiteUrl":"https://blog.example.com"}"#),
            "https://blog.example.com/"
        );
        assert_eq!(
            site_url(r#"{"websiteUrl":"https://blog.example.com/"}"#),
            "https://blog.example.com/"
        );

        let named = workflow(&answered(r#"{"websiteUrl":"https://blog.example.com"}"#));
        assert!(
            named.contains("site: https://blog.example.com/"),
            "{}",
            named
        );
        // The pages server still has to be named, or the certificate is never
        // asked for
        assert!(named.contains("server: codeberg.page"), "{}", named);
    }

    #[test]
    fn the_address_is_worked_out_from_the_pages_domain() {
        let served = |remote: &str, json: &str| {
            website_url(&Remote::parse(remote).unwrap(), &answered(json))
        };

        assert_eq!(
            served("git@codeberg.org:alex/mysite.git", "{}"),
            "https://alex.codeberg.page/mysite/"
        );
        // A repository named `pages` is the site of its owner, served at the
        // root of their subdomain and not under a path of its own
        assert_eq!(
            served("git@codeberg.org:alex/pages.git", "{}"),
            "https://alex.codeberg.page/"
        );
        // Any Forgejo that serves pages, not Codeberg alone
        assert_eq!(
            served(
                "git@v15.next.forgejo.org:alex/mysite.git",
                r#"{"pagesDomain":"pages.example.org"}"#
            ),
            "https://alex.pages.example.org/mysite/"
        );
    }

    #[test]
    fn a_domain_of_ones_own_wins_over_the_one_worked_out() {
        let remote = Remote::parse("git@codeberg.org:alex/mysite.git").unwrap();
        let named =
            answered(r#"{"pagesDomain":"codeberg.page","websiteUrl":"https://blog.example.com/"}"#);
        assert_eq!(website_url(&remote, &named), "https://blog.example.com/");
    }

    #[test]
    fn a_login_on_another_instance_is_not_this_one() {
        // What `tea logins list -o json` gives, cut down to what is read
        let logins: Vec<serde_json::Value> = serde_json::from_str(
            r#"[{"name":"codeberg","url":"https://codeberg.org","ssh_host":"codeberg.org"},
                {"name":"forgejo-next","url":"https://v15.next.forgejo.org","ssh_host":"v15.next.forgejo.org"}]"#,
        )
        .unwrap();

        assert_eq!(
            login_named(&logins, "codeberg.org").as_deref(),
            Some("codeberg")
        );
        // Any Forgejo the user signed in to, and not Codeberg alone: it is this
        // login that says a repository elsewhere is one of ours
        assert_eq!(
            login_named(&logins, "v15.next.forgejo.org").as_deref(),
            Some("forgejo-next")
        );
        // And nothing for a host another integration answers for
        assert_eq!(login_named(&logins, "gitlab.com"), None);
        assert_eq!(login_named(&logins, "git.sr.ht"), None);
    }

    #[test]
    fn a_publication_whose_earlier_runs_could_not_be_read_is_never_called_built() {
        let successful = || Ok(serde_json::from_str(r#"[{"id":842,"status":"success"}]"#).unwrap());

        // That run finished, but nothing says it is not the last
        // publication's: calling it built would tell the user their website is
        // online when nothing of theirs was ever built
        let unread = build_of(&EarlierBuild::CouldNotAsk, None, || {
            panic!("the runs tell nothing apart here, so they are not asked")
        });
        assert!(matches!(unread.unwrap(), Build::Unknown));

        // The same run, known to be newer than what was there, and then known
        // to be what was there
        let ours = build_of(&EarlierBuild::Run("841".to_string()), None, successful);
        assert!(matches!(ours.unwrap(), Build::Built));
        let theirs = build_of(&EarlierBuild::Run("842".to_string()), None, successful);
        assert!(matches!(theirs.unwrap(), Build::NotStarted));

        let first = build_of(&EarlierBuild::Nothing, None, successful);
        assert!(matches!(first.unwrap(), Build::Built));
        assert!(matches!(
            build_of(&EarlierBuild::Nothing, None, || Ok(Vec::new())).unwrap(),
            Build::NotStarted
        ));
    }

    #[test]
    fn a_run_forgejo_answered_as_a_number_is_read_all_the_same() {
        let listed = |json: &str| -> Vec<serde_json::Value> { serde_json::from_str(json).unwrap() };
        // Reading the string alone would have build() answer "not started" for
        // a build that ran, right up to the timeout
        assert_eq!(
            newest_run(&listed(r#"[{"id":842,"status":"success"}]"#)).as_deref(),
            Some("842")
        );
        assert_eq!(
            newest_run(&listed(r#"[{"id":"842"}]"#)).as_deref(),
            Some("842")
        );
        // The newest is the one at the top, as tea lists them
        assert_eq!(
            newest_run(&listed(r#"[{"id":842},{"id":841}]"#)).as_deref(),
            Some("842")
        );
        assert_eq!(newest_run(&listed(r#"[{"status":"success"}]"#)), None);
        assert_eq!(newest_run(&[]), None);
    }
}
