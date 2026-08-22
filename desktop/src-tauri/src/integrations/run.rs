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
//! What makes running a program dangerous is handled here, once: an explicit
//! working directory, no way for the program to ask the user anything, a time
//! limit, a bounded amount of output kept, and no secret in what comes back.

use std::io::Read;
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::mpsc::{self, Receiver};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use super::remote::redact;

/// How long a program has to answer before it is killed
const LOCAL: Duration = Duration::from_secs(30);

/// How long a program sending a whole website has
///
/// The first push carries every image and font the website has, over whatever
/// connection the user is on. Thirty seconds is a failure waiting to happen;
/// ten minutes means something is really stuck. Asking a question over the
/// network stays on the short timer: one that takes half a minute is not
/// coming back.
const TRANSFER: Duration = Duration::from_secs(600);

/// How long taking in what was pushed elsewhere has
///
/// A website is read after this, and somebody is waiting in front of an editor
/// that has not opened yet. A host that takes the connection and then says
/// nothing would hold them there for the whole transfer timer, so this one is
/// short: what it does not bring back arrives at the next opening.
const SYNC_PULL: Duration = Duration::from_secs(15);

/// How long the output of a program is waited for once it exited
///
/// A program can leave a child of its own holding the pipe: what was read is
/// used and the pipe is left behind, rather than waiting for a process Silex
/// never started.
const OUTPUT: Duration = Duration::from_secs(2);

/// The longest Silex goes without looking at a program that is still running
const LOOKED_AT_AT_LEAST_EVERY: Duration = Duration::from_millis(20);

/// How much of the output of a program is kept, the rest is read and dropped
const MAX_OUTPUT: usize = 64 * 1024;

/// Run a program and wait for what it has to say
///
/// `dir` is always explicit, so that a program never runs in the working
/// directory of the app, which could be inside somebody else's repository.
pub fn run(program: &Path, dir: &Path, args: &[&str]) -> Result<String, String> {
    said(program, args, run_within(program, dir, args, LOCAL)?)
}

/// Run a program that sends the whole website somewhere
pub fn run_transfer(program: &Path, dir: &Path, args: &[&str]) -> Result<String, String> {
    said(program, args, run_within(program, dir, args, TRANSFER)?)
}

/// Run a program that takes in what was pushed somewhere else
pub fn run_sync_pull(program: &Path, dir: &Path, args: &[&str]) -> Result<String, String> {
    said(program, args, run_within(program, dir, args, SYNC_PULL)?)
}

/// The same, keeping what the program said even when it failed
///
/// A program can say something a caller has to act on rather than show: git
/// answers `--porcelain` on its standard output and fails all the same.
pub fn run_transfer_verbatim(program: &Path, dir: &Path, args: &[&str]) -> Result<Ran, String> {
    run_within(program, dir, args, TRANSFER)
}

/// What a program said, and whether it worked
pub struct Ran {
    pub stdout: String,
    pub stderr: String,
    pub failed: bool,
}

/// What a caller that only wants the answer gets: the output, or an error made
/// of the program's own words
fn said(program: &Path, args: &[&str], ran: Ran) -> Result<String, String> {
    let _ = args;
    if ran.failed {
        return Err(failure(program, &ran));
    }
    Ok(ran.stdout)
}

/// What went wrong, in the program's own words
///
/// The name of the program and what it said: a user reads "git failed:
/// Authentication failed", not the path of a binary and its arguments.
pub fn failure(program: &Path, ran: &Ran) -> String {
    // Programs say what went wrong on either stream
    let reason = [ran.stderr.trim(), ran.stdout.trim()]
        .into_iter()
        .find(|out| !out.is_empty())
        .unwrap_or("no output");
    let program_name = program
        .file_stem()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_else(|| program.display().to_string());
    format!(
        "{} failed: {}",
        program_name,
        // A program quotes back the remote it was given, token included, and
        // this error is both shown to the user and sent to telemetry
        redact(&readable(reason))
    )
}

fn run_within(program: &Path, dir: &Path, args: &[&str], timeout: Duration) -> Result<Ran, String> {
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
        .env("GIT_ASKPASS", "")
        // And for ssh, which pops a window of its own to ask for a passphrase
        // when it finds a graphical session
        .env("SSH_ASKPASS", "")
        .env("SSH_ASKPASS_REQUIRE", "never")
        // Colour codes are unreadable in an error and break reading JSON
        .env("NO_COLOR", "1")
        // Programs answer in the language of the user otherwise, and what they
        // say ends up read by Silex, shown in English sentences, and sent to
        // telemetry
        .env("LC_ALL", "C");

    // A killed program should take with it whatever it started: git leaves an
    // ssh behind, and that ssh holds the connection and the pipes
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        command.process_group(0);
    }

    // A console window would pop up on every save otherwise
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    // What was run is not in the error a user reads, so it has to be
    // somewhere: a failure they report is unreproducible otherwise
    tracing::debug!(
        program = %program.display(),
        args = %redact(&args.join(" ")),
        "running"
    );

    let name = program.display();
    let mut child = command
        .spawn()
        .map_err(|e| format!("Could not run {}: {}", name, e))?;

    let stdout = drain(child.stdout.take());
    let stderr = drain(child.stderr.take());

    let start = Instant::now();
    let mut asked_again_after = Duration::from_millis(1);
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) => {}
            Err(e) => {
                let message = format!("Could not wait for {}: {}", name, e);
                stop(&mut child);
                return Err(message);
            }
        }
        if start.elapsed() >= timeout {
            stop(&mut child);
            return Err(format!(
                "{} {} took more than {}s",
                name,
                args.join(" "),
                timeout.as_secs()
            ));
        }
        // Growing rather than fixed: a program of this machine answers in a
        // millisecond or two, and waiting twenty for it cost seventeen times
        // what it takes. What runs long is asked about rarely.
        std::thread::sleep(asked_again_after);
        asked_again_after = (asked_again_after * 2).min(LOOKED_AT_AT_LEAST_EVERY);
    };

    Ok(Ran {
        stdout: collect(stdout),
        stderr: collect(stderr),
        failed: !status.success(),
    })
}

/// Stop a program that ran out of time, and what it started with it
fn stop(child: &mut Child) {
    #[cfg(unix)]
    {
        // The program was put in a group of its own, so this reaches the ssh or
        // the helper it spawned as well
        let group = child.id() as i32;
        unsafe { libc::killpg(group, libc::SIGKILL) };
    }
    let _ = child.kill();
    let _ = child.wait();
}

/// A pipe being read, and what has been read so far
struct Draining {
    read_so_far: Arc<Mutex<Vec<u8>>>,
    closed: Receiver<()>,
}

/// Read a pipe to its end in a thread of its own
///
/// A program filling a pipe nobody reads stops writing and never exits, so the
/// pipes are emptied while it runs, even though only the beginning is kept.
/// What was read is shared as it comes, rather than at the end: a program can
/// leave a child of its own holding the pipe, and the end may never come.
fn drain(pipe: Option<impl Read + Send + 'static>) -> Draining {
    let read_so_far = Arc::new(Mutex::new(Vec::new()));
    let (closed, wait_for_it) = mpsc::channel();

    let filling = read_so_far.clone();
    std::thread::spawn(move || {
        if let Some(mut pipe) = pipe {
            let mut chunk = [0u8; 4096];
            while let Ok(read) = pipe.read(&mut chunk) {
                if read == 0 {
                    break;
                }
                let mut kept = filling.lock().unwrap_or_else(|held| held.into_inner());
                let room = MAX_OUTPUT.saturating_sub(kept.len());
                kept.extend_from_slice(&chunk[..read.min(room)]);
            }
        }
        let _ = closed.send(());
    });

    Draining {
        read_so_far,
        closed: wait_for_it,
    }
}

/// What a pipe gave, waiting only for what a finished program can still owe
fn collect(output: Draining) -> String {
    let _ = output.closed.recv_timeout(OUTPUT);
    let kept = output
        .read_so_far
        .lock()
        .unwrap_or_else(|held| held.into_inner());
    String::from_utf8_lossy(&kept).into_owned()
}

/// What a program said, made readable outside a terminal
///
/// A program writes to be read in a terminal, so it can carry the codes that
/// make its text bold or coloured. `NO_COLOR` asks them not to and most listen,
/// but tea writes its version in bold whatever it is told, and those codes are
/// unreadable in a file a user sends us or in what Silex shows them when a
/// publication fails. Reading where a sequence ends is a state machine, not a
/// guess, so a parser does it.
///
/// Only what a person reads goes through here: what a program answers to be
/// parsed, JSON above all, is left exactly as it came.
pub fn readable(said: &str) -> String {
    // A tab is a control character too, and the parser drops it with the rest.
    // It is what tea puts between the fields of its version, and a space says
    // the same thing to somebody reading it.
    let spaced = said.replace('\t', " ");
    String::from_utf8_lossy(&strip_ansi_escapes::strip(spaced)).into_owned()
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;

    fn a_temp_file(name: &str) -> std::path::PathBuf {
        let file = std::env::temp_dir().join(format!("silex-run-{}-{}", name, std::process::id()));
        let _ = std::fs::remove_file(&file);
        file
    }

    #[test]
    fn does_not_wait_for_a_child_the_program_left_behind() {
        // git leaves an ssh holding the pipes and exits; waiting for the pipes
        // to close would then mean waiting for that ssh
        let started = Instant::now();
        let out = run(
            Path::new("/bin/sh"),
            Path::new("/tmp"),
            &["-c", "sleep 3 & echo done"],
        );
        assert_eq!(out.as_deref().map(str::trim), Ok("done"));
        assert!(
            started.elapsed() < OUTPUT * 3,
            "waited {:?} for a program that had already exited",
            started.elapsed()
        );
    }

    #[test]
    fn a_program_that_ran_out_of_time_takes_its_children_with_it() {
        // The reason stop() kills the whole group rather than the program
        // alone: git leaves an ssh behind, and that ssh holds the connection.
        // The grandchild writes the marker if it survived.
        let marker = a_temp_file("survivor");
        let script = format!("(sleep 2; touch {}) & sleep 30", marker.display());
        let timed_out = run_within(
            Path::new("/bin/sh"),
            Path::new("/tmp"),
            &["-c", &script],
            Duration::from_secs(1),
        );
        assert!(
            timed_out.is_err(),
            "the program should have run out of time"
        );

        std::thread::sleep(Duration::from_secs(3));
        assert!(
            !marker.exists(),
            "a child of the program outlived it: the whole group was not stopped"
        );
    }

    #[test]
    fn what_a_program_says_is_its_own_words_without_its_secrets() {
        let failed = run(
            Path::new("/bin/sh"),
            Path::new("/tmp"),
            &["-c", "echo 'fatal: Authentication failed for https://me:glpat-abc@gitlab.com/x/y.git' >&2; exit 1"],
        )
        .unwrap_err();
        assert!(failed.starts_with("sh failed: "), "{}", failed);
        assert!(!failed.contains("glpat-abc"), "{}", failed);
        assert!(failed.contains("***@gitlab.com/x/y.git"), "{}", failed);
    }

    #[test]
    fn what_makes_text_bold_in_a_terminal_does_not_come_back() {
        // What tea really writes, and keeps writing even into a pipe
        assert_eq!(
            readable("Version: \u{1b}[1m0.15.1\u{1b}[0m\tgolang: 1.26.5").trim(),
            "Version: 0.15.1 golang: 1.26.5"
        );
        // A sequence that ends in something other than `m`: reading to the
        // first `m` would swallow the rest of the line
        assert_eq!(readable("\u{1b}[2Jstill here"), "still here");
        // And one that ends in a bell rather than a letter at all
        assert_eq!(readable("\u{1b}]0;a title\u{7}still here"), "still here");
        // What has nothing to take off comes back as it was, accents included
        assert_eq!(readable("café — naïve"), "café — naïve");
    }

    #[test]
    fn what_a_program_said_is_kept_even_when_it_failed() {
        // git answers --porcelain on its standard output and fails all the same
        let ran = run_transfer_verbatim(
            Path::new("/bin/sh"),
            Path::new("/tmp"),
            &["-c", "echo 'to the caller'; exit 1"],
        )
        .unwrap();
        assert!(ran.failed);
        assert_eq!(ran.stdout.trim(), "to the caller");
    }
}
