import { CMD_DS_LIST, CMD_DS_GET_STATES, CMD_DS_SET_STATE, CMD_DS_REMOVE_STATE } from './commands'

export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void) {
  addCapability({
    id: 'data-source:refresh',
    command: 'data-source:refresh',
    description: 'Refresh data sources',
    openWorld: true,
    tags: ['data'],
  })
  addCapability({
    id: 'data-source:preview:activate',
    command: 'data-source:preview:activate',
    description: 'Activate data preview',
    tags: ['data'],
  })
  addCapability({
    id: 'data-source:preview:deactivate',
    command: 'data-source:preview:deactivate',
    description: 'Deactivate data preview',
    tags: ['data'],
  })
  addCapability({
    id: 'data-source:preview:toggle',
    command: 'data-source:preview:toggle',
    description: 'Toggle data preview',
    tags: ['data'],
  })
  addCapability({
    id: CMD_DS_LIST,
    command: CMD_DS_LIST,
    description: 'List connected data sources',
    readOnly: true,
    tags: ['data'],
  })
  addCapability({
    id: CMD_DS_GET_STATES,
    command: CMD_DS_GET_STATES,
    description: 'Get data expressions on selected component',
    readOnly: true,
    inputSchema: {
      type: 'object',
      properties: {
        exported: { type: 'boolean' },
      },
    },
    tags: ['data'],
  })
  addCapability({
    id: CMD_DS_SET_STATE,
    command: CMD_DS_SET_STATE,
    description: 'Set data expression on selected component',
    inputSchema: {
      type: 'object',
      required: ['stateId', 'expression'],
      properties: {
        stateId: { type: 'string', description: 'Common: "innerHTML" (text content), "condition" (visibility), "__data" (loop). For attributes use any custom ID.' },
        expression: { type: 'array', description: 'Array of expression tokens. Each token needs "type" and "fieldId".' },
        label: { type: 'string' },
        exported: { type: 'boolean' },
      },
    },
    tags: ['data'],
  })
  addCapability({
    id: CMD_DS_REMOVE_STATE,
    command: CMD_DS_REMOVE_STATE,
    description: 'Remove data expression from selected component',
    destructive: true,
    inputSchema: {
      type: 'object',
      required: ['stateId'],
      properties: {
        stateId: { type: 'string' },
        exported: { type: 'boolean' },
      },
    },
    tags: ['data'],
  })
}
