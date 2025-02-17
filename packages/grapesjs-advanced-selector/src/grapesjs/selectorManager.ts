import { html, render } from 'lit'
import { CssRule, Editor } from 'grapesjs'
import { ComplexSelector } from '../model/ComplexSelector'
import { convertRulesToModel } from './model'

export type AdvancedSelectorOptions = {
  classSelector: {
    label: string
  }
}

type CustomSelectorEventProps = {
  container: HTMLElement
}

// Create a container for the custom selector
const container = document.createElement('div')
container.id = 'asm-container'

// Append the container to the SelectorManager container
export function initSelectorCustom(editor: Editor, options: AdvancedSelectorOptions, props?: CustomSelectorEventProps) {
  if (props && props.container) {
    props.container.appendChild(container)
    editor.on('selector:custom', ({ selected }: {selected: CssRule[]}) => updateUi(editor, selected))
  } else {
    // Keep listening
    editor.once('selector:custom', (props) => initSelectorCustom(editor, options, props))
  }
}

function updateUi(editor: Editor, selected: CssRule[]) {
  const selectors = getSelectors(editor)
  const selector = selectors[0]
  console.log('updateUi', selected, selectors)
  render(html`
    <complex-selector
      .value=${selector}
      .suggestions=${[]}
      .relations=${[]}
      @change=${(e: CustomEvent) => editStyle(editor, e.detail)}
    ></complex-selector>
    <current-selector-display
      .value=${editor.getSelected()?.getSelectorsString()}
    ></current-selector-display>
  `, container)
}

function getSelectors(editor: Editor): ComplexSelector[] {
  //const selectors = editor.CssComposer.getAll()
  //console.log({selectors})
  // FIXME: Handle multi-selection
  const component = editor.getSelected()
  const rules = editor.CssComposer.getRules()
    .filter((rule: CssRule) => component?.view?.el.matches(rule.getSelectorsString()))

  console.log('getSelectors', rules)
  return convertRulesToModel(rules)
}

// Function to edit or add style based on the selector
function editStyle(editor: Editor, selector: string) {
  
  // Get the selected component
  const selectedComponent = editor.getSelected()

  if (!selectedComponent) {
    console.warn('No component is selected')
    return
  }

  // Add the class (or use tag selector if it's a tag like `.title`)
  //const _class = selectedComponent.setClass(selector)
  //console.log({_class})

  // Get or create the CSS rule for the given selector
  const rule = editor.CssComposer.setRule(selector)
  console.log('editStye', { rule })

  editor.StyleManager.select(rule)

  //// Apply some default styles (optional)
  //rule.setStyle({
  //  'color': 'blue',
  //  'font-size': '18px',
  //});

  // Ensure the component is still selected for the Style Manager to work
  //editor.select(selectedComponent);
}