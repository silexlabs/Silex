/*
 * MCP (Model Context Protocol) server for Silex Desktop.
 *
 * Exposes Silex control as 14 merged MCP tools over Streamable HTTP transport.
 * Designed for small local LLMs (7B-13B): action-enum params, HTML string
 * input for components, dot-notation for CMS expressions, CSS string support.
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
use rmcp::{tool, tool_handler, tool_router, ErrorData as McpError, ServerHandler, ServiceExt};
use serde::Deserialize;
use tauri::Manager;
use tokio::sync::oneshot;

use crate::AppState;

// ==========================================================================
// Shared state
// ==========================================================================

/// Pending eval results — shared between MCP tools and the HTTP callback handler.
pub type PendingEvals = Arc<std::sync::Mutex<HashMap<u64, oneshot::Sender<String>>>>;

// ==========================================================================
// Action enums
// ==========================================================================

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum WebsiteAction {
    List,
    Create,
    Delete,
    Rename,
    Duplicate,
    Open,
    Dashboard,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum PageAction {
    List,
    Add,
    Select,
    Remove,
    Rename,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ComponentAction {
    GetTree,
    Get,
    Add,
    Update,
    Move,
    Remove,
    Select,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum SelectorAction {
    List,
    Select,
    Create,
    Delete,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum StyleAction {
    Get,
    Set,
    Delete,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum SymbolAction {
    List,
    Create,
    Insert,
    Delete,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum DeviceAction {
    List,
    Set,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum SettingsAction {
    Get,
    Set,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum BlockAction {
    List,
    Insert,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum DataSourceAction {
    List,
    Preview,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum StateAction {
    List,
    Set,
    Remove,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum HistoryAction {
    Undo,
    Redo,
}

// ==========================================================================
// Parameter structs
// ==========================================================================

#[derive(Debug, Deserialize, JsonSchema)]
pub struct WebsiteParams {
    /// The action to perform.
    pub action: WebsiteAction,
    /// Website ID (required for delete, rename, duplicate, open).
    pub website_id: Option<String>,
    /// Website name (required for create, rename).
    pub name: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct PageParams {
    /// The action to perform.
    pub action: PageAction,
    /// Page ID or name (for select, remove).
    pub page_id: Option<String>,
    /// Page display name (for add, rename).
    pub name: Option<String>,
    /// Page slug / URL path (for add). Defaults to name if omitted.
    pub slug: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct ComponentParams {
    /// The action to perform.
    pub action: ComponentAction,
    /// Component ID (required for select and move target).
    pub component_id: Option<String>,
    /// HTML string to add as components (for add). The server parses it,
    /// auto-sets text elements as editable, and strips inline styles.
    pub html: Option<String>,
    /// New text content (for update on selected component).
    pub content: Option<String>,
    /// Standard HTML attributes like href, src, alt (for update on selected component). Object.
    pub attributes: Option<serde_json::Value>,
    /// Position relative to selected component: "before", "after", or "inside" (default).
    /// For add: places new content relative to selected (or appends to wrapper if none selected).
    /// For move: places selected component relative to target_id component.
    pub position: Option<String>,
    /// Tree depth limit (for get_tree, default 2).
    pub depth: Option<u32>,
    /// Max components to return (for get_tree, default 50).
    pub max_components: Option<u32>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct SelectorParams {
    /// The action to perform.
    pub action: SelectorAction,
    /// CSS selector string (for select, e.g. ".hero__title"). Must match the selected component.
    pub selector: Option<String>,
    /// CSS class name without dot (for create/delete, e.g. "hero__title").
    pub class_name: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct StyleParams {
    /// The action to perform. Operates on the currently active selector (set via selector tool).
    pub action: StyleAction,
    /// CSS properties as object, e.g. {"font-size": "2rem"} (for set).
    pub properties: Option<serde_json::Value>,
    /// CSS string alternative, e.g. "font-size: 2rem; color: #333;" (for set).
    pub css: Option<String>,
    /// CSS property name to remove (for delete).
    pub property: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct SymbolParams {
    /// The action to perform.
    pub action: SymbolAction,
    /// Symbol display label (for create, place, delete).
    pub label: Option<String>,
    /// FontAwesome icon class (for create, e.g. "fa fa-diamond").
    pub icon: Option<String>,
    /// Position relative to selected component: "before", "after", or "inside" (default).
    /// For insert: where to insert the symbol relative to the selected component.
    pub position: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct DeviceParams {
    /// The action to perform.
    pub action: DeviceAction,
    /// Device name: "Desktop", "Tablet", or "Mobile" (for set).
    pub name: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct SettingsParams {
    /// The action to perform.
    pub action: SettingsAction,
    /// Scope: "site" for site-wide settings, "page" for the currently selected page.
    pub scope: String,
    /// Settings object with keys like lang, title, description, favicon, head,
    /// "og:title", "og:description", "og:image" (for set).
    pub settings: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct BlockParams {
    /// The action to perform.
    pub action: BlockAction,
    /// Block ID (required for insert).
    pub block_id: Option<String>,
    /// Position relative to selected component: "before", "after", or "inside" (default).
    pub position: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct DataSourceParams {
    /// The action to perform.
    pub action: DataSourceAction,
    /// Whether to enable (true) or disable (false) live data preview (for preview action).
    pub enabled: Option<bool>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct StateParams {
    /// The action to perform. Operates on the currently selected component.
    pub action: StateAction,
    /// State type for set: "content", "loop", "condition", "attribute", or "expose".
    #[serde(rename = "type")]
    pub state_type: Option<String>,
    /// Dot-notation data path, e.g. "wordpress.posts.title" (for set).
    pub expression: Option<String>,
    /// Condition operator: "truthy", "==", "!=", etc. (for set with type=condition).
    pub operator: Option<String>,
    /// Attribute name (for set with type=attribute).
    pub name: Option<String>,
    /// Attribute value (for set with type=attribute).
    pub value: Option<String>,
    /// State ID (for expose or remove).
    pub state_id: Option<String>,
    /// Display label (for set with type=expose).
    pub label: Option<String>,
    /// Whether the state is exported/public (for remove, default false).
    pub exported: Option<bool>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct HistoryParams {
    /// The action to perform.
    pub action: HistoryAction,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct EvalParams {
    /// JavaScript code to execute in the Silex webview.
    /// Evaluated with eval(), so expressions return their value directly.
    /// Access the GrapesJS editor with: window.silex.getEditor()
    pub js: String,
    /// Optional file path to save the result to.
    pub output_file: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct ScreenshotParams {
    /// What to capture: "ui" for the whole editor (default),
    /// or "canvas" for only the website preview.
    pub target: Option<String>,
    /// File path to save the screenshot PNG to.
    pub output_file: Option<String>,
}


// ==========================================================================
// SilexMcp struct
// ==========================================================================

#[derive(Clone)]
pub struct SilexMcp {
    tool_router: ToolRouter<Self>,
    app_handle: tauri::AppHandle,
    eval_counter: Arc<AtomicU64>,
    pending_evals: PendingEvals,
}

// ==========================================================================
// Internal helpers
// ==========================================================================

impl SilexMcp {
    fn get_base_url(&self) -> String {
        self.app_handle
            .get_webview_window("main")
            .and_then(|w| w.url().ok())
            .map(|u| {
                format!(
                    "{}://{}:{}",
                    u.scheme(),
                    u.host_str().unwrap_or("localhost"),
                    u.port().unwrap_or(6805)
                )
            })
            .unwrap_or_else(|| "http://localhost:6805".to_string())
    }

    /// Navigate the webview to a URL (safe, no injection).
    fn navigate_to(&self, url: &str) -> Result<(), String> {
        let window = self
            .app_handle
            .get_webview_window("main")
            .ok_or_else(|| "No main window".to_string())?;
        let url_json =
            serde_json::to_string(url).map_err(|e| format!("Failed to encode URL: {}", e))?;
        window
            .eval(&format!("window.location.href = {}", url_json))
            .map_err(|e| format!("Navigation failed: {}", e))
    }

    /// Check that a project is open.
    fn require_project(&self) -> Result<(), String> {
        let state = self.app_handle.state::<AppState>();
        if state.current_website_id.lock().unwrap().is_none() {
            return Err(
                "No project open. Use website(action: 'open') or website(action: 'create') first."
                    .into(),
            );
        }
        Ok(())
    }

    /// Execute JS in the webview and return the result.
    async fn eval_js_internal(
        &self,
        js_code: &str,
        timeout_secs: u64,
    ) -> Result<Option<String>, String> {
        let window = self
            .app_handle
            .get_webview_window("main")
            .ok_or_else(|| "No main window".to_string())?;

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

        let js_escaped = serde_json::to_string(js_code)
            .map_err(|e| format!("Failed to escape JS: {}", e))?;

        let wrapped = r#"(async()=>{try{let __r=eval(__JS__);if(__r instanceof Promise)__r=await __r;const __s=(typeof __r==='undefined')?null:(typeof __r==='string')?__r:JSON.stringify(__r);await fetch(window.location.origin+'/eval-callback/__ID__',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({success:true,result:__s})})}catch(__e){await fetch(window.location.origin+'/eval-callback/__ID__',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({success:false,error:__e.message||String(__e)})})}})()"#
            .replace("__JS__", &js_escaped)
            .replace("__ID__", &id.to_string());

        window.eval(&wrapped).map_err(|e| {
            self.pending_evals.lock().unwrap().remove(&id);
            format!("Failed to inject JS: {}", e)
        })?;

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

    /// Helper: run JS in editor, return success CallToolResult.
    async fn run_js(&self, js: &str) -> Result<CallToolResult, McpError> {
        self.require_project().map_err(|e| McpError::internal_error(e, None))?;
        match self.eval_js_internal(js, 10).await {
            Ok(result) => Ok(CallToolResult::success(vec![Content::text(
                result.unwrap_or_else(|| "null".into()),
            )])),
            Err(e) => Ok(tool_error(e)),
        }
    }
}

/// Create an error CallToolResult (is_error = true).
fn tool_error(msg: impl Into<String>) -> CallToolResult {
    CallToolResult {
        content: vec![Content::text(msg.into())],
        structured_content: None,
        is_error: Some(true),
        meta: None,
    }
}

/// Wrap a website API response with selection: null and next_steps.
/// Used for website actions where the editor may not be loaded.
fn wrap_website_response(body: &str, next_steps: &str) -> String {
    let mut parsed: serde_json::Value =
        serde_json::from_str(body).unwrap_or(serde_json::json!({"raw": body}));
    if let Some(obj) = parsed.as_object_mut() {
        obj.insert("selection".into(), serde_json::Value::Null);
        obj.insert("next_steps".into(), serde_json::json!(next_steps));
    }
    parsed.to_string()
}

/// Wrap a JS expression so it returns { result, selection, next_steps }.
fn wrap_with_selection(js_body: &str, next_steps: &str) -> String {
    let next_js = serde_json::to_string(next_steps).unwrap();
    format!(
        r#"(function(){{var e=window.silex.getEditor();var __result__=(function(){{ {body} }})();var __sel__=window.__silexMcp.getSelectionState(e);if(typeof __result__==='string'){{try{{__result__=JSON.parse(__result__)}}catch(ex){{__result__={{raw:__result__}}}}}}if(Array.isArray(__result__)){{__result__={{result:__result__}}}}if(typeof __result__==='object'&&__result__!==null){{__result__.selection=__sel__;if(!__result__.error&&__result__.success!==false)__result__.next_steps={next}}}return JSON.stringify(__result__)}})()"#,
        body = js_body,
        next = next_js
    )
}

// ==========================================================================
// Tool implementations
// ==========================================================================

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

    // ----------------------------------------------------------------------
    // website — list, create, delete, rename, duplicate, open, dashboard
    // ----------------------------------------------------------------------

    #[tool(description = "Manage websites in Silex visual builder (NOT PHP). Actions: list, create, delete, rename, duplicate, open, dashboard. After create/open, use component() to add HTML content.")]
    async fn website(
        &self,
        Parameters(params): Parameters<WebsiteParams>,
    ) -> Result<CallToolResult, McpError> {
        let base_url = self.get_base_url();
        let client = reqwest::Client::new();

        match params.action {
            WebsiteAction::List => {
                let url = format!("{}/api/website", base_url);
                match reqwest::get(&url).await {
                    Ok(resp) => match resp.text().await {
                        Ok(body) => {
                            let wrapped = wrap_website_response(&body, "Use website(action:'open', website_id:'THE_ID') to open, or website(action:'create', name:'My Site') to create.");
                            Ok(CallToolResult::success(vec![Content::text(wrapped)]))
                        }
                        Err(e) => Ok(tool_error(format!("Error reading response: {}", e))),
                    },
                    Err(e) => Ok(tool_error(format!("Error fetching websites: {}", e))),
                }
            }

            WebsiteAction::Create => {
                let url = format!("{}/api/website?connectorId=fs-storage", base_url);
                let body = if let Some(name) = &params.name {
                    serde_json::json!({ "name": name })
                } else {
                    serde_json::json!({})
                };
                match client
                    .put(&url)
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
                                    // Auto-navigate to the new website
                                    if let Some(id) =
                                        serde_json::from_str::<serde_json::Value>(&response_body)
                                            .ok()
                                            .and_then(|v| {
                                                v.get("websiteId")
                                                    .and_then(|id| id.as_str().map(String::from))
                                            })
                                    {
                                        let _ = self
                                            .navigate_to(&format!("{}/?id={}", base_url, id));
                                    }
                                    let wrapped = wrap_website_response(&response_body, "Website created and opened. Next: component(action:'add', html:'<section>...</section>') to add content, then selector(action:'create') and style(action:'set') to style.");
                                    Ok(CallToolResult::success(vec![Content::text(wrapped)]))
                                } else {
                                    Ok(tool_error(format!(
                                        "Error creating website ({}): {}",
                                        status, response_body
                                    )))
                                }
                            }
                            Err(e) => Ok(tool_error(format!("Error reading response: {}", e))),
                        }
                    }
                    Err(e) => Ok(tool_error(format!("Error creating website: {}", e))),
                }
            }

            WebsiteAction::Delete => {
                let wid = params
                    .website_id
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("website_id is required", None))?;
                let url = format!(
                    "{}/api/website?websiteId={}&connectorId=fs-storage",
                    base_url, wid
                );
                match client.delete(&url).send().await {
                    Ok(resp) => {
                        if resp.status().is_success() {
                            let _ = self.navigate_to(&format!("{}/", base_url));
                            let body = format!("{{\"success\":true,\"message\":\"Website '{}' deleted\"}}", wid);
                            let wrapped = wrap_website_response(&body, "Website deleted. Use website(action:'list') to see remaining websites.");
                            Ok(CallToolResult::success(vec![Content::text(wrapped)]))
                        } else {
                            let body = resp.text().await.unwrap_or_default();
                            Ok(tool_error(format!("Error deleting website: {}", body)))
                        }
                    }
                    Err(e) => Ok(tool_error(format!("Error deleting website: {}", e))),
                }
            }

            WebsiteAction::Rename => {
                let wid = params
                    .website_id
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("website_id is required", None))?;
                let name = params
                    .name
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("name is required", None))?;
                let url = format!(
                    "{}/api/website/meta?websiteId={}&connectorId=fs-storage",
                    base_url, wid
                );
                let body = serde_json::json!({ "name": name });
                match client
                    .post(&url)
                    .header("Content-Type", "application/json")
                    .body(body.to_string())
                    .send()
                    .await
                {
                    Ok(resp) => {
                        if resp.status().is_success() {
                            let resp_body = format!("{{\"success\":true,\"message\":\"Renamed to '{}'\"}}", name);
                            let wrapped = wrap_website_response(&resp_body, "Website renamed.");
                            Ok(CallToolResult::success(vec![Content::text(wrapped)]))
                        } else {
                            let body = resp.text().await.unwrap_or_default();
                            Ok(tool_error(format!("Error renaming website: {}", body)))
                        }
                    }
                    Err(e) => Ok(tool_error(format!("Error renaming website: {}", e))),
                }
            }

            WebsiteAction::Duplicate => {
                let wid = params
                    .website_id
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("website_id is required", None))?;
                let url = format!(
                    "{}/api/website/duplicate?websiteId={}&connectorId=fs-storage",
                    base_url, wid
                );
                match client.post(&url).send().await {
                    Ok(resp) => {
                        if resp.status().is_success() {
                            let body = resp.text().await.unwrap_or_default();
                            let wrapped = wrap_website_response(&body, "Website duplicated. Use website(action:'open', website_id:'...') to open the copy.");
                            Ok(CallToolResult::success(vec![Content::text(wrapped)]))
                        } else {
                            let body = resp.text().await.unwrap_or_default();
                            Ok(tool_error(format!("Error duplicating website: {}", body)))
                        }
                    }
                    Err(e) => Ok(tool_error(format!("Error duplicating website: {}", e))),
                }
            }

            WebsiteAction::Open => {
                let wid = params
                    .website_id
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("website_id is required", None))?;
                let nav_url = format!("{}/?id={}", base_url, wid);
                match self.navigate_to(&nav_url) {
                    Ok(_) => {
                        let body = "{\"success\":true,\"message\":\"Website opened in editor\"}";
                        let wrapped = wrap_website_response(body, "Use component(action:'get_tree') to see content, then component(action:'select') to select, selector(action:'list') to see selectors, and style(action:'set') to style.");
                        Ok(CallToolResult::success(vec![Content::text(wrapped)]))
                    }
                    Err(e) => Ok(tool_error(e)),
                }
            }

            WebsiteAction::Dashboard => match self.navigate_to(&format!("{}/", base_url)) {
                Ok(_) => {
                    let body = "{\"success\":true,\"message\":\"Navigated to dashboard\"}";
                    let wrapped = wrap_website_response(body, "Use website(action:'list') to see websites, or website(action:'create', name:'...') to create one.");
                    Ok(CallToolResult::success(vec![Content::text(wrapped)]))
                }
                Err(e) => Ok(tool_error(e)),
            },
        }
    }

    // ----------------------------------------------------------------------
    // page — list, add, select, remove, update_settings
    // ----------------------------------------------------------------------

    #[tool(description = "Manage pages (Level 3). Actions: list, add (name + slug), select (page_id — sets Level 3), remove (page_id), rename (name — renames the currently selected page). Homepage must be named 'index'.")]
    async fn page(
        &self,
        Parameters(params): Parameters<PageParams>,
    ) -> Result<CallToolResult, McpError> {
        match params.action {
            PageAction::List => {
                let js_body = "return window.__silexMcp.listPages(e)";
                let js = wrap_with_selection(js_body, "Use page(action:'select', page_id:'...') to select a page, then component(action:'add') to add content.");
                self.run_js(&js).await
            }

            PageAction::Add => {
                let name = params.name.as_deref().unwrap_or("New Page");
                let name_js = serde_json::to_string(name).unwrap();
                let slug = params.slug.as_deref().unwrap_or(name);
                let slug_js = serde_json::to_string(slug).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.addPage(e,{},{})",
                    name_js, slug_js
                );
                let js = wrap_with_selection(&js_body, "Page created and selected. Use component(action:'add', html:'...') to add content.");
                self.run_js(&js).await
            }

            PageAction::Select => {
                let pid = params.page_id.as_deref().unwrap_or("");
                let pid_js = serde_json::to_string(pid).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.selectPage(e,{})",
                    pid_js
                );
                let js = wrap_with_selection(&js_body, "Page selected. Use component(action:'get_tree') to see content, or component(action:'add') to add content.");
                self.run_js(&js).await
            }

            PageAction::Remove => {
                let pid = params
                    .page_id
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("page_id is required", None))?;
                let pid_js = serde_json::to_string(pid).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.removePage(e,{})",
                    pid_js
                );
                let js = wrap_with_selection(&js_body, "Page removed.");
                self.run_js(&js).await
            }

            PageAction::Rename => {
                let name = params
                    .name
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("name is required", None))?;
                let name_js = serde_json::to_string(name).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.renamePage(e,{})",
                    name_js
                );
                let js = wrap_with_selection(&js_body, "Page renamed.");
                self.run_js(&js).await
            }
        }
    }

    // ----------------------------------------------------------------------
    // component — get_tree, get, add, update, move, remove, select
    // ----------------------------------------------------------------------

    #[tool(description = "Manage visual components. Actions: get_tree (view structure), select (component_id required — sets Level 4), get/update/remove (operate on selected), add (html + position), move (component_id=target + position). Position: 'before'/'after'/'inside' (default) relative to selected component.")]
    async fn component(
        &self,
        Parameters(params): Parameters<ComponentParams>,
    ) -> Result<CallToolResult, McpError> {
        match params.action {
            ComponentAction::GetTree => {
                let depth = params.depth.unwrap_or(2);
                let max = params.max_components.unwrap_or(50);
                let js_body = format!("return window.__silexMcp.getTree(e,{},{})", depth, max);
                let js = wrap_with_selection(&js_body, "Use component(action:'select', component_id:'...') to select a component, then selector(action:'list') to see its selectors.");
                self.run_js(&js).await
            }

            ComponentAction::Get => {
                let js_body = "return window.__silexMcp.getComponent(e)";
                let js = wrap_with_selection(js_body, "Use selector(action:'list') to see selectors, or component(action:'update') to modify.");
                self.run_js(&js).await
            }

            ComponentAction::Add => {
                let html = params
                    .html
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("html is required", None))?;
                let html_js = serde_json::to_string(html).unwrap();
                let pos = params.position.as_deref().unwrap_or("inside");
                let pos_js = serde_json::to_string(pos).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.addComponent(e,{},{})",
                    html_js, pos_js
                );
                let js = wrap_with_selection(&js_body, "Component added and selected. Use selector(action:'create', class_name:'...') to add a class, then selector(action:'select', selector:'.classname') and style(action:'set', css:'...') to style it.");
                self.run_js(&js).await
            }

            ComponentAction::Update => {
                let content_js = params
                    .content
                    .as_ref()
                    .map(|s| serde_json::to_string(s).unwrap())
                    .unwrap_or_else(|| "null".into());
                let attrs_js = params
                    .attributes
                    .as_ref()
                    .map(|v| v.to_string())
                    .unwrap_or_else(|| "null".into());
                let js_body = format!(
                    "return window.__silexMcp.updateComponent(e,{},{})",
                    content_js, attrs_js
                );
                let js = wrap_with_selection(&js_body, "Component updated. Use selector(action:'list') to see selectors for styling.");
                self.run_js(&js).await
            }

            ComponentAction::Move => {
                let target_id = params
                    .component_id
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("component_id (target) is required for move", None))?;
                let target_js = serde_json::to_string(target_id).unwrap();
                let pos = params.position.as_deref().unwrap_or("inside");
                let pos_js = serde_json::to_string(pos).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.moveComponent(e,{},{})",
                    target_js, pos_js
                );
                let js = wrap_with_selection(&js_body, "Component moved.");
                self.run_js(&js).await
            }

            ComponentAction::Remove => {
                let js_body = "return window.__silexMcp.removeComponent(e)";
                let js = wrap_with_selection(js_body, "Component removed.");
                self.run_js(&js).await
            }

            ComponentAction::Select => {
                let cid = params
                    .component_id
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("component_id is required", None))?;
                let cid_js = serde_json::to_string(cid).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.selectComponent(e,{})",
                    cid_js
                );
                let js = wrap_with_selection(&js_body, "Component selected. Use selector(action:'list') to see selectors, or selector(action:'create', class_name:'...') to add a class.");
                self.run_js(&js).await
            }
        }
    }

    // ----------------------------------------------------------------------
    // selector — list, select, create, delete (Level 5)
    // ----------------------------------------------------------------------

    #[tool(description = "Manage CSS selectors on the selected component (Level 5). Actions: list (shows selectors), select (activates a selector for styling — REQUIRED before style()), create (adds a CSS class), delete (removes a CSS class). Always select a component first.")]
    async fn selector(
        &self,
        Parameters(params): Parameters<SelectorParams>,
    ) -> Result<CallToolResult, McpError> {
        match params.action {
            SelectorAction::List => {
                let js_body = "var c=e.getSelected();if(!c)return{error:'No component selected. Use component(action:select) first.'};return window.__silexMcp.listComponentSelectors(e)";
                let js = wrap_with_selection(js_body, "Use selector(action:'select', selector:'.classname') to activate a selector for styling, or selector(action:'create', class_name:'my-class') to add a new class.");
                self.run_js(&js).await
            }

            SelectorAction::Select => {
                let sel = params
                    .selector
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("selector string is required", None))?;
                let sel_js = serde_json::to_string(sel).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.selectSelector(e,{})",
                    sel_js
                );
                let js = wrap_with_selection(&js_body, "Selector activated. Use style(action:'set', css:'...') to apply styles, or style(action:'get') to read current styles.");
                self.run_js(&js).await
            }

            SelectorAction::Create => {
                let class_name = params
                    .class_name
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("class_name is required", None))?;
                let class_js = serde_json::to_string(class_name).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.createSelector(e,{})",
                    class_js
                );
                let js = wrap_with_selection(&js_body, "Class added. Use selector(action:'select', selector:'.classname') to activate it for styling.");
                self.run_js(&js).await
            }

            SelectorAction::Delete => {
                let class_name = params
                    .class_name
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("class_name is required", None))?;
                let class_js = serde_json::to_string(class_name).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.deleteSelector(e,{})",
                    class_js
                );
                let js = wrap_with_selection(&js_body, "Class and associated styles removed.");
                self.run_js(&js).await
            }
        }
    }

    // ----------------------------------------------------------------------
    // style — get, set, delete (operates on active selector)
    // ----------------------------------------------------------------------

    #[tool(description = "Read/write CSS styles on the active selector. REQUIRES selector(action:'select') first. Actions: get (read styles), set (properties object or css string — validated before applying), delete (remove a CSS property).")]
    async fn style(
        &self,
        Parameters(params): Parameters<StyleParams>,
    ) -> Result<CallToolResult, McpError> {
        match params.action {
            StyleAction::Get => {
                let js_body = "return window.__silexMcp.getStyle(e)";
                let js = wrap_with_selection(js_body, "Use style(action:'set', css:'...') to modify styles, or style(action:'delete', property:'...') to remove a property.");
                self.run_js(&js).await
            }

            StyleAction::Set => {
                // Accept either properties object or css string
                let props_source = if let Some(props) = &params.properties {
                    props.to_string()
                } else if let Some(css) = &params.css {
                    let css_js = serde_json::to_string(css).unwrap();
                    format!("window.__silexMcp.parseCssString({})", css_js)
                } else {
                    return Ok(tool_error("Either 'properties' or 'css' is required"));
                };

                let js_body = format!(
                    "return window.__silexMcp.setStyle(e,{})",
                    props_source
                );
                let js = wrap_with_selection(&js_body, "Styles applied. Use take_screenshot to verify, or style(action:'get') to confirm.");
                self.run_js(&js).await
            }

            StyleAction::Delete => {
                let prop = params
                    .property
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("property is required", None))?;
                let prop_js = serde_json::to_string(prop).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.deleteStyleProperty(e,{})",
                    prop_js
                );
                let js = wrap_with_selection(&js_body, "CSS property removed.");
                self.run_js(&js).await
            }
        }
    }

    // ----------------------------------------------------------------------
    // symbol — list, create, place, delete
    // ----------------------------------------------------------------------

    #[tool(description = "Manage reusable symbols (shared header/footer). Actions: list, create (from selected component), insert (relative to selected component using position), delete. Select a component first for create/insert.")]
    async fn symbol(
        &self,
        Parameters(params): Parameters<SymbolParams>,
    ) -> Result<CallToolResult, McpError> {
        match params.action {
            SymbolAction::List => {
                let js_body = "return{symbols:window.__silexMcp.findAllSymbols(e)}";
                let js = wrap_with_selection(js_body, "Use symbol(action:'insert', label:'...') to insert a symbol, or symbol(action:'create', label:'...') to create one from the selected component.");
                self.run_js(&js).await
            }

            SymbolAction::Create => {
                let label = params
                    .label
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("label is required", None))?;
                let label_js = serde_json::to_string(label).unwrap();
                let icon_js = serde_json::to_string(
                    params.icon.as_deref().unwrap_or("fa fa-diamond"),
                )
                .unwrap();
                let js_body = format!(
                    "return window.__silexMcp.createSymbol(e,{},{})",
                    label_js, icon_js
                );
                let js = wrap_with_selection(&js_body, "Symbol created. Use symbol(action:'insert', label:'...') to insert it on other pages.");
                self.run_js(&js).await
            }

            SymbolAction::Insert => {
                let label = params
                    .label
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("label is required", None))?;
                let label_js = serde_json::to_string(label).unwrap();
                let pos = params.position.as_deref().unwrap_or("inside");
                let pos_js = serde_json::to_string(pos).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.insertSymbol(e,{},{})",
                    label_js, pos_js
                );
                let js = wrap_with_selection(&js_body, "Symbol inserted.");
                self.run_js(&js).await
            }

            SymbolAction::Delete => {
                let label = params
                    .label
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("label is required", None))?;
                let label_js = serde_json::to_string(label).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.deleteSymbol(e,{})",
                    label_js
                );
                let js = wrap_with_selection(&js_body, "Symbol deleted.");
                self.run_js(&js).await
            }
        }
    }

    // ----------------------------------------------------------------------
    // device — list, set
    // ----------------------------------------------------------------------

    #[tool(description = "Switch responsive breakpoint (Level 2). Actions: list, set. Use name:'Desktop', 'Tablet', or 'Mobile'. Affects which styles are edited.")]
    async fn device(
        &self,
        Parameters(params): Parameters<DeviceParams>,
    ) -> Result<CallToolResult, McpError> {
        match params.action {
            DeviceAction::List => {
                let js_body = "return window.__silexMcp.listDevices(e)";
                let js = wrap_with_selection(js_body, "Use device(action:'set', name:'Tablet') to switch breakpoint.");
                self.run_js(&js).await
            }

            DeviceAction::Set => {
                let name = params
                    .name
                    .as_deref()
                    .ok_or_else(|| McpError::invalid_params("name is required", None))?;
                let name_js = serde_json::to_string(name).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.setDevice(e,{})",
                    name_js
                );
                let js = wrap_with_selection(&js_body, "Breakpoint changed. Styles set now will apply to this breakpoint.");
                self.run_js(&js).await
            }
        }
    }

    // ----------------------------------------------------------------------
    // settings — get/set with scope (site or page)
    // ----------------------------------------------------------------------

    #[tool(description = "Get or set settings. scope:'site' for site-wide, scope:'page' for the currently selected page. Keys: lang, title, description, favicon, head, og:title, og:description, og:image. Page overrides site (except head which concatenates).")]
    async fn settings(
        &self,
        Parameters(params): Parameters<SettingsParams>,
    ) -> Result<CallToolResult, McpError> {
        let scope = params.scope.as_str();
        if scope != "site" && scope != "page" {
            return Ok(tool_error("scope must be 'site' or 'page'"));
        }
        let scope_js = serde_json::to_string(scope).unwrap();

        match params.action {
            SettingsAction::Get => {
                let js_body = format!(
                    "return window.__silexMcp.getSettings(e,{})",
                    scope_js
                );
                let js = wrap_with_selection(&js_body, "Use settings(action:'set', scope:'...', settings:{...}) to update.");
                self.run_js(&js).await
            }

            SettingsAction::Set => {
                let settings_json = params
                    .settings
                    .as_ref()
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| "{}".into());
                let js_body = format!(
                    "return window.__silexMcp.setSettings(e,{},{})",
                    scope_js, settings_json
                );
                let js = wrap_with_selection(&js_body, "Settings updated.");
                self.run_js(&js).await
            }
        }
    }

    // ----------------------------------------------------------------------
    // block — list, insert
    // ----------------------------------------------------------------------

    #[tool(description = "Browse and insert pre-built blocks (templates). Actions: list (returns all registered blocks with id, label, category), insert (block_id + position relative to selected component).")]
    async fn block(
        &self,
        Parameters(params): Parameters<BlockParams>,
    ) -> Result<CallToolResult, McpError> {
        match params.action {
            BlockAction::List => {
                let js_body = "return window.__silexMcp.listBlocks(e)";
                let js = wrap_with_selection(js_body, "Use block(action:'insert', block_id:'...') to insert a block.");
                self.run_js(&js).await
            }

            BlockAction::Insert => {
                let block_id = params.block_id.as_deref()
                    .ok_or_else(|| McpError::invalid_params("block_id is required", None))?;
                let bid_js = serde_json::to_string(block_id).unwrap();
                let pos = params.position.as_deref().unwrap_or("inside");
                let pos_js = serde_json::to_string(pos).unwrap();
                let js_body = format!(
                    "return window.__silexMcp.insertBlock(e,{},{})",
                    bid_js, pos_js
                );
                let js = wrap_with_selection(&js_body, "Block inserted. Use selector(action:'create', class_name:'...') to add a class, then style it.");
                self.run_js(&js).await
            }
        }
    }

    // ----------------------------------------------------------------------
    // data_source — list, preview
    // ----------------------------------------------------------------------

    #[tool(description = "Discover CMS data sources (optional, only if configured). Actions: list (returns sources, types, fields, queryables), preview (toggle live data preview on canvas with enabled:true/false).")]
    async fn data_source(
        &self,
        Parameters(params): Parameters<DataSourceParams>,
    ) -> Result<CallToolResult, McpError> {
        match params.action {
            DataSourceAction::List => {
                let js_body = "return window.__silexMcp.listDataSources(e)";
                let js = wrap_with_selection(js_body, "Use state(action:'set', type:'content', expression:'source.field') to bind data to the selected component.");
                self.run_js(&js).await
            }

            DataSourceAction::Preview => {
                let enabled = params.enabled.unwrap_or(true);
                let cmd = if enabled {
                    "data-source:preview:activate"
                } else {
                    "data-source:preview:deactivate"
                };
                let cmd_js = serde_json::to_string(cmd).unwrap();
                let js_body = format!(
                    "e.runCommand({});return{{success:true,preview:{}}}",
                    cmd_js, enabled
                );
                let js = wrap_with_selection(&js_body, "Data preview toggled.");
                self.run_js(&js).await
            }
        }
    }

    // ----------------------------------------------------------------------
    // state — list, set, remove (operates on selected component)
    // ----------------------------------------------------------------------

    #[tool(description = "Manage CMS data states on the selected component. Actions: list (shows public + private states), set (type: 'content'/'loop'/'condition'/'attribute'/'expose' + expression in dot-notation), remove (state_id + exported flag). Select a component first.")]
    async fn state(
        &self,
        Parameters(params): Parameters<StateParams>,
    ) -> Result<CallToolResult, McpError> {
        match params.action {
            StateAction::List => {
                let js_body = "var c=e.getSelected();if(!c)return{error:'No component selected'};return{public_states:c.get('publicStates')??[],private_states:c.get('privateStates')??[]}";
                let js = wrap_with_selection(js_body, "Use state(action:'set', type:'content', expression:'source.field') to bind data, or state(action:'remove', state_id:'...') to remove.");
                self.run_js(&js).await
            }

            StateAction::Set => {
                let state_type = params.state_type.as_deref()
                    .ok_or_else(|| McpError::invalid_params("type is required (content, loop, condition, attribute, expose)", None))?;

                match state_type {
                    "content" => {
                        let expr = params.expression.as_deref()
                            .ok_or_else(|| McpError::invalid_params("expression is required", None))?;
                        let expr_js = serde_json::to_string(expr).unwrap();
                        let js_body = format!(
                            "var c=e.getSelected();if(!c)return{{error:'No component selected'}};var tokens=window.__silexMcp.resolveExpression(e,{expr});if(tokens.error)return tokens;window.__silexMcp.setState(c,'innerHTML',{{expression:tokens}},false);return{{success:true,state_id:'innerHTML'}}",
                            expr = expr_js
                        );
                        let js = wrap_with_selection(&js_body, "Content bound to data.");
                        self.run_js(&js).await
                    }
                    "loop" => {
                        let expr = params.expression.as_deref()
                            .ok_or_else(|| McpError::invalid_params("expression is required", None))?;
                        let expr_js = serde_json::to_string(expr).unwrap();
                        let js_body = format!(
                            "var c=e.getSelected();if(!c)return{{error:'No component selected'}};var tokens=window.__silexMcp.resolveExpression(e,{expr});if(tokens.error)return tokens;window.__silexMcp.setState(c,'__data',{{expression:tokens}},false);return{{success:true,state_id:'__data'}}",
                            expr = expr_js
                        );
                        let js = wrap_with_selection(&js_body, "Loop set on component.");
                        self.run_js(&js).await
                    }
                    "condition" => {
                        let expr = params.expression.as_deref()
                            .ok_or_else(|| McpError::invalid_params("expression is required", None))?;
                        let op = params.operator.as_deref().unwrap_or("truthy");
                        let expr_js = serde_json::to_string(expr).unwrap();
                        let op_js = serde_json::to_string(op).unwrap();
                        let js_body = format!(
                            "var c=e.getSelected();if(!c)return{{error:'No component selected'}};var tokens=window.__silexMcp.resolveExpression(e,{expr});if(tokens.error)return tokens;c.set('conditionOperator',{op});window.__silexMcp.setState(c,'condition',{{expression:tokens}},false);return{{success:true,state_id:'condition'}}",
                            expr = expr_js, op = op_js
                        );
                        let js = wrap_with_selection(&js_body, "Condition set on component.");
                        self.run_js(&js).await
                    }
                    "attribute" => {
                        let name = params.name.as_deref()
                            .ok_or_else(|| McpError::invalid_params("name is required for attribute", None))?;
                        let value = params.value.as_deref().unwrap_or("");
                        let name_js = serde_json::to_string(name).unwrap();
                        let value_js = serde_json::to_string(value).unwrap();
                        let js_body = format!(
                            "var c=e.getSelected();if(!c)return{{error:'No component selected'}};var stateId=window.__silexMcp.getOrCreatePersistantId(c)+'-attr-'+{name}.replace(/[^a-zA-Z0-9]/g,'_');window.__silexMcp.setState(c,stateId,{{label:{name},expression:[{{type:'property',propType:'field',fieldId:'fixed',kind:'scalar',label:'Fixed value',typeIds:['String'],options:{{value:{value}}}}}]}},false);return{{success:true,attribute:{name},value:{value}}}",
                            name = name_js, value = value_js
                        );
                        let js = wrap_with_selection(&js_body, "Attribute set on component.");
                        self.run_js(&js).await
                    }
                    "expose" => {
                        let expr = params.expression.as_deref()
                            .ok_or_else(|| McpError::invalid_params("expression is required", None))?;
                        let state_id = params.state_id.as_deref()
                            .ok_or_else(|| McpError::invalid_params("state_id is required for expose", None))?;
                        let label = params.label.as_deref().unwrap_or(state_id);
                        let expr_js = serde_json::to_string(expr).unwrap();
                        let sid_js = serde_json::to_string(state_id).unwrap();
                        let label_js = serde_json::to_string(label).unwrap();
                        let js_body = format!(
                            "var c=e.getSelected();if(!c)return{{error:'No component selected'}};var tokens=window.__silexMcp.resolveExpression(e,{expr});if(tokens.error)return tokens;window.__silexMcp.setState(c,{sid},{{label:{label},hidden:false,expression:tokens}},true);return{{success:true,state_id:{sid}}}",
                            expr = expr_js, sid = sid_js, label = label_js
                        );
                        let js = wrap_with_selection(&js_body, "Data exposed as public state.");
                        self.run_js(&js).await
                    }
                    _ => Ok(tool_error(format!("Unknown state type: '{}'. Use content, loop, condition, attribute, or expose.", state_type))),
                }
            }

            StateAction::Remove => {
                let state_id = params.state_id.as_deref()
                    .ok_or_else(|| McpError::invalid_params("state_id is required", None))?;
                let exported = params.exported.unwrap_or(false);
                let sid_js = serde_json::to_string(state_id).unwrap();
                let js_body = format!(
                    "var c=e.getSelected();if(!c)return{{error:'No component selected'}};window.__silexMcp.removeState(c,{sid},{exported});return{{success:true,removed:{sid}}}",
                    sid = sid_js, exported = exported
                );
                let js = wrap_with_selection(&js_body, "State removed from component.");
                self.run_js(&js).await
            }
        }
    }

    // ----------------------------------------------------------------------
    // history — undo, redo
    // ----------------------------------------------------------------------

    #[tool(description = "Undo or redo changes. Autosave is active — no manual save needed.")]
    async fn history(
        &self,
        Parameters(params): Parameters<HistoryParams>,
    ) -> Result<CallToolResult, McpError> {
        let js_body = match params.action {
            HistoryAction::Undo => "e.UndoManager.undo();return{success:true,action:'undo'}",
            HistoryAction::Redo => "e.UndoManager.redo();return{success:true,action:'redo'}",
        };
        let js = wrap_with_selection(js_body, "Change applied.");
        self.run_js(&js).await
    }

    // ----------------------------------------------------------------------
    // eval_js — escape hatch
    // ----------------------------------------------------------------------

    #[tool(description = "Execute JavaScript in the editor webview. Escape hatch for advanced operations. Access the editor with window.silex.getEditor(). Prefer using the other tools instead.")]
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
            Err(error) => Ok(tool_error(error)),
        }
    }

    // ----------------------------------------------------------------------
    // take_screenshot
    // ----------------------------------------------------------------------

    #[tool(description = "Take a screenshot to verify your work. target:'ui' for editor, 'canvas' for website preview.")]
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
            Ok(None) => return Ok(tool_error("Screenshot returned no data")),
            Err(e) => return Ok(tool_error(format!("Screenshot failed: {}", e))),
        };

        let base64_prefix = "data:image/png;base64,";
        let base64_data = if data_url.starts_with(base64_prefix) {
            &data_url[base64_prefix.len()..]
        } else {
            return Ok(tool_error("Unexpected data URL format"));
        };

        let png_bytes = match base64::engine::general_purpose::STANDARD.decode(base64_data) {
            Ok(bytes) => bytes,
            Err(e) => return Ok(tool_error(format!("Failed to decode base64: {}", e))),
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
            Err(e) => Ok(tool_error(format!("Failed to write file: {}", e))),
        }
    }

}

// ==========================================================================
// Eval callback handler
// ==========================================================================

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

// ==========================================================================
// ServerHandler — instructions for LLMs
// ==========================================================================

#[tool_handler]
impl ServerHandler for SilexMcp {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            protocol_version: ProtocolVersion::V_2024_11_05,
            capabilities: ServerCapabilities::builder().enable_tools().build(),
            server_info: Implementation::from_build_env(),
            instructions: Some(
                r#"Silex Desktop MCP — controls the Silex no-code visual website builder.

WORKFLOW: website(open/create) → device(set) → page(select) → component(add/select) → selector(create/select) → style(set) → take_screenshot

HIERARCHY (the level system):
  Website → Breakpoint → Page → Component → Selector
  Select each level before operating on deeper levels.
  Every tool operates on the currently selected level.

RULES:
- BEM class names. No inline styles. No CSS Grid (use Flexbox).
- Homepage page name must be "index". Internal links start with "./".
- Autosave is active — no manual save needed.
- block(list) to see available templates, block(insert) to add them.
- state() for CMS data bindings on selected component. data_source(list) to discover available fields first.
- settings(scope:'site') for site-wide, settings(scope:'page') for the selected page.
- history(undo/redo) to undo/redo changes.
"#
                .into(),
            ),
        }
    }
}

// ==========================================================================
// Server entry point
// ==========================================================================

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

    let router = axum::Router::new().nest_service("/mcp", mcp_service);

    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], port));
    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(l) => l,
        Err(e) => {
            tracing::warn!("MCP HTTP port {} unavailable ({}), skipping", port, e);
            return;
        }
    };
    let addr = listener.local_addr().unwrap();
    tracing::info!("MCP server listening on http://{}/mcp", addr);

    tokio::spawn(async move {
        axum::serve(listener, router).await.unwrap();
    });
}

pub async fn start_mcp_stdio(
    app_handle: tauri::AppHandle,
    pending_evals: PendingEvals,
) {
    let eval_counter = Arc::new(AtomicU64::new(0));
    let service = SilexMcp::new(app_handle, pending_evals, eval_counter);
    tracing::info!("MCP stdio transport starting");
    match service.serve(rmcp::transport::io::stdio()).await {
        Ok(server) => {
            let _ = server.waiting().await;
            tracing::info!("MCP stdio transport closed");
        }
        Err(e) => {
            tracing::warn!("MCP stdio not available (launched without stdin?): {}", e);
        }
    }
}
