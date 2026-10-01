/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! What Silex tells the person in the desktop dashboard when something fails
//!
//! Each sentence is a key of the dashboard's locales, sent as it is written:
//! the dashboard translates it and puts in the `{name}` parameters. What the
//! system said (the OS, git, the network) goes in the detail, never
//! translated.

use std::collections::BTreeMap;
use std::fmt;

use serde::Serialize;
use serde_json::{Number, Value};

pub const SENDING: &str =
    "Silex is sending this website to its repository. Try again in a few seconds.";
pub const NO_WEBSITE: &str = "This website is not on this computer anymore.";
pub const CHECK_CONNECTION: &str = "Check your internet connection, then try again.";
pub const TEMPLATE_ELSEWHERE: &str = "Silex only takes templates from {group}, not from {url}.";
pub const ARCHIVE_TOO_LARGE: &str =
    "This template is larger than {mb} MB, which Silex does not copy.";
pub const TEMPLATE_TOO_LARGE: &str =
    "This template is larger than {mb} MB or {files} files, which Silex does not copy.";
pub const NOT_A_WEBSITE: &str =
    "This template is not a Silex website: it has no {file} at its root.";
pub const TEMPLATE_LINKS: &str =
    "This template has symbolic links in it, which Silex does not copy.";
pub const TEMPLATE_FILE: &str = "This template has a file Silex does not copy: {file}";
pub const DAMAGED: &str = "Could not read “{file}”. This file of your website is damaged.";
pub const COPY_PUBLISHED_OVER: &str =
    "The copy would have kept where the first website is published, and publishing it would have replaced the first one.";
pub const NOT_IN_A_WEBSITE: &str = "Silex only opens the folders of your websites, not {path}.";
pub const NOT_VERSIONED: &str =
    "Your website is saved on this computer. What Silex could not do is add this version to its history:";
pub const DOES_NOT_OPEN: &str =
    "Silex only opens web addresses and the folders of your websites, not {url}.";

/// Every sentence, for the test that finds each one in the locales
pub const ALL: &[&str] = &[
    SENDING,
    NO_WEBSITE,
    CHECK_CONNECTION,
    TEMPLATE_ELSEWHERE,
    ARCHIVE_TOO_LARGE,
    TEMPLATE_TOO_LARGE,
    NOT_A_WEBSITE,
    TEMPLATE_LINKS,
    TEMPLATE_FILE,
    DAMAGED,
    COPY_PUBLISHED_OVER,
    NOT_IN_A_WEBSITE,
    DOES_NOT_OPEN,
    NOT_VERSIONED,
];

#[derive(Debug, Clone, Default, Serialize)]
pub struct Said {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sentence: Option<&'static str>,
    #[serde(skip_serializing_if = "BTreeMap::is_empty")]
    pub params: BTreeMap<&'static str, Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

impl Said {
    pub fn new(sentence: &'static str) -> Self {
        Self {
            sentence: Some(sentence),
            ..Self::default()
        }
    }

    /// Only the words of the system, when Silex has nothing to add to them
    pub fn raw(detail: impl fmt::Display) -> Self {
        Self {
            detail: Some(detail.to_string()),
            ..Self::default()
        }
    }

    pub fn with(mut self, name: &'static str, value: impl fmt::Display) -> Self {
        self.params.insert(name, Value::String(value.to_string()));
        self
    }

    /// Sent as a number, for the dashboard to write it the way its language does
    pub fn with_number(mut self, name: &'static str, value: impl Into<Number>) -> Self {
        self.params.insert(name, Value::Number(value.into()));
        self
    }

    pub fn because(mut self, detail: impl fmt::Display) -> Self {
        self.detail = Some(detail.to_string());
        self
    }
}

/// `sentence` with its `{name}` parameters put in, as the dashboard does
pub fn fill<'a>(sentence: &str, params: impl IntoIterator<Item = (&'a str, &'a str)>) -> String {
    params
        .into_iter()
        .fold(sentence.to_string(), |written, (name, value)| {
            written.replace(&format!("{{{name}}}"), value)
        })
}

/// In English, for the logs and for the editor, which does not translate
impl fmt::Display for Said {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let params: Vec<(&str, String)> = self
            .params
            .iter()
            .map(|(name, value)| match value {
                Value::String(text) => (*name, text.clone()),
                other => (*name, other.to_string()),
            })
            .collect();
        let mut written = fill(
            self.sentence.unwrap_or_default(),
            params.iter().map(|(name, value)| (*name, value.as_str())),
        );
        if let Some(detail) = &self.detail {
            if !written.is_empty() {
                written.push(' ');
            }
            written.push_str(detail);
        }
        f.write_str(&written)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn says_it_in_english_with_the_detail_after() {
        let said = Said::new(TEMPLATE_TOO_LARGE)
            .with_number("mb", 200)
            .with_number("files", 10_000)
            .because("disk full");
        assert_eq!(
            said.to_string(),
            "This template is larger than 200 MB or 10000 files, which Silex does not copy. disk full"
        );
        assert_eq!(Said::raw("disk full").to_string(), "disk full");
    }

    #[test]
    fn sends_the_sentence_unformatted_and_the_numbers_as_numbers() {
        let said = serde_json::to_value(
            Said::new(TEMPLATE_FILE)
                .with("file", "a.txt")
                .with_number("mb", 50),
        )
        .unwrap();
        assert_eq!(
            said,
            serde_json::json!({ "sentence": TEMPLATE_FILE, "params": { "file": "a.txt", "mb": 50 } })
        );
    }
}
