/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

use std::path::Path;

use super::git::Git;
use super::remote::Remote;

/// The addresses of a published website, as far as its forge told them
#[derive(Default)]
pub struct Urls {
    /// Where the website is served
    pub site: Option<String>,
    /// Where the build can be watched
    pub ci: Option<String>,
    /// Where the user sets a domain of their own
    pub settings: Option<String>,
}

/// What an integration answers when asked about a website
pub enum Answer {
    /// Not one of its own
    No,
    /// One of its own, but the user is not signed in to that forge
    ///
    /// Publishing still saves and sends the website: signing in to a forge and
    /// being able to push are two different things, and a user with an ssh key
    /// and no forge account pushes perfectly well.
    NotSignedIn,
    /// One of its own, and what it knows about it
    Yes(Urls),
}

pub trait Deploy: Send + Sync {
    fn program(&self) -> &'static str;

    /// How this program is asked for its version
    ///
    /// Asked once, when the program is found: the answer says which version a
    /// user is running when they report something, and asking at all proves the
    /// file that was found actually runs.
    fn version_args(&self) -> &'static [&'static str] {
        &["--version"]
    }

    /// Whether this website is one of its own, and what it knows about it
    ///
    /// The program is asked in the website folder. An error means the program
    /// could not tell, which is not the same as a no and must not be taken for
    /// one.
    ///
    /// `remote` is what git said about this website, read once and handed
    /// over: none of them goes looking for git itself, so a git the user turned
    /// off is a git nothing starts.
    fn urls(&self, cli: &Path, site: &Path, remote: Option<&Remote>) -> Result<Answer, String>;

    /// Write what the build needs and version it, answering what `sync` has to
    /// send along
    ///
    /// All of it happens in the website's own folder, so none of it needs the
    /// git of the user: only `sync` does, because only `sync` reaches a forge.
    fn deploy(&self, cli: &Path, site: &Path) -> Result<Prepared, String>;

    fn sync(&self, _cli: &Path, site: &Path, git: &Git, prepared: &Prepared) -> Result<(), String> {
        git.push(site, prepared.tag.as_deref())
    }
}

/// What `deploy` left for `sync` to send
pub struct Prepared {
    /// The forges that start their build on a tag put theirs here
    pub tag: Option<String>,
}

/// The address the user says their website is served at, when they said one
///
/// A forge that serves pages does not always say which of its addresses belongs
/// to which repository, and a domain of their own is never something to work
/// out: it is read from the website, where they wrote it.
///
/// The name of the file is the server's, kept in step by hand rather than
/// shared: the desktop reads what the server wrote, and nothing else here needs
/// to know how a website is stored.
pub fn published_domain(site: &Path) -> Option<String> {
    let website = std::fs::read_to_string(site.join("website.json")).ok()?;
    let website: serde_json::Value = serde_json::from_str(&website).ok()?;
    website
        .get("settings")?
        .get("publishDomain")?
        .as_str()
        .map(str::trim)
        .filter(|domain| !domain.is_empty())
        .map(String::from)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_the_address_the_user_named_and_nothing_else() {
        let site = std::env::temp_dir().join(format!("silex-domain-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&site);
        std::fs::create_dir_all(&site).unwrap();

        // Nothing written yet: nothing to say, rather than something to guess
        assert_eq!(published_domain(&site), None);

        std::fs::write(
            site.join("website.json"),
            r#"{ "settings": { "title": "My site", "publishDomain": " blog.example.com " } }"#,
        )
        .unwrap();
        assert_eq!(published_domain(&site).as_deref(), Some("blog.example.com"));

        // An empty setting is the user not having named one
        std::fs::write(site.join("website.json"), r#"{ "settings": { "publishDomain": "" } }"#).unwrap();
        assert_eq!(published_domain(&site), None);

        let _ = std::fs::remove_dir_all(&site);
    }
}

/// The tag name the SaaS uses, so that a history reads the same everywhere
///
/// The pipeline files only let a tag of this shape start a build: saving a
/// website is not publishing it, and a tag the user made for their own reasons
/// does not put a website online.
pub fn silex_tag() -> String {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|since| since.as_millis())
        .unwrap_or_default();
    format!("_silex_{}", timestamp)
}
