import { ComponentView, Editor, Component } from 'grapesjs'
import { getState } from '../model/state'
import { Properties, DATA_SOURCE_CHANGED, DATA_SOURCE_DATA_LOAD_END, StoredToken } from '../types'
import { getDataTreeFromUtils } from '../utils'
import { fromStored } from '../model/token'
import { DataTree } from '../model/DataTree'

export function createLoopElementForIndex(component: Component, index: number, dataTree: DataTree): HTMLElement | null {
  try {
    // Create a simple wrapper element for this loop item
    const loopEl = document.createElement('div')
    loopEl.classList.add('ds-loop-item')
    loopEl.setAttribute('data-loop-index', index.toString())
    
    // CRITICAL: Set the previewIndex on the component's stored states before evaluation
    const privateStates = component.get('privateStates') || []
    const originalPreviewIndices: {[stateId: string]: number | undefined} = {}
    
    // Store original previewIndex values and set new ones for this loop iteration
    privateStates.forEach((state: {id: string, expression: StoredToken[]}) => {
      if (state.expression && state.expression.length > 0) {
        state.expression.forEach((token: StoredToken & {previewIndex?: number}, tokenIdx: number) => {
          const key = `${state.id}_${tokenIdx}`
          originalPreviewIndices[key] = token.previewIndex
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
      // If no innerHTML expression, use original content but process any nested expressions
      const originalEl = component.view?.el
      if (originalEl) {
        loopEl.innerHTML = originalEl.getAttribute('data-original-content') || originalEl.innerHTML
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
    
    // CRITICAL: Restore original previewIndex values after evaluation
    privateStates.forEach((state: {id: string, expression: StoredToken[]}) => {
      if (state.expression && state.expression.length > 0) {
        state.expression.forEach((token: StoredToken & {previewIndex?: number}, tokenIdx: number) => {
          const key = `${state.id}_${tokenIdx}`
          if (key in originalPreviewIndices) {
            token.previewIndex = originalPreviewIndices[key]
          }
        })
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
