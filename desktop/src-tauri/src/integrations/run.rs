/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

//! Running an external program
//!
//! Integrations are command line programs, and this is the only place in the
//! app that starts one. Everything that makes running a program dangerous is
//! handled here, once: no shell, an absolute program path, an explicit working
//! directory, no way for the program to ask the user anything, a time limit,
//! and a bounded amount of output kept.

use std::io::Read;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

/// How long a program has to do its work before it is killed. Long enough for
/// a big repository, short enough for a save to fail rather than hang.
const TIMEOUT: Duration = Duration::from_secs(30);

/// How much of the output of a program is kept, the rest is read and dropped
const MAX_OUTPUT: usize = 64 * 1024;

/// Run a program to completion and return what it wrote on its standard output
///
/// `program` is an absolute path: nothing is ever resolved through `PATH` at
/// call time, that happens once when an integration is detected. `dir` is
/// always explicit, so that a program never runs in the working directory of
/// the app, which could be inside somebody else's repository.
pub fn run(program: &Path, dir: &Path, args: &[&str]) -> Result<String, String> {
    let mut command = Command::new(program);
    command
        .args(args)
        .current_dir(dir)
        // A program with nothing to read cannot wait for an answer, and git
        // asking for a password would otherwise freeze a save forever
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        // Same idea, for the ways git has of asking on its own
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_ASKPASS", "");

    // A console window would pop up on every save otherwise
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    let name = program.display();
    let mut child = command
        .spawn()
        .map_err(|e| format!("Could not run {}: {}", name, e))?;

    let stdout = drain(child.stdout.take());
    let stderr = drain(child.stderr.take());

    let start = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) => {}
            Err(e) => return Err(format!("Could not wait for {}: {}", name, e)),
        }
        if start.elapsed() >= TIMEOUT {
            let _ = child.kill();
            let _ = child.wait();
            return Err(format!(
                "{} {} took more than {}s",
                name,
                args.join(" "),
                TIMEOUT.as_secs()
            ));
        }
        std::thread::sleep(Duration::from_millis(20));
    };

    let stdout = stdout.join().unwrap_or_default();
    let stderr = stderr.join().unwrap_or_default();

    if status.success() {
        return Ok(stdout);
    }

    // Programs report their troubles on either output, and an exit code alone
    // says nothing the user could act on
    let reason = [stderr.trim(), stdout.trim()]
        .into_iter()
        .find(|out| !out.is_empty())
        .unwrap_or("no output");
    Err(format!("{} {} failed: {}", name, args.join(" "), reason))
}

/// Read a pipe to its end in a thread of its own
///
/// A program filling a pipe nobody reads stops writing and never exits, so the
/// pipes are emptied while it runs, even though only the beginning is kept.
fn drain(pipe: Option<impl Read + Send + 'static>) -> std::thread::JoinHandle<String> {
    std::thread::spawn(move || {
        let Some(mut pipe) = pipe else {
            return String::new();
        };
        let mut kept: Vec<u8> = Vec::new();
        let mut chunk = [0u8; 4096];
        while let Ok(read) = pipe.read(&mut chunk) {
            if read == 0 {
                break;
            }
            let room = MAX_OUTPUT.saturating_sub(kept.len());
            kept.extend_from_slice(&chunk[..read.min(room)]);
        }
        String::from_utf8_lossy(&kept).into_owned()
    })
}
