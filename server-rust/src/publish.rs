/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Publication of a website to its `public/` folder
//!
//! The editor generates the files, the server writes them. Anything that turns
//! those files into a deployed website runs in the desktop app, not here.

use std::path::{Path, PathBuf};
use tokio::fs;

use crate::error::Result;
use crate::models::{File, WebsiteId, PUBLIC_FOLDER};
use crate::storage::{under_data_path, website_path};

/// Write the published files under `{data_path}/{website_id}/public/`
pub async fn publish(data_path: &Path, website_id: &WebsiteId, files: &[File]) -> Result<()> {
    let target_dir = website_path(data_path, website_id)?.join(PUBLIC_FOLDER);

    tracing::info!(
        "Publishing {} files to {}",
        files.len(),
        target_dir.display()
    );

    let mut written = std::collections::HashSet::new();
    for file in files {
        let file_path = under_data_path(&target_dir, file.path.trim_start_matches('/'))?;

        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        crate::storage::write_file(&file_path, &file.content).await?;
        written.insert(file_path);
    }

    took_a_page_away(&target_dir, &written).await;

    Ok(())
}

/// Delete the pages of a publication that no longer has them
///
/// A page somebody deleted keeps being served until its file goes: it was
/// written here once and nothing ever takes it back. Only pages are looked at,
/// and only those this publication did not write: everything else in the folder
/// belongs to whoever put it there.
async fn took_a_page_away(target_dir: &Path, written: &std::collections::HashSet<PathBuf>) {
    let mut folders = vec![target_dir.to_path_buf()];
    while let Some(folder) = folders.pop() {
        let Ok(mut entries) = fs::read_dir(&folder).await else {
            continue;
        };
        while let Ok(Some(entry)) = entries.next_entry().await {
            let path = entry.path();
            if entry.file_type().await.is_ok_and(|kind| kind.is_dir()) {
                folders.push(path);
                continue;
            }
            let a_page = path.extension().is_some_and(|kind| kind == "html");
            if a_page && !written.contains(&path) {
                if let Err(e) = fs::remove_file(&path).await {
                    tracing::warn!("Could not delete {}: {}", path.display(), e);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The page somebody deleted stops being served, and nothing else in the
    /// folder is touched
    #[tokio::test]
    async fn a_page_that_is_gone_is_taken_off_the_published_site() {
        let data_path = std::env::temp_dir().join(format!("silex-gone-{}", std::process::id()));
        let _ = fs::remove_dir_all(&data_path).await;
        let website_id: WebsiteId = "site".parse().unwrap();
        let public = data_path.join("site").join(PUBLIC_FOLDER);
        fs::create_dir_all(public.join("contact")).await.unwrap();

        // What a publication of two pages left behind, plus what nobody but
        // the owner of the website put there
        fs::write(public.join("index.html"), "old").await.unwrap();
        fs::write(public.join("contact/index.html"), "gone")
            .await
            .unwrap();
        fs::write(public.join("robots.txt"), "mine").await.unwrap();
        fs::write(public.join("keep.html.bak"), "mine")
            .await
            .unwrap();

        let only_the_home = [File {
            path: "/index.html".to_string(),
            content: b"new".to_vec(),
        }];
        publish(&data_path, &website_id, &only_the_home)
            .await
            .unwrap();

        assert!(
            public.join("index.html").exists(),
            "the page it wrote is gone"
        );
        assert!(
            !public.join("contact/index.html").exists(),
            "a deleted page is still being served"
        );
        assert!(
            public.join("robots.txt").exists(),
            "took a file it never wrote"
        );
        assert!(
            public.join("keep.html.bak").exists(),
            "took a file it never wrote"
        );
        let _ = fs::remove_dir_all(&data_path).await;
    }

    #[tokio::test]
    async fn a_published_file_leading_out_of_the_website_is_refused() {
        let name = format!("silex-publish-{}", std::process::id());
        let around = std::env::temp_dir().join(name);
        let data_path = around.join("data");
        let _ = std::fs::remove_dir_all(&around);
        std::fs::create_dir_all(&data_path).unwrap();

        let website_id: WebsiteId = "a-website".parse().unwrap();
        let leading_out = File {
            path: "../../../elsewhere.txt".to_string(),
            content: b"anything".to_vec(),
        };
        let refused = publish(&data_path, &website_id, &[leading_out])
            .await
            .unwrap_err();

        assert!(refused.to_string().contains("elsewhere.txt"), "{}", refused);
        assert!(
            !around.join("elsewhere.txt").exists(),
            "nothing is written outside the data folder"
        );

        let page = File {
            path: "/about/index.html".to_string(),
            content: b"a page".to_vec(),
        };
        publish(&data_path, &website_id, &[page]).await.unwrap();
        let published = data_path.join("a-website").join(PUBLIC_FOLDER);
        assert!(published.join("about").join("index.html").is_file());

        let _ = std::fs::remove_dir_all(&around);
    }
}
