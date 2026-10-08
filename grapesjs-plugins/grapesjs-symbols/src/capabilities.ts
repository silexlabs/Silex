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
    description: 'Turn the selected element into a symbol',
    inputSchema: {
      type: 'object',
      required: ['label'],
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
        symbolId: { type: 'string', description: 'id from symbols_list or symbols_add' },
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
    command: cmdCreate,
    description: 'Insert an instance of a symbol relative to the selected element and select it',
    inputSchema: {
      type: 'object',
      required: ['symbolId'],
      properties: {
        symbolId: { type: 'string', description: 'id from symbols_list or symbols_add' },
        position: { type: 'string', enum: ['inside', 'before', 'after'], description: 'Default: inside, as last child' },
      },
    },
    tags: ['symbols'],
  })
}
