/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

//! The address of a server, as the user typed or pasted it

pub fn is_plain_host(host: &str) -> bool {
    host.starts_with(|c: char| c.is_ascii_alphanumeric())
        && host
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || ".-:_".contains(c))
}

/// The host, with its port if it has one, after the first of `schemes` it
/// starts with
pub fn host_of(server: &str, schemes: &[&str]) -> Result<String, String> {
    let typed = server.trim();
    let host = schemes
        .iter()
        .find_map(|scheme| typed.strip_prefix(scheme))
        .unwrap_or(typed);
    // A link to a project is pasted as often as the address of the server
    let host = host.split('/').next().unwrap_or_default().to_lowercase();
    if !is_plain_host(&host) {
        return Err(format!("{} is not the address of a server", typed));
    }
    Ok(host)
}
