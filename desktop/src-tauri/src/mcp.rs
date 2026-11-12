/*
 * Silex website builder - desktop app.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

/*
 * MCP (Model Context Protocol) server for Silex Desktop.
 *
 * Static tools: website, screenshot.
 * Editor tools: loaded from the grapesjs-ai-capabilities registry once a
 * website is open, one tool per family of capabilities. A call is routed by
 * its action to the editor command of that capability, through eval_js.
 * A family named like a static tool adds its actions to it.
 */

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

use rmcp::handler::server::router::tool::{ToolRoute, ToolRouter};
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::*;
use rmcp::service::RequestContext;
use rmcp::transport::streamable_http_server::session::local::LocalSessionManager;
use rmcp::transport::streamable_http_server::StreamableHttpService;
use rmcp::{tool, tool_router, ErrorData as McpError, RoleServer, ServerHandler, ServiceExt};
use serde::Deserialize;
use tauri::Manager;
use tokio::sync::oneshot;

use crate::held::held;
use crate::AppState;

// ==========================================================================
// Shared state
// ==========================================================================

/// Pending eval results — shared between MCP tools and the HTTP callback handler.
pub type PendingEvals = Arc<std::sync::Mutex<HashMap<u64, oneshot::Sender<String>>>>;

/// Replaced as a whole when a website opens, so that a running call keeps its own
type DynamicTools = Arc<tokio::sync::RwLock<Arc<ToolRouter<SilexMcp>>>>;
type ToolsOf = Arc<std::sync::Mutex<Option<String>>>;
type SeenSelection = Arc<std::sync::Mutex<Option<serde_json::Value>>>;

/// Forgets an eval whatever ends the wait: answer, timeout or failure
struct PendingEval<'a> {
    evals: &'a PendingEvals,
    id: u64,
}

impl<'a> PendingEval<'a> {
    fn register(evals: &'a PendingEvals, id: u64) -> (Self, oneshot::Receiver<String>) {
        let (tx, rx) = oneshot::channel::<String>();
        held(evals).insert(id, tx);
        (Self { evals, id }, rx)
    }
}

impl Drop for PendingEval<'_> {
    fn drop(&mut self) {
        held(self.evals).remove(&self.id);
    }
}

/// Files named by an agent, fetched once by the editor at /mcp-file/{token}/{name}, so
/// that nothing in the editor can read a path of the disk by itself
pub type LocalFiles = Arc<std::sync::Mutex<HashMap<String, Vec<u8>>>>;

/// Forgets the files of a call when it ends, fetched or not
struct CallFiles<'a> {
    files: &'a LocalFiles,
    tokens: Vec<String>,
}

impl Drop for CallFiles<'_> {
    fn drop(&mut self) {
        let mut files = held(self.files);
        for token in &self.tokens {
            files.remove(token);
        }
    }
}

fn read_file(path: &str) -> Result<(String, Vec<u8>), String> {
    let path = std::path::Path::new(path);
    if !path.is_absolute() {
        return Err(format!(
            "path must be absolute, like /home/me/logo.svg: {}",
            path.display()
        ));
    }
    let unreadable = |e: std::io::Error| format!("Can not read {}: {e}", path.display());
    // Opening a named pipe would wait for a writer forever
    if !std::fs::metadata(path).map_err(unreadable)?.is_file() {
        return Err(format!("{} is not a file.", path.display()));
    }
    let content = std::fs::read(path).map_err(unreadable)?;
    let name = path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned();
    Ok((name, content))
}

// ==========================================================================
// Action enums (static tools only)
// ==========================================================================

#[derive(Debug, Deserialize)]
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

// ==========================================================================
// Parameter structs (static tools only)
// ==========================================================================

#[derive(Debug, Deserialize)]
pub struct WebsiteParams {
    pub action: WebsiteAction,
    pub website_id: Option<String>,
    pub name: Option<String>,
}

fn website_schema() -> Arc<JsonObject> {
    flat_schema(serde_json::json!({
        "type": "object",
        "required": ["action"],
        "properties": {
            "action": {
                "type": "string",
                "enum": ["list", "create", "open", "rename", "duplicate", "delete", "dashboard"],
                "description": "list: the websites. create: a new website, opened. open: open a website, the other tools work on it. rename: change its name. duplicate: a copy, opened. delete: delete a website. dashboard: close the website and go back to the website list."
            },
            "website_id": {"type": "string", "description": "open/rename/duplicate/delete: website id from list"},
            "name": {"type": "string", "description": "create/rename: website name"}
        }
    }))
}

fn screenshot_schema() -> Arc<JsonObject> {
    flat_schema(serde_json::json!({
        "type": "object",
        "properties": {
            "target": {"type": "string", "enum": ["canvas", "ui"], "description": "canvas: the website (default). ui: the whole editor"}
        }
    }))
}

fn flat_schema(schema: serde_json::Value) -> Arc<JsonObject> {
    match schema {
        serde_json::Value::Object(map) => Arc::new(map),
        _ => Arc::new(JsonObject::new()),
    }
}

#[derive(Debug, Default, Clone, Copy, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ScreenshotTarget {
    #[default]
    Canvas,
    Ui,
}

impl ScreenshotTarget {
    fn as_str(self) -> &'static str {
        match self {
            Self::Ui => "ui",
            Self::Canvas => "canvas",
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct ScreenshotParams {
    pub target: Option<ScreenshotTarget>,
}

// ==========================================================================
// SilexMcp struct
// ==========================================================================

#[derive(Clone)]
pub struct SilexMcp {
    /// Static tools (website, screenshot) generated by #[tool_router].
    tool_router: ToolRouter<Self>,
    /// Editor tools loaded from the grapesjs-ai-capabilities JS registry.
    dynamic_tools: DynamicTools,
    /// The website the editor tools were loaded from
    tools_of: ToolsOf,
    app_handle: tauri::AppHandle,
    eval_counter: Arc<AtomicU64>,
    pending_evals: PendingEvals,
    local_files: LocalFiles,
    /// The last selection the clients were told about. Shared: a client that
    /// sends its protocol version with each request gets a new service each time
    seen_selection: SeenSelection,
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

    /// `made` is what `create` or `duplicate` did: the website they made opens, as the
    /// user would expect
    async fn open_in_editor(&self, base_url: &str, id: &str, made: Option<&str>) -> CallToolResult {
        let opened = reqwest::Url::parse_with_params(&format!("{}/", base_url), &[("id", id)])
            .map_err(|e| e.to_string())
            .and_then(|url| self.navigate_to(url.as_str()));
        if let Err(e) = opened {
            return tool_error(match made {
                Some(made) => format!("Website '{}' {} but could not be opened: {}", id, made, e),
                None => e,
            });
        }
        match self.load_capabilities().await {
            Ok(n) => tracing::info!("Loaded {} capabilities after opening the website", n),
            Err(e) => tracing::warn!("Failed to load capabilities: {}", e),
        }
        let message = match made {
            Some(made) => format!("Website {} and opened in editor", made),
            None => "Website opened in editor".to_string(),
        };
        CallToolResult::success(vec![ContentBlock::text(
            serde_json::json!({
                "success": true,
                "website_id": id,
                "message": message,
            })
            .to_string(),
        )])
    }

    /// The dashboard forgets the website only once loaded: until then, the
    /// `list_tools` that follows the notification would poll for editor tools for 30s.
    async fn forget_website(&self) {
        *self.dynamic_tools.write().await = Arc::new(ToolRouter::new());
        *held(&self.tools_of) = None;
        crate::clear_current_project(self.app_handle.clone());
    }

    fn open_website(&self) -> Option<String> {
        held(&self.app_handle.state::<AppState>().current_website_id).clone()
    }

    fn is_open_with_tools(&self, website_id: &str) -> bool {
        self.tools_loaded() && self.open_website().as_deref() == Some(website_id)
    }

    fn tools_loaded(&self) -> bool {
        let open = self.open_website();
        open.is_some() && *held(&self.tools_of) == open
    }

    /// Check that a project is open.
    fn require_project(&self) -> Result<(), String> {
        let state = self.app_handle.state::<AppState>();
        if held(&state.current_website_id).is_none() {
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
                    "Editor not available — still on dashboard. Open or create a project first."
                        .to_string(),
                );
            }
        }

        let id = self.eval_counter.fetch_add(1, Ordering::Relaxed);
        let (_pending, rx) = PendingEval::register(&self.pending_evals, id);

        // The code goes in the script itself: the editor's CSP refuses eval(),
        // and what Tauri runs here is not subject to it
        let wrapped = r#"(async()=>{try{let __r=(__JS__
);if(__r instanceof Promise)__r=await __r;const __s=(typeof __r==='undefined')?null:(typeof __r==='string')?__r:JSON.stringify(__r);await fetch(window.location.origin+'/eval-callback/__ID__',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({success:true,result:__s})})}catch(__e){await fetch(window.location.origin+'/eval-callback/__ID__',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({success:false,error:__e.message||String(__e)})})}})()"#
            .replace("__ID__", &id.to_string())
            .replace("__JS__", js_code);

        window
            .eval(&wrapped)
            .map_err(|e| format!("Failed to inject JS: {}", e))?;

        let raw = tokio::time::timeout(std::time::Duration::from_secs(timeout_secs), rx)
            .await
            .map_err(|_| format!("The editor did not answer within {timeout_secs}s."))?
            .map_err(|_| {
                "Internal error: JS callback channel closed unexpectedly. Retry the operation."
                    .to_string()
            })?;

        #[derive(Deserialize)]
        struct JsResult {
            success: bool,
            result: Option<String>,
            error: Option<String>,
        }

        let parsed: JsResult =
            serde_json::from_str(&raw).map_err(|e| format!("Failed to parse JS result: {}", e))?;

        if parsed.success {
            Ok(parsed.result)
        } else {
            Err(parsed.error.unwrap_or_else(|| "Unknown JS error".into()))
        }
    }

    // ======================================================================
    // Dynamic capability loading
    // ======================================================================

    /// Called after a website is opened/created and the editor is ready.
    async fn load_capabilities(&self) -> Result<usize, String> {
        // The registry function exists early, but capabilities are registered
        // after the editor 'load' event fires 'ai-capabilities:ready'.
        let mut raw = "[]".to_string();
        let mut last_error = None;
        for _ in 0..60 {
            let js = "JSON.stringify(window.__silexMcp?.getTools?.() || [])";
            match self.eval_js_internal(js, 3).await {
                Ok(Some(val)) if val != "[]" && val.len() > 2 => {
                    raw = val;
                    last_error = None;
                    break;
                }
                Ok(_) => {}
                Err(e) => last_error = Some(e),
            }
            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        }
        if raw == "[]" {
            return Err(format!(
                "Editor capabilities not available after 30s{}",
                last_error.map(|e| format!(": {e}")).unwrap_or_default()
            ));
        }

        let families: Vec<FamilyDef> = serde_json::from_str(&raw)
            .map_err(|e| format!("Failed to parse capabilities: {}", e))?;

        let count = families.len();
        let mut router = ToolRouter::new();
        for family in families {
            router.add_route(family.into_route());
        }

        *self.dynamic_tools.write().await = Arc::new(router);
        *held(&self.tools_of) = self.open_website();

        tracing::info!("Loaded {} editor tools", count);
        Ok(count)
    }

    async fn run_action(
        &self,
        tool: &str,
        actions: &HashMap<String, ActionDef>,
        arguments: Option<JsonObject>,
    ) -> Result<CallToolResult, McpError> {
        let arguments = arguments.unwrap_or_default();
        let name = arguments.get("action").and_then(|a| a.as_str());
        let Some((name, action)) = name.and_then(|n| actions.get_key_value(n)) else {
            let mut names: Vec<&str> = actions.keys().map(String::as_str).collect();
            names.sort_unstable();
            return Ok(tool_error(format!(
                "Set action to one of: {}. Nothing was changed.",
                names.join(", ")
            )));
        };
        let missing: Vec<&str> = action
            .required
            .iter()
            .filter(|key| arguments.get(*key).is_none_or(|v| v.is_null()))
            .map(String::as_str)
            .collect();
        if !missing.is_empty() {
            return Ok(tool_error(format!(
                "{tool}(action:'{name}') needs {}. Nothing was changed.",
                missing.join(", ")
            )));
        }
        let mut params: JsonObject = action
            .parameters
            .iter()
            .filter_map(|key| Some((key.clone(), arguments.get(key)?.clone())))
            .collect();

        if let Err(e) = self.require_project() {
            return Ok(tool_error(e));
        }
        let mut call_files = CallFiles {
            files: &self.local_files,
            tokens: Vec::new(),
        };
        for key in &action.files {
            let Some(path) = params.get(key).and_then(|v| v.as_str()).map(str::to_string) else {
                continue;
            };
            let (name, content) = match tokio::task::spawn_blocking(move || read_file(&path)).await
            {
                Ok(Ok(file)) => file,
                Ok(Err(why)) => return Ok(tool_error(format!("{why} Nothing was changed."))),
                Err(e) => return Ok(tool_error(format!("Could not read the file: {e}"))),
            };
            let token = uuid::Uuid::new_v4().to_string();
            let mut url = reqwest::Url::parse("http://localhost/mcp-file/").expect("valid URL");
            url.path_segments_mut()
                .expect("URL with a path")
                .pop_if_empty()
                .push(&token)
                .push(&name);
            params.insert(key.clone(), url.path().into());
            held(&self.local_files).insert(token.clone(), content);
            call_files.tokens.push(token);
        }

        let js = COMMAND_JS
            .replace(
                "__CMD__",
                &serde_json::Value::from(action.command.as_str()).to_string(),
            )
            .replace(
                "__PARAMS__",
                &serde_json::Value::from(serde_json::Value::Object(params).to_string()).to_string(),
            );

        // A command that queries a remote server (a CMS schema) can take far more than 10 s
        let timeout_secs = if action.open_world { 45 } else { 10 };
        // Kept until the editor answers even if the call is cancelled: the
        // command goes on running there
        Ok(match self.eval_js_internal(&js, timeout_secs).await {
            Ok(raw) => self.command_answer(raw.as_deref().unwrap_or("{}")),
            Err(e) => tool_error(e),
        })
    }

    /// The selection goes with an answer when the clients have not seen it yet: after
    /// a tool changed it, or after the user did in the editor.
    /// Repeated on every call, it was most of what the tools returned.
    fn selection_news(
        &self,
        selection: &serde_json::Value,
        always: bool,
    ) -> Option<serde_json::Value> {
        if selection.is_null() {
            return None;
        }
        let mut seen = held(&self.seen_selection);
        if !always && seen.as_ref() == Some(selection) {
            return None;
        }
        *seen = Some(selection.clone());
        Some(selection.clone())
    }

    /// A text answer stays text, with the selection on a last line
    fn command_answer(&self, raw: &str) -> CallToolResult {
        let answer: CommandAnswer = match serde_json::from_str(raw) {
            Ok(answer) => answer,
            Err(e) => return tool_error(format!("Failed to parse the editor answer: {e}")),
        };
        if let Some(error) = answer.error {
            let mut body = serde_json::json!({ "error": error });
            if let Some(selection) = self.selection_news(&answer.selection, true) {
                body["selection"] = selection;
            }
            return CallToolResult::error(vec![ContentBlock::text(body.to_string())]);
        }
        let mut result = answer.result;
        if let serde_json::Value::String(text) = &result {
            match serde_json::from_str::<serde_json::Value>(text) {
                Ok(parsed) => result = parsed,
                Err(_) => {
                    let text = match self.selection_news(&answer.selection, false) {
                        Some(selection) => format!("{text}\nselection: {selection}"),
                        None => text.clone(),
                    };
                    return CallToolResult::success(vec![ContentBlock::text(text)]);
                }
            }
        }
        let failed = result.get("error").is_some_and(|e| !e.is_null())
            || result.get("success") == Some(&serde_json::Value::Bool(false));
        let mut body = match result {
            serde_json::Value::Object(map) => map,
            serde_json::Value::Null => JsonObject::new(),
            other => JsonObject::from_iter([("result".to_string(), other)]),
        };
        if let Some(selection) = self.selection_news(&answer.selection, failed) {
            body.insert("selection".into(), selection);
        }
        let content = vec![ContentBlock::text(
            serde_json::Value::Object(body).to_string(),
        )];
        if failed {
            CallToolResult::error(content)
        } else {
            CallToolResult::success(content)
        }
    }

    /// Says which website is open, and what is selected in it: the user may have
    /// chosen an element before asking the agent to change it
    async fn website_list(&self, body: &str) -> CallToolResult {
        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct Listed {
            website_id: String,
            #[serde(default)]
            name: String,
            updated_at: Option<String>,
        }
        let listed = match serde_json::from_str::<Vec<Listed>>(body) {
            Ok(listed) => listed,
            Err(e) => return tool_error(format!("Unexpected website list ({e}): {body}")),
        };
        let open = self.open_website();
        let websites: Vec<serde_json::Value> = listed
            .into_iter()
            .map(|site| {
                let mut entry =
                    serde_json::json!({"website_id": site.website_id, "name": site.name});
                if let Some(updated) = site.updated_at {
                    entry["updatedAt"] = updated.into();
                }
                if open.as_deref() == Some(site.website_id.as_str()) {
                    entry["open"] = true.into();
                }
                entry
            })
            .collect();
        let mut answer = serde_json::json!({ "websites": websites });
        if let Some(selection) = self.current_selection().await {
            answer["selection"] = selection;
        }
        CallToolResult::success(vec![ContentBlock::text(answer.to_string())])
    }

    /// The selection of the open website, always given by the calls an agent starts with
    async fn current_selection(&self) -> Option<serde_json::Value> {
        self.require_project().ok()?;
        let selection = match self.eval_js_internal(SELECTION_JS, 3).await {
            Ok(Some(raw)) => serde_json::from_str(&raw).map_err(|e| e.to_string()),
            Ok(None) => Err("no answer".to_string()),
            Err(e) => Err(e),
        };
        match selection {
            Ok(selection) => self.selection_news(&selection, true),
            Err(e) => {
                tracing::warn!("Could not read the selection: {}", e);
                None
            }
        }
    }
}

/// An editor tool, as grapesjs-ai-capabilities' getTools() describes it
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FamilyDef {
    name: String,
    description: String,
    input_schema: JsonObject,
    read_only: bool,
    destructive: bool,
    idempotent: bool,
    open_world: bool,
    actions: HashMap<String, ActionDef>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ActionDef {
    command: String,
    parameters: Vec<String>,
    required: Vec<String>,
    open_world: bool,
    files: Vec<String>,
}

impl FamilyDef {
    fn into_route(self) -> ToolRoute<SilexMcp> {
        let mut annotations = ToolAnnotations::new();
        annotations.read_only_hint = Some(self.read_only);
        annotations.destructive_hint = (!self.read_only).then_some(self.destructive);
        annotations.idempotent_hint = Some(self.idempotent);
        annotations.open_world_hint = Some(self.open_world);
        let tool = Tool::new(
            self.name.clone(),
            self.description,
            Arc::new(self.input_schema),
        )
        .with_annotations(annotations);
        let name = Arc::new(self.name);
        let actions = Arc::new(self.actions);
        ToolRoute::new_dyn(tool, move |ctx| {
            let name = name.clone();
            let actions = actions.clone();
            Box::pin(async move {
                let mcp: &SilexMcp = ctx.service;
                mcp.run_action(&name, &actions, ctx.arguments)
                    .await
                    .map(Into::into)
            })
        })
    }
}

/// A static tool with the actions an editor family of the same name adds to it.
/// Annotated for the riskiest action of both.
fn merge_family(base: &Tool, family: &Tool) -> Tool {
    let mut schema = (*base.input_schema).clone();
    if let (Some(serde_json::Value::Object(props)), Some(serde_json::Value::Object(extra))) = (
        schema.get_mut("properties"),
        family.input_schema.get("properties"),
    ) {
        for (key, value) in extra {
            match (key.as_str(), props.get_mut(key)) {
                ("action", Some(serde_json::Value::Object(action))) => {
                    if let (Some(serde_json::Value::Array(all)), Some(more)) = (
                        action.get_mut("enum"),
                        value.get("enum").and_then(|e| e.as_array()),
                    ) {
                        for name in more {
                            if !all.contains(name) {
                                all.push(name.clone());
                            }
                        }
                    }
                    let described = [action.get("description"), value.get("description")]
                        .into_iter()
                        .flatten()
                        .filter_map(|d| d.as_str())
                        .collect::<Vec<_>>()
                        .join(" ");
                    action.insert("description".into(), described.into());
                }
                (_, None) => {
                    props.insert(key.clone(), value.clone());
                }
                _ => {}
            }
        }
    }
    let hint = |tool: &Tool, get: fn(&ToolAnnotations) -> Option<bool>| {
        tool.annotations.as_ref().and_then(get)
    };
    let mut annotations = ToolAnnotations::new();
    annotations.read_only_hint = Some(
        hint(base, |a| a.read_only_hint) == Some(true)
            && hint(family, |a| a.read_only_hint) == Some(true),
    );
    annotations.destructive_hint = Some(
        hint(base, |a| a.destructive_hint) != Some(false)
            || hint(family, |a| a.destructive_hint) == Some(true),
    );
    annotations.idempotent_hint = Some(
        hint(base, |a| a.idempotent_hint) == Some(true)
            && hint(family, |a| a.idempotent_hint) == Some(true),
    );
    annotations.open_world_hint = Some(
        hint(base, |a| a.open_world_hint) != Some(false)
            || hint(family, |a| a.open_world_hint) == Some(true),
    );
    let mut tool = base.clone();
    tool.input_schema = Arc::new(schema);
    tool.annotations = Some(annotations);
    tool
}

fn declared_actions(tool: &Tool) -> Option<Vec<&str>> {
    let actions = tool
        .input_schema
        .get("properties")?
        .get("action")?
        .get("enum")?
        .as_array()?;
    Some(actions.iter().filter_map(|a| a.as_str()).collect())
}

/// The editor answers with the selection after the command, success or not
const COMMAND_JS: &str = r#"(async function(){
var e=window.silex.getEditor();
var selection=function(){try{return window.__silexMcp.getSelectionState(e)}catch(ex){console.error(ex);return null}};
var result;
try{if(!e.Commands.has(__CMD__))throw new Error('Unknown editor command '+__CMD__);result=await e.runCommand(__CMD__,JSON.parse(__PARAMS__))}
catch(ex){return JSON.stringify({error:ex.message||String(ex),selection:selection()})}
return JSON.stringify({result:typeof result==='undefined'?null:result,selection:selection()});
})()"#;

const SELECTION_JS: &str =
    "JSON.stringify(window.__silexMcp.getSelectionState(window.silex.getEditor()))";

#[derive(Deserialize)]
struct CommandAnswer {
    #[serde(default)]
    result: serde_json::Value,
    error: Option<String>,
    #[serde(default)]
    selection: serde_json::Value,
}

fn new_website_id(body: &str) -> Option<String> {
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct NewWebsite {
        website_id: String,
    }
    serde_json::from_str::<NewWebsite>(body)
        .ok()
        .map(|made| made.website_id)
}

fn needs<'a>(
    value: &'a Option<String>,
    tool: &str,
    action: &str,
    key: &str,
) -> Result<&'a str, CallToolResult> {
    value.as_deref().filter(|v| !v.is_empty()).ok_or_else(|| {
        tool_error(format!(
            "{tool}(action:'{action}') needs {key}. Nothing was changed."
        ))
    })
}

/// Create an error CallToolResult (is_error = true).
fn tool_error(msg: impl Into<String>) -> CallToolResult {
    CallToolResult::error(vec![ContentBlock::text(msg.into())])
}

// ==========================================================================
// Static tool implementations
// ==========================================================================

/// Sentry puts no Drop on its own spans, and one that is never finished is
/// never sent
struct ToolSpan {
    span: Option<sentry::TransactionOrSpan>,
    answered: bool,
}

impl ToolSpan {
    /// One per tool call, with only values chosen by Silex or the name of the client:
    /// never the arguments, an error message, nor anything else of the website
    fn start(tool: &str, action: Option<&str>, client: Option<&str>) -> Self {
        let tx_ctx = sentry::TransactionContext::new(&format!("mcp/{}", tool), "mcp.tool");
        let transaction = sentry::start_transaction(tx_ctx);
        if let Some(action) = action {
            transaction.set_tag("action", action);
        }
        if let Some(client) = client {
            transaction.set_tag("client", client.chars().take(64).collect::<String>());
        }
        Self {
            span: Some(transaction.into()),
            answered: false,
        }
    }

    fn answers(&mut self, result: &Result<CallToolResponse, McpError>) {
        self.answered = true;
        let Some(span) = &self.span else { return };
        let outcome = match result {
            Ok(CallToolResponse::Complete(call)) => {
                let bytes: usize = call
                    .content
                    .iter()
                    .map(|block| {
                        block
                            .as_text()
                            .map(|text| text.text.len())
                            .unwrap_or_default()
                            + block
                                .as_image()
                                .map(|image| image.data.len())
                                .unwrap_or_default()
                    })
                    .sum();
                span.set_data("response_bytes", bytes.into());
                if call.is_error == Some(true) {
                    "tool_error"
                } else {
                    "ok"
                }
            }
            Ok(CallToolResponse::InputRequired(_)) => "input_required",
            Ok(_) => "task",
            Err(e) => {
                span.set_data("error_code", e.code.0.into());
                "protocol_error"
            }
        };
        span.set_tag("outcome", outcome);
        if matches!(outcome, "tool_error" | "protocol_error") {
            span.set_status(sentry::protocol::SpanStatus::InternalError);
        }
    }
}

impl Drop for ToolSpan {
    fn drop(&mut self) {
        if let Some(span) = self.span.take() {
            if !self.answered {
                span.set_tag("outcome", "cancelled");
                span.set_status(sentry::protocol::SpanStatus::Cancelled);
            }
            span.finish();
        }
    }
}

#[tool_router]
impl SilexMcp {
    pub fn new(
        app_handle: tauri::AppHandle,
        pending_evals: PendingEvals,
        local_files: LocalFiles,
        eval_counter: Arc<AtomicU64>,
        dynamic_tools: DynamicTools,
        tools_of: ToolsOf,
        seen_selection: SeenSelection,
    ) -> Self {
        Self {
            tool_router: Self::tool_router(),
            dynamic_tools,
            tools_of,
            app_handle,
            eval_counter,
            pending_evals,
            local_files,
            seen_selection,
        }
    }

    #[tool(
        description = "Websites in Silex, a visual website builder. Once a website is open, the editor tools are in the tool list.",
        input_schema = website_schema(),
        annotations(read_only_hint = false, destructive_hint = true, open_world_hint = false)
    )]
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
                        Ok(body) => Ok(self.website_list(&body).await),
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
                                    let Some(id) = new_website_id(&response_body) else {
                                        return Ok(tool_error(format!(
                                            "Unexpected server answer: {response_body}"
                                        )));
                                    };
                                    Ok(self.open_in_editor(&base_url, &id, Some("created")).await)
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
                let wid = match needs(&params.website_id, "website", "delete", "website_id") {
                    Ok(wid) => wid,
                    Err(missing) => return Ok(missing),
                };
                let url = format!(
                    "{}/api/website?websiteId={}&connectorId=fs-storage",
                    base_url, wid
                );
                match client.delete(&url).send().await {
                    Ok(resp) => {
                        if resp.status().is_success() {
                            let was_open = self.open_website().as_deref() == Some(wid);
                            if was_open && self.navigate_to(&format!("{}/", base_url)).is_ok() {
                                self.forget_website().await;
                            }
                            Ok(CallToolResult::success(vec![ContentBlock::text(format!(
                                "{{\"success\":true,\"message\":\"Website '{}' deleted\"}}",
                                wid
                            ))]))
                        } else {
                            let body = resp.text().await.unwrap_or_default();
                            Ok(tool_error(format!("Error deleting website: {}", body)))
                        }
                    }
                    Err(e) => Ok(tool_error(format!("Error deleting website: {}", e))),
                }
            }

            WebsiteAction::Rename => {
                let wid = match needs(&params.website_id, "website", "rename", "website_id") {
                    Ok(wid) => wid,
                    Err(missing) => return Ok(missing),
                };
                let name = match needs(&params.name, "website", "rename", "name") {
                    Ok(name) => name,
                    Err(missing) => return Ok(missing),
                };
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
                            Ok(CallToolResult::success(vec![ContentBlock::text(format!(
                                "{{\"success\":true,\"message\":\"Renamed to '{}'\"}}",
                                name
                            ))]))
                        } else {
                            let body = resp.text().await.unwrap_or_default();
                            Ok(tool_error(format!("Error renaming website: {}", body)))
                        }
                    }
                    Err(e) => Ok(tool_error(format!("Error renaming website: {}", e))),
                }
            }

            WebsiteAction::Duplicate => {
                let wid = match needs(&params.website_id, "website", "duplicate", "website_id") {
                    Ok(wid) => wid,
                    Err(missing) => return Ok(missing),
                };
                let url = format!(
                    "{}/api/website/duplicate?websiteId={}&connectorId=fs-storage",
                    base_url, wid
                );
                match client.post(&url).send().await {
                    Ok(resp) => {
                        let status = resp.status();
                        match resp.text().await {
                            Ok(body) if status.is_success() => {
                                let Some(copy_id) = new_website_id(&body) else {
                                    return Ok(tool_error(format!(
                                        "Unexpected server answer: {body}"
                                    )));
                                };
                                Ok(self
                                    .open_in_editor(&base_url, &copy_id, Some("duplicated"))
                                    .await)
                            }
                            Ok(body) => Ok(tool_error(format!(
                                "Error duplicating website ({}): {}",
                                status, body
                            ))),
                            Err(e) => Ok(tool_error(format!("Error reading response: {}", e))),
                        }
                    }
                    Err(e) => Ok(tool_error(format!("Error duplicating website: {}", e))),
                }
            }

            WebsiteAction::Open => {
                let wid = match needs(&params.website_id, "website", "open", "website_id") {
                    Ok(wid) => wid,
                    Err(missing) => return Ok(missing),
                };
                // Opening it again would reload the editor and lose what the user selected
                if self.is_open_with_tools(wid) {
                    let mut body =
                        serde_json::json!({"success": true, "message": "Website already open"});
                    if let Some(selection) = self.current_selection().await {
                        body["selection"] = selection;
                    }
                    return Ok(CallToolResult::success(vec![ContentBlock::text(
                        body.to_string(),
                    )]));
                }
                Ok(self.open_in_editor(&base_url, wid, None).await)
            }

            WebsiteAction::Dashboard => match self.navigate_to(&format!("{}/", base_url)) {
                Ok(_) => {
                    self.forget_website().await;
                    Ok(CallToolResult::success(vec![ContentBlock::text(
                        "{\"success\":true,\"message\":\"Navigated to dashboard\"}",
                    )]))
                }
                Err(e) => Ok(tool_error(e)),
            },
        }
    }

    #[tool(
        description = "Take a screenshot of the website (canvas, default) or of the whole editor (ui). Use it after visual changes to verify your work.",
        input_schema = screenshot_schema(),
        annotations(read_only_hint = true)
    )]
    async fn screenshot(
        &self,
        Parameters(params): Parameters<ScreenshotParams>,
    ) -> Result<CallToolResult, McpError> {
        let target = params.target.unwrap_or_default().as_str();
        let Some(html2canvas) = crate::frontend::html2canvas() else {
            return Ok(tool_error(
                "Screenshot failed: html2canvas is not in the dashboard build",
            ));
        };
        let html2canvas = serde_json::to_string(&html2canvas).unwrap_or_default();

        let screenshot_js = r#"
(async function() {
    const { default: html2canvas } = await import(__HTML2CANVAS__);
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
        .replace("__TARGET__", target)
        .replace("__HTML2CANVAS__", &html2canvas);

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

        let content = vec![ContentBlock::image(base64_data.to_string(), "image/png")];

        Ok(CallToolResult::success(content))
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
    if let Some(tx) = held(&pending).remove(&id) {
        let _ = tx.send(body);
    }
    "ok"
}

pub async fn local_file(
    axum::extract::Extension(files): axum::extract::Extension<LocalFiles>,
    axum::extract::Path((token, _name)): axum::extract::Path<(String, String)>,
) -> Result<Vec<u8>, axum::http::StatusCode> {
    held(&files)
        .remove(&token)
        .ok_or(axum::http::StatusCode::NOT_FOUND)
}

// ==========================================================================
// ServerHandler — manual impl to merge static + dynamic tools
// ==========================================================================

impl ServerHandler for SilexMcp {
    fn get_info(&self) -> ServerConfig {
        ServerConfig::new(
            ServerCapabilities::builder()
                .enable_tools()
                .enable_tool_list_changed()
                .build(),
        )
        .with_protocol_version(ProtocolVersion::V_2024_11_05)
        .with_instructions(
            r#"Silex Desktop MCP: controls Silex, a visual website builder.

START: website(action:'list') lists the websites and says which one is open. website(action:'open') or (action:'create') opens one, then the editor tools appear.

SELECTION: website > page > breakpoint > element > selector. Choose each level before the next one.
An answer shows the selection (a "selection" object, or a last line "selection: ...") only when it is new to you or the call failed.
breakpoint(action:'select') chooses the breakpoint that styles are written for.

TO STYLE: one style(action:'set', element_id, selector, css) with all the CSS; the selector must match the element (for a new class, element(action:'update', add_class) first).

IDS: element(action:'insert') returns the new ids in "created": use them, no need to list. Creating one element or page selects it.

CMS: cms(action:'add', source:'wp', url:'https://.../graphql') connects a GraphQL API and lists its collections. To repeat a card: keep one card, remove its copies, element(action:'bind', element_id:'<card>', bind_to:'loop', path:'wp.posts(first: 3).nodes'); the answer lists the item fields. Then for each child: element(action:'bind', element_id:'<child>', bind_to:'content', path:'item.title'), or bind_to:'attribute', attribute:'href', path:'item.link'.

RULES:
- Use BEM class names. No inline styles. No CSS Grid (use Flexbox).
- The page with no name is the homepage. Internal links start with "./".
- Autosave is on.
- After visual changes, use screenshot to verify your work.
"#,
        )
    }

    fn list_tools(
        &self,
        _request: Option<PaginatedRequestParams>,
        _context: RequestContext<RoleServer>,
    ) -> impl std::future::Future<Output = Result<ListToolsResult, McpError>> + Send + '_ {
        async move {
            // Eagerly load capabilities if a project is open but caps haven't loaded yet
            if !self.tools_loaded() && self.require_project().is_ok() {
                if let Err(e) = self.load_capabilities().await {
                    tracing::warn!("[list_tools] Failed to load capabilities: {}", e);
                }
            }
            let dynamic = self.dynamic_tools.read().await;
            let mut tools: Vec<Tool> = self
                .tool_router
                .list_all()
                .into_iter()
                .map(|tool| match dynamic.get(&tool.name) {
                    Some(family) => merge_family(&tool, family),
                    None => tool,
                })
                .collect();
            tools.extend(
                dynamic
                    .list_all()
                    .into_iter()
                    .filter(|tool| self.tool_router.get(&tool.name).is_none()),
            );
            tracing::info!(
                "[list_tools] {:?}",
                tools.iter().map(|t| t.name.as_ref()).collect::<Vec<_>>()
            );
            Ok(ListToolsResult::with_all_items(tools))
        }
    }

    fn call_tool(
        &self,
        request: CallToolRequestParams,
        context: RequestContext<RoleServer>,
    ) -> impl std::future::Future<Output = Result<CallToolResponse, McpError>> + Send + '_ {
        async move {
            let known = self.get_tool(&request.name);
            let tool = known.as_ref().map_or("unknown", |tool| tool.name.as_ref());
            let action = known.as_ref().and_then(|tool| known_action(tool, &request));
            let client = context
                .peer
                .peer_info()
                .map(|info| info.client_info.name.clone());
            let mut span = ToolSpan::start(tool, action.as_deref(), client.as_deref());
            let cancelled = context.ct.clone();
            let result = self.route_call(request, context).await;
            if cancelled.is_cancelled() {
                // The client never gets this answer, nor the selection in it
                *held(&self.seen_selection) = None;
            } else {
                span.answers(&result);
            }
            result
        }
    }

    fn get_tool(&self, name: &str) -> Option<Tool> {
        let dynamic = self.dynamic_tools.try_read().ok();
        let family = dynamic.as_ref().and_then(|tools| tools.get(name));
        match (self.tool_router.get(name), family) {
            (Some(base), Some(family)) => Some(merge_family(base, family)),
            (Some(base), None) => Some(base.clone()),
            (None, family) => family.cloned(),
        }
    }
}

impl SilexMcp {
    async fn route_call(
        &self,
        request: CallToolRequestParams,
        context: RequestContext<RoleServer>,
    ) -> Result<CallToolResponse, McpError> {
        // Not under the lock: a long call would keep load_capabilities waiting
        let dynamic = {
            let tools = self.dynamic_tools.read().await;
            tools.has_route(&request.name).then(|| Arc::clone(&tools))
        };
        let action = request
            .arguments
            .as_ref()
            .and_then(|args| args.get("action"))
            .and_then(|action| action.as_str());
        let route = route(
            self.tool_router.get(&request.name),
            dynamic.as_ref().and_then(|tools| tools.get(&request.name)),
            action,
        );
        match (route, dynamic) {
            (Route::WrongAction, _) => {
                let all = self
                    .get_tool(&request.name)
                    .and_then(|tool| declared_actions(&tool).map(|actions| actions.join(", ")))
                    .unwrap_or_default();
                Ok(tool_error(format!("Set action to one of: {all}. Nothing was changed.")).into())
            }
            (Route::Static, _) => {
                let before = Arc::clone(&*self.dynamic_tools.read().await);
                let peer = context.peer.clone();
                let tool_ctx =
                    rmcp::handler::server::tool::ToolCallContext::new(self, request, context);
                let result = self.tool_router.call(tool_ctx).await;
                if !Arc::ptr_eq(&before, &*self.dynamic_tools.read().await) {
                    if let Err(e) = peer.notify_tool_list_changed().await {
                        tracing::warn!("Failed to send tools/list_changed: {}", e);
                    }
                }
                result
            }
            (Route::Family, Some(dynamic)) => {
                let tool_ctx =
                    rmcp::handler::server::tool::ToolCallContext::new(self, request, context);
                dynamic.call(tool_ctx).await
            }
            (Route::Family | Route::NotFound, _) => Err(McpError::invalid_params(
                format!(
                    "Tool '{}' not found. The editor tools are only available while a website is open.",
                    request.name
                ),
                None,
            )),
        }
    }
}

enum Route {
    Static,
    Family,
    WrongAction,
    NotFound,
}

/// Which half serves a call: the static tool, or the editor family of the same name
fn route(static_tool: Option<&Tool>, family: Option<&Tool>, action: Option<&str>) -> Route {
    let declares = |tool: &Tool| {
        declared_actions(tool).is_none_or(|actions| action.is_some_and(|a| actions.contains(&a)))
    };
    let in_family = family
        .and_then(declared_actions)
        .zip(action)
        .is_some_and(|(actions, action)| actions.contains(&action));
    match static_tool {
        Some(tool) if family.is_none() || declares(tool) => Route::Static,
        Some(_) if in_family => Route::Family,
        Some(_) => Route::WrongAction,
        None if family.is_some() => Route::Family,
        None => Route::NotFound,
    }
}

/// The action of a call, when it is one the tool declares: a free value could
/// be anything of the website
fn known_action(tool: &Tool, request: &CallToolRequestParams) -> Option<String> {
    let args = request.arguments.as_ref()?;
    if tool.name.as_ref() == "screenshot" {
        let target = args.get("target").cloned().unwrap_or_default();
        let target = if target.is_null() {
            ScreenshotTarget::default()
        } else {
            serde_json::from_value::<ScreenshotTarget>(target).ok()?
        };
        return Some(target.as_str().to_string());
    }
    let action = args.get("action")?.as_str()?;
    declared_actions(tool)?
        .contains(&action)
        .then(|| action.to_string())
}

// ==========================================================================
// Server entry point
// ==========================================================================

/// State shared by every MCP session: the dynamic tools loaded from the page
/// have to survive a session, otherwise they would be lost on website open.
fn shared_state() -> (Arc<AtomicU64>, DynamicTools, ToolsOf, SeenSelection) {
    (
        Arc::new(AtomicU64::new(0)),
        Arc::new(tokio::sync::RwLock::new(Arc::new(ToolRouter::new()))),
        Default::default(),
        Default::default(),
    )
}

pub async fn start_mcp_server(
    app_handle: tauri::AppHandle,
    pending_evals: PendingEvals,
    local_files: LocalFiles,
    port: u16,
) {
    let (eval_counter, dynamic_tools, tools_of, seen_selection) = shared_state();

    let mcp_service = StreamableHttpService::new(
        move || {
            Ok(SilexMcp::new(
                app_handle.clone(),
                pending_evals.clone(),
                local_files.clone(),
                eval_counter.clone(),
                dynamic_tools.clone(),
                tools_of.clone(),
                seen_selection.clone(),
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
    local_files: LocalFiles,
) {
    let (eval_counter, dynamic_tools, tools_of, seen_selection) = shared_state();
    let service = SilexMcp::new(
        app_handle,
        pending_evals,
        local_files,
        eval_counter,
        dynamic_tools,
        tools_of,
        seen_selection,
    );
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
