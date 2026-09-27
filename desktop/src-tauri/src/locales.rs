/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The locales of the dashboard, the one catalog of the app
//!
//! Rust reads them for the windows it opens itself: the native dialogs and the
//! splash screen. These follow the language of this computer, since the one
//! picked in the dashboard is kept in the webview.

use std::collections::HashMap;
use std::sync::OnceLock;

const FRENCH: &str = include_str!("../../dashboard/src/locales/fr.json");

pub const UPDATE_AVAILABLE: &str = "Update available";
pub const UPDATE_NOW: &str = "Silex {version} is available. Do you want to update now?";
pub const UPDATE_AND_RESTART: &str = "Update & Restart";
pub const LATER: &str = "Later";
pub const SAVE_BEFORE_QUITTING: &str = "Do you want to save changes before quitting?";
pub const SAVE_AND_QUIT: &str = "Save & Quit";
pub const QUIT: &str = "Quit";
pub const SAVING: &str = "Saving your work";
pub const NOT_SENT_YET: &str = "Your work is saved on this computer, but some of it has not reached your repository yet.\n\nSilex will send it the next time you open it.";
pub const STARTING: &str = "Starting your workspace…";

#[cfg(test)]
const ALL: &[&str] = &[
    UPDATE_AVAILABLE,
    UPDATE_NOW,
    UPDATE_AND_RESTART,
    LATER,
    SAVE_BEFORE_QUITTING,
    SAVE_AND_QUIT,
    QUIT,
    SAVING,
    NOT_SENT_YET,
    STARTING,
];

pub fn in_french() -> bool {
    sys_locale::get_locale().is_some_and(|locale| locale.starts_with("fr"))
}

/// `key` in the language of this computer, English when the locale has no other
pub fn tr(key: &str) -> String {
    static FRENCH_WORDS: OnceLock<HashMap<String, String>> = OnceLock::new();
    let words = FRENCH_WORDS.get_or_init(|| {
        if in_french() {
            serde_json::from_str(FRENCH).unwrap_or_default()
        } else {
            HashMap::new()
        }
    });
    words.get(key).cloned().unwrap_or_else(|| key.to_string())
}

/// The label of a dialog button
///
/// The TaskDialog of Windows takes a `&` for the letter it underlines as a
/// shortcut, and hides it. GTK and macOS show it as it is.
pub fn button(key: &str) -> String {
    let label = tr(key);
    if cfg!(windows) {
        label.replace('&', "&&")
    } else {
        label
    }
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use super::{ALL, FRENCH};

    const ENGLISH: &str = include_str!("../../dashboard/src/locales/en.json");

    fn keys(locale: &str) -> BTreeMap<String, String> {
        serde_json::from_str(locale).expect("a locale is a flat object of strings")
    }

    #[test]
    fn both_locales_have_the_same_keys() {
        let (english, french) = (keys(ENGLISH), keys(FRENCH));
        let only_in_one: Vec<_> = english
            .keys()
            .filter(|key| !french.contains_key(*key))
            .chain(french.keys().filter(|key| !english.contains_key(*key)))
            .collect();
        assert!(
            only_in_one.is_empty(),
            "in one locale only: {only_in_one:?}"
        );
    }

    #[test]
    fn what_rust_says_is_in_both_locales() {
        let (english, french) = (keys(ENGLISH), keys(FRENCH));
        let missing: Vec<_> = silex_server::said::ALL
            .iter()
            .chain(ALL)
            .filter(|key| !english.contains_key(**key) || !french.contains_key(**key))
            .collect();
        assert!(missing.is_empty(), "missing from the locales: {missing:?}");
    }
}
