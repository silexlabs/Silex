import { cmdFontsInstalled, cmdFontsAvailable, cmdFontsInstall, cmdFontsRemove } from './commands.js'

export function registerCapabilities(addCapability) {
  addCapability({
    tool: 'font',
    action: 'list',
    command: cmdFontsInstalled,
    description: 'List installed fonts',
    readOnly: true,
  })
  addCapability({
    tool: 'font',
    action: 'search',
    command: cmdFontsAvailable,
    description: 'List available Google Fonts',
    readOnly: true,
    openWorld: true,
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        category: { type: 'string', enum: ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'] },
      },
    },
  })
  addCapability({
    tool: 'font',
    action: 'install',
    command: cmdFontsInstall,
    description: 'Install a Google Font by family name',
    openWorld: true,
    inputSchema: {
      type: 'object',
      required: ['family'],
      properties: {
        family: { type: 'string' },
      },
    },
  })
  addCapability({
    tool: 'font',
    action: 'remove',
    command: cmdFontsRemove,
    description: 'Remove an installed font',
    destructive: true,
    inputSchema: {
      type: 'object',
      required: ['family'],
      properties: {
        family: { type: 'string' },
      },
    },
  })
}
