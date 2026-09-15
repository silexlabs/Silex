//! Taking a lock

use std::sync::{Mutex, MutexGuard};

/// The lock of a mutex, taken back when a thread panicked holding it
///
/// Every mutex here guards a map for the few lines it takes to read or write
/// it, where a panic leaves nothing half done. What such a thread left says
/// nothing about the request that comes next.
pub(crate) fn held<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex
        .lock()
        .unwrap_or_else(|panicked| panicked.into_inner())
}
