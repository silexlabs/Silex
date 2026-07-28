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
use std::path::{Path, PathBuf};
use tokio::fs;
use uuid::Uuid;

use crate::error::{Error, Result};
use crate::models::{
    empty_website, WebsiteId, WebsiteMeta, WebsiteMetaFileContent, ASSETS_FOLDER, PUBLIC_FOLDER,
    WEBSITE_DATA_FILE, WEBSITE_META_DATA_FILE,
};

// ==================
// Paths
// ==================

/// Directory holding one website
pub fn website_path(data_path: &Path, website_id: &str) -> PathBuf {
    data_path.join(website_id)
}

fn website_data_path(data_path: &Path, website_id: &str) -> PathBuf {
    website_path(data_path, website_id).join(WEBSITE_DATA_FILE)
}

fn website_meta_path(data_path: &Path, website_id: &str) -> PathBuf {
    website_path(data_path, website_id).join(WEBSITE_META_DATA_FILE)
}

fn assets_path(data_path: &Path, website_id: &str) -> PathBuf {
    website_path(data_path, website_id).join(ASSETS_FOLDER)
}

/// Make sure the storage root exists.
///
/// We intentionally do NOT create a default website: on a fresh install the
/// dashboard opens empty and the user creates their first site from there.
pub async fn init(data_path: &Path) -> Result<()> {
    fs::create_dir_all(data_path).await?;
    Ok(())
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

        let website_id = entry.file_name().to_string_lossy().to_string();
        if fs::metadata(website_data_path(data_path, &website_id))
            .await
            .is_err()
        {
            continue;
        }

        websites.push(get_website_meta(data_path, &website_id).await?);
    }

    Ok(websites)
}

/// Read a website, pages included
pub async fn read_website(data_path: &Path, website_id: &WebsiteId) -> Result<serde_json::Value> {
    let path = website_data_path(data_path, website_id);

    let content = fs::read_to_string(&path).await.map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            Error::NotFound(format!("Website '{}' not found", website_id))
        } else {
            Error::Io(e)
        }
    })?;

    merge_website_data(&website_path(data_path, website_id), &content).await
}

/// Create a website and return its id
pub async fn create_website(
    data_path: &Path,
    meta: &WebsiteMetaFileContent,
) -> Result<WebsiteId> {
    let website_id = Uuid::new_v4().to_string();

    fs::create_dir_all(assets_path(data_path, &website_id)).await?;
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
    let pages_folder = pages_folder_of(data).ok_or_else(|| {
        Error::InvalidInput("Website data has no pagesFolder, cannot tell where to write its pages".to_string())
    })?;

    let website_path = website_path(data_path, website_id);
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
        fs::write(website_path.join(&path), content).await?;
    }

    Ok(())
}

/// Delete a website and everything in its directory
pub async fn delete_website(data_path: &Path, website_id: &WebsiteId) -> Result<()> {
    fs::remove_dir_all(website_path(data_path, website_id))
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
    let new_website_id = Uuid::new_v4().to_string();

    let source_path = website_path(data_path, website_id);
    if fs::metadata(&source_path).await.is_err() {
        return Err(Error::NotFound(format!(
            "Website '{}' not found",
            website_id
        )));
    }

    copy_dir_recursive(source_path, website_path(data_path, &new_website_id)).await?;

    let meta = get_website_meta(data_path, website_id).await?;
    let new_meta = WebsiteMetaFileContent {
        name: format!("{} copy", meta.name),
        image_url: meta.image_url,
    };
    set_website_meta(data_path, &new_website_id, &new_meta).await?;

    Ok(new_website_id)
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
    let assets_path = assets_path(data_path, website_id);
    fs::create_dir_all(&assets_path).await?;

    let mut written_paths = Vec::new();

    for file in files {
        let relative_path = file.path.trim_start_matches('/');
        let file_path = assets_path.join(relative_path);

        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        fs::write(&file_path, &file.content).await?;
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
    let path = assets_path(data_path, website_id).join(relative_path);

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
/// `meta.json` is optional: a website cloned from a forge has none (the SaaS
/// keeps its metadata in the forge itself), and the marker of a Silex website
/// is `website.json`. Missing metadata falls back to the directory name.
pub async fn get_website_meta(data_path: &Path, website_id: &WebsiteId) -> Result<WebsiteMeta> {
    let website_path = website_path(data_path, website_id);

    let metadata = fs::metadata(&website_path).await.map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            Error::NotFound(format!("Website '{}' not found", website_id))
        } else {
            Error::Io(e)
        }
    })?;

    let file_content = match fs::read_to_string(website_meta_path(data_path, website_id)).await {
        Ok(content) => serde_json::from_str(&content)?,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => WebsiteMetaFileContent {
            name: website_id.clone(),
            image_url: None,
        },
        Err(e) => return Err(Error::Io(e)),
    };

    let public_path = website_path.join(PUBLIC_FOLDER);
    let pages_url = fs::metadata(&public_path)
        .await
        .is_ok()
        .then(|| format!("file://{}", public_path.display()));

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
    let content = serialize_json(meta)?;
    fs::write(website_meta_path(data_path, website_id), content).await?;
    Ok(())
}

// ==================
// Split and merge
// ==================

/// Folder holding the page files of a website
///
/// Required, and only asked for where it is needed: a website whose pages are
/// embedded can be read without it.
fn pages_folder_of(data: &serde_json::Value) -> Option<&str> {
    data.get("pagesFolder")
        .and_then(|v| v.as_str())
        .filter(|folder| !folder.is_empty())
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
    let mut parsed: serde_json::Value = serde_json::from_str(website_content)?;

    let pages = match parsed.get("pages") {
        Some(serde_json::Value::Array(pages)) if !pages.is_empty() => pages.clone(),
        _ => return Ok(parsed),
    };

    // Pages written before the split are embedded in website.json
    if !pages.iter().any(|p| p.get("isFile").is_some()) {
        return Ok(parsed);
    }

    let pages_folder = pages_folder_of(&parsed)
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
        let file_path = website_path
            .join(&pages_folder)
            .join(page_file_name(page_name, page_id));

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

        loaded_pages.push(serde_json::from_str(&content)?);
    }

    parsed["pages"] = serde_json::Value::Array(loaded_pages);

    Ok(parsed)
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

/// Serialize with sorted keys, so that saving twice gives the same bytes and
/// a git diff only shows what the user actually changed
fn serialize_json<T: serde::Serialize>(data: &T) -> Result<String> {
    let value = sort_json_keys(&serde_json::to_value(data)?);
    Ok(serde_json::to_string_pretty(&value)?)
}

fn sort_json_keys(value: &serde_json::Value) -> serde_json::Value {
    match value {
        serde_json::Value::Object(map) => {
            let mut sorted = serde_json::Map::new();
            let mut keys: Vec<_> = map.keys().collect();
            keys.sort();
            for key in keys {
                sorted.insert(key.clone(), sort_json_keys(&map[key]));
            }
            serde_json::Value::Object(sorted)
        }
        serde_json::Value::Array(arr) => {
            serde_json::Value::Array(arr.iter().map(sort_json_keys).collect())
        }
        _ => value.clone(),
    }
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
