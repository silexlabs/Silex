import { Editor, Component } from 'grapesjs'
import { getState, StoredState } from '../model/state'
import { Properties, StoredToken, BinariOperator, UnariOperator, PREVIEW_RENDER_START, PREVIEW_RENDER_END, PREVIEW_RENDER_ERROR, DataSourceEditorViewOptions } from '../types'
import { fromStored } from '../model/token'
import { DataTree } from '../model/DataTree'
import { getDataTreeFromUtils } from '../utils'

function getPrivateState(component: Component, stateId: string): StoredState | null {
  return getState(component, stateId, false)
}

// Pure function to evaluate a single condition
function evaluateCondition(expression: StoredToken[], component: Component, dataTree: DataTree): unknown | null {
  try {
    const tokens = expression.map(token => fromStored(token, dataTree, component.getId?.() || null))
    return dataTree.getValue(tokens, component, true)
  } catch (e) {
    console.warn('Error evaluating condition:', e)
    return null
  }
}

// Pure function to render innerHTML for a component at a specific loop index
function renderInnerHTML(component: Component, dataTree: DataTree, loopIndex?: number): string | null {
  const innerHTML = getPrivateState(component, Properties.innerHTML)
  if (innerHTML === null) {
    return null
  }
  try {
    // Set preview index for loop context
    if (typeof loopIndex === 'number') {
      setPreviewIndex(component, loopIndex)
    }
    const value = evaluateCondition(innerHTML.expression, component, dataTree)
    return value !== null && value !== undefined ? String(value) : null
  } catch (e) {
    console.warn('Error rendering innerHTML:', e)
    return null
  }
}

// Pure function to set preview index on all tokens in a component
function setPreviewIndex(component: Component, index: number): void {
  const privateStates = component.get('privateStates') || []
  privateStates.forEach((state: {id: string, expression: StoredToken[]}) => {
    if (state.expression && state.expression.length > 0) {
      state.expression.forEach((token: StoredToken & {previewIndex?: number}) => {
        if (token.type === 'state' && token.storedStateId === '__data') {
          token.previewIndex = index
        } else if (token.type === 'property' || token.type === 'filter') {
          token.previewIndex = index
        }
      })
    }
  })
}

function renderLoopData(
  component: Component,
  dataTree: DataTree,
): unknown[] | null {
  try {
    const dataState = getPrivateState(component, Properties.__data)!
    if (dataState === null) {
      return null
    }
    const result = dataTree.getValue(dataState.expression, component, false) // Get full array
    return Array.isArray(result) ? result : null
  } catch (e) {
    console.warn('Error getting loop data:', e)
    return null
  }
}

// Export for tests
export function isComponentVisible(
  component: Component,
  dataTree: DataTree,
): boolean {
  const condition1State = getPrivateState(component, Properties.condition)
  const condition2State = getPrivateState(component, Properties.condition2)
  const conditionOperator = component.get('conditionOperator')

  // If no condition is set, component is visible
  if (!condition1State || !condition1State?.expression || condition1State?.expression.length === 0) {
    return true
  }

  const condition1Value = dataTree.getValue(condition1State.expression, component, true)

  // For unary operators, only condition1 is needed
  switch (conditionOperator) {
  case UnariOperator.TRUTHY:
    return !!condition1Value
  case UnariOperator.FALSY:
    return !condition1Value
  case UnariOperator.EMPTY_ARR:
    return Array.isArray(condition1Value) && condition1Value.length === 0
  case UnariOperator.NOT_EMPTY_ARR:
    return Array.isArray(condition1Value) && condition1Value.length > 0
  case undefined:
  case null:
    // If no operator is specified but condition1 exists, default to TRUTHY behavior
    return !!condition1Value
  default:
  }

  // For binary operators, we need condition2
  if (!condition2State || !condition2State.expression || condition2State.expression.length === 0) {
    return false
  }

  const condition2Value = dataTree.getValue(condition2State.expression, component, true)

  // Apply binary operator
  switch (conditionOperator) {
  case BinariOperator.EQUAL:
    return condition1Value == condition2Value
  case BinariOperator.NOT_EQUAL:
    return condition1Value !== condition2Value
  case BinariOperator.GREATER_THAN:
    return Number(condition1Value) > Number(condition2Value)
  case BinariOperator.LESS_THAN:
    return Number(condition1Value) < Number(condition2Value)
  case BinariOperator.GREATER_THAN_OR_EQUAL:
    return Number(condition1Value) >= Number(condition2Value)
  case BinariOperator.LESS_THAN_OR_EQUAL:
    return Number(condition1Value) <= Number(condition2Value)
  default:
    throw new Error(`Unknown operator ${conditionOperator}`)
  }
}

function renderAttributes(
  component: Component,
  dataTree: DataTree,
): void {
  const privateStates = component.get('privateStates') || []
  privateStates.forEach((state: {id: string, expression: StoredToken[], label?: string}) => {
    // Skip condition states and internal data states - they should not become HTML attributes
    if (state.id &&
        state.id !== Properties.innerHTML &&
        state.id !== Properties.__data &&
        state.id !== Properties.condition &&
        state.id !== Properties.condition2 &&
        state.expression) {
      try {
        const value = dataTree.getValue(state.expression, component, true)
        if (value !== null && value !== undefined) {
          component.view?.el.setAttribute(state.label || state.id, String(value))
        }
      } catch (e) {
        console.warn(`Error evaluating attribute ${state.id}:`, e)
      }
    }
  })
}

// // Helper to extend a component instance
// function extendComponent(comp: Component, onRender: (c: Component) => void) {
//   // Extend view
//   if (comp.view) {
//     const origOnRender = comp.view.onRender?.bind(comp.view)
//     comp.view.onRender = function (opts: ClbObj) {
//       if (origOnRender) origOnRender(opts)
//       onRender(comp)
//     }
//   }
// }
//
// /**
//  * Applies extended model/view logic to all existing components in the editor.
//  * @param editor The GrapesJS editor instance
//  */
// function extendAllComponents(editor: Editor, onRender: (c: Component) => void, parents: Components = editor.getComponents()) {
//   parents.forEach((comp) => {
//     extendComponent(comp, onRender)
//     extendAllComponents(editor, onRender, comp.components())
//   })
// }
//

function renderContent(comp: Component, dataTree: DataTree, deep: number) {
  const innerHtml = renderInnerHTML(comp, dataTree)
  
  if (innerHtml === null) {
    comp.view!.render()
    comp.components()
      .forEach(c => renderPreview(c, dataTree, deep+1))
  } else {
    comp.view!.el.innerHTML = innerHtml!
  }
}

// exported for unit tests only
export function renderPreview(comp: Component, dataTree: DataTree, deep = 0) {
  const view = comp.view
  if (!view) {
    return
  }
  const el = view.el
  const __data = renderLoopData(comp, dataTree)
  if (__data) {
    if (__data.length === 0) {
      el.remove()
    } else {
      // Render each loop iteration
      // Render first iteration in the original element
      setPreviewIndex(comp, 0)
      if(isComponentVisible(comp, dataTree)) {
        renderContent(comp, dataTree, deep)
        renderAttributes(comp, dataTree)
      } else {
        el.remove()
      }

      // For subsequent iterations: clone first, then render into original, then clone again
      for (let idx = 1; idx < __data.length; idx++) {
        // Clone the current state (with previous iteration's content)
        const clone = el.cloneNode(true) as HTMLElement
        el.insertAdjacentElement('afterend', clone)

        // Set preview index for the next iteration and render into original element
        setPreviewIndex(comp, idx)
        if (isComponentVisible(comp, dataTree)) {
          renderContent(comp, dataTree, deep)
          renderAttributes(comp, dataTree)
        } else {
          // el.setAttribute('data-hidden', '')
          // el.style.display = 'none'
          // el.innerHTML = 'xxxx'
          el.remove()
        }
      }
    }
  } else {
    if(isComponentVisible(comp, dataTree)) {
      renderContent(comp, dataTree, deep)
      renderAttributes(comp, dataTree)
    } else {
      el.remove()
    }
  }
}

export function doRender(editor: Editor, dataTree: DataTree) {
  if(!editor.getWrapper()?.view?.el) {
    return
  }
  try {
    editor.trigger(PREVIEW_RENDER_START)
    renderPreview(editor.getWrapper()!, dataTree)

    requestAnimationFrame(() => {
      editor.trigger(PREVIEW_RENDER_END)
    })
  } catch (err) {
    editor.trigger(PREVIEW_RENDER_ERROR, err)
    console.error('Error during preview render:', err)
  }
}

let renderTimeoutId: NodeJS.Timeout | null = null
let debounceDelay = 500
function debouncedRender(editor: Editor, dataTree: DataTree) {
  if (renderTimeoutId) clearTimeout(renderTimeoutId)
  renderTimeoutId = setTimeout(() => {
    doRender(editor, dataTree)
    renderTimeoutId = null
  }, debounceDelay)
}

export default (editor: Editor, opts: DataSourceEditorViewOptions) => {
  const dataTree = getDataTreeFromUtils()
  editor.on(opts.previewRefreshEvents!, () => debouncedRender(editor, dataTree))// : doRender(editor, dataTree))
  setTimeout(() => {
    debounceDelay = opts.previewDebounceDelay!
  }, 1000)
}
