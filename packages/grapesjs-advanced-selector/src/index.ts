// Web components
import './components/simple-selector.ts'
import './components/inline-select.ts'
import './components/compound-selector.ts'
import './components/complex-selector.ts'
import './components/current-selector-display.ts'

// GrapesJs Plugin
import { AdvancedSelectorOptions, initASM, initListeners } from './plugin'
import { Editor } from 'grapesjs'
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
      console.log('escapeName =========== NEVER USED? REMOVE?', name)
      return `as-${name}`
    },
  }

  initASM(editor, options)
  initListeners(editor)
}
