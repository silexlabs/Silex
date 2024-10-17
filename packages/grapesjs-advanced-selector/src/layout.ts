import { html, render } from 'lit'
import './as-classes'
import './as-selector-display'
import { Editor } from 'grapesjs'
import { AdvancedSelectorOptions, CustomSelectorEventProps } from './types'

export default (editor: Editor, options: AdvancedSelectorOptions, container: HTMLElement) => {
  editor.on('selector:custom', props => updateUi(editor, options, container, props))
}

function updateUi(editor: Editor, options: AdvancedSelectorOptions, container: HTMLElement, props: CustomSelectorEventProps) {
  console.log('updateUi', props)
  render(html`
    <as-classes
      .selected=${props.selected}
      .states=${props.states}
      .options=${options.classSelector}
      .editor=${editor}
    ></as-classes>
    <as-selector-display
      .editor=${editor}
    ></as-selector-display>
  `, container)
}