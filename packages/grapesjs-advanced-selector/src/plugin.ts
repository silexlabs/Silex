import { Component, CssRule, Editor } from 'grapesjs'
import { html, render } from 'lit'
import { editStyle, getComponentSelector, getSelectors, getSuggestionsMain, getSuggestionsRelated, renameSelector, setComponentSelector } from './model/GrapesJs'
import { activateSelectors, ComplexSelector, EMPTY_SELECTOR, merge, same, toString } from './model/ComplexSelector'
import { IdSelector, SimpleSelectorType } from './model/SimpleSelector'

////////////////
// Types
export type AdvancedSelectorOptions = {
  classSelector: {
    label: string
  }
}

type CustomSelectorEventProps = {
  container: HTMLElement
}

////////////////
// Globals
const container = document.createElement('div')
container.id = 'asm-container'

////////////////
// Plugin functions
export function initListeners(editor: Editor) {
  return
  //editor.on('component:selected', (component: Component) => {
  //  updateUi(editor, [component])
  //})
  // When a class changes
  editor.on('selector', (...args) => {
    console.log('============> component:classes', args)
  })
  editor.on('component:update:classes', (...args) => {
    console.log('============', ...args)
    // console.log("========== Component class list updated:", component, component.getC);
    // // Get the class that changed
    // const changedClass = component
    //   .getClasses()
    //   .filter((cls) => component.previous('classes') !== component.get(cls))[0];
    // const classNames = component.getClasses()
    // console.log("============ Updated class names:", classNames);
  })

}

export function initASM(editor: Editor, options: AdvancedSelectorOptions, props?: CustomSelectorEventProps) {
  if (props && props.container) {
    props.container.appendChild(container)
    editor.on('selector:custom', ({ selected }: {selected: CssRule[]}) => updateUi(editor, selected))
  } else {
    // Keep listening
    editor.once('selector:custom', (props) => initASM(editor, options, props))
  }
}

function updateUi(editor: Editor, selected: CssRule[]) {
  console.log('TODO handle all styles?', selected)
  //const selectors = getSelectors(editor)
  //const selector = selectors[0]
  const components: Component[] = editor.getSelectedAll()
  const selector = getSelector(components)
  if(selector) {
    requestAnimationFrame(() => editStyle(editor, toString(selector)))
    render(html`
      <complex-selector
        .value=${selector}
        .suggestions=${getSuggestionsMain(editor, components, selector)}
        .relations=${getSuggestionsRelated(editor, components, selector)}
        @change=${(event: CustomEvent) => chagedSelector(event.detail as ComplexSelector, editor, components)}
        @rename=${(event: CustomEvent) => renameSelector(editor, event.detail.oldValue, event.detail.value) }
      ></complex-selector>

      <current-selector-display
        .value=${getSelector(components)}
        .selectors=${getSelectors(editor)}
        .selectedId=${components[0]?.getId()}
        @change=${(event: CustomEvent) => chagedSelectorKeep(event.detail as ComplexSelector, editor, components)}
      ></current-selector-display>
    `, container)
  } else {
    render(html`
      <p>Select a component to edit its selector</p>
    `, container)
  }
}

function getSelector(components: Component[]): ComplexSelector | null {
  if(components.length === 0) return null
  const selectors: ComplexSelector[] = components
    .map((component) => getComponentSelector(component) || EMPTY_SELECTOR)
  const selector = same(selectors)
  if(!selector) return null
  const idSelectorOff: IdSelector = {
    type: SimpleSelectorType.ID,
    value: components[0].getId(),
    active: false,
  }
  const idSelectorOn: IdSelector = {
    type: SimpleSelectorType.ID,
    value: components[0].getId(),
    active: true,
  }
  const newSelector = merge(selector, { mainSelector: { selectors: [idSelectorOff] } })
  if(toString(newSelector) === '') {
    return activateSelectors(newSelector, { mainSelector: { selectors: [idSelectorOn] } })
  }
  return activateSelectors(newSelector, { mainSelector: { selectors: [idSelectorOff] } })
}

function chagedSelector(selector: ComplexSelector, editor: Editor, components: Component[]) {
  components.forEach((component) => {
    setComponentSelector(component, selector)
  })
  editStyle(editor, toString(selector))
}

// Keep inactive and put the active as inactive
function chagedSelectorKeep(selector: ComplexSelector, editor: Editor, components: Component[]) {
  components.forEach((component) => {
    const oldSelector = getComponentSelector(component) || EMPTY_SELECTOR
    const newSelector = merge(oldSelector, selector)
    const activated = activateSelectors(newSelector, selector)
    setComponentSelector(component, activated)
  })
  editStyle(editor, toString(selector))
}
