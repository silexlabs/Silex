import { cmdList, cmdAdd, cmdRemove, cmdUnlink, cmdCreate } from './SymbolsCommands'

export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void) {
  addCapability({
    id: cmdList,
    command: cmdList,
    description: 'List all symbols',
    readOnly: true,
    tags: ['symbols'],
  })
  addCapability({
    id: cmdAdd,
    command: cmdAdd,
    description: 'Create symbol from component',
    inputSchema: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        icon: { type: 'string' },
      },
    },
    tags: ['symbols'],
  })
  addCapability({
    id: cmdRemove,
    command: cmdRemove,
    description: 'Delete a symbol',
    destructive: true,
    inputSchema: {
      type: 'object',
      required: ['symbolId'],
      properties: {
        symbolId: { type: 'string' },
      },
    },
    tags: ['symbols'],
  })
  addCapability({
    id: cmdUnlink,
    command: cmdUnlink,
    description: 'Unlink component from symbol',
    tags: ['symbols'],
  })
  addCapability({
    id: cmdCreate,
    command: cmdCreate,
    description: 'Create symbol instance',
    tags: ['symbols'],
  })
}
