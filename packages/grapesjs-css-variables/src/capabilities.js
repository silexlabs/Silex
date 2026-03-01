import {
  getAllVariablesOrdered,
  setVariable,
  removeVariable,
  renameVariable,
} from './variables.js'

const TYPES = ['color', 'size', 'typo']

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
        throw new Error('Required: name, value, type (color|size|typo)')
      }
      if (!TYPES.includes(type)) {
        throw new Error('type must be color, size, or typo')
      }
      setVariable(editor, { name, value, type }, prefix)
    },
  })

  editor.Commands.add(cmdRemoveVar, {
    run(ed, sender, opts = {}) {
      const { name, type } = opts
      if (!name || !type) {
        throw new Error('Required: name, type (color|size|typo)')
      }
      if (!TYPES.includes(type)) {
        throw new Error('type must be color, size, or typo')
      }
      removeVariable(editor, { name, type }, prefix)
    },
  })

  editor.Commands.add(cmdRenameVar, {
    run(ed, sender, opts = {}) {
      const { oldName, newName, type } = opts
      if (!oldName || !newName || !type) {
        throw new Error('Required: oldName, newName, type (color|size|typo)')
      }
      if (!TYPES.includes(type)) {
        throw new Error('type must be color, size, or typo')
      }
      renameVariable(editor, { oldName, newName, type }, prefix)
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
        name: { type: 'string' },
        value: { type: 'string' },
        type: { type: 'string', enum: TYPES },
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
        type: { type: 'string', enum: TYPES },
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
        type: { type: 'string', enum: TYPES },
      },
    },
    tags: ['css'],
  })
}
