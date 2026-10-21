import { cmdList, cmdAdd, cmdRemove, cmdUnlink, cmdCreate } from './SymbolsCommands'

const POSITION = { type: 'string', enum: ['inside', 'before', 'after'], description: 'Default: inside, as last child' }
const ELEMENT_ID = { type: 'string', description: 'Element id, like "ab12". Default: the selected element' }
const SYMBOL_ID = { type: 'string', description: 'Symbol id from list or create' }

export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void, describeTool?: (name: string, description: string) => void) {
  describeTool?.('symbol', 'Symbols: elements shared by several pages, like a header. A change to one instance changes them all.')
  addCapability({
    tool: 'symbol',
    action: 'list',
    command: cmdList,
    description: 'the symbols.',
    readOnly: true,
  })
  addCapability({
    tool: 'symbol',
    action: 'create',
    command: cmdAdd,
    description: 'turn an element into a symbol; it becomes its first instance.',
    inputSchema: {
      type: 'object',
      required: ['label'],
      properties: {
        element_id: ELEMENT_ID,
        label: { type: 'string', description: 'Symbol name' },
      },
    },
  })
  addCapability({
    tool: 'symbol',
    action: 'insert',
    command: cmdCreate,
    description: 'add an instance inside, before or after target_id (default: the selected element), and select it.',
    inputSchema: {
      type: 'object',
      required: ['symbol_id'],
      properties: {
        symbol_id: SYMBOL_ID,
        target_id: { type: 'string', description: 'The element it goes inside, before or after. Default: the selected element' },
        position: POSITION,
      },
    },
  })
  addCapability({
    tool: 'symbol',
    action: 'unlink',
    command: cmdUnlink,
    description: 'turn an instance back into a plain element, the other instances stay.',
    inputSchema: { type: 'object', properties: { element_id: ELEMENT_ID } },
  })
  addCapability({
    tool: 'symbol',
    action: 'remove',
    command: cmdRemove,
    description: 'delete a symbol.',
    destructive: true,
    inputSchema: { type: 'object', required: ['symbol_id'], properties: { symbol_id: SYMBOL_ID } },
  })
}
