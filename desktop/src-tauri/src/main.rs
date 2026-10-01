/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

// Prevents an extra console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime};

use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tokio::net::TcpListener;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::held::held;
use crate::locales::{button, tr};
use silex_server::said::{self, Said};
use silex_server::{Config, WebsiteId};
use tauri_plugin_updater::UpdaterExt;

mod actions;
mod frontend;
mod held;
mod integrations;
mod locales;
mod mcp;
mod templates;

// ==================
// App State
// ==================

struct AppState {
    /// Shared with the actions of the server, which answer about the website
    /// the editor has open without being told which one that is
    current_website_id: actions::CurrentWebsiteId,
    current_website_name: Mutex<Option<String>>,
    has_unsaved_changes: Mutex<bool>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            current_website_id: Arc::new(Mutex::new(None)),
            current_website_name: Mutex::new(None),
            has_unsaved_changes: Mutex::new(false),
        }
    }
}

struct WebsitesFolder(PathBuf);

impl WebsitesFolder {
    fn website(&self, website_id: &WebsiteId) -> Result<PathBuf, Said> {
        actions::site_path(&self.0, website_id.as_str()).ok_or_else(|| Said::new(said::NO_WEBSITE))
    }
}

// ==================
// Tauri Commands
// ==================

#[tauri::command]
fn set_current_project(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    website_id: String,
    website_name: String,
) {
    *held(&state.current_website_id) = Some(website_id);
    *held(&state.current_website_name) = Some(website_name.clone());
    *held(&state.has_unsaved_changes) = false;

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_title(&format!("{} \u{2014} Silex", website_name));
    }
}

#[tauri::command]
fn clear_current_project(app: tauri::AppHandle, state: tauri::State<'_, AppState>) {
    *held(&state.current_website_id) = None;
    *held(&state.current_website_name) = None;
    *held(&state.has_unsaved_changes) = false;

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_title("Silex");
    }
}

#[tauri::command]
fn set_unsaved(app: tauri::AppHandle, state: tauri::State<'_, AppState>, unsaved: bool) {
    *held(&state.has_unsaved_changes) = unsaved;

    if let Some(name) = held(&state.current_website_name).as_ref() {
        if let Some(window) = app.get_webview_window("main") {
            let mark = if unsaved { "\u{2022} " } else { "" };
            let _ = window.set_title(&format!("{mark}{name} \u{2014} Silex"));
        }
    }
}

/// A file could be a program, which the system would run: only folders open
#[tauri::command]
async fn open_link(folder: tauri::State<'_, WebsitesFolder>, url: String) -> Result<(), Said> {
    let does_not_open = || Said::new(said::DOES_NOT_OPEN).with("url", &url);
    let parsed = tauri::Url::parse(&url).map_err(|_| does_not_open())?;
    let target = match parsed.scheme() {
        "file" => {
            let path = parsed.to_file_path().map_err(|()| does_not_open())?;
            let path = std::fs::canonicalize(path).map_err(Said::raw)?;
            let websites = std::fs::canonicalize(&folder.0).map_err(Said::raw)?;
            if !path.is_dir() || !path.starts_with(websites) {
                return Err(Said::new(said::NOT_IN_A_WEBSITE).with("path", path.display()));
            }
            path.into_os_string()
        }
        "http" | "https" => parsed.as_str().into(),
        _ => return Err(does_not_open()),
    };
    open::that_detached(target).map_err(Said::raw)
}

#[tauri::command]
async fn show_website_folder(
    folder: tauri::State<'_, WebsitesFolder>,
    website_id: WebsiteId,
) -> Result<(), Said> {
    open::that_detached(folder.website(&website_id)?).map_err(Said::raw)
}

/// Unlike the DELETE route, which the hosted server shares, the user can get the website back
#[tauri::command]
async fn trash_website(
    folder: tauri::State<'_, WebsitesFolder>,
    sendings: tauri::State<'_, actions::Sendings>,
    website_id: WebsiteId,
) -> Result<(), Said> {
    // git holds its files while it sends them, and the send would then fail on a website that is gone
    if sendings
        .borrow()
        .get(website_id.as_str())
        .is_some_and(actions::Sending::on_its_way)
    {
        return Err(Said::new(said::SENDING));
    }
    to_trash(folder.website(&website_id)?).map_err(Said::raw)
}

/// Through Finder, the default, macOS asks the user to let Silex control Finder
#[cfg(target_os = "macos")]
fn to_trash(path: PathBuf) -> Result<(), trash::Error> {
    use trash::macos::{DeleteMethod, TrashContextExtMacos};
    let mut context = trash::TrashContext::default();
    context.set_delete_method(DeleteMethod::NsFileManager);
    context.delete(path)
}

#[cfg(not(target_os = "macos"))]
fn to_trash(path: PathBuf) -> Result<(), trash::Error> {
    trash::delete(path)
}

/// Told by the editor once it has finished saving
///
/// Called even when it had nothing to save: quitting waits on this to tell an
/// empty queue from one whose save is still on its way.
#[tauri::command]
fn saved_everything(saves: tauri::State<'_, actions::Saves>) {
    saves.send_modify(|saves| *saves += 1);
}

/// The GlitchTip DSN is read from the glitchtip.dsn bundle resource, not compiled
/// in, so the binary stays reproducible. The committed file is empty; releases
/// carry the real one.
fn glitchtip_dsn(resource_dir: Option<PathBuf>) -> Option<String> {
    let dsn = std::fs::read_to_string(resource_dir?.join("glitchtip.dsn")).ok()?;
    let dsn = dsn.trim().to_string();
    if dsn.is_empty() {
        None
    } else {
        Some(dsn)
    }
}

/// How this copy of Silex was installed, which is what a bug report leaves out
fn package_kind() -> &'static str {
    if cfg!(debug_assertions) {
        return "dev";
    }
    for (variable, kind) in [
        ("APPIMAGE", "appimage"),
        ("FLATPAK_ID", "flatpak"),
        ("SNAP", "snap"),
    ] {
        if std::env::var_os(variable).is_some() {
            return kind;
        }
    }
    let Ok(program) = std::env::current_exe() else {
        return "unknown";
    };
    if cfg!(target_os = "macos") {
        return "app";
    }
    if cfg!(target_os = "windows") {
        return "exe";
    }
    if !program.starts_with("/usr") {
        return "portable";
    }
    // deb and rpm install the same files in the same places, so what tells them
    // apart is which package manager the machine keeps
    if PathBuf::from("/var/lib/dpkg/status").exists() {
        "deb"
    } else if PathBuf::from("/var/lib/rpm").exists() {
        "rpm"
    } else {
        "linux-package"
    }
}

/// The version the repository carries, until `scripts/set-version.sh` stamps a release
const UNRELEASED_VERSION: &str = "0.0.0-dev";

/// Map a release version to a GlitchTip environment channel (canary/alpha/beta/stable).
fn telemetry_environment(version: &str) -> &'static str {
    if cfg!(debug_assertions) || version == UNRELEASED_VERSION {
        "development"
    } else if version.contains("canary") {
        "canary"
    } else if version.contains("alpha") {
        "alpha"
    } else if version.contains("beta") {
        "beta"
    } else {
        "stable"
    }
}

/// Persistent anonymous install id (UUID v4), generated on first launch. No PII.
fn get_or_create_install_id(data_dir: &PathBuf) -> String {
    let path = data_dir.join("install_id");
    if let Ok(existing) = std::fs::read_to_string(&path) {
        let existing = existing.trim();
        if !existing.is_empty() {
            return existing.to_string();
        }
    }
    let id = uuid::Uuid::new_v4().to_string();
    let _ = std::fs::create_dir_all(data_dir);
    let _ = std::fs::write(&path, &id);
    id
}

/// Telemetry config handed to the frontend Sentry init (real version, channel, install id, OS).
#[derive(serde::Serialize)]
struct TelemetryContext {
    dsn: String,
    release: String,
    environment: String,
    user_id: String,
    os: String,
    arch: String,
    package: String,
}

#[tauri::command]
fn get_telemetry_context(app: tauri::AppHandle) -> Option<TelemetryContext> {
    let data_dir = dirs::data_dir()?.join("org.silex.desktop");
    let dsn = glitchtip_dsn(app.path().resource_dir().ok())?;
    let version = app.package_info().version.to_string();
    Some(TelemetryContext {
        dsn,
        release: version.clone(),
        environment: telemetry_environment(&version).to_string(),
        user_id: get_or_create_install_id(&data_dir),
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        package: package_kind().to_string(),
    })
}

/// The longest "Save & Quit" keeps the app running after the save is asked for
///
/// The website still has to reach its repository, over a network that answers
/// when it answers. Past this the app closes and says what is left.
const SAVE_AND_QUIT_WAIT: Duration = Duration::from_secs(15);

/// Wait for the websites on their way to their repository to get there
///
/// An empty queue means two opposite things, nothing to send or a save that
/// has not arrived yet, and only the editor tells them apart.
///
/// False when the wait ran out with some still on their way.
async fn everything_left(sendings: &mut actions::Sendings, saved: &mut actions::Saved) -> bool {
    let wait_until = tokio::time::Instant::now() + SAVE_AND_QUIT_WAIT;

    // Err is the editor gone rather than a save: nobody is going to say it now
    if tokio::time::timeout_at(wait_until, saved.changed())
        .await
        .is_err()
    {
        return false;
    }

    loop {
        if !sendings
            .borrow_and_update()
            .values()
            .any(actions::Sending::on_its_way)
        {
            return true;
        }
        match tokio::time::timeout_at(wait_until, sendings.changed()).await {
            Err(_) => return false,
            Ok(Err(_)) => return true,
            Ok(Ok(())) => {}
        }
    }
}

/// Say what has not left yet, on the one occasion it is worth saying
///
/// Their work is saved on this computer either way. What they cannot see is
/// that Silex picks this up when it opens again.
fn says_what_is_left(app: &tauri::AppHandle) {
    use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

    app.dialog()
        .message(tr(locales::NOT_SENT_YET))
        .title("Silex")
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::Ok)
        .blocking_show();
}

fn show_quit_dialog(app: &tauri::AppHandle) {
    use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

    let app_handle = app.clone();
    app.dialog()
        .message(tr(locales::SAVE_BEFORE_QUITTING))
        .title("Silex")
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::OkCancelCustom(
            button(locales::SAVE_AND_QUIT),
            button(locales::QUIT),
        ))
        .show(move |result| {
            if result {
                // Subscribed before the editor is asked, so that the save it
                // is about to confirm cannot be missed
                let saved = app_handle.state::<actions::Saves>().subscribe();
                let _ = app_handle.emit("menu-save", ());
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.set_title(&format!("{} \u{2014} Silex", tr(locales::SAVING)));
                }
                let handle = app_handle.clone();
                std::thread::spawn(move || {
                    let mut sendings = handle.state::<actions::Sendings>().inner().clone();
                    let mut saved = saved;
                    if !tauri::async_runtime::block_on(everything_left(&mut sendings, &mut saved)) {
                        says_what_is_left(&handle);
                    }
                    if let Some(window) = handle.get_webview_window("main") {
                        let _ = window.destroy();
                    }
                });
            } else if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.destroy();
            }
        });
}

// ==================
// Auto-update
// ==================

fn check_for_updates(app: tauri::AppHandle) {
    use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

    tauri::async_runtime::spawn(async move {
        tracing::info!("Checking for updates...");
        let updater = match app.updater() {
            Ok(updater) => updater,
            Err(error) => {
                tracing::warn!("Cannot check for updates: {error}");
                return;
            }
        };
        match updater.check().await {
            Ok(Some(update)) => {
                let version = update.version.clone();
                tracing::info!("Update available: v{}", version);
                let app_clone = app.clone();

                app.dialog()
                    .message(said::fill(
                        &tr(locales::UPDATE_NOW),
                        [("version", version.as_str())],
                    ))
                    .title(tr(locales::UPDATE_AVAILABLE))
                    .kind(MessageDialogKind::Info)
                    .buttons(MessageDialogButtons::OkCancelCustom(
                        button(locales::UPDATE_AND_RESTART),
                        button(locales::LATER),
                    ))
                    .show(move |accepted| {
                        if accepted {
                            tauri::async_runtime::spawn(async move {
                                tracing::info!("Downloading update v{}...", version);
                                match update.download_and_install(|_, _| {}, || {}).await {
                                    Ok(_) => {
                                        tracing::info!("Update installed, restarting...");
                                        app_clone.restart();
                                    }
                                    Err(e) => {
                                        tracing::error!("Update failed: {}", e);
                                    }
                                }
                            });
                        }
                    });
            }
            Ok(None) => {
                tracing::info!("No update available");
            }
            Err(e) => {
                tracing::warn!("Update check failed: {}", e);
            }
        }
    });
}

// ==================
// Server
// ==================

/// A path under the home folder names the user
fn without_home(text: &str) -> String {
    match dirs::home_dir().and_then(|home| home.to_str().map(String::from)) {
        Some(home) => text.replace(&home, "~"),
        None => text.to_string(),
    }
}

/// The query of an API call carries what the user typed to publish
fn without_query(request: &sentry::protocol::Request) -> sentry::protocol::Request {
    let mut url = request.url.clone();
    if let Some(url) = url.as_mut() {
        url.set_query(None);
    }
    sentry::protocol::Request {
        method: request.method.clone(),
        url,
        ..Default::default()
    }
}

/// The tracing layer attaches the whole request to the transaction, and sentry
/// offers no hook to change a transaction before it is sent
async fn trace_without_query(
    request: axum::extract::Request,
    next: axum::middleware::Next,
) -> axum::response::Response {
    sentry::configure_scope(|scope| {
        if let Some(span) = scope.get_span() {
            span.set_request(sentry::protocol::Request {
                method: Some(request.method().to_string()),
                url: format!("http://localhost{}", request.uri().path())
                    .parse()
                    .ok(),
                ..Default::default()
            });
        }
    });
    next.run(request).await
}

fn is_local_authority(authority: &str) -> bool {
    axum::http::uri::Authority::try_from(authority).is_ok_and(|a| {
        let host = a.host().trim_start_matches('[').trim_end_matches(']');
        ["localhost", "127.0.0.1", "::1"]
            .iter()
            .any(|local| host.eq_ignore_ascii_case(local))
    })
}

// A web page can point its own domain at 127.0.0.1 (DNS rebinding) and then
// call this API as same-origin; only the Host header gives it away.
// A plain cross-site form POST keeps a local Host, but not a local Origin
async fn reject_foreign_host(
    request: axum::extract::Request,
    next: axum::middleware::Next,
) -> axum::response::Response {
    use axum::http::{header, Method};
    use axum::response::IntoResponse;

    let headers = request.headers();
    let host = headers
        .get(header::HOST)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");
    let safe_method = matches!(*request.method(), Method::GET | Method::HEAD);
    let same_origin = match headers.get(header::ORIGIN) {
        None => true,
        Some(origin) => origin
            .to_str()
            .ok()
            .and_then(|o| o.strip_prefix("http://"))
            .is_some_and(|o| o.eq_ignore_ascii_case(host)),
    };
    if is_local_authority(host) && (safe_method || same_origin) {
        next.run(request).await
    } else {
        axum::http::StatusCode::FORBIDDEN.into_response()
    }
}

async fn start_server(
    pending_evals: mcp::PendingEvals,
    data_path: std::path::PathBuf,
    app_data_dir: PathBuf,
    current_website_id: actions::CurrentWebsiteId,
    dashboard_in_development: bool,
    asking_integrations: sentry::Span,
) -> Result<(u16, actions::Sendings), Box<dyn std::error::Error>> {
    // Which programs Silex works with was settled the first time the app ran
    let integrations = integrations::load_in_background(app_data_dir, move |integrations| {
        asking_integrations.finish();
        // Names as a tag, versions beside them: a version string as a tag would
        // make an indexed value of its own out of every machine
        sentry::Hub::main().configure_scope(|scope| {
            let names: Vec<&str> = integrations.at_hand().map(|(id, _)| id).collect();
            scope.set_tag("integrations", names.join(","));
            let versions = integrations
                .at_hand()
                .filter_map(|(id, version)| Some((id.to_string(), version?.into())))
                .collect();
            scope.set_context("integrations", sentry::protocol::Context::Other(versions));
        });
        // The one event every launch produces is where the integrations are
        // worth having
        sentry::Hub::main().capture_event(sentry::protocol::Event {
            message: Some("app_started".into()),
            level: sentry::Level::Info,
            ..Default::default()
        });
    });
    let actions = actions::SilexActions::new(data_path.clone(), integrations, current_website_id);
    let sendings = actions.sending();

    let config = Config::new(data_path).with_actions(std::sync::Arc::new(actions));

    let (app, port) = silex_server::build_app(config).await;

    // Add eval-callback route for JS→Rust result passing (same origin, no CORS)
    let app = app
        .route(
            "/eval-callback/{id}",
            axum::routing::post(mcp::eval_callback),
        )
        .layer(axum::Extension(pending_evals));

    let app = app
        .layer(axum::middleware::from_fn(trace_without_query))
        .layer(axum::middleware::from_fn(reject_foreign_host))
        .layer(sentry::integrations::tower::SentryHttpLayer::new().enable_transaction());

    let app = frontend::configure(app);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = match TcpListener::bind(addr).await {
        Ok(l) => l,
        Err(e) if dashboard_in_development => {
            return Err(format!(
                "Silex cannot listen on port {port}, where the dashboard in development sends its requests: {e}"
            )
            .into());
        }
        Err(_) => {
            // The port belongs to another program on this machine
            let fallback = SocketAddr::from(([127, 0, 0, 1], 0));
            TcpListener::bind(fallback).await?
        }
    };
    let addr = listener.local_addr()?;
    let port = addr.port();
    tracing::info!("Silex server listening on http://{}", addr);

    // A hub per request, or the layer above stacks an event processor on the one
    // shared scope at every request and never takes one off. Made from the main
    // hub: the integrations reach its scope after a worker has taken its copy
    let served = tower::ServiceBuilder::new()
        .layer(sentry::integrations::tower::SentryLayer::<
            _,
            _,
            axum::extract::Request,
        >::new(|_: &axum::extract::Request| {
            Arc::new(sentry::Hub::new_from_top(sentry::Hub::main()))
        }))
        .service(app);

    tokio::spawn(async move {
        if let Err(error) = axum::serve(listener, tower::make::Shared::new(served)).await {
            tracing::error!("Silex server stopped: {error}");
        }
    });

    Ok((port, sendings))
}

/// Only debug builds read it: a leftover variable cannot redirect a release
fn dashboard_in_development() -> Option<String> {
    if cfg!(debug_assertions) {
        std::env::var("SILEX_DASHBOARD_URL").ok()
    } else {
        None
    }
}

/// On a laptop with two graphics cards, the one the screen starts on draws
/// unless the user asks for the NVIDIA one
#[cfg(target_os = "linux")]
fn renders_on_nvidia() -> bool {
    let asked = std::env::var("__NV_PRIME_RENDER_OFFLOAD").is_ok_and(|v| v == "1")
        || std::env::var("__GLX_VENDOR_LIBRARY_NAME").is_ok_and(|v| v == "nvidia");
    asked
        || std::fs::read_dir("/sys/class/drm")
            .into_iter()
            .flatten()
            .flatten()
            .any(|card| {
                let device = card.path().join("device");
                let read = |file| std::fs::read_to_string(device.join(file)).unwrap_or_default();
                read("boot_vga").trim() == "1" && read("vendor").trim() == "0x10de"
            })
}

// ==================
// Main
// ==================

/// A step of the start that is over already
fn took(startup: &sentry::Transaction, step: &str, from: SystemTime, to: SystemTime) {
    startup
        .start_child_with_details("app.start", step, Default::default(), from)
        .finish_with_timestamp(to);
}

fn main() {
    // What the user waits for starts here, not once telemetry can measure it
    let launched = SystemTime::now();

    // WebKitGTK crashes with NVIDIA under Wayland (Gdk Error 71), and turning
    // the renderer off draws everything on the CPU, which makes the editor
    // crawl: only pay for it where it crashes. Must be set before any WebKit/GTK
    // initialization. See: https://github.com/tauri-apps/tauri/issues/11988
    #[cfg(target_os = "linux")]
    if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none()
        && std::env::var_os("WAYLAND_DISPLAY").is_some()
        && renders_on_nvidia()
    {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    // Resolved before Tauri starts, for the install id of the telemetry.
    // This mirrors the path Tauri uses: ~/.local/share/org.silex.desktop (Linux),
    // ~/Library/Application Support/org.silex.desktop (macOS),
    // %APPDATA%/org.silex.desktop (Windows).
    let app_data_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("org.silex.desktop");
    let _ = std::fs::create_dir_all(&app_data_dir);

    // Real app version comes from tauri.conf.json (patched from the tag in CI), not
    // CARGO_PKG_VERSION (stuck at the 0.1.0 placeholder). The context is built once here
    // and moved into .run() below.
    let context = tauri::generate_context!();
    let app_version = context.package_info().version.to_string();
    let install_id = get_or_create_install_id(&app_data_dir);
    let dsn = glitchtip_dsn(
        tauri::utils::platform::resource_dir(context.package_info(), &tauri::Env::default()).ok(),
    );

    let mut options = sentry::ClientOptions::new()
        .release(app_version.clone())
        .environment(telemetry_environment(&app_version))
        // The editor asks for the status of a publication every second
        .traces_sampler(|ctx| {
            if ctx.name().contains("/publication/status") {
                0.0
            } else {
                1.0
            }
        })
        // Named rather than left out: unset, sentry puts the hostname of the
        // machine in every event, which names the user
        .server_name("desktop")
        // Started below instead, once the scope carries the install id: started
        // here the session goes out with nobody attached
        .auto_session_tracking(false)
        .session_mode(sentry::SessionMode::Application)
        .attach_stacktrace(true)
        // A single publication spends the default of 100 in git commands alone
        .max_breadcrumbs(300)
        .before_send(|mut event| {
            if let Some(request) = event.request.as_mut() {
                *request = without_query(request);
            }
            event.message = event.message.as_deref().map(without_home);
            if let Some(entry) = event.logentry.as_mut() {
                entry.message = without_home(&entry.message);
            }
            for exception in event.exception.values.iter_mut() {
                exception.value = exception.value.as_deref().map(without_home);
            }
            Some(event)
        })
        .before_breadcrumb(|mut breadcrumb| {
            breadcrumb.message = breadcrumb.message.as_deref().map(without_home);
            for value in breadcrumb.data.values_mut() {
                if let sentry::protocol::Value::String(text) = value {
                    *text = without_home(text);
                }
            }
            Some(breadcrumb)
        });
    options.dsn = dsn.as_deref().and_then(|s| s.parse().ok());
    let configured = SystemTime::now();
    let _sentry_guard = sentry::init(options);
    sentry::configure_scope(|scope| {
        scope.set_tag("os", std::env::consts::OS);
        scope.set_tag("arch", std::env::consts::ARCH);
        scope.set_tag("package", package_kind());
        if let Ok(webview) = tauri::webview_version() {
            scope.set_tag("webview", webview);
        }
        // Anonymous install id → distinguishes distinct installs from repeat crashes.
        scope.set_user(Some(sentry::protocol::User {
            id: Some(install_id.clone()),
            ..Default::default()
        }));
    });
    sentry::start_session();
    // Until the dashboard has loaded: a launch is over for the user when there
    // is something to click
    let startup = sentry::start_transaction_with_timestamp(
        sentry::TransactionContext::new("app_startup", "app.start"),
        launched,
    );
    let telemetry_ready = SystemTime::now();
    took(&startup, "before telemetry", launched, configured);
    took(&startup, "telemetry", configured, telemetry_ready);

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "warn,silex_server=info,silex_desktop=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        // Logs are left out: they carry paths, and so the name of the user
        .with(
            sentry::integrations::tracing::layer().event_filter(|metadata| {
                use sentry::integrations::tracing::EventFilter;
                match *metadata.level() {
                    tracing::Level::ERROR => EventFilter::Event,
                    tracing::Level::WARN | tracing::Level::INFO => EventFilter::Breadcrumb,
                    _ => EventFilter::Ignore,
                }
            }),
        )
        .init();

    tauri::Builder::default()
        // Before every other plugin, as this one asks for: a second Silex
        // would open a second server on the one directory of websites
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            set_current_project,
            clear_current_project,
            set_unsaved,
            open_link,
            show_website_folder,
            trash_website,
            templates::create_website_from_template,
            saved_everything,
            get_telemetry_context,
        ])
        .setup(move |app| {
            let set_up = SystemTime::now();
            took(&startup, "tauri start", telemetry_ready, set_up);
            let setup = startup.start_child("app.start", "setup");

            // Silex website data lives under app_data_dir/"websites".
            // NOT "storage": WebKitGTK uses app_data_dir/"storage" for the webview's own
            // localStorage/IndexedDB origins, and FsStorage would then scan those origin
            // dirs as if they were websites (→ metadata errors + "No such file or directory").
            let app_data_dir = app.path().app_data_dir()?;
            let data_path = app_data_dir.join("websites");
            // SILEX_DATA_PATH lets the user store the websites somewhere else
            let data_path = std::env::var_os("SILEX_DATA_PATH")
                .filter(|v| !v.is_empty())
                .map(PathBuf::from)
                .unwrap_or(data_path);
            app.manage(WebsitesFolder(data_path.clone()));

            let pending_evals = mcp::PendingEvals::default();
            let dashboard = dashboard_in_development();
            let server = setup.start_child("app.start", "server");
            let (port, sendings) = tauri::async_runtime::block_on(start_server(
                pending_evals.clone(),
                data_path,
                app_data_dir,
                app.state::<AppState>().current_website_id.clone(),
                dashboard.is_some(),
                startup.start_child("app.start", "integrations"),
            ))?;
            server.finish();
            app.manage(sendings);
            app.manage(actions::Saves::new(0));

            let url = dashboard.unwrap_or_else(|| format!("http://localhost:{}/", port));
            let creating_window = setup.start_child("app.start", "window");
            let loading: Arc<Mutex<Option<(sentry::Transaction, sentry::Span)>>> =
                Default::default();
            let loaded = loading.clone();
            let shown: Arc<Mutex<Option<SystemTime>>> = Default::default();
            let was_shown = shown.clone();
            let window = WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url.parse()?))
                .title("Silex")
                .maximized(true)
                // The dashboard's background, from the first frame on, before the page paints
                .background_color(include!(concat!(env!("OUT_DIR"), "/background.rs")))
                .initialization_script(include_str!("../scripts/desktop-bridge.js"))
                .on_page_load(move |webview, payload| {
                    if matches!(payload.event(), tauri::webview::PageLoadEvent::Finished) {
                        let _ = webview.set_focus();
                        if let Some((startup, page)) = held(&loaded).take() {
                            page.finish();
                            if let Some(shown) = *held(&was_shown) {
                                took(&startup, "window open", launched, shown);
                                let open = shown.duration_since(launched).unwrap_or_default();
                                startup.set_data("window_open", (open.as_millis() as u64).into());
                            }
                            startup.finish();
                        }
                    }
                })
                .build()?;
            creating_window.finish();
            // The page loads once setup has handed the main thread back
            *held(&loading) = Some((startup.clone(), startup.start_child("app.start", "page")));

            // Editor and dashboard reach each other through `location.href`, so
            // WebKit kept the previous editor pages alive for a back button the
            // app does not have, about 130 MB each
            #[cfg(target_os = "linux")]
            window.with_webview(|webview| {
                use webkit2gtk::{SettingsExt, WebViewExt};
                if let Some(settings) = webview.inner().settings() {
                    settings.set_enable_page_cache(false);
                }
            })?;

            // MCP transport: --stdio for agent-managed launch, HTTP otherwise
            if std::env::args().any(|a| a == "--stdio") {
                let mcp_handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    mcp::start_mcp_stdio(mcp_handle, pending_evals).await;
                });
            } else {
                let mcp_handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    mcp::start_mcp_server(mcp_handle, pending_evals, 6807).await;
                });
            }

            // Check for updates in the background — release builds only.
            // In dev (`cargo run` / `cargo watch`) the version is the placeholder 0.0.0-dev,
            // so the updater would otherwise prompt "update to <latest release>" on every launch.
            if !cfg!(debug_assertions) {
                check_for_updates(app.handle().clone());
            }

            setup.finish();

            // Handle window close with unsaved changes
            let app_handle = app.handle().clone();
            window.on_window_event(move |event| {
                // Tauri tells nothing when the window appears: its first event
                // comes when the window system has placed it on the screen
                held(&shown).get_or_insert_with(SystemTime::now);
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    let state = app_handle.state::<AppState>();
                    let has_changes = *held(&state.has_unsaved_changes);
                    if has_changes {
                        api.prevent_close();
                        show_quit_dialog(&app_handle);
                    }
                }
            });

            Ok(())
        })
        .build(context)
        .expect("error while building tauri application")
        .run(|_app, event| {
            // Tauri exits the process itself and the guard is never dropped
            if let tauri::RunEvent::Exit = event {
                sentry::end_session();
                if let Some(client) = sentry::Hub::current().client() {
                    if !client.flush(Some(std::time::Duration::from_secs(2))) {
                        tracing::warn!("telemetry did not finish sending before quitting");
                    }
                }
            }
        });
}
