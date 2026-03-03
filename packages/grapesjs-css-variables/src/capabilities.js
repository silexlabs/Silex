import {
  getAllVariablesOrdered,
  setVariable,
  removeVariable,
  renameVariable,
} from './variables.js'
import { VARIABLE_TYPES, TYPE_COLOR, TYPE_SIZE, TYPE_FONT_FAMILY } from './types.js'

// Aliases that LLMs might guess instead of the canonical type names
const TYPE_ALIASES = {
  font: TYPE_FONT_FAMILY,
  typo: TYPE_FONT_FAMILY,
  typography: TYPE_FONT_FAMILY,
}

/** Normalize a type value: accept aliases, return canonical type or null. */
function normalizeType(type) {
  if (VARIABLE_TYPES.includes(type)) return type
  return TYPE_ALIASES[type] || null
}

export const cmdListVars = 'css-var:list'
export const cmdSetVar = 'css-var:set'
export const cmdRemoveVar = 'css-var:remove'
export const cmdRenameVar = 'css-var:rename'

export function registerCommands(editor) {
  editor.Commands.add(cmdListVars, {
    run() {
      return getAllVariablesOrdered(editor)
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
      setVariable(editor, { name, value })
      // Track type in cssVarOrder
      const order = editor.getModel().get('cssVarOrder') || []
      if (!order.some(o => o.name === name)) {
        order.push({ type: canonical, name })
        editor.getModel().set('cssVarOrder', [...order])
      }
    },
  })

  editor.Commands.add(cmdRemoveVar, {
    run(ed, sender, opts = {}) {
      const { name } = opts
      if (!name) {
        throw new Error('Required: name. Example: {name: "primary"}. Use css-var:list to see existing variables.')
      }
      removeVariable(editor, { name })
      // Remove from cssVarOrder
      const order = editor.getModel().get('cssVarOrder') || []
      const newOrder = order.filter(o => o.name !== name)
      editor.getModel().set('cssVarOrder', [...newOrder])
    },
  })

  editor.Commands.add(cmdRenameVar, {
    run(ed, sender, opts = {}) {
      const { oldName, newName } = opts
      if (!oldName || !newName) {
        throw new Error('Required: oldName, newName. Example: {oldName: "primary", newName: "brand"}. Use css-var:list to see existing variables.')
      }
      renameVariable(editor, { oldName, newName })
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
        name: { type: 'string', description: 'Variable name (e.g. "primary")' },
        value: { type: 'string', description: 'CSS value (e.g. "#ff0000", "16px", "Inter, sans-serif")' },
        type: { type: 'string', enum: [...VARIABLE_TYPES, 'font', 'typo', 'typography'], description: 'color, size, or font-family. Aliases accepted: font, typo, typography' },
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
      required: ['name'],
      properties: {
        name: { type: 'string' },
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
      required: ['oldName', 'newName'],
      properties: {
        oldName: { type: 'string' },
        newName: { type: 'string' },
      },
    },
    tags: ['css'],
  })
}
