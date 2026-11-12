/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

//! Zola, built on this computer
//!
//! gqlfreez and Zola are compiled into the app, so that there is nothing to install.

use std::any::Any;
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::path::Path;
use std::sync::Mutex;

use silex_server::{message, Job, PUBLIC_FOLDER};

use super::download::{download_lines, run_if, CACHE_FOLDER};
use super::{link_all, BUILD_OUTPUT};
use crate::held::held;
use crate::integrations::common::install::Archive;

const CONFIG: &str = "zola.toml";
// Zola refuses an empty base_url, and a website served at the root of its domain needs no other
const DEFAULT_CONFIG: &str = "base_url = \"/\"\n";

// The crates in Cargo.toml are at the same versions, the checksums are the ones of the release pages
const GQLFREEZ: &[Archive] = &[
    Archive {
        os: "linux",
        arch: "x86_64",
        url: "https://github.com/lexoyo/gqlfreez/releases/download/v0.2.1/gqlfreez-linux-x64",
        sha256: "ece79db164b01802cb98aca6aefb4f411d4c0d33680b845201d851ded658eff0",
        inside: None,
    },
    Archive {
        os: "linux",
        arch: "aarch64",
        url: "https://github.com/lexoyo/gqlfreez/releases/download/v0.2.1/gqlfreez-linux-arm64",
        sha256: "837d0df24f97ae1949b88ff61f933b85ae90ea0f6efb28c3b15f3343005c93fe",
        inside: None,
    },
];
// Musl on x64, as SourceHut builds on Alpine
const ZOLA: &[Archive] = &[
    Archive {
        os: "linux",
        arch: "x86_64",
        url: "https://github.com/getzola/zola/releases/download/v0.23.6/zola-v0.23.6-x86_64-unknown-linux-musl.tar.gz",
        sha256: "7d77a4220a4f699cba2fc0e0c7859f780e887e269159ad4fab90e11ea16c906f",
        inside: Some("zola"),
    },
    Archive {
        os: "linux",
        arch: "aarch64",
        url: "https://github.com/getzola/zola/releases/download/v0.23.6/zola-v0.23.6-aarch64-unknown-linux-gnu.tar.gz",
        sha256: "266448fffbf7c7004ca399d0e76dd699541771096d8a42aede98cebe2a029d02",
        inside: Some("zola"),
    },
];

// Zola keeps the site it builds in globals of the process: one build at a time, whatever the website
static BUILDING: Mutex<()> = Mutex::new(());

/// The data and the pages of the CMS are written in `staging`, so that none of them is versioned with the website
pub fn build(site: &Path, staging: &Path, output: &Path, job: &Job) -> Result<(), String> {
    let _building = held(&BUILDING);
    mirror(&site.join(PUBLIC_FOLDER), staging).map_err(|e| {
        message::explained(
            "Silex could not prepare the build of your website.",
            &e.to_string(),
            &[],
        )
    })?;
    job.step("Fetching the data of your website");
    freeze(staging).map_err(|e| {
        message::explained("Silex could not fetch the data of your website.", &e, &[])
    })?;
    job.step("Building your website with Zola");
    zola(site, staging, output)
        .map_err(|e| message::explained("Silex could not build your website with Zola.", &e, &[]))
}

/// The published files, linked rather than copied: a website heavy with images is not copied at each build
///
/// gqlfreez and Zola never write into a file they did not create, so
/// the published files stay as the editor wrote them.
fn mirror(from: &Path, to: &Path) -> std::io::Result<()> {
    if to.exists() {
        std::fs::remove_dir_all(to)?;
    }
    std::fs::create_dir_all(to)?;
    link_all(from, to)
}

fn freeze(root: &Path) -> Result<(), String> {
    use gqlfreez::options::defaults;
    let options = gqlfreez::Options {
        root: root.to_path_buf(),
        glob: defaults::GLOB.to_string(),
        endpoint: None,
        headers: Vec::new(),
        concurrency: defaults::CONCURRENCY,
        page_size: defaults::PAGE_SIZE,
        retries: defaults::RETRIES,
        delay: defaults::DELAY,
        connect_timeout: defaults::CONNECT_TIMEOUT,
        request_timeout: defaults::REQUEST_TIMEOUT,
        file_timeout: defaults::FILE_TIMEOUT,
        max_pages: defaults::MAX_PAGES,
        max_response_bytes: defaults::MAX_RESPONSE_BYTES,
        allow_partial: false,
        envelope: false,
        check: false,
        dry_run: false,
        logger: gqlfreez::Logger::new(gqlfreez::Level::Silent, false),
    };
    let results = match tauri::async_runtime::block_on(gqlfreez::run(&options)) {
        Ok(results) => results,
        // A website without data has no query to freeze
        Err(gqlfreez::Error::NoQueries { .. }) => return Ok(()),
        Err(e) => return Err(e.to_string()),
    };
    match results.into_iter().find_map(|result| match result.outcome {
        gqlfreez::Outcome::Failed(e) => Some((result.source, e)),
        _ => None,
    }) {
        Some((source, e)) => Err(format!(
            "{}: {e}",
            source.strip_prefix(root).unwrap_or(&source).display()
        )),
        None => Ok(()),
    }
}

// The user's own, once written
fn config(site: &Path) -> Result<std::path::PathBuf, String> {
    let config = site.join(CONFIG);
    if !config.exists() {
        std::fs::write(&config, DEFAULT_CONFIG).map_err(|e| e.to_string())?;
    }
    Ok(config)
}

pub fn build_commands() -> Vec<String> {
    [
        // gqlfreez stops on a website without queries, which has no data to fetch
        run_if(
            &format!("find {PUBLIC_FOLDER} -name '*.graphql' | grep -q ."),
            GQLFREEZ,
            PUBLIC_FOLDER,
        ),
        // Zola checks the system roots even for local data, and node:22-slim has none
        vec![
            "if [ ! -e /etc/ssl/certs/ca-certificates.crt ]; then".to_string(),
            format!("  mkdir -p {CACHE_FOLDER}"),
            format!("  node -e \"console.log(require('tls').rootCertificates.join('\\n'))\" > {CACHE_FOLDER}/roots.pem"),
            format!("  export SSL_CERT_FILE=\"$PWD/{CACHE_FOLDER}/roots.pem\""),
            "fi".to_string(),
        ],
        download_lines(ZOLA),
        vec![
            "tar xzf \"$file\" -C \"$(dirname \"$file\")\"".to_string(),
            // The config is found from the root, the output from here; --force
            // for a _site left by an earlier build
            format!("\"$(dirname \"$file\")/zola\" --root {PUBLIC_FOLDER} --config ../{CONFIG} build --output-dir {} --force", BUILD_OUTPUT.trim_end_matches('/')),
        ],
    ]
    .concat()
}

fn zola(site: &Path, root: &Path, output: &Path) -> Result<(), String> {
    let config = config(site)?;
    catch_unwind(AssertUnwindSafe(|| -> errors::Result<()> {
        let mut site = site::Site::new(root, &config)?;
        site.set_output_path(output);
        site.load()?;
        site.build()
    }))
    .map_err(|panic| {
        format!(
            "Zola stopped before the end of the build: {}",
            said(&*panic)
        )
    })?
    .map_err(|e| format!("{e:#}"))
}

fn said(panic: &(dyn Any + Send)) -> &str {
    panic
        .downcast_ref::<&str>()
        .copied()
        .or_else(|| panic.downcast_ref::<String>().map(String::as_str))
        .unwrap_or("no reason given")
}
