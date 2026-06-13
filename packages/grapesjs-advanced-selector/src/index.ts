// GrapesJs Plugin
import { AdvancedSelectorOptions, initASM, initListeners } from './plugin'
import { Editor } from 'grapesjs'
import en from './i18n/en'
import fr from './i18n/fr'
import registerCommands from './commands'
import { registerCapabilities } from './capabilities'

// For devtools debugging
export const name = '@silexlabs/grapesjs-advanced-selector'

// Re-export selector model functions for programmatic use (MCP bridge, etc.)
export { editStyle, getComponentSelector, setComponentSelector, getSelectors, matchSelectorAll } from './model/GrapesJsSelectors'
export { toString as complexSelectorToString, fromString as complexSelectorFromString } from './model/ComplexSelector'

export default (editor: Editor, opts: Partial<AdvancedSelectorOptions> = {}) => {
  // Defaults
  const options = {
    ...opts,
    i18n: {},
    helpLinks: {
      actionBar: 'https://docs.silex.me/en/user/selectors',
      ...opts.helpLinks,
    },
  } as AdvancedSelectorOptions

  editor.config.selectorManager = {
    ...editor.config.selectorManager,
  }

  if(editor.I18n) {
    editor.I18n.addMessages({
      en,
      fr,
      ...options.i18n,
    })
  }

  initASM(editor, options)
  initListeners(editor, options)
  registerCommands(editor)

  // Register AI capabilities
  editor.on('ai-capabilities:ready', (addCapability: (def: Record<string, unknown>) => void) => {
    registerCapabilities(addCapability)
  })
}
