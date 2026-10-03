use std::path::Path;
use std::{env, fs};

const COMMANDS: &[&str] = &[
    "set_current_project",
    "clear_current_project",
    "set_unsaved",
    "open_link",
    "show_website_folder",
    "trash_website",
    "sync_places",
    "sync_website",
    "create_website_from_template",
    "save_ended",
    "get_telemetry_context",
];

/// `--silex-bg-main` as a `tauri::window::Color`, for the window of the dashboard
fn background() {
    let tokens = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../editor/css/tokens.css");
    println!("cargo:rerun-if-changed={}", tokens.display());
    let css = fs::read_to_string(&tokens).expect("the editor's tokens");
    let hex = css
        .split("--silex-bg-main:")
        .nth(1)
        .and_then(|rest| rest.split(';').next())
        .and_then(|value| value.trim().strip_prefix('#'))
        .filter(|hex| hex.len() == 6)
        .expect("--silex-bg-main is a #rrggbb color");
    let [red, green, blue] = [0, 2, 4].map(|at| {
        u8::from_str_radix(&hex[at..at + 2], 16).expect("--silex-bg-main is a #rrggbb color")
    });
    let out = Path::new(&env::var("OUT_DIR").expect("set by cargo")).join("background.rs");
    fs::write(
        out,
        format!("tauri::window::Color({red:#04x}, {green:#04x}, {blue:#04x}, 0xff)"),
    )
    .expect("the background of the window");
}

fn main() {
    background();
    // The editor is served over http, and since Tauri 2.11 a remote page may
    // only call the commands a capability grants
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(COMMANDS)),
    )
    .expect("failed to run tauri-build");
}
