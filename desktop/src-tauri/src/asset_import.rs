/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Images an agent copies from the disk into a website

use std::io::Read;
use std::path::Path;

const MAX_BYTES: u64 = 10 * 1024 * 1024;

pub struct Image {
    pub name: String,
    pub content: Vec<u8>,
}

pub fn read_image(path: &str) -> Result<Image, String> {
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
    let mut content = Vec::new();
    std::fs::File::open(path)
        .map_err(unreadable)?
        .take(MAX_BYTES + 1)
        .read_to_end(&mut content)
        .map_err(unreadable)?;
    if content.len() as u64 > MAX_BYTES {
        return Err(format!("{} is larger than 10 MB.", path.display()));
    }
    Ok(Image {
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

#[cfg(test)]
mod tests {
    use super::*;

    fn write(name: &str, content: &[u8]) -> String {
        let dir = std::env::current_dir()
            .unwrap()
            .join("target")
            .join("asset-import-tests");
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join(name);
        std::fs::write(&path, content).unwrap();
        path.to_string_lossy().into_owned()
    }

    fn refusal(path: &str) -> String {
        read_image(path).err().unwrap_or_default()
    }

    #[test]
    fn reads_a_file_under_a_safe_name() {
        assert_eq!(
            read_image(&write("Logo Final.PNG", b"png")).unwrap().name,
            "logo-final.png"
        );
    }

    #[test]
    fn says_why_a_file_is_refused() {
        assert!(refusal("relative/logo.png").contains("must be absolute"));
        let large = vec![0; 10 * 1024 * 1024 + 1];
        assert!(refusal(&write("large.png", &large)).contains("larger than 10 MB"));
    }
}
