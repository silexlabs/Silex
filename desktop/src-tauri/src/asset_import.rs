/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Files an agent copies from the disk into a website

use std::path::Path;

pub struct LocalFile {
    pub name: String,
    pub content: Vec<u8>,
}

pub fn read_file(path: &str) -> Result<LocalFile, String> {
    let path = Path::new(path);
    if !path.is_absolute() {
        return Err(format!(
            "path must be absolute, like /home/me/logo.svg: {}",
            path.display()
        ));
    }
    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase)
        .unwrap_or_default();
    let unreadable = |e: std::io::Error| format!("Can not read {}: {e}", path.display());
    // Opening a named pipe would wait for a writer forever
    if !std::fs::metadata(path).map_err(unreadable)?.is_file() {
        return Err(format!("{} is not a file.", path.display()));
    }
    let content = std::fs::read(path).map_err(unreadable)?;
    Ok(LocalFile {
        name: safe_name(path, &extension),
        content,
    })
}

fn safe_name(path: &Path, extension: &str) -> String {
    let stem: String = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase()
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '-'
            }
        })
        .collect();
    let stem = stem.trim_matches('-');
    let extension = if extension == "jpeg" {
        "jpg"
    } else {
        extension
    };
    format!(
        "{}.{extension}",
        if stem.is_empty() { "image" } else { stem }
    )
}
