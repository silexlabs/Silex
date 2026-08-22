/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Website storage on the local filesystem
//!
//! Each website is a directory under the data path:
//!
//! ```text
//! data_path/
//!   {website_id}/
//!     website.json     <- marks the directory as a Silex website
//!     meta.json        <- optional, a cloned website has none
//!     assets/
//!     pages/
//!       index-abc123.json
//! ```
//!
//! The split between `website.json` and one file per page is the format shared
//! with the Node server: it is what makes a website readable in a git diff.
//!
//! Two rules drive this module: never transform data silently, and only
//! validate what the server actually needs (`pages` and `pagesFolder`).

use chrono::{DateTime, Utc};
use std::collections::HashSet;
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use tokio::fs;

use crate::error::{Error, Result};
use crate::history;
use crate::models::{
    empty_website, names_one_folder, WebsiteId, WebsiteMeta, WebsiteMetaFileContent, ASSETS_FOLDER,
    PUBLIC_FOLDER, WEBSITE_DATA_FILE, WEBSITE_META_DATA_FILE,
};

// ==================
// Paths
// ==================

/// Resolve a path in the data path, and refuse it if it leads out of it
///
/// Website ids are checked when they are read, but page ids, asset names and
/// published file names are not: they are whatever the editor sent. The file
/// may not exist yet, so `..` is resolved on the components rather than on the
/// disk.
pub(crate) fn under_data_path(data_path: &Path, path: impl AsRef<Path>) -> Result<PathBuf> {
    let path = path.as_ref();
    let asked = resolved(&data_path.join(path));

    if !asked.starts_with(resolved(data_path)) {
        return Err(Error::InvalidInput(format!(
            "'{}' is not in the data folder",
            path.display()
        )));
    }

    Ok(asked)
}

/// The same path with its `.` and `..` taken out, without reading the disk
fn resolved(path: &Path) -> PathBuf {
    let mut resolved = PathBuf::new();

    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                resolved.pop();
            }
            component => resolved.push(component),
        }
    }

    resolved
}

/// Directory holding one website
pub fn website_path(data_path: &Path, website_id: &WebsiteId) -> Result<PathBuf> {
    under_data_path(data_path, website_id.as_str())
}

/// Where the published files of a website are, as an address a browser opens
///
/// These are the files the editor generated, not the website that gets built
/// out of them: nothing here ran the page generator. Said in one place because
/// the metadata of a website and the message of a publication both point at
/// this same folder.
pub fn published_files_url(data_path: &Path, website_id: &str) -> String {
    // Nothing but the data path is ours to show, so an id naming anything else
    // is shown as the data path rather than as the folder it asked for
    let website = website_id
        .parse::<WebsiteId>()
        .ok()
        .and_then(|website_id| website_path(data_path, &website_id).ok())
        .unwrap_or_else(|| data_path.to_path_buf());

    format!("file://{}", website.join(PUBLIC_FOLDER).display())
}

fn website_data_path(data_path: &Path, website_id: &WebsiteId) -> Result<PathBuf> {
    Ok(website_path(data_path, website_id)?.join(WEBSITE_DATA_FILE))
}

fn website_meta_path(data_path: &Path, website_id: &WebsiteId) -> Result<PathBuf> {
    Ok(website_path(data_path, website_id)?.join(WEBSITE_META_DATA_FILE))
}

fn assets_path(data_path: &Path, website_id: &WebsiteId) -> Result<PathBuf> {
    Ok(website_path(data_path, website_id)?.join(ASSETS_FOLDER))
}

/// Make sure the storage root exists.
///
/// We intentionally do NOT create a default website: on a fresh install the
/// dashboard opens empty and the user creates their first site from there.
pub async fn init(data_path: &Path) -> Result<()> {
    fs::create_dir_all(data_path).await?;
    Ok(())
}

/// Write a file by writing beside it and moving it onto its name
///
/// A write cut short leaves the file that was there, never half of a new one:
/// half a page file, or half a `website.json`, makes the whole website
/// unreadable.
///
/// The name written to belongs to this write alone. The editor saving while
/// something else saves the same website is two writes of the same file at
/// once, and on one shared name the second one finds nothing left to move.
pub(crate) async fn write_file(path: &Path, content: impl AsRef<[u8]>) -> Result<()> {
    let being_written = written_beside(path)?;

    let written = async {
        fs::write(&being_written, content).await?;
        fs::rename(&being_written, path).await
    }
    .await;

    if written.is_err() {
        let _ = fs::remove_file(&being_written).await;
    }

    Ok(written?)
}

/// Name to write a file under until it is whole
fn written_beside(path: &Path) -> Result<PathBuf> {
    static WRITES: AtomicU64 = AtomicU64::new(0);

    let mut name = path
        .file_name()
        .ok_or_else(|| Error::InvalidInput(format!("'{}' is not a file name", path.display())))?
        .to_os_string();
    name.push(format!(
        ".{}-{}.writing",
        std::process::id(),
        WRITES.fetch_add(1, Ordering::Relaxed)
    ));

    Ok(path.with_file_name(name))
}

// ==================
// Website data
// ==================

/// List the websites, i.e. the directories holding a `website.json`.
///
/// Anything else in the data path is not ours: the webview stores its own
/// origin directories next to the websites.
pub async fn list_websites(data_path: &Path) -> Result<Vec<WebsiteMeta>> {
    let mut websites = Vec::new();
    let mut entries = fs::read_dir(data_path).await?;

    while let Some(entry) = entries.next_entry().await? {
        if !entry.file_type().await?.is_dir() {
            continue;
        }

        let Ok(website_id) = entry.file_name().to_string_lossy().parse::<WebsiteId>() else {
            continue;
        };
        let Ok(data_file) = website_data_path(data_path, &website_id) else {
            continue;
        };
        if fs::metadata(data_file).await.is_err() {
            continue;
        }

        websites.push(get_website_meta(data_path, &website_id).await?);
    }

    Ok(websites)
}

/// Read a website, pages included
pub async fn read_website(data_path: &Path, website_id: &WebsiteId) -> Result<serde_json::Value> {
    let path = website_data_path(data_path, website_id)?;

    let content = fs::read_to_string(&path).await.map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            Error::NotFound(format!("Website '{}' not found", website_id))
        } else {
            Error::Io(e)
        }
    })?;

    merge_website_data(&website_path(data_path, website_id)?, &content).await
}

/// Create a website and return its id
pub async fn create_website(
    data_path: &Path,
    meta: &WebsiteMetaFileContent,
) -> Result<WebsiteId> {
    let website_id = WebsiteId::fresh();

    fs::create_dir_all(assets_path(data_path, &website_id)?).await?;
    set_website_meta(data_path, &website_id, meta).await?;
    update_website(data_path, &website_id, &empty_website()).await?;

    Ok(website_id)
}

/// Write a website: `website.json` plus one file per page
///
/// `pagesFolder` says where the pages go, so the editor has to send it back:
/// picking a folder ourselves would move the pages of the website, which is
/// not what saving means.
pub async fn update_website(
    data_path: &Path,
    website_id: &WebsiteId,
    data: &serde_json::Value,
) -> Result<()> {
    let pages_folder = pages_folder_of(data)?.ok_or_else(|| {
        Error::InvalidInput("Website data has no pagesFolder, cannot tell where to write its pages".to_string())
    })?;

    let website_path = website_path(data_path, website_id)?;
    fs::create_dir_all(&website_path).await?;

    let files = split_website_data(data, pages_folder)?;
    let pages_path = website_path.join(pages_folder);

    let page_prefix = format!("{}/", pages_folder);
    let has_page_files = files.iter().any(|(path, _)| path.starts_with(&page_prefix));
    if has_page_files {
        fs::create_dir_all(&pages_path).await?;
    }

    // Delete the page files that are no longer part of the website
    if let Ok(mut entries) = fs::read_dir(&pages_path).await {
        let new_page_files: HashSet<_> = files
            .iter()
            .filter_map(|(path, _)| path.strip_prefix(&page_prefix))
            .collect();

        while let Ok(Some(entry)) = entries.next_entry().await {
            let file_name = entry.file_name().to_string_lossy().to_string();
            if file_name.ends_with(".json") && !new_page_files.contains(&file_name.as_str()) {
                let _ = fs::remove_file(entry.path()).await;
            }
        }
    }

    for (path, content) in files {
        write_file(&under_data_path(&website_path, &path)?, content).await?;
    }

    Ok(())
}

/// Delete a website and everything in its directory
pub async fn delete_website(data_path: &Path, website_id: &WebsiteId) -> Result<()> {
    fs::remove_dir_all(website_path(data_path, website_id)?)
        .await
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                Error::NotFound(format!("Website '{}' not found", website_id))
            } else {
                Error::Io(e)
            }
        })
}

/// Copy a website, name it "<name> copy", and return the id of the copy
pub async fn duplicate_website(data_path: &Path, website_id: &WebsiteId) -> Result<WebsiteId> {
    let new_website_id = WebsiteId::fresh();

    let source_path = website_path(data_path, website_id)?;
    if fs::metadata(&source_path).await.is_err() {
        return Err(Error::NotFound(format!(
            "Website '{}' not found",
            website_id
        )));
    }

    let copy_path = website_path(data_path, &new_website_id)?;
    copy_dir_recursive(source_path, copy_path.clone()).await?;
    keep_the_history_drop_the_remotes(&copy_path)?;

    let meta = get_website_meta(data_path, website_id).await?;
    let new_meta = WebsiteMetaFileContent {
        name: format!("{} copy", meta.name),
        image_url: meta.image_url,
    };
    set_website_meta(data_path, &new_website_id, &new_meta).await?;

    Ok(new_website_id)
}

/// Take the remotes out of the repository a copy inherited
///
/// A duplicated website keeps its history but must not keep where it was sent:
/// publishing the copy would push over the website it was copied from. Git is
/// asked rather than its config file read, because a remote can be written
/// there in more than one shape and each of them counts.
fn keep_the_history_drop_the_remotes(site: &Path) -> Result<()> {
    history::drop_the_remotes(site).map_err(|why| {
        Error::Told(format!(
            "Silex copied your website, but could not take out of the copy where the first one is published. Publishing the copy would replace the first one. {}",
            why
        ))
    })
}

// ==================
// Assets
// ==================

/// Write the uploaded assets, return their paths as stored
pub async fn write_assets(
    data_path: &Path,
    website_id: &WebsiteId,
    files: Vec<crate::models::File>,
) -> Result<Vec<String>> {
    let assets_path = assets_path(data_path, website_id)?;
    fs::create_dir_all(&assets_path).await?;

    let mut written_paths = Vec::new();

    for file in files {
        let relative_path = file.path.trim_start_matches('/');
        let file_path = under_data_path(&assets_path, relative_path)?;

        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        write_file(&file_path, &file.content).await?;
        written_paths.push(format!("/{}", relative_path));
    }

    Ok(written_paths)
}

/// Read one asset
pub async fn read_asset(
    data_path: &Path,
    website_id: &WebsiteId,
    file_name: &str,
) -> Result<Vec<u8>> {
    let relative_path = file_name.trim_start_matches('/');
    let path = under_data_path(&assets_path(data_path, website_id)?, relative_path)?;

    fs::read(&path).await.map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            Error::NotFound(format!("Asset '{}' not found", file_name))
        } else {
            Error::Io(e)
        }
    })
}

// ==================
// Metadata
// ==================

/// Read the metadata of a website
///
/// `meta.json` is optional: a cloned website has none (the SaaS keeps its
/// metadata where the website is kept), and the marker of a Silex website
/// is `website.json`. Metadata that is missing, or there but damaged, falls
/// back to the directory name: one website nobody can name is not a reason to
/// leave the user in front of a dashboard with none of their websites on it.
pub async fn get_website_meta(data_path: &Path, website_id: &WebsiteId) -> Result<WebsiteMeta> {
    let website_path = website_path(data_path, website_id)?;

    let metadata = fs::metadata(&website_path).await.map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            Error::NotFound(format!("Website '{}' not found", website_id))
        } else {
            Error::Io(e)
        }
    })?;

    let meta_path = website_meta_path(data_path, website_id)?;
    let named_after_its_folder = || WebsiteMetaFileContent {
        name: website_id.to_string(),
        image_url: None,
    };
    let file_content = match fs::read_to_string(&meta_path).await {
        Ok(content) => parse_file(&meta_path, &content).unwrap_or_else(|e: Error| {
            tracing::warn!("{}", e);
            named_after_its_folder()
        }),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => named_after_its_folder(),
        Err(e) => return Err(Error::Io(e)),
    };

    let pages_url = fs::metadata(website_path.join(PUBLIC_FOLDER))
        .await
        .is_ok()
        .then(|| published_files_url(data_path, website_id.as_str()));

    Ok(WebsiteMeta {
        website_id: website_id.clone(),
        name: file_content.name,
        image_url: file_content.image_url,
        created_at: metadata.created().ok().map(DateTime::<Utc>::from),
        updated_at: metadata.modified().ok().map(DateTime::<Utc>::from),
        repo_url: Some(format!("file://{}", website_path.display())),
        pages_url,
    })
}

/// Write the metadata of a website
pub async fn set_website_meta(
    data_path: &Path,
    website_id: &WebsiteId,
    meta: &WebsiteMetaFileContent,
) -> Result<()> {
    // Through a `Value` so the keys come out in alphabetical order: written
    // straight from the struct they would come out in the order it declares
    // them, and the Node server sorts them.
    let content = serialize_json(&serde_json::to_value(meta)?)?;
    write_file(&website_meta_path(data_path, website_id)?, content).await?;
    Ok(())
}

// ==================
// Split and merge
// ==================

/// Folder holding the page files of a website
///
/// Required, and only asked for where it is needed: a website whose pages are
/// embedded can be read without it. It is a folder of the website and nothing
/// else: saving writes the pages there and deletes the page files that are no
/// longer part of the website, so a name leading anywhere else would do both
/// outside the website.
fn pages_folder_of(data: &serde_json::Value) -> Result<Option<&str>> {
    let folder = data
        .get("pagesFolder")
        .and_then(|v| v.as_str())
        .filter(|folder| !folder.is_empty());

    match folder {
        Some(folder) if !names_one_folder(folder) => Err(Error::InvalidInput(format!(
            "'{}' is not a folder of this website, its pages cannot go there",
            folder
        ))),
        folder => Ok(folder),
    }
}

/// Split the website into `website.json` and one file per page
///
/// Everything the server does not need to understand is written back as it was
/// read: a key added by a GrapesJS plugin (`dataSources`…) must survive a save.
fn split_website_data(
    data: &serde_json::Value,
    pages_folder: &str,
) -> Result<Vec<(String, String)>> {
    let mut website_object = match data {
        serde_json::Value::Object(map) => map.clone(),
        _ => {
            return Err(Error::InvalidInput(
                "Website data must be a JSON object".to_string(),
            ))
        }
    };

    let pages = match data.get("pages") {
        Some(serde_json::Value::Array(pages)) => pages.clone(),
        _ => Vec::new(),
    };

    let mut files = Vec::new();
    let mut page_refs = Vec::new();

    for page in pages {
        // A page with no id is the empty page GrapesJS expects in a new website
        let Some(page_id) = page.get("id").and_then(|v| v.as_str()) else {
            page_refs.push(page);
            continue;
        };
        let page_name = page.get("name").and_then(|v| v.as_str());

        let file_path = format!("{}/{}", pages_folder, page_file_name(page_name, page_id));
        files.push((file_path, serialize_json(&page)?));

        // A page with no name has no `name` key, same as the Node server
        let mut page_ref = serde_json::Map::new();
        if let Some(name) = page_name {
            page_ref.insert("name".to_string(), serde_json::json!(name));
        }
        page_ref.insert("id".to_string(), serde_json::json!(page_id));
        page_ref.insert("isFile".to_string(), serde_json::json!(true));
        page_refs.push(serde_json::Value::Object(page_ref));
    }

    website_object.insert("pages".to_string(), serde_json::json!(page_refs));
    website_object.insert(
        "pagesFolder".to_string(),
        serde_json::json!(pages_folder),
    );

    let website_content = serialize_json(&serde_json::Value::Object(website_object))?;
    files.push((WEBSITE_DATA_FILE.to_string(), website_content));

    Ok(files)
}

/// Load the page files referenced by `website.json`
async fn merge_website_data(
    website_path: &Path,
    website_content: &str,
) -> Result<serde_json::Value> {
    let mut parsed: serde_json::Value = parse_file(&website_path.join(WEBSITE_DATA_FILE), website_content)?;

    let pages = match parsed.get("pages") {
        Some(serde_json::Value::Array(pages)) if !pages.is_empty() => pages.clone(),
        _ => return Ok(parsed),
    };

    // Pages written before the split are embedded in website.json
    if !pages.iter().any(|p| p.get("isFile").is_some()) {
        return Ok(parsed);
    }

    let pages_folder = pages_folder_of(&parsed)?
        .ok_or_else(|| {
            Error::InvalidWebsite(
                "Website has no pagesFolder, cannot tell where its pages are".to_string(),
            )
        })?
        .to_string();

    let mut loaded_pages = Vec::new();
    for page_ref in pages {
        let is_file = page_ref
            .get("isFile")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        if !is_file {
            loaded_pages.push(page_ref);
            continue;
        }

        let page_name = page_ref.get("name").and_then(|v| v.as_str());
        let page_id = page_ref.get("id").and_then(|v| v.as_str()).unwrap_or("");
        let file_path = under_data_path(
            website_path,
            Path::new(&pages_folder).join(page_file_name(page_name, page_id)),
        )?;

        // Returning the reference instead of the page would send a hollow page
        // to the editor, and the next save would delete the page for good
        let content = fs::read_to_string(&file_path).await.map_err(|e| {
            Error::InvalidWebsite(format!(
                "Could not read page '{}' from {}: {}",
                page_name.unwrap_or("(unnamed)"),
                file_path.display(),
                e
            ))
        })?;

        loaded_pages.push(parse_file(&file_path, &content)?);
    }

    parsed["pages"] = serde_json::Value::Array(loaded_pages);

    Ok(parsed)
}

/// Parse one file of a website, naming it when it cannot be read
///
/// A website is several files, and a parsing error naming none of them leaves
/// the user with nothing to look at.
fn parse_file<T: serde::de::DeserializeOwned>(path: &Path, content: &str) -> Result<T> {
    serde_json::from_str(content).map_err(|e| {
        Error::InvalidWebsite(format!("Could not read '{}'. This file of your website is damaged. {}", path.display(), e))
    })
}

/// File name of a page, `<slug>-<id>.json`
fn page_file_name(page_name: Option<&str>, page_id: &str) -> String {
    format!("{}-{}.json", page_slug(page_name), page_id)
}

/// Slug of a page name, same output as `getPageSlug` in `common/page.ts`.
/// That function is shared by the editor and the Node server, and the file name
/// is recomputed from the page name rather than stored, so any difference here
/// makes a website written by one server unreadable by the other.
fn page_slug(page_name: Option<&str>) -> String {
    let name = page_name.filter(|name| !name.is_empty()).unwrap_or("index");

    let mut slug: Vec<char> = name
        .to_lowercase()
        .chars()
        .filter_map(|c| match c {
            'a'..='z' | '0'..='9' => Some(c),
            ' ' | '-' => Some('-'),
            _ => None,
        })
        .collect();
    slug.dedup_by(|a, b| *a == '-' && *b == '-');

    slug.into_iter().collect()
}

/// Write a website file the way the Node server writes it
///
/// A website is kept in a git repository, so saving it twice must give the
/// same bytes and a diff must show only what the user changed. The keys come
/// out in alphabetical order on their own, a `serde_json` object being a
/// sorted map here.
fn serialize_json(data: &serde_json::Value) -> Result<String> {
    Ok(serde_json::to_string_pretty(data)?)
}

/// Recursively copy a directory
fn copy_dir_recursive(
    source: PathBuf,
    dest: PathBuf,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<()>> + Send>> {
    Box::pin(async move {
        fs::create_dir_all(&dest).await?;

        let mut entries = fs::read_dir(&source).await?;
        while let Some(entry) = entries.next_entry().await? {
            let entry_path = entry.path();
            let dest_path = dest.join(entry.file_name());

            if entry.file_type().await?.is_dir() {
                copy_dir_recursive(entry_path, dest_path).await?;
            } else {
                fs::copy(&entry_path, &dest_path).await?;
            }
        }

        Ok(())
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn a_data_path(name: &str) -> PathBuf {
        let name = format!("silex-storage-{}-{}", name, std::process::id());
        let data_path = std::env::temp_dir().join(name);
        let _ = std::fs::remove_dir_all(&data_path);
        std::fs::create_dir_all(&data_path).unwrap();
        data_path
    }

    #[tokio::test]
    async fn a_pages_folder_leading_out_of_the_website_is_refused() {
        let data_path = a_data_path("pages-folder");
        let outside = data_path.join("not-a-website");
        std::fs::create_dir_all(&outside).unwrap();
        std::fs::write(outside.join("important.json"), "keep me").unwrap();

        let website_id: WebsiteId = "a-website".parse().unwrap();
        let asked = serde_json::json!({ "pages": [], "pagesFolder": "../not-a-website" });
        let refused = update_website(&data_path, &website_id, &asked)
            .await
            .unwrap_err();

        assert!(refused.to_string().contains("not a folder of this website"), "{}", refused);
        assert!(outside.join("important.json").is_file(), "a file outside the website is left alone");

        let normal = serde_json::json!({ "pages": [], "pagesFolder": "pages" });
        update_website(&data_path, &website_id, &normal).await.unwrap();
        assert!(data_path.join("a-website").join(WEBSITE_DATA_FILE).is_file());

        let _ = std::fs::remove_dir_all(&data_path);
    }

    #[tokio::test]
    async fn a_website_whose_meta_file_is_damaged_is_named_after_its_folder() {
        let data_path = a_data_path("damaged-meta");

        let website_id: WebsiteId = "a-website".parse().unwrap();
        let site = data_path.join(website_id.as_str());
        std::fs::create_dir_all(&site).unwrap();
        std::fs::write(site.join(WEBSITE_DATA_FILE), "{}").unwrap();
        std::fs::write(site.join(WEBSITE_META_DATA_FILE), "{\n").unwrap();

        let listed = list_websites(&data_path).await.unwrap();
        assert_eq!(listed.len(), 1, "the website is still on the dashboard");
        assert_eq!(listed[0].name, "a-website");

        let _ = std::fs::remove_dir_all(&data_path);
    }

    #[tokio::test]
    async fn a_copy_keeps_no_remote_of_the_website_it_was_copied_from() {
        let data_path = a_data_path("copy-remotes");

        let meta = WebsiteMetaFileContent {
            name: "A website".to_string(),
            image_url: None,
        };
        let website_id = create_website(&data_path, &meta).await.unwrap();
        let site = website_path(&data_path, &website_id).unwrap();
        crate::history::version(&site, "one").unwrap();

        // The shape git writes is `[remote "origin"]`, this one it only reads
        let config = site.join(".git").join("config");
        let mut written = std::fs::read_to_string(&config).unwrap();
        written.push_str("[remote.origin]\n\turl = https://example.invalid/site.git\n");
        std::fs::write(&config, written).unwrap();
        assert_eq!(remotes_of(&site), vec!["origin".to_string()], "the website has a remote to lose");

        let copy_id = duplicate_website(&data_path, &website_id).await.unwrap();
        let copy = website_path(&data_path, &copy_id).unwrap();

        assert!(remotes_of(&copy).is_empty(), "the copy is published nowhere yet");
        assert_eq!(remotes_of(&site), vec!["origin".to_string()], "the website it was copied from keeps its own");
        assert!(copy.join(".git").is_dir(), "the copy keeps the history");

        let _ = std::fs::remove_dir_all(&data_path);
    }

    fn remotes_of(site: &Path) -> Vec<String> {
        let repo = git2::Repository::open(site).unwrap();
        repo.remotes()
            .unwrap()
            .iter()
            .map(|remote| remote.unwrap().unwrap().to_string())
            .collect()
    }

    #[test]
    fn two_writes_of_the_same_file_do_not_share_a_name() {
        let path = Path::new("/somewhere/website.json");
        assert_ne!(
            written_beside(path).unwrap(),
            written_beside(path).unwrap()
        );
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn saving_the_same_file_twice_at_once_writes_it_whole() {
        let data_path = a_data_path("at-once");
        let path = data_path.join("website.json");

        let mut saving = Vec::new();
        for save in 0..16 {
            let path = path.clone();
            saving.push(tokio::spawn(async move {
                write_file(&path, "x".repeat(200_000) + &save.to_string()).await
            }));
        }

        for save in saving {
            save.await.unwrap().unwrap();
        }
        assert!(std::fs::read_to_string(&path).unwrap().starts_with("xxx"));

        let _ = std::fs::remove_dir_all(&data_path);
    }

    #[tokio::test]
    async fn a_damaged_file_of_a_website_is_named_in_what_is_said() {
        let name = format!("silex-storage-damaged-{}", std::process::id());
        let data_path = std::env::temp_dir().join(name);
        let _ = std::fs::remove_dir_all(&data_path);

        let website_id: WebsiteId = "a-website".parse().unwrap();
        let site = data_path.join(website_id.as_str());
        std::fs::create_dir_all(site.join("pages")).unwrap();
        std::fs::write(
            site.join(WEBSITE_DATA_FILE),
            r#"{"pagesFolder":"pages","pages":[{"id":"abc","name":"Home","isFile":true}]}"#,
        )
        .unwrap();
        std::fs::write(site.join("pages").join("home-abc.json"), "{\n").unwrap();

        let refused = read_website(&data_path, &website_id).await.unwrap_err();
        let said = refused.to_string();
        assert!(said.contains("home-abc.json"), "{}", said);

        let _ = std::fs::remove_dir_all(&data_path);
    }

    #[test]
    fn a_website_file_is_written_the_way_the_node_server_writes_it() {
        let data = serde_json::json!({ "b": 1, "a": { "d": [2, 3], "c": "x" } });
        let expected = "{\n  \"a\": {\n    \"c\": \"x\",\n    \"d\": [\n      2,\n      3\n    ]\n  },\n  \"b\": 1\n}";

        assert_eq!(serialize_json(&data).unwrap(), expected);
    }

    #[test]
    fn the_metadata_of_a_website_is_written_with_its_keys_in_order() {
        let meta = WebsiteMetaFileContent {
            name: "A website".to_string(),
            image_url: Some("cover.png".to_string()),
        };
        let written = serialize_json(&serde_json::to_value(&meta).unwrap()).unwrap();

        assert_eq!(written, "{\n  \"imageUrl\": \"cover.png\",\n  \"name\": \"A website\"\n}");
    }
}
