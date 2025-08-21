import { ComponentView, Editor, Component } from 'grapesjs'
import { getState } from '../model/state'
import { Properties, DATA_SOURCE_CHANGED, DATA_SOURCE_DATA_LOAD_END, StoredToken, BinariOperator, UnariOperator } from '../types'
import { getDataTreeFromUtils } from '../utils'
import { fromStored } from '../model/token'
import { DataTree } from '../model/DataTree'
import { getPreviewActive } from '../commands'

// Pure function to check if a component has a specific state
export function hasState(component: Component, stateId: string): boolean {
  const state = getState(component, stateId, false)
  return !!(state && state.expression && state.expression.length > 0)
}

// Pure function to get loop data from a component
export function getLoopData(component: Component, dataTree: DataTree): any[] | null {
  if (!hasState(component, Properties.__data)) {
    return null
  }

  try {
    const dataState = getState(component, Properties.__data, false)!
    const tokens = dataState.expression.map(token => fromStored(token, dataTree, component.getId?.() || null))
    const result = dataTree.getValue(tokens, component, false) // Get full array
    return Array.isArray(result) ? result : null
  } catch (e) {
    console.warn('Error getting loop data:', e)
    return null
  }
}

// Pure function to evaluate a single condition
export function evaluateCondition(expression: StoredToken[], dataTree: DataTree, component: Component): any {
  try {
    const tokens = expression.map(token => fromStored(token, dataTree, component.getId?.() || null))
    return dataTree.getValue(tokens, component, true)
  } catch (e) {
    console.warn('Error evaluating condition:', e)
    return null
  }
}

// Pure function to check visibility based on conditions
export function isComponentVisible(component: Component, dataTree: DataTree): boolean {
  const conditionState = getState(component, Properties.condition, false)
  const condition2State = getState(component, Properties.condition2, false)
  const conditionOperator = component.get ? component.get('conditionOperator') : undefined

  // If no condition is set, component is visible
  if (!conditionState || !conditionState.expression || conditionState.expression.length === 0) {
    return true
  }

  try {
    const condition1Value = evaluateCondition(conditionState.expression, dataTree, component)

    // For unary operators, only condition1 is needed
    if (!conditionOperator || Object.values(UnariOperator).includes(conditionOperator)) {
      switch (conditionOperator) {
      case UnariOperator.TRUTHY:
        return !!condition1Value
      case UnariOperator.FALSY:
        return !condition1Value
      case UnariOperator.EMPTY_ARR:
        return Array.isArray(condition1Value) && condition1Value.length === 0
      case UnariOperator.NOT_EMPTY_ARR:
        return Array.isArray(condition1Value) && condition1Value.length > 0
      default:
        return !!condition1Value
      }
    }

    // For binary operators, we need condition2
    if (!condition2State || !condition2State.expression || condition2State.expression.length === 0) {
      return true
    }

    const condition2Value = evaluateCondition(condition2State.expression, dataTree, component)

    // Apply binary operator
    switch (conditionOperator) {
    case BinariOperator.EQUAL:
      // Handle null/undefined values properly for equality checks
      if (condition1Value === null || condition1Value === undefined || condition1Value === '') {
        return false
      }
      return condition1Value == condition2Value
    case BinariOperator.NOT_EQUAL:
      return condition1Value != condition2Value
    case BinariOperator.GREATER_THAN:
      return Number(condition1Value) > Number(condition2Value)
    case BinariOperator.LESS_THAN:
      return Number(condition1Value) < Number(condition2Value)
    case BinariOperator.GREATER_THAN_OR_EQUAL:
      return Number(condition1Value) >= Number(condition2Value)
    case BinariOperator.LESS_THAN_OR_EQUAL:
      return Number(condition1Value) <= Number(condition2Value)
    default:
      return true
    }
  } catch (e) {
    console.warn('Error evaluating visibility condition:', e)
    return true
  }
}

// Pure function to render innerHTML for a component at a specific loop index
export function renderInnerHTML(component: Component, dataTree: DataTree, loopIndex?: number): string | null {
  if (!hasState(component, Properties.innerHTML)) {
    return null
  }

  try {
    // Set preview index for loop context
    if (typeof loopIndex === 'number') {
      setPreviewIndex(component, loopIndex)
    }

    const innerHTMLState = getState(component, Properties.innerHTML, false)!
    const value = evaluateCondition(innerHTMLState.expression, dataTree, component)
    return value !== null && value !== undefined ? String(value) : null
  } catch (e) {
    console.warn('Error rendering innerHTML:', e)
    return null
  }
}

// Pure function to set preview index on all tokens in a component
export function setPreviewIndex(component: Component, index: number): void {
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

// Pure function to create a clone of an element with loop-specific attributes
export function createLoopElement(originalEl: HTMLElement, index: number): HTMLElement {
  const loopEl = originalEl.cloneNode(false) as HTMLElement

  // Copy all attributes from original element
  Array.from(originalEl.attributes).forEach(attr => {
    loopEl.setAttribute(attr.name, attr.value)
  })

  // Make ID unique for this loop instance
  if (loopEl.id) {
    loopEl.id = `${loopEl.id}-${index}`
  }

  // Add loop-specific attributes
  loopEl.setAttribute('data-loop-index', index.toString())
  loopEl.setAttribute('data-loop-original-id', originalEl.id || '')

  return loopEl
}

// Main pure function to generate HTML from a component tree
export function generateHtml(
  root: Component,
  getValue: (expression: StoredToken[], component: Component, resolvePreview: boolean) => any,
  select?: (component: Component) => void
): HTMLElement[] {
  // Check if component has loop data
  const loopData = getLoopDataPure(root, getValue)

  if (loopData && loopData.length > 0) {
    // Generate multiple elements for loop component
    return generateLoopElements(root, loopData, getValue, select)
  } else {
    // Generate single element for regular component
    const element = generateSingleElement(root, getValue, select)
    return element ? [element] : []
  }
}

// Pure function to get loop data using getValue
function getLoopDataPure(
  component: Component,
  getValue: (expression: StoredToken[], component: Component, resolvePreview: boolean) => any
): any[] | null {
  if (!hasState(component, Properties.__data)) {
    return null
  }

  try {
    const dataState = getState(component, Properties.__data, false)!
    const result = getValue(dataState.expression, component, false) // Get full array
    return Array.isArray(result) ? result : null
  } catch (e) {
    console.warn('Error getting loop data:', e)
    return null
  }
}

// Generate multiple elements for a loop component
function generateLoopElements(
  component: Component,
  loopData: any[],
  getValue: (expression: StoredToken[], component: Component, resolvePreview: boolean) => any,
  select?: (component: Component) => void
): HTMLElement[] {
  const elements: HTMLElement[] = []

  for (let i = 0; i < loopData.length; i++) {
    // Set preview index for this iteration
    setPreviewIndex(component, i)

    // Check visibility condition
    if (!isComponentVisiblePure(component, getValue)) {
      continue
    }

    // Generate element for this loop iteration
    const element = generateElementForLoopIndex(component, i, getValue, select)
    if (element) {
      elements.push(element)
    }
  }

  return elements
}

// Generate a single element for a regular component
function generateSingleElement(
  component: Component,
  getValue: (expression: StoredToken[], component: Component, resolvePreview: boolean) => any,
  select?: (component: Component) => void
): HTMLElement | null {
  // Check visibility condition
  if (!isComponentVisiblePure(component, getValue)) {
    return null
  }

  const originalEl = component.view?.el
  if (!originalEl) return null

  // Create base element
  const element = originalEl.cloneNode(false) as HTMLElement

  // Copy all attributes from original element
  Array.from(originalEl.attributes).forEach(attr => {
    element.setAttribute(attr.name, attr.value)
  })

  // Render innerHTML if available
  const innerHTML = renderInnerHTMLPure(component, getValue)
  if (innerHTML !== null) {
    element.innerHTML = innerHTML
  } else {
    // Process child components
    const hasVisibleChildren = processChildrenPure(component, element, getValue, select)
    // If no visible children, the container should be hidden
    if (!hasVisibleChildren) {
      return null
    }
  }

  // Process dynamic attributes
  processAttributesPure(component, element, getValue)

  // Add selection event listener if provided
  if (select) {
    element.addEventListener('click', (e) => {
      e.stopPropagation()
      select(component)
    })
  }

  return element
}

// Generate element for a specific loop index
function generateElementForLoopIndex(
  component: Component,
  index: number,
  getValue: (expression: StoredToken[], component: Component, resolvePreview: boolean) => any,
  select?: (component: Component) => void
): HTMLElement | null {
  const originalEl = component.view?.el
  if (!originalEl) return null

  // Create loop element with loop-specific attributes
  const element = createLoopElement(originalEl, index)

  // Render innerHTML if available
  const innerHTML = renderInnerHTMLPure(component, getValue)
  if (innerHTML !== null) {
    element.innerHTML = innerHTML
  } else {
    // Process child components
    const hasVisibleChildren = processChildrenPure(component, element, getValue, select)
    // If no visible children, the container should be hidden
    if (!hasVisibleChildren) {
      return null
    }
  }

  // Process dynamic attributes
  processAttributesPure(component, element, getValue)

  // Add selection event listener if provided
  if (select) {
    element.addEventListener('click', (e) => {
      e.stopPropagation()
      select(component)
    })
  }

  return element
}

// Pure function to check visibility using getValue
function isComponentVisiblePure(
  component: Component,
  getValue: (expression: StoredToken[], component: Component, resolvePreview: boolean) => any
): boolean {
  const conditionState = getState(component, Properties.condition, false)
  const condition2State = getState(component, Properties.condition2, false)
  const conditionOperator = component.get ? component.get('conditionOperator') : undefined

  // If no condition is set, component is visible
  if (!conditionState || !conditionState.expression || conditionState.expression.length === 0) {
    return true
  }

  try {
    const condition1Value = getValue(conditionState.expression, component, true)

    // For unary operators, only condition1 is needed
    if (!conditionOperator || Object.values(UnariOperator).includes(conditionOperator)) {
      switch (conditionOperator) {
      case UnariOperator.TRUTHY:
        return !!condition1Value
      case UnariOperator.FALSY:
        return !condition1Value
      case UnariOperator.EMPTY_ARR:
        return Array.isArray(condition1Value) && condition1Value.length === 0
      case UnariOperator.NOT_EMPTY_ARR:
        return Array.isArray(condition1Value) && condition1Value.length > 0
      default:
        return !!condition1Value
      }
    }

    // For binary operators, we need condition2
    if (!condition2State || !condition2State.expression || condition2State.expression.length === 0) {
      return true
    }

    const condition2Value = getValue(condition2State.expression, component, true)

    // Apply binary operator
    switch (conditionOperator) {
    case BinariOperator.EQUAL:
      // Handle null/undefined values properly for equality checks
      if (condition1Value === null || condition1Value === undefined || condition1Value === '') {
        return false
      }
      return condition1Value == condition2Value
    case BinariOperator.NOT_EQUAL:
      return condition1Value != condition2Value
    case BinariOperator.GREATER_THAN:
      return Number(condition1Value) > Number(condition2Value)
    case BinariOperator.LESS_THAN:
      return Number(condition1Value) < Number(condition2Value)
    case BinariOperator.GREATER_THAN_OR_EQUAL:
      return Number(condition1Value) >= Number(condition2Value)
    case BinariOperator.LESS_THAN_OR_EQUAL:
      return Number(condition1Value) <= Number(condition2Value)
    default:
      return true
    }
  } catch (e) {
    console.warn('Error evaluating visibility condition:', e)
    return true
  }
}

// Pure function to render innerHTML using getValue
function renderInnerHTMLPure(
  component: Component,
  getValue: (expression: StoredToken[], component: Component, resolvePreview: boolean) => any
): string | null {
  if (!hasState(component, Properties.innerHTML)) {
    return null
  }

  try {
    const innerHTMLState = getState(component, Properties.innerHTML, false)!
    const value = getValue(innerHTMLState.expression, component, true)
    return value !== null && value !== undefined ? String(value) : null
  } catch (e) {
    console.warn('Error rendering innerHTML:', e)
    return null
  }
}

// Pure function to process child components
function processChildrenPure(
  component: Component,
  element: HTMLElement,
  getValue: (expression: StoredToken[], component: Component, resolvePreview: boolean) => any,
  select?: (component: Component) => void
): boolean {
  const childComponents = component.components()
  if (!childComponents || childComponents.length === 0) {
    // No children, preserve original content
    element.innerHTML = component.view?.el?.innerHTML || ''
    return true // Has content
  }

  let hasVisibleChildren = false

  childComponents.forEach((childComponent: Component) => {
    if (hasAnyState(childComponent)) {
      // Child has dynamic states - process it recursively
      const childElements = generateHtml(childComponent, getValue, select)
      if (childElements.length > 0) {
        childElements.forEach(childEl => element.appendChild(childEl))
        hasVisibleChildren = true
      }
    } else {
      // Child has no dynamic states - just clone it
      const childEl = childComponent.view?.el
      if (childEl) {
        const clonedChild = childEl.cloneNode(true) as HTMLElement
        if (select) {
          clonedChild.addEventListener('click', (e) => {
            e.stopPropagation()
            select(childComponent)
          })
        }
        element.appendChild(clonedChild)
        hasVisibleChildren = true
      }
    }
  })

  return hasVisibleChildren
}

// Pure function to process attributes using getValue
function processAttributesPure(
  component: Component,
  element: HTMLElement,
  getValue: (expression: StoredToken[], component: Component, resolvePreview: boolean) => any
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
        const value = getValue(state.expression, component, true)
        if (value !== null && value !== undefined) {
          element.setAttribute(state.label || state.id, String(value))
        }
      } catch (e) {
        console.warn(`Error evaluating attribute ${state.id}:`, e)
      }
    }
  })
}


// Helper function to check if component has any dynamic states
function hasAnyState(component: Component): boolean {
  const privateStates = component.get('privateStates') || []
  return privateStates.some((state: {expression: StoredToken[]}) =>
    state.expression && state.expression.length > 0
  )
}


// Main update function - now uses generateHtml for pure HTML generation
export function updateView(type: string, view: ComponentView, editor: Editor): void {
  if (!getPreviewActive()) {
    return
  }

  const el = view.el
  const component = view.model

  try {
    const dataTree = getDataTreeFromUtils(editor)

    // Create getValue function that resolves expressions using dataTree
    const getValue = (expression: StoredToken[], comp: Component, resolvePreview: boolean) => {
      const tokens = expression.map(token => fromStored(token, dataTree, comp.getId?.() || null))
      return dataTree.getValue(tokens, comp, resolvePreview)
    }

    // Create select function for editor integration
    const select = (comp: Component) => {
      if (editor.select) {
        editor.select(comp)
      }
    }

    // Generate HTML elements using pure function
    const generatedElements = generateHtml(component, getValue, select)

    // Apply generated HTML to DOM
    applyGeneratedHtmlToDOM(component, el, generatedElements, editor)

  } catch (e) {
    console.warn('Error updating canvas view:', e)
  }
}


// Helper function to clone DOM structure while preserving event listeners
function cloneElementWithEventListeners(sourceElement: HTMLElement, targetElement: HTMLElement): void {
  // Copy all attributes
  Array.from(targetElement.attributes).forEach(attr => {
    targetElement.removeAttribute(attr.name)
  })
  Array.from(sourceElement.attributes).forEach(attr => {
    targetElement.setAttribute(attr.name, attr.value)
  })
  
  // Clear target content
  targetElement.innerHTML = ''
  
  // Clone each child node recursively
  Array.from(sourceElement.childNodes).forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childElement = child as HTMLElement
      const clonedChild = document.createElement(childElement.tagName)
      
      // Recursively clone the child
      cloneElementWithEventListeners(childElement, clonedChild)
      
      // Clone event listeners by checking if the source child has a click handler
      // We can detect this by checking if the element has event listeners (in a real scenario)
      // For our case, we'll copy the click behavior by re-triggering the original element's events
      clonedChild.addEventListener('click', (e) => {
        e.stopPropagation()
        // Trigger click on the original element to preserve the original behavior
        childElement.click()
      })
      
      targetElement.appendChild(clonedChild)
    } else {
      // Text nodes and other non-element nodes
      targetElement.appendChild(child.cloneNode(true))
    }
  })
  
  // Copy the click behavior from source to target
  targetElement.addEventListener('click', (e) => {
    e.stopPropagation()
    // Trigger the click on the source element to preserve original behavior
    sourceElement.click()
  })
}

// Helper function to apply generated HTML elements to the DOM
function applyGeneratedHtmlToDOM(component: Component, originalEl: HTMLElement, generatedElements: HTMLElement[], editor: Editor): void {
  if (generatedElements.length === 0) {
    // Component is not visible, hide it
    return
  }

  if (generatedElements.length === 1) {
    // Single element - update the original element while preserving event listeners
    const newEl = generatedElements[0]

    // Copy all attributes from generated element to original
    Array.from(originalEl.attributes).forEach(attr => {
      originalEl.removeAttribute(attr.name)
    })
    Array.from(newEl.attributes).forEach(attr => {
      originalEl.setAttribute(attr.name, attr.value)
    })

    // Clone the structure and event listeners from generated element to original
    cloneElementWithEventListeners(newEl, originalEl)
    originalEl.style.display = ''

  } else {
    // Multiple elements (loop) - update original with first, add others after
    const parentElement = originalEl.parentElement
    if (!parentElement) return

    // Remove existing loop elements
    const existingLoops = parentElement.querySelectorAll(`[data-loop-original-id="${originalEl.id}"]`)
    existingLoops.forEach(loopEl => loopEl.remove())

    // Update original element with first generated element
    const firstEl = generatedElements[0]
    Array.from(originalEl.attributes).forEach(attr => {
      originalEl.removeAttribute(attr.name)
    })
    Array.from(firstEl.attributes).forEach(attr => {
      originalEl.setAttribute(attr.name, attr.value)
    })
    // Clone the structure and event listeners from first element to original
    cloneElementWithEventListeners(firstEl, originalEl)
    originalEl.style.display = ''

    // Add remaining elements after the original
    for (let i = 1; i < generatedElements.length; i++) {
      originalEl.insertAdjacentElement('afterend', generatedElements[i])
    }
  }
}



// GrapesJS plugin setup
export default (editor: Editor) => {
  const domc = editor.DomComponents

  // Listen for data source changes
  editor.on(`${DATA_SOURCE_CHANGED} ${DATA_SOURCE_DATA_LOAD_END}`, () => {
    const wrapper = editor.getWrapper()
    if (wrapper) {
      updateAllViews(wrapper, editor)
    }
  })

  // Extend component types
  ;['container', 'text', 'image', 'default'].forEach((type) => {
    const typeObj = domc.getType(type)
    if (typeObj) {
      domc.addType(type, {
        ...typeObj,
        view: {
          ...typeObj?.view,
          onRender() {
            const view = this as ComponentView
            if (typeObj?.view?.onRender) typeObj.view.onRender.call(this)
            updateView(type, view, editor)
          },
        },
        model: {
          ...typeObj?.model,
          init() {
            if (typeObj?.model?.init) typeObj.model.init.call(this)
            this.on('change:privateStates change:publicStates', () => {
              if (this.view) {
                updateView(type, this.view, editor)
              }
            })
          },
        },
      })
    }
  })
}

function updateAllViews(component: Component, editor: Editor) {
  if (component.view) {
    updateView(component.get('type') || 'default', component.view, editor)
  }
  component.components().forEach((child: Component) => {
    updateAllViews(child, editor)
  })
}
