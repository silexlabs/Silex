/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! What a remote URL says
//!
//! Kept as small as possible on purpose: an integration is asked what it knows
//! about a website rather than having Silex read it off a URL. Only the
//! programs that cannot be asked read this.

/// Host, owner and repository name of a git remote
pub struct Remote {
    pub host: String,
    pub owner: String,
    pub repo: String,
}

impl Remote {
    /// The remote of a website, asked by the integrations that work from one
    pub fn of(site: &std::path::Path) -> Option<Remote> {
        let url = super::git::remote_url(site)?;
        let read = Remote::parse(&url);
        if read.is_none() {
            tracing::warn!(remote = %redact(&url), "This remote is written in a way Silex cannot read");
        }
        read
    }

    /// The host part of a URL, `https://codeberg.org/x/y` and `git@sr.ht:~x/y`
    /// alike
    pub fn host_of(url: &str) -> Option<String> {
        Remote::parse(url)
            .map(|remote| remote.host)
            .or_else(|| {
                let rest = url
                    .trim()
                    .split_once("://")
                    .map(|(_, rest)| rest)
                    .unwrap_or(url);
                let authority = rest.split(['/', ':']).next()?;
                let host = authority.rsplit_once('@').map(|(_, h)| h).unwrap_or(authority);
                (!host.is_empty()).then(|| host.to_string())
            })
    }

    /// Parse `https://host/owner/repo.git`, `git@host:owner/repo.git` and
    /// sourcehut's `~owner`
    pub fn parse(remote_url: &str) -> Option<Remote> {
        let url = remote_url.trim().trim_end_matches('/');
        let url = url.strip_suffix(".git").unwrap_or(url);

        let rest = if let Some(rest) = url
            .strip_prefix("https://")
            .or_else(|| url.strip_prefix("http://"))
        {
            let (authority, path) = rest.split_once('/')?;
            // Drop credentials, as in https://user:token@host/owner/repo
            let host = authority.rsplit_once('@').map(|(_, h)| h).unwrap_or(authority);
            format!("{} {}", host, path)
        } else if let Some(rest) = url.strip_prefix("ssh://") {
            let (authority, path) = rest.split_once('/')?;
            let host = authority.rsplit_once('@').map(|(_, h)| h).unwrap_or(authority);
            format!("{} {}", host, path)
        } else if url.split_once(':').is_some_and(|(before, _)| !before.contains('/')) {
            // `git@host:owner/repo`, and the same without a user, which git
            // takes just as well
            let rest = url.split_once('@').map(|(_, r)| r.to_string()).unwrap_or_else(|| url.to_string());
            rest.replacen(':', " ", 1)
        } else {
            return None;
        };

        let (host, path) = rest.split_once(' ')?;
        // A GitLab repository can live in nested groups, all of them are its
        // owner as far as an address is concerned
        let (owner, repo) = path.rsplit_once('/')?;
        let owner = owner.trim_start_matches('~');
        if owner.is_empty() || repo.is_empty() {
            return None;
        }
        Some(Remote {
            host: host.to_string(),
            owner: owner.to_string(),
            repo: repo.to_string(),
        })
    }
}

/// A remote URL as it can be shown: what a password could be in is dropped
pub fn without_secret(remote_url: &str) -> &str {
    remote_url.split('@').next_back().unwrap_or(remote_url)
}

/// The same, in the middle of a sentence a program wrote
///
/// A remote can carry a token, and git quotes the remote back in its errors.
/// Those errors are shown to the user and sent to telemetry, so every URL in
/// them loses what stands before its host.
pub fn redact(text: &str) -> String {
    let mut redacted = String::with_capacity(text.len());
    let mut rest = text;

    while let Some(scheme) = rest.find("://") {
        let (start, after) = rest.split_at(scheme + 3);
        redacted.push_str(start);

        let end = after
            .find(|c: char| c == '/' || c.is_whitespace())
            .unwrap_or(after.len());
        let (authority, tail) = after.split_at(end);
        match authority.rsplit_once('@') {
            Some((_, host)) => {
                redacted.push_str("***@");
                redacted.push_str(host);
            }
            None => redacted.push_str(authority),
        }
        rest = tail;
    }

    redacted.push_str(rest);
    redacted
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_the_shapes_a_remote_comes_in() {
        for (url, host, owner, repo) in [
            ("https://gitlab.com/lexoyo/site.git", "gitlab.com", "lexoyo", "site"),
            ("https://user:token@gitlab.com/lexoyo/site.git", "gitlab.com", "lexoyo", "site"),
            ("git@codeberg.org:alex/site.git", "codeberg.org", "alex", "site"),
            ("git@git.sr.ht:~alex/site", "git.sr.ht", "alex", "site"),
            ("ssh://alice@forge.example.com/team/site.git", "forge.example.com", "team", "site"),
            // git takes the scp form without a user just as well
            ("codeberg.org:alex/site.git", "codeberg.org", "alex", "site"),
            ("https://gitlab.com/group/subgroup/site.git", "gitlab.com", "group/subgroup", "site"),
        ] {
            let remote = Remote::parse(url).unwrap_or_else(|| panic!("could not parse {}", url));
            assert_eq!((remote.host.as_str(), remote.owner.as_str(), remote.repo.as_str()), (host, owner, repo), "{}", url);
        }
    }

    #[test]
    fn reads_the_host_of_a_url() {
        assert_eq!(Remote::host_of("https://codeberg.org/x/y").as_deref(), Some("codeberg.org"));
        assert_eq!(Remote::host_of("https://forge.example.com").as_deref(), Some("forge.example.com"));
        assert_eq!(Remote::host_of("git@git.sr.ht:~x/y").as_deref(), Some("git.sr.ht"));
    }

    #[test]
    fn shows_a_url_without_its_password() {
        assert_eq!(without_secret("https://oauth2:secret@gitlab.com/x/y.git"), "gitlab.com/x/y.git");
        assert_eq!(without_secret("https://gitlab.com/x/y.git"), "https://gitlab.com/x/y.git");
    }

    #[test]
    fn drops_the_secrets_a_program_quotes_back() {
        let said = "remote: HTTP Basic: Access denied\nfatal: Authentication failed for 'https://lexoyo:glpat-abc123@gitlab.com/lexoyo/site.git/'";
        let shown = redact(said);
        assert!(!shown.contains("glpat-abc123"), "{}", shown);
        assert!(shown.contains("***@gitlab.com/lexoyo/site.git"), "{}", shown);

        // A URL with nothing to hide is left as it is, twice in a row included
        let plain = "could not read https://codeberg.org/a/b and https://sr.ht/~c/d";
        assert_eq!(redact(plain), plain);
        // And an error without any URL goes through untouched
        assert_eq!(redact("no such remote: origin"), "no such remote: origin");
    }
}

