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
//! Rust reads them for the native dialogs it opens itself, and for what it
//! tells the editor. These follow the language of this computer, since the one
//! picked in the dashboard is kept in the webview.

use std::collections::HashMap;
use std::sync::OnceLock;

const FRENCH: &str = include_str!("../../dashboard/src/locales/fr.json");

pub const UPDATE_AVAILABLE: &str = "Update available";
pub const UPDATE_NOW: &str = "Silex {version} is available. Do you want to update now?";
pub const UPDATE_AND_RESTART: &str = "Update and restart";
pub const LATER: &str = "Later";
pub const SAVE_BEFORE_QUITTING: &str = "Do you want to save changes before quitting?";
pub const SAVE_AND_QUIT: &str = "Save and quit";
pub const QUIT_WITHOUT_SAVING: &str = "Quit without saving";
pub const CANCEL: &str = "Cancel";
pub const SAVING: &str = "Saving your work";
pub const NOT_SENT_YET: &str = "Your work is saved on this computer, but some of it has not reached your repository yet.\n\nSilex will send it the next time you open this website.";
pub const CHANGED_ELSEWHERE: &str = "Silex could not send your work, because your repository has new commits. Your work is saved on this computer.";
pub const REFUSED_BY_HOST: &str = "Silex could not send your work, because {host} refused it. Your work is saved on this computer.";
pub const SEND_FAILED: &str =
    "Silex could not send your work to your repository. Your work is saved on this computer.";
pub const NEW_COMMITS: &str = "Your repository has new commits";
pub const NEW_COMMITS_DETAIL: &str = "This computer does not have these commits yet. Your work is saved on this computer, and nothing was lost or overwritten.";
pub const TECHNICAL_DETAILS: &str = "Technical details";
pub const OPEN_REPOSITORY: &str = "Open your repository on {host}";
pub const CONTINUE_EDITING: &str = "Continue editing";
pub const PUSHED: &str = "Pushed.";
pub const NOT_PUSHED: &str = "This website was never pushed.";
pub const AHEAD: &str = "1 commit is not pushed yet. | {count} commits are not pushed yet.";
pub const BEHIND: &str = "1 commit is not pulled yet. | {count} commits are not pulled yet.";
pub const DIVERGED: &str =
    "This computer and your repository both have new commits: they have diverged.";
pub const SYNC: &str = "Sync";

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
