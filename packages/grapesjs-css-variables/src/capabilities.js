import {
  getAllVariablesOrdered,
  setVariable,
  removeVariable,
  renameVariable,
} from './variables.js'

const TYPES = ['color', 'size', 'typo']

// Aliases that SLMs might guess instead of the canonical 'typo'
const TYPE_ALIASES = {
  font: 'typo',
  'font-family': 'typo',
  typography: 'typo',
}

/** Normalize a type value: accept aliases, return canonical type or null. */
function normalizeType(type) {
  if (TYPES.includes(type)) return type
  return TYPE_ALIASES[type] || null
}

export const cmdListVars = 'css-var:list'
export const cmdSetVar = 'css-var:set'
export const cmdRemoveVar = 'css-var:remove'
export const cmdRenameVar = 'css-var:rename'

export function registerCommands(editor, options) {
  const prefix = options.prefix || ''

  editor.Commands.add(cmdListVars, {
    run() {
      return getAllVariablesOrdered(editor, prefix)
    },
  })

  editor.Commands.add(cmdSetVar, {
    run(ed, sender, opts = {}) {
      const { name, value, type } = opts
      if (!name || !value || !type) {
        throw new Error('Required: name, value, type. Example: {name: "primary", value: "#ff0000", type: "color"}. type must be color, size, or typo (font-family)')
      }
      const canonical = normalizeType(type)
      if (!canonical) {
        throw new Error(`Invalid type "${type}". Must be one of: color, size, typo (aliases: font, font-family, typography)`)
      }
      setVariable(editor, { name, value, type: canonical }, prefix)
    },
  })

  editor.Commands.add(cmdRemoveVar, {
    run(ed, sender, opts = {}) {
      const { name, type } = opts
      if (!name || !type) {
        throw new Error('Required: name, type. Example: {name: "primary", type: "color"}. Use css-var:list to see existing variables.')
      }
      const canonical = normalizeType(type)
      if (!canonical) {
        throw new Error(`Invalid type "${type}". Must be one of: color, size, typo (aliases: font, font-family, typography)`)
      }
      removeVariable(editor, { name, type: canonical }, prefix)
    },
  })

  editor.Commands.add(cmdRenameVar, {
    run(ed, sender, opts = {}) {
      const { oldName, newName, type } = opts
      if (!oldName || !newName || !type) {
        throw new Error('Required: oldName, newName, type. Example: {oldName: "primary", newName: "brand", type: "color"}. Use css-var:list to see existing variables.')
      }
      const canonical = normalizeType(type)
      if (!canonical) {
        throw new Error(`Invalid type "${type}". Must be one of: color, size, typo (aliases: font, font-family, typography)`)
      }
      renameVariable(editor, { oldName, newName, type: canonical }, prefix)
    },
  })
}

export function registerCapabilities(addCapability) {
  addCapability({
    id: cmdListVars,
    command: cmdListVars,
    description: 'List CSS variables',
    tags: ['css'],
  })

  addCapability({
    id: cmdSetVar,
    command: cmdSetVar,
    description: 'Set CSS variable',
    inputSchema: {
      type: 'object',
      required: ['name', 'value', 'type'],
      properties: {
        name: { type: 'string', description: 'Variable name without prefix (e.g. "primary")' },
        value: { type: 'string', description: 'CSS value (e.g. "#ff0000", "16px", "Inter, sans-serif")' },
        type: { type: 'string', enum: [...TYPES, 'font', 'font-family', 'typography'], description: 'color, size, or typo (font-family). Aliases accepted: font, font-family, typography' },
      },
    },
    tags: ['css'],
  })

  addCapability({
    id: cmdRemoveVar,
    command: cmdRemoveVar,
    description: 'Remove CSS variable',
    inputSchema: {
      type: 'object',
      required: ['name', 'type'],
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: [...TYPES, 'font', 'font-family', 'typography'], description: 'color, size, or typo (font-family)' },
      },
    },
    tags: ['css'],
  })

  addCapability({
    id: cmdRenameVar,
    command: cmdRenameVar,
    description: 'Rename CSS variable',
    inputSchema: {
      type: 'object',
      required: ['oldName', 'newName', 'type'],
      properties: {
        oldName: { type: 'string' },
        newName: { type: 'string' },
        type: { type: 'string', enum: [...TYPES, 'font', 'font-family', 'typography'], description: 'color, size, or typo (font-family)' },
      },
    },
    tags: ['css'],
  })
}
