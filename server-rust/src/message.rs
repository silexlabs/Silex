/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! What the user reads about a publication
//!
//! The editor shows the message of a publication as HTML, so a sentence comes
//! with the buttons that belong to it: where the build is, where the website is
//! once something serves it. That is how the hosted version talks to the same
//! dialog, and the buttons wear the classes the dialog already styles.
//!
//! Everything that goes in comes from the host or from a path on this machine,
//! so all of it is escaped: a repository is named by its owner, and a quote in
//! a name would otherwise end an attribute early.

/// One button of a message
pub struct Button<'a> {
    pub label: &'a str,
    pub url: &'a str,
    /// The one thing to do next, when there is one. At most one per message.
    pub primary: bool,
}

impl<'a> Button<'a> {
    pub fn primary(label: &'a str, url: &'a str) -> Self {
        Button {
            label,
            url,
            primary: true,
        }
    }

    pub fn secondary(label: &'a str, url: &'a str) -> Self {
        Button {
            label,
            url,
            primary: false,
        }
    }
}

/// What the button opening the files of the website says
///
/// Never the published website: these are the files the editor generated, the
/// page generator runs on the host, and a website whose pages are named by its
/// author may have no `index.html` among them. Opening this can show a list of
/// files, which is what it promises.
pub const FILES_ON_THIS_COMPUTER: &str = "See the files on this computer";

/// A sentence to act on, and the buttons that go with it
pub fn told(sentence: &str, buttons: &[Button]) -> String {
    explained(sentence, "", buttons)
}

/// The same, with what somebody who wants to know more needs after it
///
/// The first sentence is the one a user acts on and it is the one in bold; what
/// follows explains it. Reading only the first line has to be enough.
pub fn explained(sentence: &str, more: &str, buttons: &[Button]) -> String {
    let mut written = format!("<p><strong>{}</strong></p>", escape(sentence));
    if !more.is_empty() {
        written.push_str(&format!("<p>{}</p>", escape(more)));
    }
    let shown: Vec<&Button> = buttons.iter().filter(|button| !button.url.is_empty()).collect();
    if shown.is_empty() {
        return written;
    }

    written.push_str("<div class=\"buttons\">");
    for button in shown {
        let kind = if button.primary { "primary" } else { "secondary" };
        written.push_str(&format!(
            "<a href=\"{}\" target=\"_blank\" class=\"silex-button silex-button--{}\">{}</a>",
            escape(button.url),
            kind,
            escape(button.label)
        ));
    }
    written.push_str("</div>");
    written
}

/// Text that cannot break out of the markup it is written into
fn escape(text: &str) -> String {
    let mut escaped = String::with_capacity(text.len());
    for character in text.chars() {
        match character {
            '&' => escaped.push_str("&amp;"),
            '<' => escaped.push_str("&lt;"),
            '>' => escaped.push_str("&gt;"),
            '"' => escaped.push_str("&quot;"),
            '\'' => escaped.push_str("&#39;"),
            _ => escaped.push(character),
        }
    }
    escaped
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_sentence_and_the_buttons_the_dialog_already_styles() {
        let written = told(
            "Your website is now live!",
            &[
                Button::primary("View your website", "https://alex.codeberg.page/site/"),
                Button::secondary("Website settings", "https://codeberg.org/alex/site/settings"),
            ],
        );
        assert!(written.starts_with("<p><strong>Your website is now live!</strong></p>"));
        assert!(written.contains("class=\"silex-button silex-button--primary\""), "{}", written);
        assert!(written.contains("class=\"silex-button silex-button--secondary\""), "{}", written);
        assert!(written.contains("href=\"https://alex.codeberg.page/site/\""), "{}", written);
    }

    #[test]
    fn what_explains_a_sentence_comes_after_it_and_not_in_bold() {
        let written = explained(
            "Codeberg did not start a build.",
            "Your website was sent, but nothing built it.",
            &[],
        );
        assert_eq!(
            written,
            "<p><strong>Codeberg did not start a build.</strong></p>\
             <p>Your website was sent, but nothing built it.</p>"
        );
    }

    #[test]
    fn a_button_with_nowhere_to_go_is_not_shown() {
        // A host that could not say where its build is still gets a message
        let written = told("Building your website", &[Button::secondary("See the build", "")]);
        assert_eq!(written, "<p><strong>Building your website</strong></p>");
        assert!(!written.contains("<div"), "no empty row of buttons: {}", written);
    }

    #[test]
    fn what_a_host_named_cannot_end_an_attribute_of_ours() {
        let written = told(
            "The build failed",
            &[Button::secondary("See the build", "https://host/x\"><script>alert(1)</script>")],
        );
        assert!(!written.contains("<script>"), "{}", written);
        assert!(written.contains("&quot;&gt;&lt;script&gt;"), "{}", written);
    }
}
