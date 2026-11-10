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
//! What makes running one dangerous is handled here, once: an explicit working
//! directory, no way for it to ask the user anything, a time limit, a bounded
//! amount of output kept, and no secret in what comes back.

use std::env;
use std::ffi::OsStr;
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use super::programs;
use super::remote::redact;
use crate::held::held;

/// How long a program has to answer before it is killed
const LOCAL: Duration = Duration::from_secs(30);

/// How long the shell of the user has to say what its PATH is
///
/// Somebody is waiting in front of the integrations screen.
#[cfg(not(target_os = "windows"))]
const LOGIN_SHELL: Duration = Duration::from_secs(10);

/// How long a program sending a whole website has
///
/// The first push carries every image and font, over whatever connection the
/// user is on. Asking a question over the network stays on the short timer.
const TRANSFER: Duration = Duration::from_secs(600);

/// How long taking in what was pushed elsewhere has
///
/// Somebody is waiting in front of an editor that has not opened yet, so it is
/// short: what it does not bring back arrives at the next opening.
const FETCH: Duration = Duration::from_secs(15);

/// How long a program waiting on the user to sign in, in their browser, has
///
/// They may close the tab and never come back, and nothing tells the program.
const SIGNING_IN: Duration = Duration::from_secs(15 * 60);

/// How long the output of a program is waited for once it exited
///
/// A program can leave a child of its own holding the pipe, and that child is
/// not waited for.
const OUTPUT: Duration = Duration::from_secs(2);

/// The longest Silex goes without looking at a program that is still running
const LOOKED_AT_AT_LEAST_EVERY: Duration = Duration::from_millis(20);

/// How much of the output of a program is kept, the rest is read and dropped
///
/// One page of the projects of a GitLab account is half a megabyte
const MAX_OUTPUT: usize = 1024 * 1024;

/// A program, and what is added to its environment
///
/// A secret goes in the environment, where `ps` does not show it as it shows
/// the arguments.
#[derive(Clone, Copy)]
pub struct Program<'a> {
    pub path: &'a Path,
    pub env: &'a [(&'a str, &'a str)],
}

impl<'a, P: AsRef<Path> + ?Sized> From<&'a P> for Program<'a> {
    fn from(path: &'a P) -> Self {
        Program {
            path: path.as_ref(),
            env: &[],
        }
    }
}

/// `dir` is always explicit, so that a program never runs in the working
/// directory of the app, which could be inside somebody else's repository
pub fn run<'a>(
    program: impl Into<Program<'a>>,
    dir: &Path,
    args: &[&str],
) -> Result<String, String> {
    let program = program.into();
    said(
        program.path,
        run_within(program, dir, args, None, LOCAL, false, None)?,
    )
}

/// A program that waits on the user, until they are done or give up
pub struct Waiting<'a> {
    pub given_up: &'a AtomicBool,
    /// What the program says while it waits, it says on its error stream
    pub heard: &'a dyn Fn(&str),
}

pub fn run_waiting(
    program: &Path,
    dir: &Path,
    args: &[&str],
    waiting: &Waiting,
) -> Result<String, String> {
    said(
        program,
        run_within(program, dir, args, None, SIGNING_IN, false, Some(waiting))?,
    )
}

/// Started with the PATH of the app, since it is the shell that is asked for
/// the fresh one
#[cfg(not(target_os = "windows"))]
pub fn run_login_shell(shell: &Path, args: &[&str]) -> Result<String, String> {
    said(
        shell,
        run_within(shell, &env::temp_dir(), args, None, LOGIN_SHELL, true, None)?,
    )
}

/// A question asked over the network, to a program that only takes it on its
/// input
pub fn run_with_input(
    program: &Path,
    dir: &Path,
    args: &[&str],
    input: &str,
) -> Result<String, String> {
    said(
        program,
        run_within(program, dir, args, Some(input), FETCH, false, None)?,
    )
}

pub fn run_fetch<'a>(
    program: impl Into<Program<'a>>,
    dir: &Path,
    args: &[&str],
) -> Result<String, String> {
    let program = program.into();
    said(
        program.path,
        run_within(program, dir, args, None, FETCH, false, None)?,
    )
}

/// The same, keeping what the program said even when it failed
///
/// A program can say something a caller has to act on rather than show: git
/// answers `--porcelain` on its standard output and fails all the same.
pub fn run_transfer_verbatim(program: &Path, dir: &Path, args: &[&str]) -> Result<Ran, String> {
    run_within(program, dir, args, None, TRANSFER, false, None)
}

/// Runs a transfer with no time limit, reporting its output line by line
///
/// The program enforces its own network timeouts.
pub fn run_following(
    program: &Path,
    dir: &Path,
    args: &[&str],
    heard: &dyn Fn(&str),
) -> Result<Ran, String> {
    let waiting = Waiting {
        given_up: &AtomicBool::new(false),
        heard,
    };
    run_within(
        program,
        dir,
        args,
        None,
        Duration::MAX,
        false,
        Some(&waiting),
    )
}

pub struct Ran {
    pub stdout: String,
    pub stderr: String,
    pub failed: bool,
}

/// The output, or an error made of the program's own words
fn said(program: &Path, ran: Ran) -> Result<String, String> {
    if ran.failed {
        return Err(failure(program, &ran));
    }
    Ok(ran.stdout)
}

/// A program as a user knows it: `git`, not the path it was found at
fn named(program: &Path) -> String {
    program
        .file_stem()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_else(|| program.display().to_string())
}

/// What went wrong, in the program's own words
///
/// A user reads "git failed: Authentication failed", not the path of a binary
/// and its arguments.
pub fn failure(program: &Path, ran: &Ran) -> String {
    // Programs say what went wrong on either stream
    let reason = [ran.stderr.trim(), ran.stdout.trim()]
        .into_iter()
        .find(|out| !out.is_empty())
        .unwrap_or("no output");
    let program_name = named(program);
    format!(
        "{} failed: {}",
        program_name,
        // A program quotes back the remote it was given, token included, and
        // this error is both shown to the user and sent to telemetry
        redact(&readable(reason))
    )
}

/// The AppImage points LD_LIBRARY_PATH, PYTHONHOME, PATH and others at what
/// it carries for Silex, and the git, ssh, python or perl of the system would
/// load that instead of their own
fn without_appimage_environment(command: &mut Command) {
    let Some(appdir) = env::var_os("APPDIR") else {
        return;
    };
    // An AppImage started from here would take them for its own
    command.env_remove("APPDIR").env_remove("APPIMAGE");
    for (name, value) in env::vars_os() {
        let paths: Vec<PathBuf> = env::split_paths(&value).collect();
        if !paths.iter().any(|path| path.starts_with(&appdir)) {
            continue;
        }
        let users = outside_the_appimage(paths);
        command.env_remove(&name);
        if let (false, Ok(value)) = (users.is_empty(), env::join_paths(&users)) {
            command.env(&name, value);
        }
    }
}

/// Without what would make a program run from the wrong place: an empty or
/// relative folder is the working directory, here the website folder, and
/// those of the AppImage hold what Silex carries for itself
pub(crate) fn outside_the_appimage(folders: impl IntoIterator<Item = PathBuf>) -> Vec<PathBuf> {
    let appdir = env::var_os("APPDIR").map(PathBuf::from);
    let mut kept: Vec<PathBuf> = Vec::new();
    for folder in folders {
        let of_the_appimage = appdir.as_ref().is_some_and(|dir| folder.starts_with(dir));
        if folder.is_absolute() && !of_the_appimage && !kept.contains(&folder) {
            kept.push(folder);
        }
    }
    kept
}

/// Opens a folder or a link with what the system chooses, which the
/// environment of the AppImage would send to the wrong program: xdg-open
/// falls back to a browser when the gio of the system loads the one of Silex
pub fn open_detached(target: impl AsRef<OsStr>) -> io::Result<()> {
    if env::var_os("APPDIR").is_none() {
        return open::that_detached(target);
    }
    let mut last_error = None;
    for mut command in open::commands(target) {
        without_appimage_environment(&mut command);
        command
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        match command.spawn() {
            Ok(mut child) => {
                std::thread::spawn(move || child.wait());
                return Ok(());
            }
            Err(e) => last_error = Some(e),
        }
    }
    Err(last_error.unwrap_or_else(|| io::Error::other("Nothing on this computer opens it")))
}

fn run_within<'a>(
    program: impl Into<Program<'a>>,
    dir: &Path,
    args: &[&str],
    input: Option<&str>,
    timeout: Duration,
    login_shell: bool,
    waiting: Option<&Waiting>,
) -> Result<Ran, String> {
    let Program { path: program, env } = program.into();
    let mut command = Command::new(program);
    command
        .args(args)
        .envs(env.iter().copied())
        .current_dir(dir)
        // git asking for a password would otherwise freeze a save forever
        .stdin(if input.is_some() {
            Stdio::piped()
        } else {
            Stdio::null()
        })
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
        // Programs answer in the language of the user otherwise, and Silex
        // reads what they say
        .env("LC_ALL", "C")
        // glab tells GitLab what the user does with it otherwise
        .env("GLAB_SEND_TELEMETRY", "false")
        // and writes its update notice in front of the errors Silex shows
        .env("GLAB_CHECK_UPDATE", "false");

    without_appimage_environment(&mut command);
    if login_shell {
        // Lets startup files skip what is slow, and oh-my-zsh not ask to update
        command
            .env("SILEX_RESOLVING_ENVIRONMENT", "1")
            .env("DISABLE_AUTO_UPDATE", "true");
    } else if let Ok(path) = env::join_paths(programs::search_path()) {
        // glab starts git, which may have been installed since Silex started
        command.env("PATH", path);
    }

    // A killed program takes with it whatever it started: git leaves an ssh
    // behind, and that ssh holds the connection and the pipes
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

    // What was run is not in the error a user reads, so it has to be here.
    // Not what comes after `--`, named by the user: this goes to telemetry
    let options: Vec<&str> = args
        .iter()
        .copied()
        .take_while(|arg| *arg != "--")
        .collect();
    tracing::info!(
        program = %program.display(),
        args = %redact(&options.join(" ")),
        "running"
    );

    let name = named(program);
    let mut child = command
        .spawn()
        .map_err(|e| format!("Could not run {}: {}", name, e))?;

    // Closed once written, so that the program knows it has it all
    if let (Some(input), Some(mut stdin)) = (input, child.stdin.take()) {
        let _ = stdin.write_all(input.as_bytes());
    }

    let stdout = drain(child.stdout.take());
    let stderr = drain(child.stderr.take());

    let start = Instant::now();
    let mut asked_again_after = Duration::from_millis(1);
    let mut told = 0;
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
        if let Some(waiting) = waiting {
            if waiting.given_up.load(Ordering::Relaxed) {
                stop(&mut child);
                return Err(format!("{} was stopped", name));
            }
            told = tell_lines(&stderr, told, waiting.heard);
        }
        if start.elapsed() >= timeout {
            stop(&mut child);
            return Err(format!("{} took more than {}s", name, timeout.as_secs()));
        }
        // Growing rather than fixed: a program of this machine answers in a
        // millisecond or two, and what runs long is asked about rarely
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
        // The program was put in a group of its own, so this reaches the ssh
        // it spawned as well
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
/// A program filling a pipe nobody reads stops writing and never exits. What
/// was read is shared as it comes, because the end may never come.
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
                let mut kept = held(&filling);
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

/// The lines written since `told`, each once it is whole
fn tell_lines(output: &Draining, told: usize, heard: &dyn Fn(&str)) -> usize {
    let new = {
        let kept = held(&output.read_so_far);
        let Some(end) = kept[told..].iter().rposition(|&byte| byte == b'\n') else {
            return told;
        };
        kept[told..told + end + 1].to_vec()
    };
    for line in String::from_utf8_lossy(&new).lines() {
        heard(&readable(line));
    }
    told + new.len()
}

/// What a pipe gave, waiting only for what a finished program can still owe
fn collect(output: Draining) -> String {
    let _ = output.closed.recv_timeout(OUTPUT);
    let kept = held(&output.read_so_far);
    String::from_utf8_lossy(&kept).into_owned()
}

/// What a program said, made readable outside a terminal
///
/// `NO_COLOR` is asked of every program and most listen, but tea writes its
/// version in bold whatever it is told. Reading where a sequence ends is a
/// state machine, not a guess, so a parser does it.
///
/// Only what a person reads goes through here: JSON is left as it came.
pub fn readable(said: &str) -> String {
    // A tab is a control character too, and the parser drops it with the rest.
    // tea puts one between the fields of its version.
    let spaced = said.replace('\t', " ");
    String::from_utf8_lossy(&strip_ansi_escapes::strip(spaced)).into_owned()
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;

    #[test]
    fn does_not_wait_for_a_child_the_program_left_behind() {
        // git leaves an ssh holding the pipes and exits
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
}
