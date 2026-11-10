/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! FTP and SFTP servers, through rclone
//!
//! The servers are the `ftp` and `sftp` remotes of the rclone configuration of
//! the user, made in Silex or not, which they can use in a terminal as well:
//! Silex keeps no copy.

use std::collections::BTreeMap;
use std::path::Path;
use std::sync::Mutex;

use serde::Deserialize;
use silex_server::said::Said;
use silex_server::{OptionsChoice, OptionsField, OptionsForm, PublicationOptions, WEBSITE_URL};

use super::common::address::host_of;
use super::common::install::{Archive, Release};
use super::common::remote::Remote;
use super::common::run::{self, Program};
use super::integration::{
    Account, Build, Capacity, Integration, Openness, Prepared, SignIn, Tag, Urls,
};
use crate::held::held;
use crate::locales::{key, tr};

/// The rclone Silex installs, with the checksums rclone signed for it
const RELEASE: Release = Release {
    version: "1.76.0",
    archives: &[
        Archive {
            os: "linux",
            arch: "x86_64",
            url: "https://downloads.rclone.org/v1.76.0/rclone-v1.76.0-linux-amd64.zip",
            sha256: "b00f00b3266c3764413afe599d3ec316f6f43b3e0ea8a0bc1d186d2133e46df7",
            inside: Some("rclone-v1.76.0-linux-amd64/rclone"),
        },
        Archive {
            os: "macos",
            arch: "x86_64",
            url: "https://downloads.rclone.org/v1.76.0/rclone-v1.76.0-osx-amd64.zip",
            sha256: "4f5835733d52b818340f97b1fc0348a70461534d123363a183ca2b660219595a",
            inside: Some("rclone-v1.76.0-osx-amd64/rclone"),
        },
        Archive {
            os: "macos",
            arch: "aarch64",
            url: "https://downloads.rclone.org/v1.76.0/rclone-v1.76.0-osx-arm64.zip",
            sha256: "e72dc90b70f4947a7b72b61bde4a4fbba5777b2874fb448951ffdde67ebd0ab7",
            inside: Some("rclone-v1.76.0-osx-arm64/rclone"),
        },
        Archive {
            os: "windows",
            arch: "x86_64",
            url: "https://downloads.rclone.org/v1.76.0/rclone-v1.76.0-windows-amd64.zip",
            sha256: "8b4fd2737ade4e70c057ef4a49deb7cffe94b0fb9d7587c189d149823f21a1dc",
            inside: Some("rclone-v1.76.0-windows-amd64/rclone"),
        },
    ],
    max_bytes: 200 * 1024 * 1024,
};

/// The server icon of Lucide, ISC license: a server rather than the logo of a
/// web host
const SERVER_ICON: &str = r#"<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>"#;

pub struct Ftp;

impl Integration for Ftp {
    fn program(&self) -> &'static str {
        "rclone"
    }

    fn id(&self) -> &'static str {
        "rclone-ftp"
    }

    fn name(&self) -> &'static str {
        "FTP / SFTP"
    }

    fn summary(&self) -> &'static str {
        key!("Publish your websites on the server of your web host, with FTP or SFTP. Works with most hosting plans and with the domain name you already have there.")
    }

    fn tagline(&self) -> &'static str {
        key!("Works with most web hosts, FTP or SFTP.")
    }

    fn tags(&self) -> &'static [Tag] {
        &[Tag::Hosting, Tag::Storage]
    }

    /// Of rclone: the server of the host is unknown to Silex
    fn openness(&self) -> Openness {
        Openness::OpenSource
    }

    fn icon(&self) -> Option<&'static str> {
        Some(SERVER_ICON)
    }

    fn install_url(&self) -> &'static str {
        "https://rclone.org/install/"
    }

    fn release(&self) -> Option<&'static Release> {
        Some(&RELEASE)
    }

    fn capacities(&self) -> &'static [Capacity] {
        &[Capacity::Deploy]
    }

    // Any website can be sent to a server
    fn answers_for(&self, _site: &Path) -> bool {
        true
    }

    fn accounts(&self, cli: &Path) -> Result<Vec<Account>, Said> {
        let remotes = remotes(cli)
            .map_err(Said::raw)?
            .ok_or_else(|| Said::new(PROTECTED))?;
        Ok(remotes
            .iter()
            .filter_map(|(name, kind)| Some((name, Protocol::of(kind)?)))
            .map(|(name, protocol)| Account {
                id: name.clone(),
                name: name.clone(),
                summary: shown(cli, name, protocol)
                    .inspect_err(|e| tracing::warn!("Could not read {} in rclone: {}", name, e))
                    .ok()
                    .map(|server| server.summary()),
            })
            .collect())
    }

    fn account_form(&self) -> Option<OptionsForm> {
        let field = |name: &str, r#type: &str, label: &str| OptionsField {
            name: name.to_string(),
            r#type: r#type.to_string(),
            label: label.to_string(),
            value: None,
            help: None,
            placeholder: None,
            required: false,
            choices: Vec::new(),
        };
        let choice = |protocol: Protocol, label: &str| OptionsChoice {
            value: protocol.kind().to_string(),
            label: label.to_string(),
        };
        Some(OptionsForm {
            title: key!("Add a server").to_string(),
            fields: vec![
                OptionsField {
                    value: Some(Protocol::Ftp.kind().to_string()),
                    required: true,
                    choices: vec![
                        choice(Protocol::Ftp, key!("FTP")),
                        choice(Protocol::Sftp, key!("SFTP")),
                    ],
                    ..field(PROTOCOL, "select", key!("Protocol"))
                },
                OptionsField {
                    required: true,
                    ..field(HOST, "text", key!("Address of the server"))
                },
                OptionsField {
                    help: Some(key!("Leave it empty for the usual port.").to_string()),
                    ..field(PORT, "text", key!("Port"))
                },
                OptionsField {
                    required: true,
                    ..field(USER, "text", key!("User name"))
                },
                field(PASSWORD, "password", key!("Password")),
                OptionsField {
                    help: Some(key!("The name of this server in your rclone configuration. Made from its address when left empty.").to_string()),
                    ..field(NAME, "text", key!("Name"))
                },
                OptionsField {
                    help: Some(key!("For FTP only. Your password and your files then travel in the clear.").to_string()),
                    ..field(
                        UNENCRYPTED,
                        "checkbox",
                        key!("Connect without encryption"),
                    )
                },
            ],
        })
    }

    fn add_account(&self, cli: &Path, values: &PublicationOptions) -> Result<String, Said> {
        add(cli, NewServer::of(values)?)
    }

    /// Only an FTP or SFTP remote, the others are none of Silex's business
    fn disconnect(&self, cli: &Path, id: &str) -> Result<(), Said> {
        let _alone = held(&CHANGING);
        server(cli, id)?;
        run::run(cli, &std::env::temp_dir(), &["config", "delete", id])
            .map(|_| ())
            .map_err(Said::raw)
    }

    /// Told to the editor, which does not translate
    fn options_form(&self, _site: &Path) -> Option<OptionsForm> {
        Some(OptionsForm {
            title: tr(key!("Where to publish on the server")),
            fields: vec![
                OptionsField {
                    name: FOLDER.to_string(),
                    r#type: "text".to_string(),
                    label: tr(key!("Folder on the server")),
                    value: None,
                    help: Some(tr(key!("The folder your web host serves your website from, often www or public_html. Silex deletes the files of this folder that are not in your website."))),
                    placeholder: None,
                    required: true,
                    choices: Vec::new(),
                },
                OptionsField {
                    name: WEBSITE_URL.to_string(),
                    r#type: "url".to_string(),
                    label: tr(key!("Address of your website")),
                    value: None,
                    help: Some(tr(key!("Optional. With it, Silex gives you a link to your website after publishing."))),
                    placeholder: Some("https://".to_string()),
                    required: false,
                    choices: Vec::new(),
                },
            ],
        })
    }

    fn address(&self, _cli: &Path, _site: &Path, options: &PublicationOptions) -> Option<String> {
        options.named(WEBSITE_URL).map(String::from)
    }

    // A server keeps no repository
    fn repo(&self, _site: &Path) -> Option<String> {
        None
    }

    // Signed in with what rclone keeps of the server
    fn urls(
        &self,
        _cli: &Path,
        _site: &Path,
        _options: &PublicationOptions,
    ) -> Result<Option<Urls>, String> {
        Ok(Some(Urls::default()))
    }

    /// Mirrored: what is in the folder on the server and not in `files` is
    /// deleted
    fn deploy(
        &self,
        cli: &Path,
        _site: &Path,
        account: &str,
        files: &Path,
        options: &PublicationOptions,
    ) -> Result<Prepared, String> {
        send(cli, account, files, options).map_err(|said| said.to_string())?;
        Ok(Prepared::default())
    }

    // Nothing builds it on the server
    fn build(&self, _cli: &Path, _site: &Path, _prepared: &Prepared) -> Result<Build, String> {
        Ok(Build::Built)
    }

    fn check_account(&self, cli: &Path, id: &str) -> Result<SignIn, Said> {
        let server = server(cli, id)?;
        let remote = format!("{}:", server.name);
        let mut list = vec!["lsjson", "--dirs-only", "--max-depth", "1"];
        list.extend(CONNECTING);
        list.push(&remote);
        match run::run_fetch(cli, &std::env::temp_dir(), &list) {
            Ok(_) => Ok(SignIn::Accepted),
            Err(why) if refused(&why) => Ok(SignIn::Refused),
            Err(why) => Err(not_connected(&server.host, why)),
        }
    }
}

const PROTOCOL: &str = "protocol";
const HOST: &str = "host";
const PORT: &str = "port";
const USER: &str = "user";
const PASSWORD: &str = "password";
const NAME: &str = "name";
const UNENCRYPTED: &str = "unencrypted";
const FOLDER: &str = "folder";

/// The most questions rclone asks to configure a remote, SFTP asks ten
const QUESTIONS: usize = 50;

/// Shared hosting plans refuse more connections than that at once
const CONNECTIONS: &str = "4";

/// So that a host that does not answer is said to be unreachable by rclone
/// rather than cut short by the time limit of `run_fetch`, with time left
/// after connecting to sign in and list a folder
const CONNECTING: [&str; 4] = ["--contimeout", "10s", "--low-level-retries", "1"];

#[derive(Clone, Copy, PartialEq)]
enum Protocol {
    Ftp,
    Sftp,
}

impl Protocol {
    fn of(kind: &str) -> Option<Protocol> {
        match kind {
            "ftp" => Some(Protocol::Ftp),
            "sftp" => Some(Protocol::Sftp),
            _ => None,
        }
    }

    fn kind(self) -> &'static str {
        match self {
            Protocol::Ftp => "ftp",
            Protocol::Sftp => "sftp",
        }
    }
}

struct Server {
    name: String,
    protocol: Protocol,
    host: String,
    user: Option<String>,
}

impl Server {
    fn summary(&self) -> String {
        let protocol = self.protocol.kind().to_uppercase();
        match &self.user {
            Some(user) => format!("{} {}@{}", protocol, user, self.host),
            None => format!("{} {}", protocol, self.host),
        }
    }
}

struct NewServer {
    protocol: Protocol,
    host: String,
    port: Option<u16>,
    user: String,
    password: String,
    /// Made from the host when there is none
    name: Option<String>,
    /// FTP without TLS, only when the user asked for it
    unencrypted: bool,
}

impl NewServer {
    /// A ticked checkbox is sent with any value, one left empty is not sent
    fn of(values: &PublicationOptions) -> Result<NewServer, Said> {
        let required = |field: &str| {
            values
                .named(field)
                .map(String::from)
                .ok_or_else(|| Said::raw(format!("The {} of the server is missing", field)))
        };
        let protocol = required(PROTOCOL)?;
        let protocol = Protocol::of(&protocol)
            .ok_or_else(|| Said::raw(format!("{} is not FTP or SFTP", protocol)))?;
        let (host, typed_port) = address(&required(HOST)?, protocol)?;
        let port = match (values.named(PORT), typed_port.as_deref()) {
            (Some(port), Some(typed)) if port != typed => {
                return Err(Said::new(key!(
                    "The address says port {typed}, and the Port field says {port}. Keep only one of them."
                ))
                .with("typed", typed)
                .with("port", port))
            }
            (None, None) => None,
            (Some(port), _) | (None, Some(port)) => Some(port.parse().map_err(|_| {
                Said::new(key!(
                    "{port} is not a port. A port is a number, like 21 or 22."
                ))
                .with("port", port)
            })?),
        };
        let name = values.named(NAME).map(String::from);
        if let Some(name) = name.as_deref().filter(|name| !rclone_takes(name)) {
            return Err(Said::new(key!(
                "rclone does not take {name} as a name. Use letters, numbers, spaces and _ - . +, with no space or - at the start."
            ))
            .with("name", name));
        }
        Ok(NewServer {
            protocol,
            host,
            port,
            user: required(USER)?,
            password: values.typed(PASSWORD).unwrap_or_default().to_string(),
            name,
            unencrypted: values.named(UNENCRYPTED).is_some(),
        })
    }
}

/// The host and the port typed in the address, which may start with
/// `ftp://` or `sftp://` as long as it is the protocol chosen
fn address(typed: &str, protocol: Protocol) -> Result<(String, Option<String>), Said> {
    let lowered = typed.to_lowercase();
    let other = match protocol {
        Protocol::Ftp => Protocol::Sftp,
        Protocol::Sftp => Protocol::Ftp,
    };
    if lowered.starts_with(&format!("{}://", other.kind())) {
        return Err(Said::new(key!(
            "The address {host} is for {other}, not {protocol}. Choose {other} as the protocol."
        ))
        .with("host", typed)
        .with("other", other.kind().to_uppercase())
        .with("protocol", protocol.kind().to_uppercase()));
    }
    let not_an_address =
        || Said::new(key!("{host} is not the address of a server.")).with("host", typed);
    let host = host_of(&lowered, &["ftp://", "sftp://"]).map_err(|_| not_an_address())?;
    let bare = Remote::without_port(&host);
    if bare.contains(':') {
        return Err(not_an_address());
    }
    let port = host[bare.len()..].strip_prefix(':').map(String::from);
    Ok((bare.to_string(), port))
}

/// The rule of rclone for the name of a remote
fn rclone_takes(name: &str) -> bool {
    !name.is_empty()
        && !name.starts_with(['-', ' '])
        && !name.ends_with(' ')
        && name
            .chars()
            .all(|c| c.is_alphanumeric() || "_-.+@ ".contains(c))
}

/// The remote the user already has for this user on this server
fn same_server<'a>(servers: &'a [Server], new: &NewServer) -> Option<&'a str> {
    servers
        .iter()
        .find(|server| {
            server.protocol == new.protocol
                && server.host.eq_ignore_ascii_case(&new.host)
                && server.user.as_deref() == Some(new.user.as_str())
        })
        .map(|server| server.name.as_str())
}

/// Two changes at once would both find a name free, or remove what the other wrote
static CHANGING: Mutex<()> = Mutex::new(());

/// Written to the configuration only once the server answered
fn add(rclone: &Path, new: NewServer) -> Result<String, Said> {
    let _alone = held(&CHANGING);
    let remotes = remotes(rclone)
        .map_err(Said::raw)?
        .ok_or_else(|| Said::new(PROTECTED))?;
    let servers: Vec<Server> = remotes
        .iter()
        .filter_map(|(name, kind)| Some((name, Protocol::of(kind)?)))
        .filter_map(|(name, protocol)| shown(rclone, name, protocol).ok())
        .collect();
    if let Some(same) = same_server(&servers, &new) {
        return Err(Said::new(key!(
            "Your rclone configuration already has this server, named {name}."
        ))
        .with("name", same));
    }
    let name = match new
        .name
        .as_deref()
        .map(str::trim)
        .filter(|name| !name.is_empty())
    {
        Some(name) if remotes.contains_key(name) => {
            return Err(Said::new(key!(
                "Your rclone configuration already has a server named {name}."
            ))
            .with("name", name))
        }
        Some(name) => name.to_string(),
        None => unique(&new.host, &remotes),
    };

    let mut options = vec![("host", new.host.clone()), ("user", new.user.clone())];
    if let Some(port) = new.port {
        options.push(("port", port.to_string()));
    }
    if new.protocol == Protocol::Ftp {
        if !new.unencrypted {
            options.push(("explicit_tls", "true".to_string()));
        }
        options.push(("concurrency", CONNECTIONS.to_string()));
    }
    // Obscured is what rclone reads from its environment, and an empty input
    // would obscure the hyphen itself
    let pass = if new.password.is_empty() {
        None
    } else {
        let obscured = run::run_with_input(
            rclone,
            &std::env::temp_dir(),
            &["obscure", "-"],
            &new.password,
        )
        .map_err(Said::raw)?;
        Some(obscured.trim().to_string())
    };

    let kind = new.protocol.kind();
    let mut env: Vec<(String, String)> = options
        .iter()
        .map(|(key, value)| {
            (
                format!("RCLONE_{}_{}", kind, key).to_uppercase(),
                value.clone(),
            )
        })
        .collect();
    if let Some(pass) = &pass {
        env.push((format!("RCLONE_{}_PASS", kind).to_uppercase(), pass.clone()));
    }
    let env: Vec<(&str, &str)> = env
        .iter()
        .map(|(name, value)| (name.as_str(), value.as_str()))
        .collect();
    let on_the_fly = format!(":{}:", kind);
    let mut test = vec!["lsjson", "--dirs-only", "--max-depth", "1"];
    test.extend(CONNECTING);
    test.push(&on_the_fly);
    let program = Program {
        path: rclone,
        env: &env,
    };
    run::run_fetch(program, &std::env::temp_dir(), &test)
        .map_err(|why| not_connected(&new.host, why))?;

    if let Err(why) = create(rclone, &name, new.protocol, &options, pass.as_deref()) {
        forget(rclone, &name);
        return Err(Said::raw(why));
    }
    // A remote that is not written yet cannot keep the key rclone pins
    if new.protocol == Protocol::Sftp {
        let remote = format!("{}:", name);
        let mut pin = vec![
            "lsjson",
            "--dirs-only",
            "--max-depth",
            "1",
            "--sftp-pin-host-key",
        ];
        pin.extend(CONNECTING);
        pin.push(&remote);
        if let Err(why) = run::run_fetch(rclone, &std::env::temp_dir(), &pin) {
            forget(rclone, &name);
            return Err(if why.contains("unknown flag") {
                too_old(rclone, why)
            } else {
                not_connected(&new.host, why)
            });
        }
    }
    Ok(name)
}

fn server(rclone: &Path, name: &str) -> Result<Server, Said> {
    let remotes = remotes(rclone)
        .map_err(Said::raw)?
        .ok_or_else(|| Said::new(PROTECTED))?;
    let protocol = remotes
        .get(name)
        .and_then(|kind| Protocol::of(kind))
        .ok_or_else(|| Said::raw(format!("rclone has no FTP or SFTP server named {}", name)))?;
    shown(rclone, name, protocol).map_err(Said::raw)
}

fn send(
    rclone: &Path,
    account: &str,
    files: &Path,
    options: &PublicationOptions,
) -> Result<(), Said> {
    let server = server(rclone, account)?;
    let on_server = options
        .named(FOLDER)
        .ok_or_else(|| Said::new(key!("Choose the folder of your website on the server.")))?;
    let source = files.to_string_lossy();
    let destination = format!("{}:{}", server.name, on_server);
    let ran = run::run_transfer_verbatim(
        rclone,
        &std::env::temp_dir(),
        &["sync", "--", &source, &destination],
    )
    .map_err(Said::raw)?;
    if !ran.failed {
        return Ok(());
    }
    let why = run::failure(rclone, &ran);
    let said = why.to_lowercase();
    // 553 is how an FTP server refuses a file where it may not be written
    if said.contains("permission denied") || said.contains(" 553 ") {
        return Err(Said::new(key!(
            "{host} did not let Silex write in the folder {folder}. Check the folder, and that this user can write there."
        ))
        .with("host", &server.host)
        .with("folder", on_server)
        .because(why));
    }
    Err(failed(
        &server.host,
        why,
        key!("Silex could not send your website to {host}."),
    ))
}

const PROTECTED: &str =
    key!("Your rclone configuration is protected by a password, and Silex cannot read it.");

/// The type of every remote of the configuration, without their passwords,
/// or None when it is encrypted
fn remotes(rclone: &Path) -> Result<Option<BTreeMap<String, String>>, String> {
    match run::run(
        rclone,
        &std::env::temp_dir(),
        &["listremotes", "--long", "--ask-password=false"],
    ) {
        Ok(listed) => Ok(Some(long_list(&listed))),
        Err(why) if why.contains("unable to decrypt configuration") => Ok(None),
        Err(why) => Err(why),
    }
}

/// `name:`, then the type, then the description, in columns; a name can hold
/// spaces but no colon, a type neither
fn long_list(listed: &str) -> BTreeMap<String, String> {
    listed
        .lines()
        .filter_map(|line| {
            let (name, rest) = line.split_once(':')?;
            let kind = rest.split_whitespace().next()?;
            Some((name.to_string(), kind.to_string()))
        })
        .collect()
}

/// Only this remote is read, and its password is dropped right away
fn shown(rclone: &Path, name: &str, protocol: Protocol) -> Result<Server, String> {
    let shown = run::run(
        rclone,
        &std::env::temp_dir(),
        &["config", "show", "--ask-password=false", name],
    )?;
    let option = |key: &str| {
        shown.lines().find_map(|line| {
            let (k, value) = line.split_once(" = ")?;
            (k == key).then(|| value.to_string())
        })
    };
    Ok(Server {
        name: name.to_string(),
        protocol,
        host: option("host").unwrap_or_default(),
        user: option("user"),
    })
}

/// The host, with what rclone does not take in a name replaced, and a number
/// after it when the configuration already has it
fn unique(host: &str, remotes: &BTreeMap<String, String>) -> String {
    let named: String = host
        .trim()
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || ".-_".contains(c) {
                c
            } else {
                '-'
            }
        })
        .collect();
    let named = named.trim_start_matches(['-', '.']);
    let named = if named.is_empty() { "server" } else { named };
    (1..)
        .map(|n| {
            if n == 1 {
                named.to_string()
            } else {
                format!("{}-{}", named, n)
            }
        })
        .find(|name| !remotes.contains_key(name))
        .unwrap_or_default()
}

/// What rclone asks while it configures a remote, after the protocol it
/// offers to the programs that configure it
#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct Question {
    state: String,
    option: Option<Asked>,
    error: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct Asked {
    name: String,
    default_str: String,
}

/// The password is the answer to the question rclone asks for it, given in
/// its environment rather than in the arguments
fn create(
    rclone: &Path,
    name: &str,
    protocol: Protocol,
    options: &[(&str, String)],
    pass: Option<&str>,
) -> Result<(), String> {
    let dir = std::env::temp_dir();
    // After `--` and joined to its key, nothing the user typed reads as an
    // option of rclone
    let given: Vec<String> = options
        .iter()
        .map(|(key, value)| format!("{}={}", key, value))
        .collect();
    let mut create = vec![
        "config",
        "create",
        "--non-interactive",
        "--all",
        "--",
        name,
        protocol.kind(),
    ];
    create.extend(given.iter().map(String::as_str));
    let mut said = run::run(rclone, &dir, &create)?;
    for _ in 0..QUESTIONS {
        let question: Question = serde_json::from_str(&said)
            .map_err(|e| format!("rclone asked a question Silex cannot read: {}", e))?;
        let Some(asked) = question.option.filter(|_| !question.state.is_empty()) else {
            return Ok(());
        };
        if !question.error.is_empty() {
            return Err(format!(
                "rclone did not take the answer to {}: {}",
                asked.name, question.error
            ));
        }
        let mut answer = vec![
            "config",
            "update",
            "--continue",
            "--state",
            &question.state,
            "--non-interactive",
            "--all",
        ];
        let pass = match (asked.name.as_str(), pass) {
            // Obscured already: rclone 1.75 writes the answer as it gets it,
            // though it says it obscures it
            ("pass", Some(pass)) => {
                answer.push("--no-obscure");
                Some(pass)
            }
            _ => {
                answer.extend(["--result", &asked.default_str]);
                None
            }
        };
        answer.extend(["--", name]);
        answer.extend(given.iter().map(String::as_str));
        said = match pass {
            Some(pass) => run::run(
                Program {
                    path: rclone,
                    env: &[("RCLONE_RESULT", pass)],
                },
                &dir,
                &answer,
            ),
            None => run::run(rclone, &dir, &answer),
        }?;
    }
    Err(format!("rclone asked more than {} questions", QUESTIONS))
}

/// A remote half written, which would fail every publication
fn forget(rclone: &Path, name: &str) {
    if let Err(e) = run::run(rclone, &std::env::temp_dir(), &["config", "delete", name]) {
        tracing::warn!(
            "Could not remove {} from the configuration of rclone: {}",
            name,
            e
        );
    }
}

/// The first rclone that pins the key of an SFTP server
const PINS_KEYS_FROM: &str = "1.75";

fn too_old(rclone: &Path, why: String) -> Said {
    let version = run::run(rclone, &std::env::temp_dir(), &["version"])
        .ok()
        .and_then(|said| said.lines().next().map(|line| run::readable(line.trim())))
        .unwrap_or_else(|| "rclone".to_string());
    Said::new(key!(
        "{version} is too old for Silex, which needs rclone {needed} or later."
    ))
    .with("version", version)
    .with("needed", PINS_KEYS_FROM)
    .because(why)
}

fn not_connected(host: &str, why: String) -> Said {
    failed(host, why, key!("Silex could not connect to {host}."))
}

/// What rclone said, in the words of the user, the most common reasons first
fn failed(host: &str, why: String, otherwise: &'static str) -> Said {
    let said = why.to_lowercase();
    let unreachable = ["no such host", "no route to host", "network is unreachable"]
        .iter()
        .any(|reason| said.contains(reason));
    // What a host does to an address it did not allow, o2switch for one
    let kept_out = ["connection refused", "i/o timeout", "connection reset"]
        .iter()
        .any(|reason| said.contains(reason));
    if let Some(name) = other_name(&why, host) {
        return Said::new(key!(
            "The security certificate of {host} is for {name}. Connect with {name} instead?"
        ))
        .with("host", host)
        .with("name", name)
        .because(why);
    }
    let sentence = if said.contains("host key mismatch") {
        key!("The key of {host} has changed. If this is normal, for example after the server was reinstalled, remove this server in Integrations, then add it again.")
    } else if said.contains("x509") {
        key!("Silex does not trust the security certificate of {host}.")
    } else if refused(&why) {
        key!("{host} refused this user name or password.")
    } else if without_tls(&said) {
        key!("{host} does not offer FTPS, the encrypted FTP. Use SFTP if your web host offers it, or FTP without encryption if you accept that your password and your files travel in the clear.")
    } else if unreachable {
        key!("Silex could not reach {host}. Check its address and its port.")
    } else if kept_out {
        key!("{host} did not let Silex connect. Check its address and its port. Some web hosts also only let in the internet addresses you allow in their control panel.")
    } else {
        otherwise
    };
    Said::new(sentence).with("host", host).because(why)
}

fn refused(why: &str) -> bool {
    let said = why.to_lowercase();
    said.contains("unable to authenticate")
        // How rclone says that an SFTP server refused the password
        || said.contains("unexpected message type 51")
        // 530 is also what an FTP server without TLS answers to the asking for it
        || said
            .split_once(" 530 ")
            .is_some_and(|(_, reply)| reply.contains("incorrect") || reply.contains("failed"))
}

/// The name the certificate of the host is for, when it is not the one the
/// user typed: the certificate of a shared host is for the name of the
/// server, not for the domain of the website
///
/// A wildcard names no server to connect to.
fn other_name(why: &str, host: &str) -> Option<String> {
    let (_, valid) = why.split_once("x509: certificate is valid for ")?;
    let (names, _) = valid.split_once(", not ")?;
    names
        .split(", ")
        .find(|name| !name.contains('*') && *name != host)
        .map(String::from)
}

/// The server answered the asking for TLS, the first thing said once
/// connected, as a command it does not know, or as vsftpd does
fn without_tls(said: &str) -> bool {
    if said.contains("first record does not look like a tls handshake") {
        return true;
    }
    let Some((_, reply)) = said
        .split_once("failed to make ftp connection to ")
        .and_then(|(_, after)| after.split_once("\": "))
    else {
        return false;
    };
    match reply.get(..3) {
        Some("500" | "502" | "504" | "534") => true,
        Some("530") => reply.contains("please login with user and pass"),
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn takes_only_the_names_rclone_takes() {
        assert!(rclone_takes("ftp.client.fr"));
        assert!(rclone_takes("my site_2+@é"));
        assert!(!rclone_takes("-site"));
        assert!(!rclone_takes(" site"));
        assert!(!rclone_takes("site "));
        assert!(!rclone_takes("a:b"));
        assert!(!rclone_takes("a/b"));
    }

    #[test]
    fn reads_the_address_as_pasted() {
        let read = |typed: &str, protocol| {
            address(typed, protocol).map_err(|said| said.sentence.unwrap_or_default())
        };
        assert_eq!(
            read("sftp://Example.com:2222/www", Protocol::Sftp),
            Ok(("example.com".to_string(), Some("2222".to_string())))
        );
        assert_eq!(
            read(" ftp://example.com ", Protocol::Ftp),
            Ok(("example.com".to_string(), None))
        );
        assert_eq!(
            read("ftp://example.com", Protocol::Sftp),
            Err("The address {host} is for {other}, not {protocol}. Choose {other} as the protocol.")
        );
        assert_eq!(
            read("SFTP://example.com", Protocol::Ftp).map_err(|_| ()),
            Err(())
        );
        assert_eq!(
            read("example.com:a:21", Protocol::Ftp),
            Err("{host} is not the address of a server.")
        );
    }

    #[test]
    fn finds_the_same_server_already_there() {
        let server = |name: &str, protocol, host: &str, user: Option<&str>| Server {
            name: name.to_string(),
            protocol,
            host: host.to_string(),
            user: user.map(String::from),
        };
        let servers = [
            server("a", Protocol::Ftp, "Example.com", Some("silex")),
            server("b", Protocol::Sftp, "example.com", None),
        ];
        let new = |protocol, user: &str| NewServer {
            protocol,
            host: "example.com".to_string(),
            port: None,
            user: user.to_string(),
            password: String::new(),
            name: None,
            unencrypted: false,
        };
        assert_eq!(
            same_server(&servers, &new(Protocol::Ftp, "silex")),
            Some("a")
        );
        assert_eq!(same_server(&servers, &new(Protocol::Ftp, "other")), None);
        assert_eq!(same_server(&servers, &new(Protocol::Sftp, "silex")), None);
    }
    #[test]
    fn tells_what_to_try_instead() {
        let why = |names: &str| {
            format!(
                r#"NewFs: failed to make FTP connection to "ftp.client.fr:21": tls: failed to verify certificate: x509: certificate is valid for {}, not ftp.client.fr"#,
                names
            )
        };
        let name = |names: &str| other_name(&why(names), "ftp.client.fr");
        assert_eq!(
            name("*.o2switch.net, node1.o2switch.net").as_deref(),
            Some("node1.o2switch.net")
        );
        assert_eq!(name("*.o2switch.net"), None);
        let sentence = |said: &str| not_connected("h", said.to_string()).sentence;
        assert_eq!(
            sentence(r#"NewFs: failed to make FTP connection to "h:21": 530 "Please login with USER and PASS.""#),
            Some("{host} does not offer FTPS, the encrypted FTP. Use SFTP if your web host offers it, or FTP without encryption if you accept that your password and your files travel in the clear.")
        );
    }

    #[test]
    fn tells_a_refused_password_from_a_server_without_tls() {
        let sentence = |said: &str| not_connected("h", said.to_string()).sentence;
        let refused = Some("{host} refused this user name or password.");
        let failed = r#"CRITICAL: Failed to create file system for ":ftp:": NewFs: failed to make FTP connection to "h:21": "#;
        assert_eq!(
            sentence(&format!(r#"{}530 "Login incorrect.""#, failed)),
            refused
        );
        assert_eq!(
            sentence(&format!(r#"{}530 "Login authentication failed""#, failed)),
            refused
        );
        assert_ne!(
            sentence(&format!(
                r#"{}530 "Please login with USER and PASS.""#,
                failed
            )),
            refused
        );
        assert_eq!(
            sentence("NewFs: couldn't connect SSH: ssh: handshake failed: ssh: unexpected message type 51 (expected 60)"),
            refused
        );
    }

    #[test]
    fn tells_a_changed_key() {
        assert_eq!(
            not_connected("h", "NewFs: couldn't connect SSH: ssh: handshake failed: sftp: host key mismatch for h:22: server offered ssh-rsa key with fingerprint SHA256:6kjo; pinned fingerprints for this algorithm: SHA256:AIDt".to_string()).sentence,
            Some("The key of {host} has changed. If this is normal, for example after the server was reinstalled, remove this server in Integrations, then add it again.")
        );
    }
}
