import { html, render } from 'lit'
import './components/as-classes'
import './components/as-completion'
import display from './components/as-selector-display'
import { CssRule, Editor } from 'grapesjs'
import { AdvancedSelectorOptions, CustomSelectorEventProps } from './types'
import { createRef, ref } from 'lit/directives/ref.js'
import { getSelectors } from './model'

export default (editor: Editor, options: AdvancedSelectorOptions, container: HTMLElement) => {
  editor.on('selector:custom', props => updateUi(editor, options, container, props))
}

const inputRef = createRef<HTMLSpanElement>()

function updateUi(editor: Editor, options: AdvancedSelectorOptions, container: HTMLElement, props: CustomSelectorEventProps) {
  const selected = getSelectors(editor, editor.getSelectedAll()) 
  const components = editor.getSelectedAll()
  render(html`
    <div>
      <input
        ${ref(inputRef)}
        type="text"
      />
      <button
        @click=${() => {
          const input = inputRef.value as HTMLInputElement
          console.log('APPLY', input.value)
          editStyle(editor, input.value)
        }}
      />APPLY</button>
      <button
        @click=${() => {
          const component = editor.getSelected()
          const rules = editor.CssComposer.getRules()
            .filter((rule: CssRule) => component?.view?.el.matches(rule.getSelectorsString()))

          console.log('GET', rules, rules.map(
            (rule: CssRule) => rule.getSelectorsString()
          ))
        }}
       >GET</button>
    </div>
    <as-classes
      .editor=${editor}
      .data-old-selected=${props.selected}
      .selected=${ selected }
      .components=${ components }
      .states=${props.states}
      .options=${options.classSelector}
    ></as-classes>
    <as-completion
      .editor=${editor}
      .selected=${ selected }
      .components=${ components }
      .combinator=${ null }
    ></as-completion>
    ${ display(editor) }
  `, container)
}

// Function to edit or add style based on the selector
function editStyle(editor: Editor, selector: string) {
  
  // Get the selected component
  const selectedComponent = editor.getSelected();

  if (!selectedComponent) {
    console.warn('No component is selected');
    return;
  }

  // Add the class (or use tag selector if it's a tag like `.title`)
  //const _class = selectedComponent.setClass(selector)
  //console.log({_class})

  // Get or create the CSS rule for the given selector
  const rule = editor.CssComposer.setRule(selector);
  console.log({rule})

  editor.StyleManager.select(rule)

  //// Apply some default styles (optional)
  //rule.setStyle({
  //  'color': 'blue',
  //  'font-size': '18px',
  //});

  // Ensure the component is still selected for the Style Manager to work
  //editor.select(selectedComponent);
}
