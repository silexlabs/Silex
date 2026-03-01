import { variablesPlugin, cmdOpenVariables } from './variables.js'
import { setupStyleManager } from './style-manager.js'
import en from './locale/en.js'
import fr from './locale/fr.js'

export default (editor, opts = {}) => {
  const options = {
    // Variable name prefix (e.g. 'my-' => --my-color-primary)
    prefix: '',
    // Which variable types to enable
    enableColors: true,
    enableSizes: true,
    enableTypography: true,
    // Pre-defined variables for first load
    presets: [],
    // i18n overrides
    i18n: {},
    ...opts,
  }

  editor.I18n && editor.I18n.addMessages({
    en,
    fr,
    ...options.i18n,
  })

  variablesPlugin(editor, options)
  setupStyleManager(editor, options)
}

export { cmdOpenVariables } from './variables.js'
