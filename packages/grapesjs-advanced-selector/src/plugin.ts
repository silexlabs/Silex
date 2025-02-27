import { Component, Editor } from 'grapesjs'
import { html, render } from 'lit'
import { clearStyle, editStyle, getComponentSelector, getSelectedStyle, getSelectors, getSuggestionsMain, getSuggestionsRelated, getTranslation, getUntranslatedKeys, matchSelectorAll, matchSelectorSome, renameSelector, setComponentSelector, setSelectedStyle } from './model/GrapesJsSelectors'
import { activateSelectors, ComplexSelector, EMPTY_SELECTOR, merge, same, toString } from './model/ComplexSelector'
import { IdSelector, SimpleSelectorType } from './model/SimpleSelector'

////////////////
// Types
export type AdvancedSelectorOptions = {
  i18n: {
    [key: string]: string
  }
  helpLinks: {
    actionBar: string
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
  editor.Commands.add('i18n:info', () => {
    console.log('i18n', getUntranslatedKeys())
  })
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
    editor.on('selector:custom', (/*{ selected }: {selected: CssRule[]}*/) => updateUi(editor, options))
  } else {
    // Keep listening
    editor.once('selector:custom', (props) => initASM(editor, options, props))
  }
}

function updateUi(editor: Editor, options: AdvancedSelectorOptions) {
  const components: Component[] = editor.getSelectedAll()
  const selector = getSelector(components)
  if(selector) {
    const [errors, warnings] = getErrorsAndWarnings(selector, components)
    requestAnimationFrame(() => editStyle(editor, toString(selector)))
    render(html`
      <complex-selector
        .t=${(key: string) => getTranslation(editor, key)}
        .value=${selector}
        .suggestions=${getSuggestionsMain(editor, components, selector)}
        .relations=${getSuggestionsRelated(editor, components, selector)}
        @change=${(event: CustomEvent) => chagedSelector(event.detail as ComplexSelector, editor, components)}
        @rename=${(event: CustomEvent) => renameSelector(editor, event.detail.oldValue, event.detail.value) }
      ></complex-selector>

      <current-selector-display
        .t=${(key: string) => getTranslation(editor, key)}
        .value=${getSelector(components)}
        .selectors=${getSelectors(editor)}
        .helpLink=${options.helpLinks.actionBar}
        .error=${errors}
        .warning=${warnings}
        @change=${(event: CustomEvent) => mergeSelector(event.detail as ComplexSelector, editor, components)}
        @delete=${() => deleteSelector(editor)}
        @copy=${() => copyStyle(editor)}
        @paste=${() => pasteStyle(editor)}
      ></current-selector-display>
    `, container)
  } else {
    render(html`
      <p>Select a component to edit its selector</p>
    `, container)
  }
}

/**
 * Make sure that the selector always contains the ID of the component
 */
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
  // // Deactivate the ID selector
  // newSelector.mainSelector.selectors = newSelector.mainSelector.selectors.map((selector) => {
  //   if (selector.type === SimpleSelectorType.ID) {
  //     return idSelectorOff
  //   }
  //   return selector
  // })
  // Activate the ID if it needs to be activated
  if (!toString(newSelector)) {
    newSelector.mainSelector.selectors = newSelector.mainSelector.selectors.map((selector) => {
      if (selector.type === SimpleSelectorType.ID) {
        return idSelectorOn
      }
      return selector
    })
  }
  return newSelector
}

function chagedSelector(selector: ComplexSelector, editor: Editor, components: Component[]) {
  components.forEach((component) => {
    setComponentSelector(component, selector)
  })
  editStyle(editor, toString(selector))
}

// Keep inactive and put the active as inactive
function mergeSelector(selector: ComplexSelector, editor: Editor, components: Component[]) {
  components.forEach((component) => {
    const oldSelector = getComponentSelector(component) || EMPTY_SELECTOR
    const newSelector = merge(oldSelector, selector)
    const activated = activateSelectors(newSelector, selector)
    activated.atRule = selector.atRule // We merged but want to keep the atRule
    activated.mainSelector.pseudoClass = selector.mainSelector.pseudoClass // We merged but want to keep the pseudoClass
    setComponentSelector(component, activated)
  })
  // Select the device if the selector contains the device
  if(selector.atRule) {
    const device = editor.DeviceManager.getAll().find(device => {
      const width = device.get('width')
      return !!width && selector.atRule!.includes(width)
    })?.get('id')
    if(device) editor.DeviceManager.select(device)
  } else {
    editor.DeviceManager.select(editor.DeviceManager.getAll().first())
  }
  editStyle(editor, toString(selector))
}

function deleteSelector(editor: Editor) {
  clearStyle(editor)
}

function copyStyle(editor: Editor) {
  localStorage?.setItem('asm:clipboard', JSON.stringify(getSelectedStyle(editor)))
}

function pasteStyle(editor: Editor) {
  const clipboard = localStorage?.getItem('asm:clipboard')
  if(clipboard) {
    const style = JSON.parse(clipboard)
    setSelectedStyle(editor, style)
  }
}

function getErrorsAndWarnings(selector: ComplexSelector, components: Component[]): [string | null, string | null] {
  if (!matchSelectorAll(toString(selector), components)) {
    return ['Current selector does not match the selected components', null]
  } else if (!matchSelectorSome(toString(selector), components)) {
    return [null, 'Current selector does not match all the selected components']
  }
  return [null, null]
}
