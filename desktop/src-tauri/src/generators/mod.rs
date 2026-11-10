/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

use std::path::{Path, PathBuf};

use silex_server::{Job, Ssg};

pub mod eleventy;
mod zola;

const GITIGNORE: &str = ".gitignore";
/// Where the built website goes, which is not part of the website
const BUILD_OUTPUT: &str = "_site/";

/// Eleventy and Hugo are built by the CI of the forge
pub fn build(site: &Path, ssg: Option<Ssg>, job: &Job) -> Result<Option<PathBuf>, String> {
    match ssg {
        Some(Ssg::Zola) => {
            ignore_build_output(site)?;
            let output = site.join(BUILD_OUTPUT);
            zola::build(site, &output, job)?;
            Ok(Some(output))
        }
        Some(Ssg::Eleventy | Ssg::Hugo) | None => Ok(None),
    }
}

/// Keep the built site out of the versioned website
///
/// The folder is versioned whole, so a build would otherwise put a copy of
/// the site in its own history.
pub fn ignore_build_output(site: &Path) -> Result<(), String> {
    let path = site.join(GITIGNORE);
    let current = std::fs::read_to_string(&path).unwrap_or_default();
    if current.lines().any(|line| {
        line.trim() == BUILD_OUTPUT.trim_end_matches('/') || line.trim() == BUILD_OUTPUT
    }) {
        return Ok(());
    }

    let mut content = current;
    if !content.is_empty() && !content.ends_with('\n') {
        content.push('\n');
    }
    content.push_str(BUILD_OUTPUT);
    content.push('\n');
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use silex_server::PUBLIC_FOLDER;

    /// A website as Silex publishes it for Zola: a page with data, a page without
    fn published(name: &str, files: &[(&str, &str)]) -> PathBuf {
        let site = std::env::temp_dir().join(format!("silex-build-{name}-{}", std::process::id()));
        for (path, content) in [
            (
                "content/_index.md",
                "+++\ntemplate = \"silex-index.html\"\n+++\n",
            ),
            ("templates/silex-index.html", TEMPLATE),
            ("data/silex/wp/index.json", "{\"title\": \"Hello\"}"),
            ("static/about/index.html", "<p>About</p>"),
        ]
        .iter()
        .chain(files)
        {
            let path = site.join(PUBLIC_FOLDER).join(path);
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            std::fs::write(path, content).unwrap();
        }
        site
    }

    fn job() -> Job {
        silex_server::Jobs::default().start("Publishing")
    }

    const TEMPLATE: &str = "{% set data = load_data(path=\"data/silex/wp/index.json\") %}<h1>{{ data.title }}</h1><p>{{ config.base_url }}</p>";

    #[test]
    fn a_website_published_for_zola_is_built_twice_in_a_row() {
        let site = published("twice", &[]);
        for _ in 0..2 {
            let built = build(&site, Some(Ssg::Zola), &job()).unwrap().unwrap();
            assert!(std::fs::read_to_string(built.join("index.html"))
                .unwrap()
                .contains("<h1>Hello</h1>"));
            assert_eq!(
                std::fs::read_to_string(built.join("about/index.html")).unwrap(),
                "<p>About</p>"
            );
        }
        assert!(!site.join(PUBLIC_FOLDER).join("zola.toml").exists());
    }

    #[test]
    fn the_zola_config_of_the_website_is_written_once_and_then_read() {
        let site = published("config", &[]);
        build(&site, Some(Ssg::Zola), &job()).unwrap();
        assert_eq!(
            std::fs::read_to_string(site.join("zola.toml")).unwrap(),
            "base_url = \"/\"\n"
        );
        std::fs::write(
            site.join("zola.toml"),
            "base_url = \"https://example.org\"\n",
        )
        .unwrap();
        let built = build(&site, Some(Ssg::Zola), &job()).unwrap().unwrap();
        assert!(std::fs::read_to_string(built.join("index.html"))
            .unwrap()
            .contains("https://example.org"));
    }

    #[test]
    fn a_broken_template_ends_the_publication_with_what_zola_said_and_the_built_folder_out_of_git()
    {
        let site = published(
            "broken",
            &[("templates/silex-index.html", "{{ nope | unknown_filter }}")],
        );
        let error = build(&site, Some(Ssg::Zola), &job()).unwrap_err();
        assert!(error.contains("unknown_filter"), "{error}");
        assert!(std::fs::read_to_string(site.join(GITIGNORE))
            .unwrap()
            .contains(BUILD_OUTPUT));
    }

    #[test]
    fn a_data_source_out_of_reach_names_the_query() {
        let site = published(
            "unreachable",
            &[
                ("data/silex/wp/index.graphql", "query { title }"),
                // Nothing listens on port 1 of this computer
                (
                    "data/silex/wp/.graphqlrc.yml",
                    "schema: \"http://127.0.0.1:1/graphql\"\n",
                ),
            ],
        );
        let error = build(&site, Some(Ssg::Zola), &job()).unwrap_err();
        assert!(error.contains("index.graphql"), "{error}");
    }
}
