# GrapesJS AI Capabilities

Discovery and metadata layer for GrapesJS commands. Allows plugins to register capabilities that external builders can expose as MCP tools or other AI integrations.

> This code is part of a bigger project: [about Silex v3](https://www.silex.me/)

## SLM-first philosophy

This plugin is designed for **small language models** (SLMs) — models that are cheap to run, can run locally, and have a small context window. We believe local-first AI is better for carbon footprint, privacy, and cost.

The strategy: keep capability descriptions **minimal**. An SLM discovers available tools through short descriptions, then learns the details from error messages when it gets parameters wrong. This means:

- Descriptions are terse (e.g. "List CSS variables", "Set CSS variable")
- Input schemas list only the required parameters with their types
- Error messages are actionable (e.g. "Required: name, value, type (color|size|typo)")
- No verbose system prompts needed — the tool list itself fits in a small context

This approach works because SLMs are iterative: they try, fail, read the error, and try again. A 500-token tool description wastes context; a 5-word description plus a clear error on misuse teaches faster.

## API

The plugin keeps an internal registry per editor. All functions take the editor as first argument.

```js
import plugin, {
  addCapability,
  getCapability,
  getAllCapabilities,
  removeCapability,
  hasCapability,
  PLUGIN_ID,
} from '@silexlabs/grapesjs-ai-capabilities'
```

### addCapability(editor, def, options?)

Register a capability. Returns `{ ok, capability?, error?, warnings? }`.

```js
addCapability(editor, {
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
```

Pass `{ replace: true }` as third argument to overwrite an existing capability.

### getCapability(editor, id)

Returns `{ ok, capability? }` or `{ ok: false, error }`.

### getAllCapabilities(editor, filter?)

Returns `{ ok, capabilities, count }`. Optional filter: `{ tags: ['css'] }`.

### removeCapability(editor, id)

Returns `{ ok, removed }`. No-op if missing.

### hasCapability(editor, id)

Returns `true` or `false`.

## Usage with other plugins

Plugins register their own capabilities at init time. Example from `grapesjs-css-variables`:

```js
editor.on('load', () => {
  const aiCaps = window['@silexlabs/grapesjs-ai-capabilities']
  if (aiCaps && aiCaps.addCapability) {
    aiCaps.addCapability(editor, {
      id: 'css-var:list',
      command: 'css-var:list',
      description: 'List CSS variables',
    })
  }
})
```

## Install

```
npm i @silexlabs/grapesjs-ai-capabilities
```

## License

GPL-3.0
