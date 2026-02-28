import { Component, Editor } from 'grapesjs'
import { html, render } from 'lit'
import { clearStyle, editStyle, getComponentSelector, getSelectedStyle, getSelectors, getSuggestionsMain, getSuggestionsRelated, getTranslation, getUntranslatedKeys, matchSelectorAll, matchSelectorSome, removeClass, renameSelector, setComponentSelector, setSelectedStyle } from './model/GrapesJsSelectors'
import { activateSelectors, ComplexSelector, EMPTY_SELECTOR, merge, toString, getSelector, noPseudo } from './model/ComplexSelector'
import { BODY_CANVAS_CLASS, rewriteBodyRulesInCanvas } from './model/BodyRemapping'
import './components/complex-selector'
import './components/current-selector-display'

// Debounce utility (no semicolons, matches code style)
function debounce(fn: (...args: any[]) => void, delay: number = 100) {
  let timer: ReturnType<typeof setTimeout>
  return function(this: any, ...args: any[]) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

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
export function initListeners(editor: Editor, options: AdvancedSelectorOptions) {
  editor.Commands.add('i18n:info', () => {
    console.log('i18n', getUntranslatedKeys())
  })
  editor.on('undo redo', () => {
    requestAnimationFrame(() => updateUi(editor, options))
  })
  // editor.on('component:selected', () => {
  //   console.log('============> component:selected')
  //   requestAnimationFrame(() => updateUi(editor, options))
  // })
  // // When a class changes
  // editor.on('selector', (...args) => {
  //   console.log('============> component:classes', args)
  //   requestAnimationFrame(() => updateUi(editor, options))
  // })
  // editor.on('component:update:classes', (...args) => {
  //   console.log('============ component:update:classes', args)
  //   requestAnimationFrame(() => updateUi(editor, options)) // Delay to avoid flicker of warning
  //   // console.log("========== Component class list updated:", component, component.getC);
  //   // // Get the class that changed
  //   // const changedClass = component
  //   //   .getClasses()
  //   //   .filter((cls) => component.previous('classes') !== component.get(cls))[0];
  //   // const classNames = component.getClasses()
  //   // console.log("============ Updated class names:", classNames);
  // })
}

export function initASM(editor: Editor, options: AdvancedSelectorOptions, props?: CustomSelectorEventProps) {
  if (props && props.container) {
    props.container.appendChild(container)
    editor.on('selector:custom component:update', debounce(() => updateUi(editor, options)))
  } else {
    // Keep listening
    editor.once('selector:custom', (props) => initASM(editor, options, props))
  }
  setupBodyCanvasRemap(editor)
}

/**
 * Remap `body` selectors in the canvas iframe to target the wrapper element.
 * In GrapesJS the iframe DOM is <body> → <div.wrapper> → [page components].
 * We add a class to the wrapper and rewrite CSSOM rules so styles intended
 * for "body" visually apply to the wrapper instead — without changing the
 * CssComposer model (publication still outputs `body`).
 */
function setupBodyCanvasRemap(editor: Editor) {
  function rewrite() {
    const doc = editor.Canvas.getDocument()
    if (!doc) return

    // Ensure wrapper has the class (DOM-only, no model change)
    const wrapper = editor.getWrapper()
    if (wrapper?.view?.el) {
      wrapper.view.el.classList.add(BODY_CANVAS_CLASS)
    }

    rewriteBodyRulesInCanvas(doc)
  }

  const debouncedRewrite = debounce(rewrite, 100)

  // Rewrite after frame loads (initial + page switch)
  editor.on('canvas:frame:load', debouncedRewrite)
  editor.on('page', debouncedRewrite)

  // Rewrite when CSS rules change (debounced — style:change fires rapidly during drag)
  editor.on('style:change', debouncedRewrite)
  editor.on('component:styleUpdate', debouncedRewrite)
  editor.on('undo redo', debouncedRewrite)

  // Rewrite when selector changes — component.setClass() strips DOM-only classes
  // This is needed in firefox ff only
  editor.on('selector:custom', debouncedRewrite)
  editor.on('component:update', debouncedRewrite)
}

function updateUi(editor: Editor, options: AdvancedSelectorOptions) {
  const components: Component[] = editor.getSelectedAll()
  const widthMedia = editor.DeviceManager.getSelected()?.get('widthMedia')
  const selectorInitial = getSelector(components)
  if(selectorInitial) {
    const selector = {
      ...selectorInitial,
      atRule: widthMedia ? `@media (max-width: ${widthMedia})` : undefined,
    }
    const [errors, warnings] = getErrorsAndWarnings(selector, components)
    requestAnimationFrame(() => editStyle(editor, toString(selector)))
    render(html`
      <current-selector-display
        .t=${(key: string) => getTranslation(editor, key)}
        .value=${selector || undefined}
        .selectors=${getSelectors(editor)}
        .helpLink=${options.helpLinks.actionBar}
        .error=${getTranslation(editor, errors || '')}
        .warning=${getTranslation(editor, warnings || '')}
        @change=${(event: CustomEvent) => mergeSelector(event.detail as ComplexSelector, editor, components)}
        @delete=${() => deleteSelector(editor, selector)}
        @copy=${() => copyStyle(editor)}
        @paste=${() => pasteStyle(editor)}
      ></current-selector-display>
      <complex-selector
        .t=${(key: string) => getTranslation(editor, key)}
        .hasBody=${components.some(c => c.tagName.toLocaleLowerCase() === 'body')}
        .value=${selector}
        .suggestions=${getSuggestionsMain(editor, components, selector)}
        .relations=${getSuggestionsRelated(editor, components, selector)}
        @change=${(event: CustomEvent) => changedSelector(event.detail as ComplexSelector, editor, components)}
        @rename=${(event: CustomEvent) => renameSelector(editor, event.detail.oldValue, event.detail.value) }
        @removeClass=${(event: CustomEvent) => removeClass(editor, event.detail) }
      ></complex-selector>
    `, container)
  } else {
    render(html`
      <p>Select a component to edit its selector</p>
    `, container)
  }
}

function changedSelector(selector: ComplexSelector, editor: Editor, components: Component[]) {
  const isBody = components.some(c => c.tagName?.toLowerCase() === 'body')
  // For body: body tag and ID are mutually exclusive
  if (isBody) {
    const bodyTagActive = selector.mainSelector.selectors
      .some(s => s.type === 'tag' && (s as any).value === 'body' && s.active)
    if (bodyTagActive) {
      selector = {
        ...selector,
        mainSelector: {
          ...selector.mainSelector,
          selectors: selector.mainSelector.selectors.map(s =>
            s.type === 'id' ? { ...s, active: false } : s
          ),
        },
      }
    }
  }
  components.forEach((component) => {
    setComponentSelector(component, selector)
  })
  editStyle(editor, toString(selector))
}

/**
 * Merge the selector with the current selector of the components
 * If a simple selector is missing, just deactivate it
 * Handles the atRule and pseudoClass
 */
function mergeSelector(selector: ComplexSelector, editor: Editor, components: Component[]) {
  components.forEach((component) => {
    const oldSelector = getComponentSelector(component) || EMPTY_SELECTOR
    const newSelector = merge(oldSelector, selector)
    const activated = activateSelectors(newSelector, selector)
    activated.atRule = selector.atRule // We merged but want to keep the atRule
    activated.mainSelector.pseudoClass = selector.mainSelector.pseudoClass // We merged but want to keep the pseudoClass
    if (activated.relatedSelector) activated.relatedSelector.pseudoClass = selector.relatedSelector?.pseudoClass // We merged but want to keep the pseudoClass
    setComponentSelector(component, activated)
  })
  // Select the device if the selector contains the device
  if(selector.atRule) {
    const device = editor.DeviceManager.getAll().find(device => {
      const width = device.get('widthMedia')
      return !!width && selector.atRule!.includes(width)
    })?.get('id')
    if(device) editor.DeviceManager.select(device)
  } else {
    editor.DeviceManager.select(editor.DeviceManager.getAll().first())
  }
  editStyle(editor, toString(selector))
}

/**
 * Deletes the current selector's style from the editor.
 * Clears the style associated with the selector and updates the editor UI.
 * This does not remove the selector itself, but resets its styling.
 */
function deleteSelector(editor: Editor, selector: ComplexSelector) {
  clearStyle(editor)
  editStyle(editor, toString(selector))
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
  const selectorNoPseudo: ComplexSelector = noPseudo(selector)
  if (!matchSelectorAll(toString(selectorNoPseudo, true), components)) {
    return ['Current selector does not match the selected components', null]
  } else if (!matchSelectorSome(toString(selectorNoPseudo, true), components)) {
    return [null, 'Current selector does not match all the selected components']
  }
  return [null, null]
}
