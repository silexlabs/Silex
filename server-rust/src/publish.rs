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
//! those files into a deployed website (git, a forge CLI, a build) runs in the
//! desktop app, not here.

use std::path::Path;
use tokio::fs;

use crate::error::Result;
use crate::models::{File, WebsiteId, PUBLIC_FOLDER};
use crate::storage::website_path;

/// Write the published files under `{data_path}/{website_id}/public/`
pub async fn publish(data_path: &Path, website_id: &WebsiteId, files: &[File]) -> Result<()> {
    let target_dir = website_path(data_path, website_id).join(PUBLIC_FOLDER);

    tracing::info!(
        "Publishing {} files to {}",
        files.len(),
        target_dir.display()
    );

    for file in files {
        let file_path = target_dir.join(file.path.trim_start_matches('/'));

        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        fs::write(&file_path, &file.content).await?;
    }

    Ok(())
}
