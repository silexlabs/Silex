import { cmdList, cmdAdd, cmdRemove, cmdUnlink, cmdCreate, cmdCreateInstance } from './SymbolsCommands'

export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void) {
  addCapability({
    id: cmdList,
    command: cmdList,
    description: 'List all symbols. Returns the id, name, and instance count of each symbol.',
    readOnly: true,
    tags: ['symbols'],
  })
  addCapability({
    id: cmdAdd,
    command: cmdAdd,
    description: 'Create symbol from element',
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
    description: 'Unlink element from symbol',
    tags: ['symbols'],
  })
  addCapability({
    id: cmdCreate,
    command: cmdCreateInstance,
    description: 'Create a symbol instance from symbolId inside the selected element (or the body if nothing is selected). The new instance becomes the selection.',
    inputSchema: {
      type: 'object',
      required: ['symbolId'],
      properties: {
        symbolId: { type: 'string', description: 'Symbol id from symbols:list. The new instance is selected.' },
      },
    },
    tags: ['symbols'],
  })
}
