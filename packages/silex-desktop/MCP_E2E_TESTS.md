# MCP Tools Redesign Plan

## Context

The current MCP server (`src-tauri/src/mcp.rs`) exposes 11 tools. Almost all
real work (building pages, styling, CMS binding, symbols, etc.) requires the LLM
to write raw JavaScript via `eval_js`, which is error-prone, consumes context
with a 180-line instruction prompt, and has no server-side validation.

This plan proposes replacing most `eval_js` usage with purpose-built tools while
keeping `eval_js` as an escape hatch. The design must work well with **small
local LLMs (7B-13B params)**, not just frontier models.

Sources reviewed:
- `src-tauri/src/mcp.rs` (current implementation)
- `src-tauri/src/main.rs` (Tauri app, state, bridge setup)
- `src-tauri/scripts/desktop-bridge.js` (webview bridge)
- Agent prompts: silex-designer, silex-cloner, silex-content-writer,
  silex-wordpress, silex-devops, silex-developer, vision-analyst
- Command prompts: silex-site-create, silex-site-edit, silex-site-clone,
  silex-cms-flow-a, silex-cms-flow-b

---

## 1. Bugs to Fix

### 1.1 Bridge missing event listeners
`trigger_menu` emits `menu-undo`, `menu-redo`, `menu-close-project` but
`desktop-bridge.js` only listens for `menu-save`. Undo/redo/close are silently
dropped.

**Fix**: Add listeners in `desktop-bridge.js`:
```js
listen("menu-undo", function () { editor.UndoManager.undo(); });
listen("menu-redo", function () { editor.UndoManager.redo(); });
listen("menu-close-project", function () { window.location.href = '/'; });
```

### 1.2 Errors reported as success
Every tool returns `CallToolResult::success(...)` even on failure. MCP clients
cannot programmatically distinguish success from error.

**Fix**: Return `CallToolResult { content, is_error: true }` on failures.

### 1.3 `get_page_html` returns editor DOM, not website content
`document.documentElement.outerHTML` captures the Silex editor UI, not the
website being built. Useless for the cloner and QA workflows.

**Fix**: Replace with `editor.getHtml()` + `editor.getCss()` to get the actual
website output.

### 1.4 `navigate` has JS injection risk
URL is interpolated into `window.location.href = '...'` with minimal escaping.

**Fix**: Use Tauri's webview navigation API (`window.navigate()` or
`WebviewWindow::navigate()`) instead of eval.

### 1.5 `take_screenshot` depends on external CDN
html2canvas is loaded from `cdnjs.cloudflare.com` at runtime. Fragile (offline,
CDN down, CSP) and cross-origin iframe capture is unreliable.

**Fix**: Use Tauri's native `WebviewWindow::capture()` for UI screenshots.
For canvas screenshots, eval `editor.runCommand('export-template')` or capture
the iframe via Tauri APIs.

### 1.6 addRules vs setRule contradiction
The designer agent prompt says `cssComposer.addRules()`. The MCP server
instructions say `CssComposer.setRule()` and "NEVER use addRules()". One of
these is wrong.

**Fix**: Decide which is correct and align all prompts + the `style` tool.

---

## 2. Design Principles for Small Local LLMs

These principles shape every tool decision below. They come from prompt-engineer
analysis of what 7B-13B parameter models need.

### 2.1 Keep tool count under 20

Small LLMs degrade sharply in tool selection accuracy past ~15-20 tools. Each
tool definition costs 100-300 tokens of schema. 45 tools = 5,000-13,000 tokens
injected into every request, consuming 25-50% of a typical 8K-16K context
window.

**Solution**: Merge related tools using `action` enum parameters. Instead of 5
page tools, one `page(action: "list" | "add" | "select" | ...)`. An enum with
5-6 values is far easier than picking 1 tool out of 45.

### 2.2 Accept HTML strings for components, not JSON trees

LLMs are much better at generating HTML than nested GrapesJS component JSON.
The server parses HTML into components.

```
// Instead of complex nested JSON:
component(action: "add", html: '<section class="hero"><h1 class="hero__title">Hello</h1></section>')
```

### 2.3 Accept dot-notation for CMS expressions, not token arrays

Instead of 10-line token arrays with `type`, `propType`, `dataSourceId`,
`fieldId`, `typeIds`, `kind`, `label`, accept a dot-path string. The server
resolves it against the data source schema.

```
// Instead of:
expression: [
  { type: 'property', propType: 'field', dataSourceId: 'wordpress',
    fieldId: 'posts', typeIds: ['PostConnection'], kind: 'list', label: 'posts' },
  { type: 'property', propType: 'field', fieldId: 'title',
    typeIds: ['String'], kind: 'scalar', label: 'title' }
]

// Accept:
expression: "wordpress.posts.title"
```

### 2.4 Accept CSS strings as alternative to property objects

```
// Either of these should work:
style(selector: ".hero__title", properties: { "font-size": "2rem", "color": "#333" })
style(selector: ".hero__title", css: "font-size: 2rem; color: #333;")
```

### 2.5 Cap all tool output sizes

- `component(action: "get_tree")`: default `max_components: 50`, return compact
  summary (`id | tag | classes | child_count`), not full JSON
- `style(action: "get")`: always require a `selector` — no "dump everything"
- `get_html_css`: return one page at a time with a size limit, or structural
  summary by default
- `list_websites`, `cms(action: "list_sources")`: return only essential fields

### 2.6 Server-side validation with corrective errors

Small LLMs make more mistakes. Tools should catch common errors and return
actionable corrections:

- Missing `.` prefix on selector → auto-correct to `.hero-title`, note in
  response
- Inline `style` attributes in HTML → strip them, return warning: "Inline
  styles removed. Use the style tool with BEM classes instead."
- Invalid expression path (e.g. `wordpress.posts.nonexistent_field`) → return
  list of valid fields for that type
- Tool called with no project open → return: "No project open. Call
  `website(action: 'open', website_id: '...')` first." with available IDs

### 2.7 Minimize instruction prompt (40-60 bulleted lines)

- Bullet list format, not prose paragraphs
- 3 most critical rules first (workflow order, HTML for components, BEM classes)
- No code examples (tools encapsulate the API)
- No documentation URLs (small models can't fetch them and will hallucinate)
- If the model needs reference data, it should call a tool (e.g.
  `cms(action: "list_sources")` returns the schema)

### 2.8 Dynamic tool loading based on editor state

Expose only the tools relevant to the current context:

- **Dashboard** (no project open): `get_app_state`, `website`, `take_screenshot`
  (3 tools)
- **Editor** (project open, no CMS): core editing tools (~12 tools)
- **Editor + CMS** (data sources configured): add CMS tools (~15 tools)

This keeps any single turn's tool set under 15. The MCP spec supports dynamic
`tools/list`. If dynamic loading is too complex, the merged-tools approach
(section 3) is the pragmatic alternative.

### 2.9 Stateless tool design (minimize multi-step dependencies)

Small LLMs are bad at maintaining state across turns.

- `symbol(action: "create")` should accept inline `html` instead of requiring
  a pre-existing `component_id`
- `symbol(action: "place")` should accept `page_ids: [...]` (plural) to place
  on multiple pages in one call
- CMS binding should do discovery + binding in one call: the server resolves
  `"wordpress.posts.title"` internally, the LLM never holds the raw schema

### 2.10 Consistent tool naming

Use merged tools with `action` parameter — one tool per noun, no near-homonyms:
- `component(action: "get_tree")` not `get_components`
- `style(action: "get")` not `get_styles`
- `site_settings(action: "get")` not `get_site_settings`

---

## 3. Merged Tool Design (~15 tools)

Based on the small-LLM principles, here is the consolidated tool set.

### 3.1 `get_app_state` (keep)
Returns window title, URL, project info, unsaved-changes flag.

### 3.2 `website`
Merges: list_websites, create_website, delete_website, rename_website,
duplicate_website, open_website, go_to_dashboard.

| Param | Type | Description |
|-------|------|-------------|
| `action` | `"list" \| "create" \| "delete" \| "rename" \| "duplicate" \| "open" \| "dashboard"` | Required |
| `website_id` | string? | Required for delete, rename, duplicate, open |
| `name` | string? | Required for create, rename |

### 3.3 `page`
Merges: list_pages, add_page, select_page, remove_page, update_page_settings.

| Param | Type | Description |
|-------|------|-------------|
| `action` | `"list" \| "add" \| "select" \| "remove" \| "update_settings"` | Required |
| `page_id` | string? | For select, remove, update_settings (omit = current) |
| `name` | string? | For add |
| `slug` | string? | For add |
| `settings` | object? | For update_settings: `{ title, lang, description, head, ... }` |

### 3.4 `component`
Merges: get_components, get_component, add_component, add_components,
update_component, move_component, remove_component, select_component.

| Param | Type | Description |
|-------|------|-------------|
| `action` | `"get_tree" \| "get" \| "add" \| "update" \| "move" \| "remove" \| "select"` | Required |
| `component_id` | string? | For get, update, move, remove, select |
| `parent_id` | string? | For add, move (omit = wrapper) |
| `html` | string? | For add: HTML string, server parses into components |
| `content` | string? | For update: new text content |
| `classes` | string? | For update: space-separated class names |
| `attributes` | object? | For update: standard HTML attrs `{ href, src, alt, ... }` |
| `at` | number? | For add, move: insertion index |
| `depth` | number? | For get_tree: default 2 |
| `max_components` | number? | For get_tree: default 50 |

**Server-side behavior for `add`**:
- Parses the `html` string into GrapesJS components
- Auto-sets `type: 'text'` + `editable: true` on text-containing elements
- Strips inline `style` attributes with a warning
- Returns the created component IDs

### 3.5 `style`
Merges: set_style, set_styles_batch, get_styles.

| Param | Type | Description |
|-------|------|-------------|
| `action` | `"get" \| "set" \| "set_batch"` | Required |
| `selector` | string? | Required for get and set |
| `properties` | object? | For set: `{ "font-size": "2rem", ... }` |
| `css` | string? | For set: alternative CSS string `"font-size: 2rem; color: #333;"` |
| `device` | string? | For set: "Desktop" (default), "Tablet", "Mobile" |
| `rules` | array? | For set_batch: `[{ selector, properties?, css?, device? }, ...]` |

**Server-side behavior**:
- Auto-prepends `.` if selector doesn't start with `.` or `#`
- Validates BEM naming (warning, not error)
- `css` string is parsed into property object internally

### 3.6 `symbol`
Merges: list_symbols, create_symbol, place_symbol.

| Param | Type | Description |
|-------|------|-------------|
| `action` | `"list" \| "create" \| "place"` | Required |
| `label` | string? | For create, place |
| `component_id` | string? | For create: convert existing component |
| `html` | string? | For create: alternative to component_id, creates from HTML |
| `icon` | string? | For create |
| `page_ids` | array? | For place: place on multiple pages at once |
| `at` | number? | For place: insertion index |

### 3.7 `device`
Merges: set_device, get_devices.

| Param | Type | Description |
|-------|------|-------------|
| `action` | `"list" \| "set"` | Required |
| `name` | string? | For set: "Desktop", "Tablet", "Mobile" |

### 3.8 `site_settings`
Merges: get_site_settings, set_site_settings.

| Param | Type | Description |
|-------|------|-------------|
| `action` | `"get" \| "set"` | Required |
| `settings` | object? | For set: `{ lang, title, description, favicon, head, "og:title", ... }` |

### 3.9 `cms`
Merges: list_data_sources, bind_content, set_condition, set_loop, expose_data,
set_custom_attribute, set_component_states, refresh_preview.

| Param | Type | Description |
|-------|------|-------------|
| `action` | `"list_sources" \| "bind_content" \| "set_condition" \| "set_loop" \| "expose_data" \| "set_attribute" \| "set_states" \| "refresh_preview"` | Required |
| `component_id` | string? | For all bind/set actions |
| `expression` | string? | Dot-notation path: `"wordpress.posts.title"`. Server resolves to full token array |
| `operator` | string? | For set_condition: "truthy", "==", "!=", etc. |
| `name` | string? | For set_attribute: attribute name (e.g. "data-section") |
| `value` | string? | For set_attribute: attribute value |
| `id` | string? | For expose_data: state ID |
| `label` | string? | For expose_data: display label |
| `public_states` | array? | For set_states: full state arrays (power-user escape hatch) |
| `private_states` | array? | For set_states: full state arrays (power-user escape hatch) |

**Dot-notation expression resolution** (server-side):
1. Parse `"wordpress.posts.title"` → segments `["wordpress", "posts", "title"]`
2. Look up `"wordpress"` in DataSourceManager → get data source
3. Walk field path: `"posts"` → find type info (typeIds, kind) → `"title"` →
   find type info
4. Build full token array with correct `type`, `propType`, `dataSourceId`,
   `fieldId`, `typeIds`, `kind`, `label`
5. If any segment is invalid, return error with list of valid options at that
   level

### 3.10 `editor`
Merges: save, undo, redo.

| Param | Type | Description |
|-------|------|-------------|
| `action` | `"save" \| "undo" \| "redo"` | Required |

### 3.11 `eval_js` (keep)
Escape hatch for anything not covered by other tools.

| Param | Type | Description |
|-------|------|-------------|
| `js` | string | JavaScript code to execute |
| `output_file` | string? | Save result to file instead of returning |

### 3.12 `take_screenshot` (keep, rewrite internals)
Uses native Tauri capture instead of html2canvas CDN.

| Param | Type | Description |
|-------|------|-------------|
| `target` | string? | "ui" (default) or "canvas" |
| `output_file` | string? | File path for PNG |

### 3.13 `get_html_css` (replaces get_page_html)
Returns actual website HTML + CSS via `editor.getHtml()` / `editor.getCss()`.

| Param | Type | Description |
|-------|------|-------------|
| `page_id` | string? | Specific page (omit = current) |
| `summary` | boolean? | If true, return structural summary only (default for small output) |

### 3.14 `report_limitation`
Feedback tool for LLMs to report missing capabilities.

| Param | Type | Description |
|-------|------|-------------|
| `description` | string | What's missing |
| `context` | string? | What the LLM was trying to do |
| `workaround` | string? | Any workaround found |

**Behavior:**
1. Logs to `~/.silex/limitation-reports.jsonl` with timestamp
2. Returns message with link:
   `https://roadmap.silex.me/posts/65/vibe-coding-with-silex-desktop`

**Total: 14 tools** (vs current 11, vs previous plan's 45)

---

## 4. Tool Exposure by Context (Dynamic Loading)

If dynamic `tools/list` is implemented:

| Context | Tools exposed | Count |
|---------|---------------|-------|
| Dashboard (no project open) | `get_app_state`, `website`, `take_screenshot`, `report_limitation` | 4 |
| Editor (no CMS) | All except `cms` | 13 |
| Editor + CMS | All 14 | 14 |

If dynamic loading is not implemented, all 14 are always exposed — still within
the safe range for small LLMs.

---

## 5. Instruction Prompt (~45 lines)

The `get_info()` instructions should follow this structure:

```
Silex Desktop MCP — controls the Silex no-code website builder (GrapesJS).

## Workflow
- Call `get_app_state` first to check if a project is open
- Use `website(action: "open")` to open a project, or `website(action: "create")` for a new one
- Build pages with `component(action: "add", html: "...")` — use HTML strings
- Style with `style(action: "set", selector: ".class", css: "...")` — BEM classes only
- Save with `editor(action: "save")`
- Verify with `take_screenshot`

## Rules
- Components: pass HTML strings to `component(action: "add", html: "...")`
- Styling: BEM classes + `style` tool only. No inline styles, no element IDs
- Layout: Flexbox only, no CSS Grid
- Responsive: use `device(action: "set")` for Desktop/Tablet/Mobile
- Text elements must have type="text" and editable=true (auto-set by server)
- Homepage must be named `index`
- Internal links must start with "./"
- Accessibility: WCAG 2.1 AA contrast, semantic HTML, alt text
- CMS expressions: use dot-notation ("wordpress.posts.title"), server resolves
- Custom attributes: use `cms(action: "set_attribute")`, not HTML attributes
- If something is missing, call `report_limitation`

## CMS (if applicable)
- `cms(action: "list_sources")` to discover data sources and fields
- `cms(action: "bind_content", expression: "source.path.field")` for content
- `cms(action: "set_loop", expression: "source.collection")` for loops
- `cms(action: "set_condition", expression: "...", operator: "truthy")` for visibility
```

---

## 6. Bugs to Fix (unchanged from original)

See section 1. These should be fixed regardless of which tool design is chosen.

---

## 7. Implementation Order

Phase 1 — Bug fixes (no new tools):
1. Fix bridge event listeners (1.1)
2. Fix error handling across all tools (1.2)
3. Fix `get_page_html` → `get_html_css` (1.3)
4. Fix `navigate` injection (1.4)
5. Fix `take_screenshot` to use native capture (1.5)
6. Resolve addRules vs setRule contradiction (1.6)

Phase 2 — Merged core tools:
1. `website` (merges 7 website management actions)
2. `editor` (merges save/undo/redo)
3. `page` (merges 5 page actions)
4. `component` with HTML string input (merges 8 component actions)
5. `style` with CSS string support (merges 3 style actions)
6. `device` (merges 2 device actions)
7. `site_settings` (merges 2 settings actions)
8. `get_html_css` (replaces get_page_html)

Phase 3 — Symbols + CMS:
1. `symbol` (merges 3 symbol actions, with HTML input + multi-page placement)
2. `cms` with dot-notation expression resolution (merges 8 CMS actions)
3. Server-side expression parser (dot-notation → token array)

Phase 4 — Feedback + prompt cleanup:
1. `report_limitation` tool
2. Rewrite `get_info()` instructions (180 → ~45 bulleted lines)
3. Implement dynamic tool loading (optional, by editor state)
4. Add server-side validation (auto-correct selectors, strip inline styles,
   suggest valid fields)
5. Update all agent and command prompts

Phase 5 — Testing with small LLMs:
1. Test with 7B model (e.g. Mistral 7B, Llama 3 8B)
2. Test with 13B model
3. Measure: tool selection accuracy, expression generation success rate,
   context window usage per turn
4. Iterate on tool descriptions and instruction prompt based on results
