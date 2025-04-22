// GrapesJs Plugin
import { AdvancedSelectorOptions, initASM, initListeners } from './plugin'
import { Editor } from 'grapesjs'
import en from './i18n/en'
import fr from './i18n/fr'

// For devtools debugging
export const name = '@silexlabs/grapesjs-advanced-selector'

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
  initListeners(editor, options)
}
