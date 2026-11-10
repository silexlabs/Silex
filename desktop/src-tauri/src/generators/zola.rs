/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Zola, built on this computer
//!
//! gqlfreez and Zola are compiled into the app, so that there is nothing to install.

use std::any::Any;
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::path::Path;
use std::sync::Mutex;

use silex_server::{message, Job, PUBLIC_FOLDER};

use crate::held::held;

const CONFIG: &str = "zola.toml";
// Zola refuses an empty base_url, and a website served at the root of its domain needs no other
const DEFAULT_CONFIG: &str = "base_url = \"/\"\n";

// Two publications of the same website at once would each empty the built folder of the other
static BUILDING: Mutex<()> = Mutex::new(());

pub fn build(site: &Path, output: &Path, job: &Job) -> Result<(), String> {
    let public = site.join(PUBLIC_FOLDER);
    job.step("Fetching the data of your website");
    freeze(&public).map_err(|e| {
        message::explained("Silex could not fetch the data of your website.", &e, &[])
    })?;
    job.step("Building your website with Zola");
    zola(site, &public, output)
        .map_err(|e| message::explained("Silex could not build your website with Zola.", &e, &[]))
}

fn freeze(public: &Path) -> Result<(), String> {
    use gqlfreez::options::defaults;
    let options = gqlfreez::Options {
        root: public.to_path_buf(),
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
            source.strip_prefix(public).unwrap_or(&source).display()
        )),
        None => Ok(()),
    }
}

fn zola(site: &Path, public: &Path, output: &Path) -> Result<(), String> {
    // The user's own, once written
    let config = site.join(CONFIG);
    if !config.exists() {
        std::fs::write(&config, DEFAULT_CONFIG).map_err(|e| e.to_string())?;
    }
    let _building = held(&BUILDING);
    catch_unwind(AssertUnwindSafe(|| -> errors::Result<()> {
        let mut site = site::Site::new(public, &config)?;
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
