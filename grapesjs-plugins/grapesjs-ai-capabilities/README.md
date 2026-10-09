# GrapesJS AI Capabilities

Discovery and metadata layer for GrapesJS commands. Sits between plugins that **expose** capabilities and builders that **consume** them (MCP servers, AI agents, chat interfaces, etc.).

> This code is part of a bigger project: [about Silex v3](https://www.silex.me/)

## SLM-first philosophy

This plugin is designed for **small language models** (SLMs) — models that are cheap to run, can run locally, and have a small context window. We believe local-first AI is better for carbon footprint, privacy, and cost.

The strategy: keep capability descriptions **minimal**. An SLM discovers available tools through short descriptions, then learns the details from error messages when it gets parameters wrong. This means:

- Descriptions are terse (e.g. "List CSS variables", "Set CSS variable")
- Input schemas list only the required parameters with their types
- Error messages are actionable (e.g. "Required: name, value, type (color|size|typo)")
- No verbose system prompts needed — the tool list itself fits in a small context

This approach works because SLMs are iterative: they try, fail, read the error, and try again. A 500-token tool description wastes context; a 5-word description plus a clear error on misuse teaches faster.

## Use case 1: Expose capabilities to AI

You're a **plugin author** and want your GrapesJS commands to be discoverable by AI tools.

Listen for the `ai-capabilities:ready` event during your plugin init. No import needed — if the ai-capabilities plugin isn't loaded, the event never fires and nothing happens.

A capability is one **action** of a **tool**: the capabilities that share a `tool` become one tool with an `action` parameter (`variable(action: "set")`). Reading is an action too: no separate list tool.

```js
// In your plugin's init function
export default (editor, opts) => {
  // ... your plugin setup ...

  editor.on('ai-capabilities:ready', (addCapability, describeTool) => {
    describeTool('variable', 'CSS variables of the website.')
    addCapability({
      tool: 'variable',
      action: 'list',
      command: 'css-var:list',
      description: 'the CSS variables.',
      readOnly: true,
    })
    addCapability({
      tool: 'variable',
      action: 'set',
      command: 'css-var:set',
      description: 'add or change a CSS variable.',
      inputSchema: {
        type: 'object',
        required: ['name', 'value'],
        properties: {
          name: { type: 'string' },
          value: { type: 'string' },
        },
      },
    })
  })
}
```

Keep descriptions short. Put the detail in `inputSchema` and in your command's error messages. Silex Desktop passes the command only the parameters its own `inputSchema` declares, never `action`.

## Use case 2: Implement an MCP server (or other AI integration)

You're a **builder** and want to expose GrapesJS capabilities as MCP tools, API endpoints, or chat actions.

`getTools()` gives one tool per family, with a flat schema (small models ignore `oneOf`): `action` is an enum whose description lists what each action does, the parameters are the union of the actions' parameters, each one saying which actions read it. Annotations are those of the riskiest action. `actions` says which command runs each action:

```js
import { getTools } from '@silexlabs/grapesjs-ai-capabilities'

for (const tool of getTools()) {
  mcpServer.addTool({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    execute: ({ action, ...params }) => editor.runCommand(tool.actions[action].command, params),
  })
}
```

Execution always goes through `editor.runCommand()` — this plugin does not implement `run()`.

## Window global

When running in a browser, the plugin exposes the registry as `window.grapesjsAiCapabilities`. This is useful for environments that cannot use ES module imports (e.g. Tauri initialization scripts, browser console, injected scripts):

```js
const tools = window.grapesjsAiCapabilities.getTools()
```

For all other cases, prefer the module imports described above.

## API reference

The plugin keeps a single global registry. Query functions don't need the editor.

### addCapability(def, options?)

Register a capability: `tool` and `action` (`^[a-z][a-z0-9_]{0,63}$`), `command`, `description`, and optionally `inputSchema` (which can not declare `action`), `readOnly`, `destructive`, `idempotent`, `openWorld`. A parameter must mean the same for every action of a tool (only its description and enum values may differ). Its id is `tool.action`. Returns the capability object. Throws on validation errors.

Pass `{ replace: true }` as second argument to overwrite an existing capability.

### describeTool(name, description)

The sentence that introduces a tool, before the list of its actions.

### getTools()

One tool per family: `{ name, description, inputSchema, readOnly, destructive, idempotent, openWorld, actions: { [action]: { command, parameters, required, openWorld } } }`.

### getCapability(id)

Returns the capability object (id `tool.action`). Throws if not found.

### getAllCapabilities(filter?)

Returns an array of capabilities. Optional filter: `{ tags: ['css'] }`.

### removeCapability(id)

Returns `true` if removed, `false` if not found.

### hasCapability(id)

Returns `true` or `false`.

### clearCapabilities()

Clears the registry and the tool descriptions. Useful for tests.

### Event: `ai-capabilities:ready`

Fired on `editor.on('load')`. The callback receives `addCapability` and `describeTool`.

## Install

```
npm i @silexlabs/grapesjs-ai-capabilities
```

## License

AGPL-3.0-or-later
