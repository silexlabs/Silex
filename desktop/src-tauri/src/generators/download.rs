/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

//! Release files that build.sh downloads, checked, in the CI of the forge

use crate::integrations::common::install::{archive_for, Archive};

// node, because the build image has neither curl nor wget
const DOWNLOAD: &str = "node -e \"fetch(process.argv[1]).then(r => r.arrayBuffer()).then(b => require('fs').writeFileSync(process.argv[2], Buffer.from(b)))\"";
// Cached by GitLab CI, where npx keeps its packages
pub const CACHE_FOLDER: &str = ".npm";

fn linux<'a>(archives: &'a [Archive], arch: &str) -> &'a Archive {
    archive_for(archives, "linux", arch).expect("a build for Linux among the archives")
}

/// Leaves the file for this machine at `$file`
///
/// Named after its URL: the checksum, not the name, says when it changed.
pub fn download_lines(archives: &[Archive]) -> Vec<String> {
    let (x64, arm64) = (linux(archives, "x86_64"), linux(archives, "aarch64"));
    vec![
        format!(
            "case \"$(uname -m)\" in aarch64|arm64) url={} sum={} ;; *) url={} sum={} ;; esac",
            arm64.url, arm64.sha256, x64.url, x64.sha256
        ),
        format!("mkdir -p {CACHE_FOLDER}"),
        format!("file={CACHE_FOLDER}/$(basename \"$url\")"),
        "if ! echo \"$sum  $file\" | sha256sum -c - >/dev/null 2>&1; then".to_string(),
        format!("  {DOWNLOAD} \"$url\" \"$file\""),
        "  echo \"$sum  $file\" | sha256sum -c -".to_string(),
        "fi".to_string(),
    ]
}

pub fn run_if(condition: &str, archives: &[Archive], args: &str) -> Vec<String> {
    let run = download_lines(archives)
        .into_iter()
        .chain([
            "chmod +x \"$file\"".to_string(),
            format!("\"$file\" {args}"),
        ])
        .map(|line| format!("  {line}"));
    std::iter::once(format!("if {condition}; then"))
        .chain(run)
        .chain(std::iter::once("fi".to_string()))
        .collect()
}
