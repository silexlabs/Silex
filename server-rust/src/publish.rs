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

use std::path::Path;
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

    for file in files {
        let file_path = under_data_path(&target_dir, file.path.trim_start_matches('/'))?;

        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        fs::write(&file_path, &file.content).await?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

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
        let refused = publish(&data_path, &website_id, &[leading_out]).await.unwrap_err();

        assert!(refused.to_string().contains("elsewhere.txt"), "{}", refused);
        assert!(!around.join("elsewhere.txt").exists(), "nothing is written outside the data folder");

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
