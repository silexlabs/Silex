/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Configuration for Silex server
//!
//! Loads settings from environment variables with sensible defaults.

use std::env;
use std::path::PathBuf;

/// Server configuration
///
/// All paths are absolute paths to directories on the filesystem.
#[derive(Debug, Clone)]
pub struct Config {
    /// Base URL where the server is accessible (e.g., "http://localhost:6805")
    pub url: String,

    /// Port to listen on
    pub port: u16,

    /// Path where website data is stored (FsStorage)
    pub data_path: PathBuf,

    /// Path where published websites go (FsHosting).
    /// When `None` (default), each site publishes to `{data_path}/{website_id}/public/`.
    /// When `Some`, all sites publish to the given shared directory.
    pub hosting_path: Option<PathBuf>,

    /// Folder name for assets within each website
    pub assets_folder: String,

    /// Default website ID created on first run
    pub default_website_id: String,

    /// Simple static path (serves at "/")
    pub static_path: Option<PathBuf>,

    /// Advanced static routes: list of "route:path" pairs
    /// Example: "/assets:./public/assets,/:./dist/client"
    pub static_routes: Vec<(String, PathBuf)>,
}

impl Config {
    /// Load configuration from environment variables
    ///
    /// Environment variables:
    /// - SILEX_URL: Base URL (default: "http://localhost:6805")
    /// - SILEX_PORT: Port number (default: 6805)
    /// - SILEX_DATA_PATH: Website data storage path (default: "./data")
    /// - SILEX_HOSTING_PATH: Publication output path (default: "./public")
    /// - SILEX_ASSETS_FOLDER: Assets folder name (default: "assets")
    pub fn from_env() -> Self {
        // Try to load .env file, but don't fail if it doesn't exist
        let _ = dotenvy::dotenv();

        let port = env::var("SILEX_PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(6805);

        let url = env::var("SILEX_URL").unwrap_or_else(|_| format!("http://localhost:{}", port));

        let data_path = env::var("SILEX_DATA_PATH")
            .or_else(|_| env::var("SILEX_FS_ROOT"))
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("./silex/storage"));

        let hosting_path = env::var("SILEX_HOSTING_PATH")
            .or_else(|_| env::var("SILEX_FS_HOSTING_ROOT"))
            .ok()
            .map(PathBuf::from);

        let assets_folder =
            env::var("SILEX_ASSETS_FOLDER").unwrap_or_else(|_| "assets".to_string());

        let default_website_id =
            env::var("SILEX_DEFAULT_WEBSITE_ID").unwrap_or_else(|_| "default".to_string());

        // Simple static path (single directory at "/")
        let static_path = env::var("SILEX_STATIC_PATH").ok().map(PathBuf::from);

        // Parse static routes from SILEX_STATIC_ROUTES
        // Format: "route1:path1,route2:path2" e.g. "/assets:./public/assets,/:./dist/client"
        let static_routes = env::var("SILEX_STATIC_ROUTES")
            .ok()
            .map(|s| {
                s.split(',')
                    .filter_map(|pair| {
                        let parts: Vec<&str> = pair.splitn(2, ':').collect();
                        if parts.len() == 2 {
                            Some((parts[0].to_string(), PathBuf::from(parts[1])))
                        } else {
                            None
                        }
                    })
                    .collect()
            })
            .unwrap_or_default();

        Config {
            url,
            port,
            data_path,
            hosting_path,
            assets_folder,
            default_website_id,
            static_path,
            static_routes,
        }
    }

    /// Get the full server URL including port
    pub fn server_url(&self) -> &str {
        &self.url
    }
}

impl Default for Config {
    fn default() -> Self {
        Config {
            url: "http://localhost:6805".to_string(),
            port: 6805,
            data_path: PathBuf::from("./silex/storage"),
            hosting_path: None,
            assets_folder: "assets".to_string(),
            default_website_id: "default".to_string(),
            static_path: None,
            static_routes: Vec::new(),
        }
    }
}
