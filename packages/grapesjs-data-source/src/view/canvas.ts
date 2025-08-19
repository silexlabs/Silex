import { ComponentView, Editor, Component } from 'grapesjs'
import { getState } from '../model/state'
import { Properties, DATA_SOURCE_CHANGED, DATA_SOURCE_DATA_LOAD_END, StoredToken } from '../types'
import { getDataTreeFromUtils } from '../utils'
import { fromStored } from '../model/token'
import { DataTree } from '../model/DataTree'

function processComponentInLoopContext(component: Component, index: number, dataTree: DataTree, allModifiedStates: {component: Component, stateId: string, tokenIdx: number, originalValue: number | undefined}[]): HTMLElement | null {
  try {
    const originalEl = component.view?.el
    if (!originalEl) return null
    
    // Check if this component has its own __data state (nested loop)
    const dataState = getState(component, Properties.__data, false)
    
    if (dataState && dataState.expression && dataState.expression.length > 0) {
      // This is a nested loop component - handle it specially
      // Store and modify previewIndex values for this component
      const privateStates = component.get('privateStates') || []
      privateStates.forEach((state: {id: string, expression: StoredToken[]}) => {
        if (state.expression && state.expression.length > 0) {
          state.expression.forEach((token: StoredToken & {previewIndex?: number}, tokenIdx: number) => {
            // Store original value for later restoration
            allModifiedStates.push({
              component,
              stateId: state.id,
              tokenIdx,
              originalValue: token.previewIndex
            })
            
            if (token.type === 'state' && token.storedStateId === '__data') {
              token.previewIndex = index
            } else if (token.type === 'property' || token.type === 'filter') {
              token.previewIndex = index
            }
          })
        }
      })
      
      try {
        const tokens = dataState.expression.map(token => fromStored(token, dataTree, component.getId()))
        const loopData = dataTree.getValue(tokens, component, false) // Don't resolve preview index to get full array
        
        if (Array.isArray(loopData) && loopData.length > 0) {
          // Create a container for all nested loop items
          const nestedLoopContainer = document.createElement('div')
          // Copy attributes from original element but don't copy content
          Array.from(originalEl.attributes).forEach(attr => {
            if (attr.name !== 'class') { // Don't copy classes to avoid conflicts
              nestedLoopContainer.setAttribute(attr.name, attr.value)
            }
          })
          
          // Create elements for each nested loop item
          loopData.forEach((item, nestedIndex) => {
            const nestedLoopElement = createLoopElementForIndex(component, nestedIndex, dataTree)
            if (nestedLoopElement) {
              nestedLoopContainer.appendChild(nestedLoopElement)
            }
          })
          
          return nestedLoopContainer
        }
      } catch (e) {
        console.warn('Error evaluating nested __data state for loop:', e)
      }
    }
    
    // Not a nested loop - process normally
    // Clone the original element
    const clonedEl = originalEl.cloneNode(false) as HTMLElement
    
    // Set the previewIndex on this component's stored states before evaluation
    const privateStates = component.get('privateStates') || []
    
    // Store and modify previewIndex values for this component
    privateStates.forEach((state: {id: string, expression: StoredToken[]}) => {
      if (state.expression && state.expression.length > 0) {
        state.expression.forEach((token: StoredToken & {previewIndex?: number}, tokenIdx: number) => {
          // Store original value for later restoration
          allModifiedStates.push({
            component,
            stateId: state.id,
            tokenIdx,
            originalValue: token.previewIndex
          })
          
          if (token.type === 'state' && token.storedStateId === '__data') {
            token.previewIndex = index
          } else if (token.type === 'property' || token.type === 'filter') {
            token.previewIndex = index
          }
        })
      }
    })
    
    // Process innerHTML with the updated previewIndex
    const innerHTMLState = getState(component, Properties.innerHTML, false)
    if (innerHTMLState && innerHTMLState.expression && innerHTMLState.expression.length > 0) {
      try {
        const tokens = innerHTMLState.expression.map(token => fromStored(token, dataTree, component.getId()))
        const evaluatedValue = dataTree.getValue(tokens, component, true)
        if (evaluatedValue !== null && evaluatedValue !== undefined) {
          clonedEl.innerHTML = String(evaluatedValue)
          // Return early - don't process children if innerHTML was set directly
          return clonedEl
        }
      } catch (e) {
        console.warn('Error evaluating innerHTML in loop context:', e)
      }
    }
    
    // Process attribute states with the updated previewIndex
    privateStates.forEach((state: {id: string, expression: StoredToken[]}) => {
      if (state.id && state.id !== Properties.innerHTML && state.id !== Properties.__data && state.expression) {
        try {
          const tokens = state.expression.map((token: StoredToken) => fromStored(token, dataTree, component.getId()))
          const evaluatedValue = dataTree.getValue(tokens, component, true)
          if (evaluatedValue !== null && evaluatedValue !== undefined) {
            clonedEl.setAttribute(state.id, String(evaluatedValue))
          }
        } catch (e) {
          console.warn(`Error evaluating attribute ${state.id} in loop context:`, e)
        }
      }
    })
    
    // Recursively process child components
    const childComponents = component.components()
    if (childComponents && childComponents.length > 0) {
      childComponents.forEach((childComponent: Component) => {
        const processedChild = processComponentInLoopContext(childComponent, index, dataTree, allModifiedStates)
        if (processedChild) {
          clonedEl.appendChild(processedChild)
        }
      })
    } else {
      // If no child components and no innerHTML state, preserve original content
      clonedEl.innerHTML = originalEl.innerHTML
    }
    
    return clonedEl
  } catch (e) {
    console.warn('Error processing component in loop context:', e)
    return null
  }
}

export function createLoopElementForIndex(component: Component, index: number, dataTree: DataTree): HTMLElement | null {
  try {
    // Create the loop item wrapper
    const loopEl = document.createElement('div')
    loopEl.classList.add('ds-loop-item')
    loopEl.setAttribute('data-loop-index', index.toString())
    
    // Track all modified states for restoration
    const allModifiedStates: {component: Component, stateId: string, tokenIdx: number, originalValue: number | undefined}[] = []
    
    // Set the previewIndex on the component's stored states before evaluation
    const privateStates = component.get('privateStates') || []
    
    // Store and modify previewIndex values for this loop iteration
    privateStates.forEach((state: {id: string, expression: StoredToken[]}) => {
      if (state.expression && state.expression.length > 0) {
        state.expression.forEach((token: StoredToken & {previewIndex?: number}, tokenIdx: number) => {
          // Store original value for later restoration
          allModifiedStates.push({
            component,
            stateId: state.id,
            tokenIdx,
            originalValue: token.previewIndex
          })
          
          if (token.type === 'state' && token.storedStateId === '__data') {
            token.previewIndex = index
          } else if (token.type === 'property' || token.type === 'filter') {
            token.previewIndex = index
          }
        })
      }
    })
    
    // Process innerHTML with the updated previewIndex
    const innerHTMLState = getState(component, Properties.innerHTML, false)
    if (innerHTMLState && innerHTMLState.expression && innerHTMLState.expression.length > 0) {
      try {
        const tokens = innerHTMLState.expression.map(token => fromStored(token, dataTree, component.getId()))
        const evaluatedValue = dataTree.getValue(tokens, component, true)
        if (evaluatedValue !== null && evaluatedValue !== undefined) {
          loopEl.innerHTML = String(evaluatedValue)
        }
      } catch (e) {
        console.warn('Error evaluating innerHTML in loop context:', e)
      }
    } else {
      // If no innerHTML expression, process the original content and child components
      const originalEl = component.view?.el
      if (originalEl) {
        const originalContent = originalEl.getAttribute('data-original-content') || originalEl.innerHTML
        
        // Process child components recursively
        const childComponents = component.components()
        if (childComponents && childComponents.length > 0) {
          childComponents.forEach((childComponent: Component) => {
            const processedChild = processComponentInLoopContext(childComponent, index, dataTree, allModifiedStates)
            if (processedChild) {
              loopEl.appendChild(processedChild)
            }
          })
        } else {
          // If no child components, just use the original content
          loopEl.innerHTML = originalContent
        }
      }
    }
    
    // Process attribute states with the updated previewIndex
    privateStates.forEach((state: {id: string, expression: StoredToken[]}) => {
      if (state.id && state.id !== Properties.innerHTML && state.id !== Properties.__data && state.expression) {
        try {
          const tokens = state.expression.map((token: StoredToken) => fromStored(token, dataTree, component.getId()))
          const evaluatedValue = dataTree.getValue(tokens, component, true)
          if (evaluatedValue !== null && evaluatedValue !== undefined) {
            loopEl.setAttribute(state.id, String(evaluatedValue))
          }
        } catch (e) {
          console.warn(`Error evaluating attribute ${state.id} in loop context:`, e)
        }
      }
    })
    
    // Restore all modified previewIndex values
    allModifiedStates.forEach(({component, stateId, tokenIdx, originalValue}) => {
      const privateStates = component.get('privateStates') || []
      const state = privateStates.find((s: {id: string}) => s.id === stateId)
      if (state && state.expression && state.expression[tokenIdx]) {
        (state.expression[tokenIdx] as StoredToken & {previewIndex?: number}).previewIndex = originalValue
      }
    })
    
    return loopEl
  } catch (e) {
    console.warn('Error creating loop element:', e)
    return null
  }
}



export function updateView(type: string, view: ComponentView, editor: Editor) {
  const el = view.el
  const component = view.model
  
  try {
    const dataTree = getDataTreeFromUtils(editor)
    
    // Check for __data state (loop data)
    const dataState = getState(component, Properties.__data, false)
    
    if (dataState && dataState.expression && dataState.expression.length > 0) {
      try {
        const tokens = dataState.expression.map(token => fromStored(token, dataTree, component.getId()))
        const loopData = dataTree.getValue(tokens, component, false) // Don't resolve preview index to get full array
        
        if (Array.isArray(loopData) && loopData.length > 0) {
          // Store original content if not already stored
          if (!el.hasAttribute('data-original-content')) {
            el.setAttribute('data-original-content', el.innerHTML)
          }
          
          // Clear all content and replace with loop items
          el.innerHTML = ''
          
          // Create elements for each loop item
          loopData.forEach((item, index) => {
            const loopElement = createLoopElementForIndex(component, index, dataTree)
            if (loopElement) {
              el.appendChild(loopElement)
            }
          })
          return // Don't process other expressions if this is a loop
        }
      } catch (e) {
        console.warn('Error evaluating __data state for loop:', e)
      }
    }
    
    // Handle innerHTML property (non-loop case)
    const innerHTMLState = getState(component, Properties.innerHTML, false)
    if (innerHTMLState && innerHTMLState.expression && innerHTMLState.expression.length > 0) {
      try {
        const tokens = innerHTMLState.expression.map(token => fromStored(token, dataTree, component.getId()))
        const evaluatedValue = dataTree.getValue(tokens, component, true)
        if (evaluatedValue !== null && evaluatedValue !== undefined) {
          el.innerHTML = String(evaluatedValue)
        }
      } catch (e) {
        console.warn('Error evaluating innerHTML expression:', e)
      }
    }
    
    // Handle attribute states (non-loop case)
    const privateStates = component.get('privateStates') || []
    privateStates.forEach((state: {id: string, expression: StoredToken[]}) => {
      if (state.id && state.id !== Properties.innerHTML && state.id !== Properties.__data && state.expression) {
        try {
          const tokens = state.expression.map((token: StoredToken) => fromStored(token, dataTree, component.getId()))
          const evaluatedValue = dataTree.getValue(tokens, component, true)
          if (evaluatedValue !== null && evaluatedValue !== undefined) {
            el.setAttribute(state.id, String(evaluatedValue))
          }
        } catch (e) {
          console.warn(`Error evaluating attribute ${state.id}:`, e)
        }
      }
    })
    
  } catch (e) {
    console.warn('Error updating canvas view:', e)
  }
}
export default (editor: Editor) => {
  const domc = editor.DomComponents
  
  // Listen for data source changes to update all views
  editor.on(`${DATA_SOURCE_CHANGED} ${DATA_SOURCE_DATA_LOAD_END}`, () => {
    // Update all components on canvas
    const wrapper = editor.getWrapper()
    if (wrapper) {
      updateAllViews(wrapper, editor)
    }
  })
  
  // Extend component types to update on render and change
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
