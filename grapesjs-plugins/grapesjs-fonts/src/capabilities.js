import { cmdFontsInstalled, cmdFontsSearch, cmdFontsInstall, cmdFontsRemove } from './commands.js'

export function registerCapabilities(addCapability, describeTool) {
  const family = { type: 'string', description: 'Font family, like "Open Sans"' }
  describeTool?.('font', 'Google Fonts of the website.')
  addCapability({
    tool: 'font',
    action: 'list',
    command: cmdFontsInstalled,
    description: 'the installed fonts.',
    readOnly: true,
  })
  addCapability({
    tool: 'font',
    action: 'search',
    command: cmdFontsSearch,
    description: 'the Google Fonts whose family contains query.',
    readOnly: true,
    openWorld: true,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'part of a family name' },
        category: { type: 'string', enum: ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'] },
      },
    },
  })
  addCapability({
    tool: 'font',
    action: 'install',
    command: cmdFontsInstall,
    description: 'add a Google Font to the website; the answer gives the font-family to use in CSS.',
    openWorld: true,
    inputSchema: { type: 'object', required: ['family'], properties: { family } },
  })
  addCapability({
    tool: 'font',
    action: 'remove',
    command: cmdFontsRemove,
    description: 'remove an installed font.',
    destructive: true,
    inputSchema: { type: 'object', required: ['family'], properties: { family } },
  })
}
