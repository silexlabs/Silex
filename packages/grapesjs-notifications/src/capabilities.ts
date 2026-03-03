import { NOTIFICATION_ADD, NOTIFICATION_CLEAR, NOTIFICATION_LIST } from './commands'

export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void) {
  addCapability({
    id: NOTIFICATION_ADD,
    command: NOTIFICATION_ADD,
    description: 'Show notification to user',
    inputSchema: {
      type: 'object',
      required: ['type', 'message'],
      properties: {
        type: { type: 'string', enum: ['info', 'warning', 'error', 'success'] },
        message: { type: 'string' },
        group: { type: 'string' },
      },
    },
    tags: ['notifications'],
  })
  addCapability({
    id: NOTIFICATION_CLEAR,
    command: NOTIFICATION_CLEAR,
    description: 'Clear all notifications',
    tags: ['notifications'],
  })
  addCapability({
    id: NOTIFICATION_LIST,
    command: NOTIFICATION_LIST,
    description: 'List all notifications',
    tags: ['notifications'],
  })
}
