import './components/simple-selector.ts'
import './components/inline-select.ts'
import './components/compound-selector.ts'
import './components/complex-selector.ts'
import './components/active-selector-info.ts'

import { Editor } from 'grapesjs'
import { AdvancedSelectorOptions, initSelectorCustom } from './grapesjs/selectorManager'

/**
 * Type of the object passed to the selector:custom event listener
 * Defined in grapesjs source code, see class SelectorManager
 */
export default (editor: Editor, opts: Partial<AdvancedSelectorOptions> = {}) => {
  const options = {
    ...opts,
    classSelector: {
      label: 'CSS Selector',
      ...opts.classSelector,
    },
  } as AdvancedSelectorOptions

  editor.config.selectorManager = {
    ...editor.config.selectorManager,
    escapeName: (name: string) => {
      console.log('escapeName ===========', name)
      return `as-${name}`
    },
  }

  initSelectorCustom(editor, options)
}
