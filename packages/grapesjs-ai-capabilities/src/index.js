export const PLUGIN_ID = 'grapesjs-ai-capabilities'

const registries = new WeakMap()
const OPTIONAL_FIELDS = ['title', 'tags', 'version']

function withRegistry(editor, fn) {
    try {
        const registry = registries.get(editor)
        if (!registry) {
            return { ok: false, error: 'Plugin not initialized on this editor' }
        }
        return fn(registry)
    } catch (err) {
        return { ok: false, error: err.message }
    }
}

function isPlainObject(v) {
    if (v === null || typeof v !== 'object') return false
    const proto = Object.getPrototypeOf(v)
    return proto === Object.prototype || proto === null
}

export default (editor) => {
    registries.set(editor, new Map())
}

export function addCapability(editor, def, options = {}) {
    return withRegistry(editor, (registry) => {
        if (!def || typeof def.id !== 'string' || !def.id) {
            return { ok: false, error: 'id is required and must be a non-empty string' }
        }
        if (typeof def.command !== 'string' || !def.command) {
            return { ok: false, error: 'command is required and must be a non-empty string' }
        }
        const description = def.description || def.prompt
        if (typeof description !== 'string' || !description) {
            return { ok: false, error: 'description (or prompt) is required and must be a non-empty string' }
        }
        if (registry.has(def.id) && !options.replace) {
            return { ok: false, error: `Capability "${def.id}" already exists` }
        }
        if (def.tags !== undefined && !Array.isArray(def.tags)) {
            return { ok: false, error: 'tags must be an array' }
        }
        if (def.inputSchema !== undefined && !isPlainObject(def.inputSchema)) {
            return { ok: false, error: 'inputSchema must be an object' }
        }
        if (def.outputSchema !== undefined && !isPlainObject(def.outputSchema)) {
            return { ok: false, error: 'outputSchema must be an object' }
        }
        const warnings = []
        if (!editor.Commands.has(def.command)) {
            warnings.push(`Command "${def.command}" not found. It may be registered later.`)
            console.warn(`[${PLUGIN_ID}] ${warnings[0]}`)
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
        const result = { ok: true, capability: { ...capability } }
        if (warnings.length) result.warnings = warnings
        return result
    })
}

export function getCapability(editor, id) {
    return withRegistry(editor, (registry) => {
        const cap = registry.get(id)
        if (!cap) {
            return { ok: false, error: `Capability "${id}" not found` }
        }
        return { ok: true, capability: { ...cap } }
    })
}

export function getAllCapabilities(editor, filter = {}) {
    return withRegistry(editor, (registry) => {
        let capabilities = Array.from(registry.values())
        if (filter.tags && Array.isArray(filter.tags) && filter.tags.length) {
            capabilities = capabilities.filter(c =>
                c.tags && filter.tags.some(t => c.tags.includes(t))
            )
        }
        const copies = capabilities.map(c => ({ ...c }))
        return { ok: true, capabilities: copies, count: copies.length }
    })
}

export function removeCapability(editor, id) {
    return withRegistry(editor, (registry) => {
        const removed = registry.delete(id)
        return { ok: true, removed }
    })
}

export function hasCapability(editor, id) {
    try {
        const registry = registries.get(editor)
        return registry ? registry.has(id) : false
    } catch (_) {
        return false
    }
}
