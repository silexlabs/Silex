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

Listen for the `ai-capabilities:ready` event during your plugin init. No import needed — if the ai-capabilities plugin isn't loaded, the event never fires and nothing happens:

```js
// In your plugin's init function
export default (editor, opts) => {
  // ... your plugin setup ...

  editor.on('ai-capabilities:ready', (addCapability) => {
    addCapability({
      id: 'css-var:set',
      command: 'css-var:set',
      description: 'Set CSS variable',
      inputSchema: {
        type: 'object',
        required: ['name', 'value', 'type'],
        properties: {
          name: { type: 'string' },
          value: { type: 'string' },
          type: { type: 'string', enum: ['color', 'size', 'typo'] },
        },
      },
      tags: ['css'],
    })
  })
}
```

Keep descriptions short. Put the detail in `inputSchema` and in your command's error messages.

## Use case 2: Implement an MCP server (or other AI integration)

You're a **builder** and want to expose GrapesJS capabilities as MCP tools, API endpoints, or chat actions.

Import the query functions to read the registry and map capabilities to your integration:

```js
import { getAllCapabilities } from '@silexlabs/grapesjs-ai-capabilities'

// Get all registered capabilities as MCP tool definitions
const capabilities = getAllCapabilities()

for (const cap of capabilities) {
  mcpServer.addTool({
    name: cap.id,
    description: cap.description,
    inputSchema: cap.inputSchema,
    execute: (params) => editor.runCommand(cap.command, params),
  })
}
```

Execution always goes through `editor.runCommand()` — this plugin does not implement `run()`.

## API reference

The plugin keeps a single global registry. Query functions don't need the editor.

### addCapability(def, options?)

Register a capability. Returns the capability object. Throws on validation errors.

Pass `{ replace: true }` as third argument to overwrite an existing capability.

### getCapability(id)

Returns the capability object. Throws if not found.

### getAllCapabilities(filter?)

Returns an array of capabilities. Optional filter: `{ tags: ['css'] }`.

### removeCapability(id)

Returns `true` if removed, `false` if not found.

### hasCapability(id)

Returns `true` or `false`.

### clearCapabilities()

Clears the registry. Useful for tests.

### Event: `ai-capabilities:ready`

Fired on `editor.on('load')`. The callback receives the `addCapability` function.

## Install

```
npm i @silexlabs/grapesjs-ai-capabilities
```

## License

GPL-3.0
