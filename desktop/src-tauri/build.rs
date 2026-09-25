const COMMANDS: &[&str] = &[
    "set_current_project",
    "clear_current_project",
    "set_unsaved",
    "open_link",
    "show_website_folder",
    "trash_website",
    "create_website_from_template",
    "saved_everything",
    "get_telemetry_context",
];

fn main() {
    // The editor is served over http, and since Tauri 2.11 a remote page may
    // only call the commands a capability grants
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(COMMANDS)),
    )
    .expect("failed to run tauri-build");
}
