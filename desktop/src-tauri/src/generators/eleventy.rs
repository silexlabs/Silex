/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
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

/// `required` when nothing else will build the website: a forge has its CI
pub fn build(
    site: &Path,
    output: &Path,
    required: bool,
    job: &Job,
) -> Result<Option<PathBuf>, String> {
    let Some(npx) = programs::users_own("npx") else {
        if required {
            return Err(message::told(
                "Node.js must be installed on this computer to build this website with Eleventy.",
                &[],
            ));
        }
        return Ok(None);
    };
    job.step("Building your website with Eleventy");
    match eleventy(&npx, site, output) {
        Ok(()) => Ok(Some(output.to_path_buf())),
        Err(e) if required => Err(message::explained(
            "Silex could not build your website with Eleventy.",
            &e,
            &[],
        )),
        Err(e) => {
            tracing::warn!("Eleventy failed on this computer, leaving the build to the CI: {e}");
            Ok(None)
        }
    }
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
