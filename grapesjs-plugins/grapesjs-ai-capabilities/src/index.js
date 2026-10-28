export const PLUGIN_ID = 'grapesjs-ai-capabilities'

const registry = new Map()
const toolDescriptions = new Map()
const OPTIONAL_FIELDS = ['title', 'tags', 'version', 'readOnly', 'destructive', 'idempotent', 'openWorld']

function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

// MCP clients require property names to match ^[a-zA-Z0-9_.-]{1,64} (see desktop mcp.rs).
export const MCP_SCHEMA_PROPERTY_NAME = /^[a-zA-Z0-9_.-]{1,64}$/
// Tool names travel to every MCP client, some only accept these characters
export const TOOL_NAME = /^[a-z][a-z0-9_]{0,63}$/

function assertValidSchemaPropertyNames(schema, path) {
  if (!isPlainObject(schema)) return
  if (isPlainObject(schema.properties)) {
    for (const key of Object.keys(schema.properties)) {
      if (!MCP_SCHEMA_PROPERTY_NAME.test(key)) {
        throw new Error(
          `${path} property name "${key}" is invalid: MCP property names must match ^[a-zA-Z0-9_.-]{1,64} (use _ instead of :)`
        )
      }
      assertValidSchemaPropertyNames(schema.properties[key], `${path}.properties.${key}`)
    }
  }
  if (schema.items !== undefined) {
    assertValidSchemaPropertyNames(schema.items, `${path}.items`)
  }
  for (const combo of ['anyOf', 'oneOf', 'allOf']) {
    if (Array.isArray(schema[combo])) {
      schema[combo].forEach((entry, i) => {
        assertValidSchemaPropertyNames(entry, `${path}.${combo}[${i}]`)
      })
    }
  }
}

export const EVENT_READY = 'ai-capabilities:ready'

export default (editor) => {
  // Expose registry for cross-module access (desktop-bridge, MCP server)
  if (typeof window !== 'undefined') {
    window.grapesjsAiCapabilities = {
      addCapability,
      describeTool,
      getCapability,
      getAllCapabilities,
      getTools,
      removeCapability,
      hasCapability,
      clearCapabilities,
    }
  }
  editor.on('load', () => {
    editor.trigger(EVENT_READY, addCapability, describeTool)
  })
}

export function addCapability(def, options = {}) {
  if (!def || typeof def.tool !== 'string' || !TOOL_NAME.test(def.tool)) {
    throw new Error('tool is required and must match ^[a-z][a-z0-9_]{0,63}$')
  }
  if (typeof def.action !== 'string' || !TOOL_NAME.test(def.action)) {
    throw new Error('action is required and must match ^[a-z][a-z0-9_]{0,63}$')
  }
  if (typeof def.command !== 'string' || !def.command) {
    throw new Error('command is required and must be a non-empty string')
  }
  const description = def.description || def.prompt
  if (typeof description !== 'string' || !description) {
    throw new Error('description (or prompt) is required and must be a non-empty string')
  }
  const id = `${def.tool}.${def.action}`
  if (registry.has(id) && !options.replace) {
    throw new Error(`Capability "${id}" already exists`)
  }
  if (def.tags !== undefined && !Array.isArray(def.tags)) {
    throw new Error('tags must be an array')
  }
  if (def.inputSchema !== undefined && !isPlainObject(def.inputSchema)) {
    throw new Error('inputSchema must be an object')
  }
  if (def.outputSchema !== undefined && !isPlainObject(def.outputSchema)) {
    throw new Error('outputSchema must be an object')
  }
  if (def.inputSchema !== undefined) {
    assertValidSchemaPropertyNames(def.inputSchema, 'inputSchema')
    if (isPlainObject(def.inputSchema.properties) && 'action' in def.inputSchema.properties) {
      throw new Error('inputSchema can not declare "action": it is the action of the tool')
    }
    assertSameParameters(def, id)
  }

  const capability = {
    id,
    tool: def.tool,
    action: def.action,
    command: def.command,
    description,
    inputSchema: def.inputSchema || {},
    outputSchema: def.outputSchema || {},
  }
  for (const field of OPTIONAL_FIELDS) {
    if (def[field] !== undefined) capability[field] = def[field]
  }
  registry.set(id, capability)
  return { ...capability }
}

export function describeTool(name, description) {
  if (!TOOL_NAME.test(name)) throw new Error('tool name must match ^[a-z][a-z0-9_]{0,63}$')
  if (typeof description !== 'string' || !description) throw new Error('description must be a non-empty string')
  toolDescriptions.set(name, description)
}

export function getCapability(id) {
  const cap = registry.get(id)
  if (!cap) {
    throw new Error(`Capability "${id}" not found`)
  }
  return { ...cap }
}

export function getAllCapabilities(filter = {}) {
  let capabilities = Array.from(registry.values())
  if (filter.tags && Array.isArray(filter.tags) && filter.tags.length) {
    capabilities = capabilities.filter(c =>
      c.tags && filter.tags.some(t => c.tags.includes(t))
    )
  }
  return capabilities.map(c => ({ ...c }))
}

// Small models ignore oneOf, so a tool has one flat schema and each parameter
// says which actions read it
function describeParameter(uses, actionCount) {
  const byDescription = new Map()
  for (const { action, schema } of uses) {
    const text = schema.description || ''
    byDescription.set(text, [...(byDescription.get(text) || []), action])
  }
  if (uses.length === actionCount && byDescription.size === 1) return [...byDescription.keys()][0] || undefined
  return [...byDescription].map(([text, actions]) => text ? `${actions.join('/')}: ${text}` : `used by ${actions.join('/')}`).join('; ')
}

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted)
  if (!isPlainObject(value)) return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])]))
}

// Only the description and the allowed values can differ from one action to the other
function shape({ description, enum: values, ...rest }) {
  return JSON.stringify(sorted({ ...rest, enum: Array.isArray(values) }))
}

// One flat schema for the tool: a parameter means the same for all its actions
function assertSameParameters(def, id) {
  for (const [key, schema] of Object.entries(def.inputSchema.properties || {})) {
    for (const other of registry.values()) {
      const theirs = other.tool === def.tool && other.id !== id && other.inputSchema.properties?.[key]
      if (theirs && shape(theirs) !== shape(schema)) {
        throw new Error(`Tool "${def.tool}": parameter "${key}" of ${def.action} is not the same as in ${other.action}`)
      }
    }
  }
}

function mergeParameter(uses, actionCount) {
  const [first] = uses
  const merged = { ...first.schema }
  if (Array.isArray(first.schema.enum)) merged.enum = [...new Set(uses.flatMap(({ schema }) => schema.enum))]
  const description = describeParameter(uses, actionCount)
  if (description) merged.description = description
  else delete merged.description
  return merged
}

/**
 * One tool per family: the capabilities that share a `tool` become its actions.
 * Annotated for the riskiest action, as MCP annotations are per tool.
 */
export function getTools() {
  const families = new Map()
  for (const cap of registry.values()) {
    families.set(cap.tool, [...(families.get(cap.tool) || []), cap])
  }
  return [...families].map(([name, caps]) => {
    const uses = new Map()
    for (const cap of caps) {
      for (const [key, schema] of Object.entries(cap.inputSchema.properties || {})) {
        uses.set(key, [...(uses.get(key) || []), { action: cap.action, schema }])
      }
    }
    const properties = {
      action: {
        type: 'string',
        enum: caps.map(cap => cap.action),
        description: caps.map(cap => `${cap.action}: ${cap.description}`).join(' '),
      },
    }
    for (const [key, list] of uses) properties[key] = mergeParameter(list, caps.length)
    return {
      name,
      description: toolDescriptions.get(name) || `Actions: ${caps.map(cap => cap.action).join(', ')}.`,
      inputSchema: { type: 'object', required: ['action'], properties },
      readOnly: caps.every(cap => cap.readOnly === true),
      destructive: caps.some(cap => cap.destructive === true),
      idempotent: caps.every(cap => cap.idempotent === true),
      openWorld: caps.some(cap => cap.openWorld === true),
      actions: Object.fromEntries(caps.map(cap => [cap.action, {
        command: cap.command,
        parameters: Object.keys(cap.inputSchema.properties || {}),
        required: cap.inputSchema.required || [],
        openWorld: cap.openWorld === true,
      }])),
    }
  })
}

export function removeCapability(id) {
  return registry.delete(id)
}

export function hasCapability(id) {
  return registry.has(id)
}

export function clearCapabilities() {
  registry.clear()
  toolDescriptions.clear()
}
