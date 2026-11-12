/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

use std::path::{Path, PathBuf};

use silex_server::{message, Job, PUBLIC_FOLDER};

use super::link_all;
use crate::integrations::common::{programs, run};

const ELEVENTY_VERSION: &str = "3.1.6";
const INPUT: &str = "--input=public";
const OUTPUT: &str = "--output=_site";

// The guard is for a public/ with no folder at all: the glob then stays
// literal and cp would stop the build
const COPY_PUBLIC_FOLDERS: &str =
    "for dir in public/*/; do [ -d \"$dir\" ] || continue; cp -R \"$dir\" _site/; done";

// TEMPORARY: remove after the 3.10 stable, only sites published with 3.10.0-canary.3 have this file
const FAIL_ON_CANARY_DATA_FILE: &str =
    "test -f public/public.11tydata.js && echo 'Please delete public/public.11tydata.js' && exit 1";

pub fn build_commands() -> Vec<String> {
    vec![
        FAIL_ON_CANARY_DATA_FILE.to_string(),
        format!("npx @11ty/eleventy@{ELEVENTY_VERSION} {INPUT} {OUTPUT}"),
        COPY_PUBLIC_FOLDERS.to_string(),
    ]
}

pub fn build(site: &Path, output: &Path, job: &Job) -> Result<PathBuf, String> {
    let Some(npx) = programs::users_own("npx") else {
        return Err(message::told(
            "Node.js must be installed on this computer to build this website with Eleventy.",
            &[],
        ));
    };
    job.step("Building your website with Eleventy");
    eleventy(&npx, site, output).map_err(|e| {
        message::explained("Silex could not build your website with Eleventy.", &e, &[])
    })?;
    Ok(output.to_path_buf())
}

fn eleventy(npx: &Path, site: &Path, output: &Path) -> Result<(), String> {
    if output.exists() {
        std::fs::remove_dir_all(output).map_err(|e| e.to_string())?;
    }
    let package = format!("@11ty/eleventy@{ELEVENTY_VERSION}");
    let args = ["--yes", &package, INPUT, OUTPUT];
    let ran = run::run_transfer_verbatim(npx, site, &args)?;
    if ran.failed {
        return Err(run::failure(npx, &ran));
    }
    copy_public_folders(&site.join(PUBLIC_FOLDER), output).map_err(|e| e.to_string())
}

fn copy_public_folders(public: &Path, output: &Path) -> std::io::Result<()> {
    for entry in std::fs::read_dir(public)? {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            let target = output.join(entry.file_name());
            std::fs::create_dir_all(&target)?;
            link_all(&entry.path(), &target)?;
        }
    }
    Ok(())
}
