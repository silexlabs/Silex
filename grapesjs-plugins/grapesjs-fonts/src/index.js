import { fontsDialogPlugin } from './fonts.js'
import commands from './commands.js'
import { registerCapabilities } from './capabilities.js'
import en from './locale/en.json'
import fr from './locale/fr.json'
import ptBR from './locale/pt-BR.json'

export default (editor, opts = {}) => {

  const options = { ...{
    // default options
    i18n: {},
    preserveDefaultFonts: true,
  },  ...opts }


  // Load i18n files
  editor.I18n && editor.I18n.addMessages({
    en,
    fr,
    'pt-BR': ptBR,
    ...options.i18n,
  })

  commands(editor, options)
  fontsDialogPlugin(editor, options)

  // Register AI capabilities if grapesjs-ai-capabilities is loaded
  editor.on('ai-capabilities:ready', (addCapability, describeTool) => {
    registerCapabilities(addCapability, describeTool)
  })
}

// Expose commands to the app
export * from './fonts.js'
export * from './commands.js'
