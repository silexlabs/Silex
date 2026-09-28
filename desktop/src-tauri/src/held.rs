/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Taking a lock

use std::sync::{Mutex, MutexGuard};

/// The lock of a mutex, taken back when a thread panicked holding it
///
/// Every mutex here guards a map or a field for the few lines it takes to read
/// or write it, where a panic leaves nothing half done. A poisoned lock would
/// otherwise stop every save that comes after it.
pub fn held<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex
        .lock()
        .unwrap_or_else(|panicked| panicked.into_inner())
}
