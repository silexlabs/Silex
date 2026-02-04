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

// -- Internal helpers (not MCP tools) -----------------------------------------

impl SilexMcp {
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
            if path.starts_with("/welcome") || (path == "/" && url.query().is_none()) {
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
        let base_url = self
            .app_handle
            .get_webview_window("main")
            .and_then(|w| w.url().ok())
            .map(|u| format!("{}://{}:{}", u.scheme(), u.host_str().unwrap_or("localhost"), u.port().unwrap_or(6805)))
            .unwrap_or_else(|| "http://localhost:6805".to_string());

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
                    w.eval("window.location.href = '/welcome?action=new'").ok();
                }
                true
            }
            "open_project" => {
                if let Some(w) = self.app_handle.get_webview_window("main") {
                    w.eval("window.location.href = '/welcome'").ok();
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

    #[tool(description = "Execute JavaScript in the Silex webview and return the result. Only works when a project is open in the editor (not on the dashboard). Has a 10-second timeout — break large operations into smaller chunks. The JS is evaluated using eval(), so expressions return their value directly (e.g. \"document.title\" returns the page title). For async code, return a Promise and it will be awaited. For multi-statement code, the last expression's value is returned. Access the GrapesJS editor with: window.silex.getEditor(). Use CssComposer.addRules() for styling (never component.setStyle()). Use BEM class names.")]
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
                r#"Silex Desktop MCP server. Use these tools to inspect and control the Silex website builder.

Silex is a no-code website builder built on GrapesJS. Use `eval_js` to interact with the GrapesJS API.

## Workflow

1. Use `get_app_state` to check if a project is open (look for `current_website_id`).
2. Use `list_websites` to see available sites.
3. Use `navigate` to open a project (e.g. `http://localhost:6805/?id=my-site`), or go to `/welcome` for the dashboard.
4. Use `eval_js` to interact with the GrapesJS editor (only works when a project is open).
5. Use `take_screenshot` to visually verify changes (target "ui" or "canvas").
6. Use `trigger_menu` with "save" to save, or the editor will auto-save on close.

## Accessing the GrapesJS API

```js
const editor = window.silex.getEditor();
const wrapper = editor.getWrapper();
```

## Critical Rules

- Use GrapesJS API only — NEVER modify the DOM directly (direct DOM changes are not saved).
- CSS-only interactivity — no inline JS. Use `:hover`, `:checked`, `:target`, and CSS combinators.
- BEM class naming for all styling (e.g. `.header`, `.header__title`, `.header--dark`).
- **Style via `CssComposer.addRules()` only. NEVER use `component.setStyle()`** (that creates inline styles on element IDs which is wrong).
- Do NOT use CSS Grid — Silex does not support Grid. Use Flexbox instead.
- Never resize the browser window — use GrapesJS DeviceManager breakpoints instead.
- Ensure responsiveness for all DeviceManager breakpoints (Desktop, Tablet, Mobile).
- The homepage MUST be named `index`.
- Internal links must be relative and start with `./` (e.g. `href="./about.html"`).
- Texts should be editable: set `type: 'text'` and `editable: true`.
- Follow WCAG 2.1 AA for accessibility (sufficient color contrast, semantic HTML, alt text).

## Styling Components

ALWAYS use CSS Composer to style classes:

```js
const editor = window.silex.getEditor();
const cssComposer = editor.CssComposer;

// ✅ CORRECT - Style the class
cssComposer.addRules(`.header {
  background-color: #ffffff;
  padding: 1rem;
}`);

// ❌ WRONG - Never do this
component.setStyle({ 'background-color': '#ffffff' });
```

## Adding Components

```js
const editor = window.silex.getEditor();
const wrapper = editor.getWrapper();

// Append a component
wrapper.append(`<section class="hero">
  <h1 class="hero__title">Hello</h1>
</section>`);

// Or with the component API
wrapper.append({
  tagName: 'section',
  classes: ['hero'],
  components: [
    { tagName: 'h1', type: 'text', editable: true, classes: ['hero__title'], content: 'Hello' }
  ]
});
```

## Symbols (reusable components)

Symbols are used for shared elements like header/footer across pages.

```js
// Create a symbol from the currently selected component
editor.runCommand('symbols:add', { label: 'Header', icon: 'fa fa-diamond' });

// List existing symbols
const symbols = editor.Components.getSymbols();

// Add a symbol instance to another page
// 1. Select the target page
editor.Pages.select('about');
// 2. Get the symbol and append an instance
const wrapper = editor.getWrapper();
const headerSymbol = symbols.find(s => s.get('label') === 'Header');
if (headerSymbol) {
  wrapper.append(headerSymbol, { at: 0 }); // at:0 = first child
}
```

Important: Symbols such as header and footer MUST be added on every page.

## Pages

```js
const pm = editor.Pages;

// List pages
pm.getAll();

// Add a new page (id determines the output filename, e.g. 'about' → about.html)
pm.add({ id: 'about', name: 'About' });

// Select a page
pm.select('about');
```

## Settings (Site & Page)

Site-level and page-level settings are stored in a `settings` object. Use this for head injection, SEO, 11ty config, etc.

```js
const editor = window.silex.getEditor();

// --- Site-level settings (applies to all pages) ---
const model = editor.getModel();
const siteSettings = model.get('settings') || {};
// siteSettings.head — HTML injected into <head> on every page
console.log(siteSettings.head);

// Set site-level head content
model.set('settings', { ...siteSettings, head: '<script type="module">...</script>' });

// --- Page-level settings (applies to current page only) ---
const page = editor.Pages.getSelected();
const pageSettings = page.get('settings') || {};
// pageSettings.head — HTML injected into <head> for this page only
// pageSettings.name — the page name
console.log(pageSettings.head);

// Set page-level head content
page.set('settings', { ...pageSettings, head: '<link rel="stylesheet" href="custom.css">' });
```

Available settings keys: `head`, `name`, `eleventyPageData`, `eleventyPermalink`, `eleventySeoTitle`, `eleventySeoDescription`, `eleventyFavicon`, `eleventyOGImage`, `eleventyOGTitle`, `eleventyOGDescription`.

**Important:** To add scripts or stylesheets to the page, use `settings.head` — do NOT add components to `wrapper.get('head')`.

## Device Manager (responsive design)

```js
const dm = editor.DeviceManager;

// List available devices
dm.getAll();

// Select a device (for responsive preview)
dm.select('Mobile portrait');
```

## CMS: Data Sources

Data sources define where dynamic data comes from (GraphQL APIs, 11ty collections, etc.).

```js
const editor = window.silex.getEditor();

// List all data sources
const dataSources = editor.DataSourceManager.getAll();
dataSources.forEach(ds => {
  console.log(ds.id, ds.get('label'), ds.isConnected());
});

// Get a specific data source
const ds = editor.DataSourceManager.get('my-api');

// Inspect available types and fields
ds.getTypes().forEach(type => {
  console.log('Type:', type.id, '- Fields:', type.fields.map(f => f.id));
});

// Inspect root queryable fields
ds.getQueryables().forEach(field => {
  console.log('Queryable:', field.id, '- Kind:', field.kind);
});
```

## CMS: Expressions (component data binding)

Expressions are arrays of tokens that define how to retrieve and transform data. They are stored as **states** on components.

### Token types

1. **Property** — accesses a data source field:
   `{ type: 'property', propType: 'field', dataSourceId: 'my-api', fieldId: 'posts', typeIds: ['Post'], kind: 'list', label: 'posts' }`

2. **Filter** — transforms data:
   `{ type: 'filter', id: 'first', label: 'first', options: {} }`

3. **State** — references another component's exported state:
   `{ type: 'state', storedStateId: 'myState', componentId: 'comp-id', exposed: true, label: 'myState' }`

### Setting states on components

States come in two categories:
- **Public states** (`exported: true`) — accessible by child components
- **Private states** (`exported: false`) — internal to the component

Special state IDs for property binding:
- `innerHTML` — binds the component's HTML content to an expression
- `condition` — visibility condition (with `conditionOperator`: 'truthy', '==', '!=', etc.)
- `__data` — loop: renders the component once per item in the expression result

```js
const component = editor.getSelected();

// Read existing states
const publicStates = component.get('publicStates') || [];

// Add a public state (data available to children)
const states = component.get('publicStates') || [];
states.push({
  id: 'blogPosts',
  label: 'Blog Posts',
  hidden: false,
  expression: [
    { type: 'property', propType: 'field', dataSourceId: 'wordpress',
      fieldId: 'posts', typeIds: ['PostConnection'], kind: 'list', label: 'posts' }
  ]
});
component.set('publicStates', [...states]);

// Bind innerHTML to an expression (private state)
const privateStates = component.get('privateStates') || [];
privateStates.push({
  id: 'innerHTML',
  expression: [
    { type: 'state', storedStateId: 'blogPosts', componentId: 'parent-id',
      exposed: true, label: 'blogPosts' },
    { type: 'property', propType: 'field', fieldId: 'title',
      typeIds: ['String'], kind: 'scalar', label: 'title' }
  ]
});
component.set('privateStates', [...privateStates]);

// Make a component loop over data
privateStates.push({
  id: '__data',
  expression: [
    { type: 'state', storedStateId: 'blogPosts', componentId: 'parent-id',
      exposed: true, label: 'blogPosts' }
  ]
});
component.set('privateStates', [...privateStates]);
```

### Evaluating and previewing

```js
// Get the GraphQL query generated for the current page
const page = editor.Pages.getSelected();
// Use the data source plugin API:
editor.runCommand('data-source:preview:refresh');
```

## QA Checklist

Before finishing, verify (use `take_screenshot` to check visually):
- All DeviceManager breakpoints look correct
- Texts are editable (type: 'text', editable: true)
- CSS styling on BEM classes only (never element IDs, no inline styles)
- Header and footer symbols present on every page
- Color contrast meets WCAG 2.1 AA
- Homepage named `index`
- Internal links use relative hrefs starting with "./"
- If CMS: data sources connected, expressions set, preview data renders correctly
- Save the project with `trigger_menu("save")`
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
