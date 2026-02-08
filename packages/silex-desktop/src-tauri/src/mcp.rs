/*
 * MCP (Model Context Protocol) server for Silex Desktop.
 *
 * Exposes Silex control as MCP tools over Streamable HTTP transport.
 * Talks directly to the Tauri AppHandle — no intermediate HTTP proxy.
 *
 * For eval_js return values, injects JS that POSTs results back to a
 * callback endpoint on the Silex web server (same origin, no CORS).
 */

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

use base64::Engine;
use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::*;
use rmcp::schemars::JsonSchema;
use rmcp::transport::streamable_http_server::session::local::LocalSessionManager;
use rmcp::transport::streamable_http_server::StreamableHttpService;
use rmcp::{tool, tool_handler, tool_router, ErrorData as McpError, ServerHandler};
use serde::Deserialize;
use tauri::{Emitter, Manager};
use tokio::sync::oneshot;

use crate::AppState;

/// Pending eval results — shared between MCP tools and the HTTP callback handler.
pub type PendingEvals = Arc<std::sync::Mutex<HashMap<u64, oneshot::Sender<String>>>>;

#[derive(Clone)]
pub struct SilexMcp {
    tool_router: ToolRouter<Self>,
    app_handle: tauri::AppHandle,
    eval_counter: Arc<AtomicU64>,
    pending_evals: PendingEvals,
}

// -- Parameter types ----------------------------------------------------------

#[derive(Debug, Deserialize, JsonSchema)]
pub struct NavigateParams {
    /// The URL to navigate the Silex webview to.
    pub url: String,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct MenuParams {
    /// Menu action ID (e.g. "save", "undo", "redo", "new_project", "open_project", "close_project", "toggle_fullscreen").
    pub menu_id: String,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct EvalParams {
    /// JavaScript code to execute in the Silex webview.
    /// The code is evaluated with eval(), so expressions return their value directly
    /// (e.g. "document.title" returns the page title). For async code, return a
    /// Promise and it will be awaited. For multi-statement code, the last
    /// expression's value is returned.
    pub js: String,
    /// Optional file path to save the result to. If specified, the result is
    /// written to this file and the path is returned instead of the full result.
    /// Useful for large results.
    pub output_file: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct ScreenshotParams {
    /// What to capture: "ui" for the whole Silex editor interface (default),
    /// or "canvas" for only the GrapesJS website preview.
    pub target: Option<String>,
    /// File path to save the screenshot PNG to. If not specified, saves to a
    /// temporary file.
    pub output_file: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct CreateWebsiteParams {
    /// Human-readable name for the website.
    pub name: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct WebsiteIdParams {
    /// The ID of the website.
    pub website_id: String,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct RenameWebsiteParams {
    /// The ID of the website to rename.
    pub website_id: String,
    /// The new name for the website.
    pub name: String,
}

// -- Internal helpers (not MCP tools) -----------------------------------------

impl SilexMcp {
    /// Get the base URL for API calls
    fn get_base_url(&self) -> String {
        self.app_handle
            .get_webview_window("main")
            .and_then(|w| w.url().ok())
            .map(|u| format!("{}://{}:{}", u.scheme(), u.host_str().unwrap_or("localhost"), u.port().unwrap_or(6805)))
            .unwrap_or_else(|| "http://localhost:6805".to_string())
    }

    /// Execute JS in the webview and return the result.
    ///
    /// Injects a wrapper that evaluates the code with `eval()`, then POSTs the
    /// result back to `/eval-callback/{id}` on the same origin (the Silex web
    /// server). A oneshot channel bridges the HTTP callback to the caller.
    async fn eval_js_internal(
        &self,
        js_code: &str,
        timeout_secs: u64,
    ) -> Result<Option<String>, String> {
        let window = self
            .app_handle
            .get_webview_window("main")
            .ok_or_else(|| "No main window".to_string())?;

        // Only allow eval in the editor (URL has ?id=...), not on the dashboard
        if let Ok(url) = window.url() {
            let path = url.path();
            if path == "/" && url.query().is_none() {
                return Err(
                    "eval_js is only available in the editor, not on the dashboard. \
                     Open or create a project first."
                        .to_string(),
                );
            }
        }

        let id = self.eval_counter.fetch_add(1, Ordering::Relaxed);
        let (tx, rx) = oneshot::channel::<String>();
        self.pending_evals.lock().unwrap().insert(id, tx);

        // Escape user JS as a JSON string literal for safe embedding in eval()
        let js_escaped = serde_json::to_string(js_code)
            .map_err(|e| format!("Failed to escape JS: {}", e))?;

        // JS wrapper: eval code, POST result back via fetch to same-origin callback.
        // Using .replace() instead of format!() to avoid escaping all JS braces.
        let wrapped = r#"(async()=>{try{let __r=eval(__JS__);if(__r instanceof Promise)__r=await __r;const __s=(typeof __r==='undefined')?null:(typeof __r==='string')?__r:JSON.stringify(__r);await fetch(window.location.origin+'/eval-callback/__ID__',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({success:true,result:__s})})}catch(__e){await fetch(window.location.origin+'/eval-callback/__ID__',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({success:false,error:__e.message||String(__e)})})}})()"#
            .replace("__JS__", &js_escaped)
            .replace("__ID__", &id.to_string());

        window.eval(&wrapped).map_err(|e| {
            self.pending_evals.lock().unwrap().remove(&id);
            format!("Failed to inject JS: {}", e)
        })?;

        // Wait for the HTTP callback
        let raw = tokio::time::timeout(std::time::Duration::from_secs(timeout_secs), rx)
            .await
            .map_err(|_| {
                self.pending_evals.lock().unwrap().remove(&id);
                format!("Timeout waiting for JS result ({}s)", timeout_secs)
            })?
            .map_err(|_| "Callback channel closed".to_string())?;

        #[derive(Deserialize)]
        struct JsResult {
            success: bool,
            result: Option<String>,
            error: Option<String>,
        }

        let parsed: JsResult = serde_json::from_str(&raw)
            .map_err(|e| format!("Failed to parse JS result: {}", e))?;

        if parsed.success {
            Ok(parsed.result)
        } else {
            Err(parsed.error.unwrap_or_else(|| "Unknown JS error".into()))
        }
    }
}

// -- MCP Tool implementations ------------------------------------------------

#[tool_router]
impl SilexMcp {
    pub fn new(
        app_handle: tauri::AppHandle,
        pending_evals: PendingEvals,
        eval_counter: Arc<AtomicU64>,
    ) -> Self {
        Self {
            tool_router: Self::tool_router(),
            app_handle,
            eval_counter,
            pending_evals,
        }
    }

    #[tool(description = "Get the current Silex app state: window title, URL, project info, unsaved-changes flag")]
    async fn get_app_state(&self) -> Result<CallToolResult, McpError> {
        let handle = &self.app_handle;

        let (window_title, current_url, is_fullscreen, window_size) =
            if let Some(window) = handle.get_webview_window("main") {
                let title = window.title().ok();
                let url = window.url().ok().map(|u| u.to_string());
                let fs = window.is_fullscreen().ok();
                let size = window.inner_size().ok().map(|s| (s.width, s.height));
                (title, url, fs, size)
            } else {
                (None, None, None, None)
            };

        let app_state = handle.state::<AppState>();
        let website_id = app_state.current_website_id.lock().unwrap().clone();
        let website_name = app_state.current_website_name.lock().unwrap().clone();
        let has_unsaved = *app_state.has_unsaved_changes.lock().unwrap();

        let info = serde_json::json!({
            "window_title": window_title,
            "current_url": current_url,
            "current_website_id": website_id,
            "current_website_name": website_name,
            "has_unsaved_changes": has_unsaved,
            "is_fullscreen": is_fullscreen,
            "window_size": window_size,
        });

        Ok(CallToolResult::success(vec![Content::text(info.to_string())]))
    }

    #[tool(description = "List all websites managed by Silex, with metadata (name, ID, timestamps, etc.)")]
    async fn list_websites(&self) -> Result<CallToolResult, McpError> {
        let base_url = self.get_base_url();
        let url = format!("{}/api/website", base_url);
        match reqwest::get(&url).await {
            Ok(resp) => match resp.text().await {
                Ok(body) => Ok(CallToolResult::success(vec![Content::text(body)])),
                Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                    "Error reading response: {}", e
                ))])),
            },
            Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                "Error fetching {}: {}", url, e
            ))])),
        }
    }

    #[tool(description = "Create a new website with the given name. Returns the created website info and navigates to the editor.")]
    async fn create_website(
        &self,
        Parameters(params): Parameters<CreateWebsiteParams>,
    ) -> Result<CallToolResult, McpError> {
        let base_url = self.get_base_url();
        let url = format!("{}/api/website?connectorId=fs-storage", base_url);

        let body = if let Some(name) = &params.name {
            serde_json::json!({ "name": name })
        } else {
            serde_json::json!({})
        };

        let client = reqwest::Client::new();
        match client.put(&url)
            .header("Content-Type", "application/json")
            .body(body.to_string())
            .send()
            .await
        {
            Ok(resp) => {
                let status = resp.status();
                match resp.text().await {
                    Ok(response_body) => {
                        if status.is_success() {
                            // Parse the response to get the website ID
                            let website_id = serde_json::from_str::<serde_json::Value>(&response_body)
                                .ok()
                                .and_then(|v| v.get("websiteId").and_then(|id| id.as_str().map(String::from)));

                            // Navigate to the new website
                            if let (Some(window), Some(id)) = (self.app_handle.get_webview_window("main"), website_id) {
                                let nav_url = format!("{}/?id={}", base_url, id);
                                let _ = window.eval(&format!("window.location.href = '{}'", nav_url));
                            }
                            Ok(CallToolResult::success(vec![Content::text(response_body)]))
                        } else {
                            Ok(CallToolResult::success(vec![Content::text(format!(
                                "Error creating website ({}): {}", status, response_body
                            ))]))
                        }
                    },
                    Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                        "Error reading response: {}", e
                    ))])),
                }
            },
            Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                "Error creating website: {}", e
            ))])),
        }
    }

    #[tool(description = "Delete a website by its ID.")]
    async fn delete_website(
        &self,
        Parameters(params): Parameters<WebsiteIdParams>,
    ) -> Result<CallToolResult, McpError> {
        let base_url = self.get_base_url();
        let url = format!("{}/api/website?websiteId={}&connectorId=fs-storage", base_url, params.website_id);

        let client = reqwest::Client::new();
        match client.delete(&url).send().await {
            Ok(resp) => {
                let status = resp.status();
                match resp.text().await {
                    Ok(body) => {
                        if status.is_success() {
                            // Refresh the dashboard
                            if let Some(window) = self.app_handle.get_webview_window("main") {
                                let _ = window.eval("window.location.href = '/'");
                            }
                            Ok(CallToolResult::success(vec![Content::text(format!(
                                "{{\"success\":true,\"message\":\"Website '{}' deleted\"}}", params.website_id
                            ))]))
                        } else {
                            Ok(CallToolResult::success(vec![Content::text(format!(
                                "Error deleting website ({}): {}", status, body
                            ))]))
                        }
                    },
                    Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                        "Error reading response: {}", e
                    ))])),
                }
            },
            Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                "Error deleting website: {}", e
            ))])),
        }
    }

    #[tool(description = "Rename a website (update its display name).")]
    async fn rename_website(
        &self,
        Parameters(params): Parameters<RenameWebsiteParams>,
    ) -> Result<CallToolResult, McpError> {
        let base_url = self.get_base_url();
        let url = format!("{}/api/website/meta?websiteId={}&connectorId=fs-storage", base_url, params.website_id);

        let body = serde_json::json!({ "name": params.name });

        let client = reqwest::Client::new();
        match client.post(&url)
            .header("Content-Type", "application/json")
            .body(body.to_string())
            .send()
            .await
        {
            Ok(resp) => {
                let status = resp.status();
                match resp.text().await {
                    Ok(response_body) => {
                        if status.is_success() {
                            // Refresh the dashboard
                            if let Some(window) = self.app_handle.get_webview_window("main") {
                                let _ = window.eval("window.location.href = '/'");
                            }
                            Ok(CallToolResult::success(vec![Content::text(format!(
                                "{{\"success\":true,\"message\":\"Website renamed to '{}'\"}}", params.name
                            ))]))
                        } else {
                            Ok(CallToolResult::success(vec![Content::text(format!(
                                "Error renaming website ({}): {}", status, response_body
                            ))]))
                        }
                    },
                    Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                        "Error reading response: {}", e
                    ))])),
                }
            },
            Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                "Error renaming website: {}", e
            ))])),
        }
    }

    #[tool(description = "Duplicate a website.")]
    async fn duplicate_website(
        &self,
        Parameters(params): Parameters<WebsiteIdParams>,
    ) -> Result<CallToolResult, McpError> {
        let base_url = self.get_base_url();
        let url = format!("{}/api/website/duplicate?websiteId={}&connectorId=fs-storage", base_url, params.website_id);

        let client = reqwest::Client::new();
        match client.post(&url).send().await {
            Ok(resp) => {
                let status = resp.status();
                match resp.text().await {
                    Ok(body) => {
                        if status.is_success() {
                            // Refresh the dashboard
                            if let Some(window) = self.app_handle.get_webview_window("main") {
                                let _ = window.eval("window.location.href = '/'");
                            }
                            Ok(CallToolResult::success(vec![Content::text(body)]))
                        } else {
                            Ok(CallToolResult::success(vec![Content::text(format!(
                                "Error duplicating website ({}): {}", status, body
                            ))]))
                        }
                    },
                    Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                        "Error reading response: {}", e
                    ))])),
                }
            },
            Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                "Error duplicating website: {}", e
            ))])),
        }
    }

    #[tool(description = "Navigate the Silex webview to a URL")]
    async fn navigate(
        &self,
        Parameters(params): Parameters<NavigateParams>,
    ) -> Result<CallToolResult, McpError> {
        if let Some(window) = self.app_handle.get_webview_window("main") {
            let js = format!(
                "window.location.href = '{}'",
                params.url.replace('\'', "\\'")
            );
            match window.eval(&js) {
                Ok(_) => Ok(CallToolResult::success(vec![Content::text(format!(
                    "{{\"success\":true,\"message\":\"Navigating to {}\"}}",
                    params.url
                ))])),
                Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                    "{{\"success\":false,\"message\":\"Failed to navigate: {}\"}}",
                    e
                ))])),
            }
        } else {
            Ok(CallToolResult::success(vec![Content::text(
                "{\"success\":false,\"message\":\"No main window\"}",
            )]))
        }
    }

    #[tool(description = "Trigger a Silex menu action by ID (save, undo, redo, new_project, open_project, close_project, toggle_fullscreen, ...)")]
    async fn trigger_menu(
        &self,
        Parameters(params): Parameters<MenuParams>,
    ) -> Result<CallToolResult, McpError> {
        let result = match params.menu_id.as_str() {
            "new_project" => {
                if let Some(w) = self.app_handle.get_webview_window("main") {
                    w.eval("window.location.href = '/?action=new'").ok();
                }
                true
            }
            "open_project" => {
                if let Some(w) = self.app_handle.get_webview_window("main") {
                    w.eval("window.location.href = '/'").ok();
                }
                true
            }
            "save" => self.app_handle.emit("menu-save", ()).is_ok(),
            "undo" => self.app_handle.emit("menu-undo", ()).is_ok(),
            "redo" => self.app_handle.emit("menu-redo", ()).is_ok(),
            "close_project" => self.app_handle.emit("menu-close-project", ()).is_ok(),
            "toggle_fullscreen" => {
                if let Some(w) = self.app_handle.get_webview_window("main") {
                    let fs = w.is_fullscreen().unwrap_or(false);
                    w.set_fullscreen(!fs).is_ok()
                } else {
                    false
                }
            }
            other => self
                .app_handle
                .emit(&format!("menu-{}", other), ())
                .is_ok(),
        };

        Ok(CallToolResult::success(vec![Content::text(format!(
            "{{\"success\":{},\"message\":\"Triggered menu: {}\"}}",
            result, params.menu_id
        ))]))
    }

    #[tool(description = "Execute JavaScript in the Silex webview and return the result. Only works when a project is open in the editor (not on the dashboard). Has a 10-second timeout — break large operations into smaller chunks. The JS is evaluated using eval(), so expressions return their value directly (e.g. \"document.title\" returns the page title). For async code, return a Promise and it will be awaited. For multi-statement code, the last expression's value is returned. Access the GrapesJS editor with: window.silex.getEditor(). Use CssComposer.setRule(selector, propsObject) for styling (never addRules() or component.setStyle()). Use BEM class names.")]
    async fn eval_js(
        &self,
        Parameters(params): Parameters<EvalParams>,
    ) -> Result<CallToolResult, McpError> {
        match self.eval_js_internal(&params.js, 10).await {
            Ok(result) => {
                let result_text = result.unwrap_or_else(|| "undefined".to_string());

                if let Some(output_file) = params.output_file {
                    std::fs::write(&output_file, &result_text).map_err(|e| {
                        McpError::internal_error(format!("Failed to write file: {e}"), None)
                    })?;
                    return Ok(CallToolResult::success(vec![Content::text(format!(
                        "Result saved to {}",
                        output_file
                    ))]));
                }

                Ok(CallToolResult::success(vec![Content::text(result_text)]))
            }
            Err(error) => Ok(CallToolResult::success(vec![Content::text(format!(
                "Error: {}",
                error
            ))])),
        }
    }

    #[tool(description = "Get the full HTML of the page currently loaded in the Silex webview")]
    async fn get_page_html(&self) -> Result<CallToolResult, McpError> {
        match self
            .eval_js_internal("document.documentElement.outerHTML", 5)
            .await
        {
            Ok(Some(html)) => Ok(CallToolResult::success(vec![Content::text(html)])),
            Ok(None) => Ok(CallToolResult::success(vec![Content::text(
                "Error: no HTML returned",
            )])),
            Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                "Error: {}",
                e
            ))])),
        }
    }

    #[tool(description = "Take a screenshot of the Silex editor UI or the GrapesJS website canvas. Saves the screenshot as a PNG file and returns the file path.")]
    async fn take_screenshot(
        &self,
        Parameters(params): Parameters<ScreenshotParams>,
    ) -> Result<CallToolResult, McpError> {
        let target = params.target.as_deref().unwrap_or("ui");

        let screenshot_js = r#"
(async function() {
    if (!window.html2canvas) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        await new Promise((resolve, reject) => {
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load html2canvas from CDN'));
            document.head.appendChild(s);
        });
    }
    let element;
    if ('__TARGET__' === 'canvas') {
        const frame = document.querySelector('.gjs-frame');
        if (frame && frame.contentDocument && frame.contentDocument.body) {
            element = frame.contentDocument.body;
        } else {
            throw new Error('GrapesJS canvas iframe not found or not accessible');
        }
    } else {
        element = document.body;
    }
    const canvas = await html2canvas(element, { useCORS: true, allowTaint: true });
    return canvas.toDataURL('image/png');
})()
"#
        .replace("__TARGET__", target);

        let data_url = match self.eval_js_internal(&screenshot_js, 30).await {
            Ok(Some(url)) => url,
            Ok(None) => {
                return Ok(CallToolResult::success(vec![Content::text(
                    "Screenshot returned no data",
                )]))
            }
            Err(e) => {
                return Ok(CallToolResult::success(vec![Content::text(format!(
                    "Screenshot failed: {}",
                    e
                ))]))
            }
        };

        let base64_prefix = "data:image/png;base64,";
        let base64_data = if data_url.starts_with(base64_prefix) {
            &data_url[base64_prefix.len()..]
        } else {
            return Ok(CallToolResult::success(vec![Content::text(
                "Unexpected data URL format",
            )]));
        };

        let png_bytes =
            match base64::engine::general_purpose::STANDARD.decode(base64_data) {
                Ok(bytes) => bytes,
                Err(e) => {
                    return Ok(CallToolResult::success(vec![Content::text(format!(
                        "Failed to decode base64: {}",
                        e
                    ))]))
                }
            };

        let output_path = if let Some(path) = params.output_file {
            std::path::PathBuf::from(path)
        } else {
            let id = self.eval_counter.fetch_add(1, Ordering::Relaxed);
            std::env::temp_dir().join(format!("silex-screenshot-{}.png", id))
        };

        match std::fs::write(&output_path, &png_bytes) {
            Ok(_) => Ok(CallToolResult::success(vec![Content::text(format!(
                "Screenshot saved to {}",
                output_path.display()
            ))])),
            Err(e) => Ok(CallToolResult::success(vec![Content::text(format!(
                "Failed to write file: {}",
                e
            ))])),
        }
    }
}

// -- Eval callback handler (mounted on the Silex web server) ------------------

/// HTTP handler that receives eval results from the webview via fetch().
/// Added to the Silex web server router so it's same-origin (no CORS).
pub async fn eval_callback(
    axum::extract::Extension(pending): axum::extract::Extension<PendingEvals>,
    axum::extract::Path(id): axum::extract::Path<u64>,
    body: String,
) -> &'static str {
    if let Some(tx) = pending.lock().unwrap().remove(&id) {
        let _ = tx.send(body);
    }
    "ok"
}

// -- ServerHandler glue -------------------------------------------------------

#[tool_handler]
impl ServerHandler for SilexMcp {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            protocol_version: ProtocolVersion::V_2024_11_05,
            capabilities: ServerCapabilities::builder().enable_tools().build(),
            server_info: Implementation::from_build_env(),
            instructions: Some(
                r#"Silex Desktop MCP server — controls the Silex no-code website builder (built on GrapesJS).

Access the editor: `const editor = window.silex.getEditor();`

## Workflow

1. `get_app_state` — check if a project is open (`current_website_id`).
2. `list_websites` — list available sites.
3. `navigate` — open a project (`http://localhost:6805/?id=my-site`) or dashboard (`/`).
4. `eval_js` — run GrapesJS API code (only when a project is open). GrapesJS API operations automatically trigger saves.
5. `take_screenshot` — visually verify changes (target "ui" or "canvas").
6. `trigger_menu("save")` — manually save the project (only needed if you want to force an immediate save).

## GrapesJS API Reference

Before using any GrapesJS API method, **fetch the relevant documentation page** to verify method signatures, options, and behavior. Do NOT rely on memory alone.

- CSS:        https://grapesjs.com/docs/api/css_composer.html
- Components: https://grapesjs.com/docs/api/components.html
- Pages:      https://grapesjs.com/docs/api/pages.html
- Devices:    https://grapesjs.com/docs/api/device_manager.html
- Editor:     https://grapesjs.com/docs/api/editor.html
- Storage:    https://grapesjs.com/docs/api/storage_manager.html

## Critical Rules (Silex-specific)

1. **Styling:** Use `CssComposer.setRule(selector, propsObject)` with BEM classes ONLY. NEVER use `addRules()` (does not persist on save). NEVER use `component.setStyle()` (creates inline styles on element IDs). NEVER use CSS Grid (Flexbox only).

2. **Head injection:** NEVER add components to `wrapper.get('head')`. Use `settings.head` on the site model (all pages) or on a page object (single page) instead.

3. **Custom/non-standard HTML attributes:** NEVER use `addAttributes()`, `set('attributes', {...})`, or any normal GrapesJS attribute API for custom attributes (data-*, Vue directives, ARIA overrides, etc.). These appear in the editor but are **stripped from published output**. The ONLY way to add attributes that survive publication is via `privateStates` with a fixed expression (see "Custom HTML Attributes" below).

4. **GrapesJS API only** — never modify the DOM directly (unsaved). CSS-only interactivity (`:hover`, `:checked`, `:target`, combinators) — no inline JS.

5. **Responsive:** Use DeviceManager breakpoints (Desktop, Tablet, Mobile) — never resize the browser window.

6. **Content:** Texts must have `type: 'text'` and `editable: true`. Homepage must be named `index`. Internal links must be relative, starting with `./`.

7. **Accessibility:** WCAG 2.1 AA — sufficient contrast, semantic HTML, alt text.

## Silex-specific APIs

### Symbols

Shared elements (header/footer) reused across pages. Must be added on every page.

```js
editor.runCommand('symbols:add', { label: 'Header', icon: 'fa fa-diamond' });
const symbols = editor.Components.getSymbols();
editor.Pages.select('about');
const sym = symbols.find(s => s.get('label') === 'Header');
if (sym) editor.getWrapper().append(sym, { at: 0 });
```

### Settings (Site & Page)

Settings cascade: page-level overrides site-level for the same key. Use `settings.head` for scripts/stylesheets — never `wrapper.get('head')`.

```js
// Site-level (all pages)
const model = editor.getModel();
const site = model.get('settings') || {};
model.set('settings', { ...site,
  lang: 'en',                         // HTML lang attribute
  title: 'My Website',                // <title> tag + SEO
  description: 'A short description', // <meta name="description">
  favicon: './assets/favicon.ico',    // <link rel="icon">
  head: '<link rel="stylesheet" href="global.css">',
  'og:title': 'Share Title',          // Open Graph title
  'og:description': 'Share desc',     // Open Graph description
  'og:image': 'https://example.com/og.jpg', // Open Graph image
});

// Page-level (overrides site for this page)
const page = editor.Pages.getSelected();
const ps = page.get('settings') || {};
page.set('settings', { ...ps, title: 'About Us', lang: 'fr' });
```

Core keys (site or page): `lang`, `title`, `description`, `favicon`, `head`, `og:title`, `og:description`, `og:image`.

CMS-only keys (page, expression-based): `eleventySeoTitle`, `eleventySeoDescription`, `eleventyFavicon`, `eleventyOGImage`, `eleventyOGTitle`, `eleventyOGDescription`, `eleventyPageData`, `eleventyPermalink`.

CMS i18n (page): `silexLanguagesList` (comma-separated, e.g. "en,fr") duplicates the page per language at build time.

### CMS: Data Sources

```js
const dsm = editor.DataSourceManager;
dsm.getAll().forEach(ds => console.log(ds.id, ds.get('label'), ds.isConnected()));
const ds = dsm.get('my-api');
ds.getTypes().forEach(t => console.log(t.id, t.fields.map(f => f.id)));
ds.getQueryables().forEach(f => console.log(f.id, f.kind));
```

### CMS: Expressions & States

Expressions are token arrays stored as **states** on components. Token types:
- **Property**: `{ type: 'property', propType: 'field', dataSourceId, fieldId, typeIds, kind, label }`
- **Filter**: `{ type: 'filter', id, label, options }`
- **State**: `{ type: 'state', storedStateId, componentId, exposed: true, label }`

State categories:
- **publicStates** — accessible by child components
- **privateStates** — internal to the component

Special private state IDs:
- `innerHTML` — binds component HTML content
- `condition` — visibility (use `conditionOperator`: 'truthy', '==', '!=', etc.)
- `__data` — loop: renders once per item

```js
const comp = editor.getSelected();

// Public state: expose data to children
const pub = comp.get('publicStates') || [];
pub.push({
  id: 'blogPosts', label: 'Blog Posts', hidden: false,
  expression: [{ type: 'property', propType: 'field', dataSourceId: 'wordpress',
    fieldId: 'posts', typeIds: ['PostConnection'], kind: 'list', label: 'posts' }]
});
comp.set('publicStates', [...pub]);

// Private state: bind innerHTML
const priv = comp.get('privateStates') || [];
priv.push({
  id: 'innerHTML',
  expression: [
    { type: 'state', storedStateId: 'blogPosts', componentId: 'parent-id', exposed: true, label: 'blogPosts' },
    { type: 'property', propType: 'field', fieldId: 'title', typeIds: ['String'], kind: 'scalar', label: 'title' }
  ]
});
comp.set('privateStates', [...priv]);

// Private state: loop over data
priv.push({
  id: '__data',
  expression: [{ type: 'state', storedStateId: 'blogPosts', componentId: 'parent-id', exposed: true, label: 'blogPosts' }]
});
comp.set('privateStates', [...priv]);
```

### Custom HTML Attributes

NEVER use `addAttributes()` or `set('attributes', {...})` for custom/non-standard attributes — they are stripped on publish. Use `privateStates` with a fixed expression instead. The state's `label` becomes the attribute name.

```js
const comp = editor.getSelected();
const priv = comp.get('privateStates') || [];
priv.push({
  id: comp.getId() + '-' + Math.random().toString(36).slice(2, 15),
  label: 'v-for',  // attribute name in published HTML
  expression: [{
    type: 'property', propType: 'field', fieldId: 'fixed', kind: 'scalar',
    label: 'Fixed value', typeIds: ['String'],
    options: { value: 'item in items' }  // attribute value
  }]
});
comp.set('privateStates', [...priv]);
// Published: <div v-for="item in items">...</div>
```

### CMS: Preview

```js
editor.runCommand('data-source:preview:refresh');
```

## QA Checklist

Verify before finishing (use `take_screenshot`):
- All DeviceManager breakpoints look correct
- Texts are editable (`type: 'text'`, `editable: true`)
- Styling via BEM classes + `setRule()` only (no `addRules()`, no inline styles, no element IDs)
- Header/footer symbols on every page
- WCAG 2.1 AA color contrast
- Homepage named `index`; internal links start with `./`
- CMS (if used): data sources connected, expressions set, preview renders
"#
                .into(),
            ),
        }
    }
}

// -- Server entry point -------------------------------------------------------

pub async fn start_mcp_server(
    app_handle: tauri::AppHandle,
    pending_evals: PendingEvals,
    port: u16,
) {
    let eval_counter = Arc::new(AtomicU64::new(0));

    let mcp_service = StreamableHttpService::new(
        move || {
            Ok(SilexMcp::new(
                app_handle.clone(),
                pending_evals.clone(),
                eval_counter.clone(),
            ))
        },
        LocalSessionManager::default().into(),
        Default::default(),
    );

    let router = axum_mcp::Router::new().nest_service("/mcp", mcp_service);

    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], port));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    tracing::info!("MCP server listening on http://{}/mcp", addr);

    tokio::spawn(async move {
        axum_mcp::serve(listener, router).await.unwrap();
    });
}
