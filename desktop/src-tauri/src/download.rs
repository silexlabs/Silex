/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

//! What Silex downloads itself: templates, programs

use silex_server::said::{self, Said};

/// Why a request failed, worded for the user when it is the connection
pub fn not_downloaded(e: reqwest::Error) -> Said {
    // reqwest says "error sending request", the reason is in its sources
    let mut detail = e.to_string();
    let mut source = std::error::Error::source(&e);
    while let Some(cause) = source {
        detail.push_str(&format!(": {cause}"));
        source = cause.source();
    }
    if e.is_connect() || e.is_timeout() {
        Said::new(said::CHECK_CONNECTION).because(detail)
    } else {
        Said::raw(detail)
    }
}

/// The whole file, stopped past `max_bytes`, for a server that does not say
/// the size ahead
pub async fn download(
    client: &reqwest::Client,
    url: &str,
    max_bytes: usize,
    too_large: impl FnOnce() -> Said,
) -> Result<Vec<u8>, Said> {
    let mut response = client
        .get(url)
        .send()
        .await
        .and_then(reqwest::Response::error_for_status)
        .map_err(not_downloaded)?;
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(not_downloaded)? {
        bytes.extend_from_slice(&chunk);
        if bytes.len() > max_bytes {
            return Err(too_large());
        }
    }
    Ok(bytes)
}
