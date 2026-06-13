/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Data models for Silex server
//!
//! These types match the TypeScript types to ensure API compatibility.

mod connector;
mod job;
mod website;

pub use connector::*;
pub use job::*;
pub use website::*;
