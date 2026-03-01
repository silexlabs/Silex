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
        return { ok: false, error: 'Required: name, value, type (color|size|typo)' }
      }
      if (!TYPES.includes(type)) {
        return { ok: false, error: 'type must be color, size, or typo' }
      }
      setVariable(editor, { name, value, type }, prefix)
      return { ok: true }
    },
  })

  editor.Commands.add(cmdRemoveVar, {
    run(ed, sender, opts = {}) {
      const { name, type } = opts
      if (!name || !type) {
        return { ok: false, error: 'Required: name, type (color|size|typo)' }
      }
      if (!TYPES.includes(type)) {
        return { ok: false, error: 'type must be color, size, or typo' }
      }
      removeVariable(editor, { name, type }, prefix)
      return { ok: true }
    },
  })

  editor.Commands.add(cmdRenameVar, {
    run(ed, sender, opts = {}) {
      const { oldName, newName, type } = opts
      if (!oldName || !newName || !type) {
        return { ok: false, error: 'Required: oldName, newName, type (color|size|typo)' }
      }
      if (!TYPES.includes(type)) {
        return { ok: false, error: 'type must be color, size, or typo' }
      }
      renameVariable(editor, { oldName, newName, type }, prefix)
      return { ok: true }
    },
  })
}

export function registerCapabilities(editor, addCapability) {
  addCapability(editor, {
    id: cmdListVars,
    command: cmdListVars,
    description: 'List CSS variables',
    tags: ['css'],
  })

  addCapability(editor, {
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

  addCapability(editor, {
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

  addCapability(editor, {
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
