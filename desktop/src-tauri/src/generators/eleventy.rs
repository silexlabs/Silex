/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Eleventy, run by the CI of the forge from build.sh

const ELEVENTY_VERSION: &str = "3.1.6";

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
        format!("npx @11ty/eleventy@{ELEVENTY_VERSION} --input=public --output=_site"),
        COPY_PUBLIC_FOLDERS.to_string(),
    ]
}
