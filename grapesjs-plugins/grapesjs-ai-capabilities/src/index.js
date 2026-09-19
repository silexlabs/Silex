export const PLUGIN_ID = 'grapesjs-ai-capabilities'

const registry = new Map()
const OPTIONAL_FIELDS = ['title', 'tags', 'version', 'readOnly', 'destructive', 'idempotent', 'openWorld']
// MCP clients require property names to match ^[a-zA-Z0-9_.-]{1,64} (see desktop mcp.rs).
export const MCP_SCHEMA_PROPERTY_NAME = /^[a-zA-Z0-9_.-]{1,64}$/

function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

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
      getCapability,
      getAllCapabilities,
      removeCapability,
      hasCapability,
      clearCapabilities,
    }
  }
  editor.on('load', () => {
    editor.trigger(EVENT_READY, addCapability)
  })
}

export function addCapability(def, options = {}) {
  if (!def || typeof def.id !== 'string' || !def.id) {
    throw new Error('id is required and must be a non-empty string')
  }
  if (typeof def.command !== 'string' || !def.command) {
    throw new Error('command is required and must be a non-empty string')
  }
  const description = def.description || def.prompt
  if (typeof description !== 'string' || !description) {
    throw new Error('description (or prompt) is required and must be a non-empty string')
  }
  if (registry.has(def.id) && !options.replace) {
    throw new Error(`Capability "${def.id}" already exists`)
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
  }

  const capability = {
    id: def.id,
    command: def.command,
    description,
    inputSchema: def.inputSchema || {},
    outputSchema: def.outputSchema || {},
  }
  for (const field of OPTIONAL_FIELDS) {
    if (def[field] !== undefined) capability[field] = def[field]
  }
  registry.set(def.id, capability)
  return { ...capability }
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

export function removeCapability(id) {
  return registry.delete(id)
}

export function hasCapability(id) {
  return registry.has(id)
}

export function clearCapabilities() {
  registry.clear()
}
