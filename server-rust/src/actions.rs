/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! What the server asks for, once it has written to the disk
//!
//! The server only ever touches files. Anything happening outside of its data
//! path - running a program, versioning a website - is named here and left to
//! whoever embeds the crate. Served alone, nobody listens and nothing happens.

/// Actions the server asks its host application to perform
pub trait Actions: Send + Sync {
    /// Create a version of a website, right after it was saved.
    ///
    /// The save waits for it: a website is only answered for once its version
    /// exists. An error here does not fail the save, the website is on the
    /// disk either way.
    fn version(&self, website_id: &str, message: &str) -> Result<(), String>;
}
