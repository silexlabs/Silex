import { Editor } from 'grapesjs'
import { AdvancedSelectorOptions, CustomSelectorEventProps } from './types'
import layout from './components'

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
  layout(editor, options, container)
}

// Create a container for the custom selector
const container = document.createElement('div')
container.id = 'as-container'

// Append the container to the SelectorManager container
function initSelectorCustom(editor: Editor, options: AdvancedSelectorOptions, props?: CustomSelectorEventProps) {
  if (props && props.container) {
    props.container.appendChild(container)
  } else {
    // Keep listening
    editor.once('selector:custom', (props) => initSelectorCustom(editor, options, props))
  }
}