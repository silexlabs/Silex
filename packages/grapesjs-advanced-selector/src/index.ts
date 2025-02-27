// Web components
import './components/simple-selector.ts'
import './components/inline-select.ts'
import './components/compound-selector.ts'
import './components/complex-selector.ts'
import './components/current-selector-display.ts'

// GrapesJs Plugin
import { AdvancedSelectorOptions, initASM, initListeners } from './plugin'
import { Editor } from 'grapesjs'
import en from './i18n/en'
import fr from './i18n/fr'
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
    // escapeName: (name: string) => {
    //   console.log('escapeName =========== NEVER USED? REMOVE?', name)
    //   return `as-${name}`
    // },
  }

  if(editor.I18n) {
    editor.I18n.addMessages({
      en,
      fr,
      ...options.i18n,
    })
  }

  initASM(editor, options)
  initListeners(editor)
}
