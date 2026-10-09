import {
  getAllVariablesOrdered,
  setVariable,
  removeVariable,
  renameVariable,
} from './variables.js'
import { VARIABLE_TYPES, TYPE_FONT_FAMILY } from './types.js'
import { guessType } from './guess-type.js'

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
export const cmdDescribeVars = 'css-var:describe'
export const cmdSetVar = 'css-var:set'
export const cmdRemoveVar = 'css-var:remove'
export const cmdRenameVar = 'css-var:rename'

/** Names of all defined CSS variables, in order. */
function getVariableNames(editor) {
  return getAllVariablesOrdered(editor).map(v => v.name)
}

/** Throw an actionable error unless `name` is a defined variable. */
function requireVariable(editor, name, label = 'Variable') {
  const names = getVariableNames(editor)
  if (!names.includes(name)) {
    throw new Error(names.length
      ? `${label} "${name}" not found. Existing variables: ${names.join(', ')}.`
      : `${label} "${name}" not found. No variables defined.`)
  }
  return names
}

export function registerCommands(editor) {
  editor.Commands.add(cmdListVars, {
    run() {
      return getAllVariablesOrdered(editor)
    },
  })

  editor.Commands.add(cmdDescribeVars, {
    run() {
      const variables = getAllVariablesOrdered(editor)
      return variables.length
        ? variables.map(v => `--${v.name}: ${v.values[''] ?? Object.values(v.values)[0]} (${v.type})`).join('\n')
        : 'No variable yet.'
    },
  })

  editor.Commands.add(cmdSetVar, {
    run(ed, sender, opts = {}) {
      const { value, type } = opts
      const name = opts.name?.replace(/^--/, '')
      if (!name || !value) {
        throw new Error('Required: name, value. Example: {name: "primary", value: "#ff0000"}.')
      }
      const order = editor.getModel().get('cssVarOrder') || []
      const existing = order.find(o => o.name === name)
      // A var() is valid for any property: it has the type of the variable it names
      const named = /^var\(--([\w-]+)/.exec(value.trim())?.[1]
      const canonical = type ? normalizeType(type) : existing?.type ?? order.find(o => o.name === named)?.type ?? guessType(value)
      if (!canonical) {
        throw new Error(`Invalid type "${type}". Must be one of: ${VARIABLE_TYPES.join(', ')}.`)
      }
      if (existing && existing.type !== canonical) {
        throw new Error(`Variable "${name}" already exists with type "${existing.type}", not "${canonical}". Remove it first or reuse its type.`)
      }
      setVariable(editor, { name, value })
      // Track type in cssVarOrder
      if (!existing) {
        order.push({ type: canonical, name })
        editor.getModel().set('cssVarOrder', [...order])
      }
    },
  })

  editor.Commands.add(cmdRemoveVar, {
    run(ed, sender, opts = {}) {
      const name = opts.name?.replace(/^--/, '')
      if (!name) {
        throw new Error('Required: name. Example: {name: "primary"}. Use variable(action:\'list\') to see existing variables.')
      }
      requireVariable(editor, name)
      removeVariable(editor, { name })
      // Remove from cssVarOrder
      const order = editor.getModel().get('cssVarOrder') || []
      const newOrder = order.filter(o => o.name !== name)
      editor.getModel().set('cssVarOrder', [...newOrder])
    },
  })

  editor.Commands.add(cmdRenameVar, {
    run(ed, sender, opts = {}) {
      const oldName = opts.name?.replace(/^--/, '')
      const newName = opts.new_name?.replace(/^--/, '')
      if (!oldName || !newName) {
        throw new Error('Required: name, new_name. Example: {name: "primary", new_name: "brand"}. Use variable(action:\'list\') to see existing variables.')
      }
      const names = requireVariable(editor, oldName)
      if (oldName === newName) {
        throw new Error(`Variable "${oldName}" already has that name.`)
      }
      if (names.includes(newName)) {
        throw new Error(`Variable "${newName}" already exists. Choose a different name. Existing variables: ${names.join(', ')}.`)
      }
      renameVariable(editor, { oldName, newName })
    },
  })
}

export function registerCapabilities(addCapability, describeTool) {
  const name = { type: 'string', description: 'Variable name, like "primary"; CSS uses it as var(--primary)' }
  describeTool?.('variable', 'CSS variables of the website.')
  addCapability({
    tool: 'variable',
    action: 'list',
    command: cmdDescribeVars,
    description: 'the variables and their values.',
    readOnly: true,
  })
  addCapability({
    tool: 'variable',
    action: 'set',
    command: cmdSetVar,
    description: 'add or change a variable.',
    inputSchema: {
      type: 'object',
      required: ['name', 'value'],
      properties: {
        name,
        value: { type: 'string', description: 'CSS value, like "#ff0000", "16px", "Inter, sans-serif"' },
        type: { type: 'string', enum: [...VARIABLE_TYPES, 'font', 'typo', 'typography'], description: 'Default: guessed from the value' },
      },
    },
  })
  addCapability({
    tool: 'variable',
    action: 'rename',
    command: cmdRenameVar,
    description: 'rename a variable, the CSS that uses it follows.',
    inputSchema: {
      type: 'object',
      required: ['name', 'new_name'],
      properties: { name, new_name: { type: 'string', description: 'the new name' } },
    },
  })
  addCapability({
    tool: 'variable',
    action: 'remove',
    command: cmdRemoveVar,
    description: 'remove a variable.',
    destructive: true,
    inputSchema: { type: 'object', required: ['name'], properties: { name } },
  })
}
