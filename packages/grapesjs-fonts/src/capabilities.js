import { cmdGetHtml, cmdFontsInstalled, cmdFontsAvailable, cmdFontsInstall, cmdFontsRemove } from './commands.js'

export function registerCapabilities(addCapability) {
    addCapability({
        id: cmdGetHtml,
        command: cmdGetHtml,
        description: 'Get HTML imports for installed fonts',
        tags: ['fonts'],
    })
    addCapability({
        id: cmdFontsInstalled,
        command: cmdFontsInstalled,
        description: 'List installed fonts',
        tags: ['fonts'],
    })
    addCapability({
        id: cmdFontsAvailable,
        command: cmdFontsAvailable,
        description: 'List available Google Fonts',
        inputSchema: {
            type: 'object',
            properties: {
                search: { type: 'string' },
                category: { type: 'string', enum: ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'] },
            },
        },
        tags: ['fonts'],
    })
    addCapability({
        id: cmdFontsInstall,
        command: cmdFontsInstall,
        description: 'Install a Google Font by family name',
        inputSchema: {
            type: 'object',
            required: ['family'],
            properties: {
                family: { type: 'string' },
            },
        },
        tags: ['fonts'],
    })
    addCapability({
        id: cmdFontsRemove,
        command: cmdFontsRemove,
        description: 'Remove an installed font',
        inputSchema: {
            type: 'object',
            required: ['family'],
            properties: {
                family: { type: 'string' },
            },
        },
        tags: ['fonts'],
    })
}
