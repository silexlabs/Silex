/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! The programs Silex downloads itself, for a user who cannot install them

use std::env::consts::{ARCH, EXE_SUFFIX, OS};
use std::io::{Cursor, Read};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

use sha2::{Digest, Sha256};
use silex_server::said::Said;

use crate::download::{download, not_downloaded};

/// The build of a program for one system, as its project publishes it
pub struct Archive {
    pub os: &'static str,
    pub arch: &'static str,
    pub url: &'static str,
    pub sha256: &'static str,
}

/// The version Silex was tested with, replaced only by an update of Silex
pub struct Release {
    pub version: &'static str,
    /// Where the program is in the archive, without the `.exe` of Windows
    pub inside: &'static str,
    pub archives: &'static [Archive],
    /// Past this the download stops, well above the size of the archives
    pub max_bytes: usize,
}

/// One install at a time: two would write the same folder
static INSTALLING: Mutex<()> = Mutex::new(());

fn folder(data_dir: &Path, name: &str) -> PathBuf {
    data_dir.join("programs").join(name)
}

fn file_name(name: &str) -> String {
    format!("{name}{EXE_SUFFIX}")
}

/// The program Silex installed, when it is the version of this release
pub fn silex_copy(data_dir: &Path, name: &str, release: &Release) -> Option<PathBuf> {
    let path = folder(data_dir, name)
        .join(release.version)
        .join(file_name(name));
    path.is_file().then_some(path)
}

/// A copy Silex installed of another version than this release
pub fn is_old_silex_copy(
    data_dir: &Path,
    name: &str,
    release: Option<&Release>,
    path: &Path,
) -> bool {
    let all = folder(data_dir, name);
    path.starts_with(&all)
        && release.is_none_or(|release| !path.starts_with(all.join(release.version)))
}

pub fn has_archive_here(release: &Release) -> bool {
    archive_here(release).is_some()
}

fn archive_here(release: &Release) -> Option<&Archive> {
    release
        .archives
        .iter()
        .find(|archive| archive.os == OS && archive.arch == ARCH)
}

/// Downloads the program, checks it is the one its project published, and
/// keeps it in the folder of Silex, removing the versions installed before
pub fn install(data_dir: &Path, name: &str, release: &Release) -> Result<PathBuf, Said> {
    let _installing = crate::held::held(&INSTALLING);
    let archive = archive_here(release)
        .ok_or_else(|| Said::raw(format!("{name} has no build for {OS} on {ARCH}")))?;
    let bytes = tauri::async_runtime::block_on(fetched(archive.url, release.max_bytes))?;
    let sum: String = Sha256::digest(&bytes)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect();
    if sum != archive.sha256 {
        return Err(Said::raw(format!(
            "{} is not the file {name} published: its checksum is {sum}",
            archive.url
        )));
    }
    let inside = file_name(release.inside);
    let program = if archive.url.ends_with(".zip") {
        from_zip(&bytes, &inside)
    } else {
        from_tar_gz(&bytes, &inside)
    }
    .map_err(Said::raw)?
    .ok_or_else(|| Said::raw(format!("{} has no {inside}", archive.url)))?;
    place(data_dir, name, release.version, &program).map_err(Said::raw)
}

fn place(data_dir: &Path, name: &str, version: &str, program: &[u8]) -> Result<PathBuf, String> {
    let all = folder(data_dir, name);
    let unwritable = |e: std::io::Error| format!("{}: {e}", all.display());
    let removed = |folder: &Path| match std::fs::remove_dir_all(folder) {
        Err(e) if e.kind() != std::io::ErrorKind::NotFound => {
            Err(format!("{} is in use: {e}", folder.display()))
        }
        _ => Ok(()),
    };
    // Written aside then renamed, so that a download stopped halfway never
    // leaves a program that does not run
    let partial = all.join(format!("{version}.partial"));
    removed(&partial)?;
    std::fs::create_dir_all(&partial).map_err(unwritable)?;
    let path = partial.join(file_name(name));
    std::fs::write(&path, program).map_err(unwritable)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755))
            .map_err(unwritable)?;
    }
    let done = all.join(version);
    removed(&done)?;
    std::fs::rename(&partial, &done).map_err(unwritable)?;

    if let Ok(versions) = std::fs::read_dir(&all) {
        for other in versions
            .flatten()
            .filter(|other| other.file_name() != version)
        {
            if let Err(e) = removed(&other.path()) {
                tracing::warn!("{e}");
            }
        }
    }
    Ok(done.join(file_name(name)))
}

async fn fetched(url: &str, max_bytes: usize) -> Result<Vec<u8>, Said> {
    let client = reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(300))
        .https_only(true)
        .build()
        .map_err(not_downloaded)?;
    download(&client, url, max_bytes, || {
        Said::raw(format!("{url} is larger than expected"))
    })
    .await
}

fn from_tar_gz(bytes: &[u8], inside: &str) -> Result<Option<Vec<u8>>, String> {
    let mut archive = tar::Archive::new(flate2::read::GzDecoder::new(bytes));
    for entry in archive.entries().map_err(|e| e.to_string())? {
        let mut entry = entry.map_err(|e| e.to_string())?;
        if entry.header().entry_type().is_file()
            && entry.path().map_err(|e| e.to_string())? == Path::new(inside)
        {
            let mut program = Vec::new();
            entry.read_to_end(&mut program).map_err(|e| e.to_string())?;
            return Ok(Some(program));
        }
    }
    Ok(None)
}

fn from_zip(bytes: &[u8], inside: &str) -> Result<Option<Vec<u8>>, String> {
    let mut archive = zip::ZipArchive::new(Cursor::new(bytes)).map_err(|e| e.to_string())?;
    let mut entry = match archive.by_name(inside) {
        Ok(entry) => entry,
        Err(zip::result::ZipError::FileNotFound) => return Ok(None),
        Err(e) => return Err(e.to_string()),
    };
    let mut program = Vec::new();
    entry.read_to_end(&mut program).map_err(|e| e.to_string())?;
    Ok(Some(program))
}

#[cfg(test)]
mod tests {
    use super::*;

    // Without this, an update of Silex kept using the glab of the version before
    #[test]
    fn an_update_of_silex_replaces_its_old_copy() {
        let data_dir = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("target")
            .join(format!("install-test-{}", std::process::id()));
        let old = place(&data_dir, "glab", "1.0.0", b"old").unwrap();
        let release = Release {
            version: "2.0.0",
            inside: "bin/glab",
            archives: &[],
            max_bytes: 0,
        };
        assert!(is_old_silex_copy(&data_dir, "glab", Some(&release), &old));
        assert_eq!(silex_copy(&data_dir, "glab", &release), None);

        let new = place(&data_dir, "glab", "2.0.0", b"new").unwrap();
        assert_eq!(silex_copy(&data_dir, "glab", &release), Some(new));
        assert!(!old.exists());
        std::fs::remove_dir_all(&data_dir).unwrap();
    }
}
