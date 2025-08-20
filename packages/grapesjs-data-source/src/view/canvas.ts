import { ComponentView, Editor, Component } from 'grapesjs'
import { getState } from '../model/state'
import { Properties, DATA_SOURCE_CHANGED, DATA_SOURCE_DATA_LOAD_END, StoredToken, BinariOperator, UnariOperator } from '../types'
import { getDataTreeFromUtils } from '../utils'
import { fromStored } from '../model/token'
import { DataTree } from '../model/DataTree'

function evaluateVisibilityCondition(component: Component, dataTree: DataTree, loopIndex?: number): boolean {
  const conditionState = getState(component, Properties.condition, false)
  const condition2State = getState(component, Properties.condition2, false)
  const conditionOperator = component.get('conditionOperator')

  // If no condition is set, component is visible
  if (!conditionState || !conditionState.expression || conditionState.expression.length === 0) {
    return true
  }

  try {
    // For loop context, we need to temporarily set previewIndex on condition tokens
    const modifiedConditionStates: {component: Component, stateId: string, tokenIdx: number, originalValue: number | undefined}[] = []
    
    if (typeof loopIndex === 'number') {
      // Temporarily modify condition expression tokens for loop evaluation
      const privateStates = component.get('privateStates') || []
      privateStates.forEach((state: {id: string, expression: StoredToken[], label?: string}) => {
        if (state.id === Properties.condition || state.id === Properties.condition2) {
          if (state.expression && state.expression.length > 0) {
            state.expression.forEach((token: StoredToken & {previewIndex?: number}, tokenIdx: number) => {
              // Store original value
              modifiedConditionStates.push({
                component,
                stateId: state.id,
                tokenIdx,
                originalValue: token.previewIndex
              })
              
              // Set loop index for evaluation
              if (token.type === 'state' && token.storedStateId === '__data') {
                token.previewIndex = loopIndex
              } else if (token.type === 'property' || token.type === 'filter') {
                token.previewIndex = loopIndex
              }
            })
          }
        }
      })
    }
    
    // Evaluate condition1
    const condition1Tokens = conditionState.expression.map(token => fromStored(token, dataTree, component.getId()))
    const condition1Value = dataTree.getValue(condition1Tokens, component, true)
    
    console.log('🔍 Evaluating visibility condition for component', component.getId(), 'at loop index', loopIndex, '- condition1 value:', condition1Value)

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
        return !!condition1Value // Default to truthy check
      }
    }

    // For binary operators, we need condition2
    if (!condition2State || !condition2State.expression || condition2State.expression.length === 0) {
      return true // If condition2 is not set, show component
    }

    const condition2Tokens = condition2State.expression.map(token => fromStored(token, dataTree, component.getId()))
    const condition2Value = dataTree.getValue(condition2Tokens, component, true)

    // Apply binary operator
    switch (conditionOperator) {
    case BinariOperator.EQUAL:
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
    return true // Show component if condition evaluation fails
  }
}

function processComponentInLoopContext(component: Component, index: number, dataTree: DataTree, allModifiedStates: {component: Component, stateId: string, tokenIdx: number, originalValue: number | undefined}[], editor?: Editor): HTMLElement | null {
  try {
    const originalEl = component.view?.el
    if (!originalEl) return null
    
    
    // Check if this component has its own __data state (nested loop)
    const dataState = getState(component, Properties.__data, false)
    
    if (dataState && dataState.expression && dataState.expression.length > 0) {
      // This is a nested loop component - handle it specially
      // Store and modify previewIndex values for this component
      const privateStates = component.get('privateStates') || []
      privateStates.forEach((state: {id: string, expression: StoredToken[], label?: string}) => {
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
          // Copy attributes from original element including classes
          Array.from(originalEl.attributes).forEach(attr => {
            nestedLoopContainer.setAttribute(attr.name, attr.value)
          })
          
          // Create elements for each nested loop item
          loopData.forEach((item, nestedIndex) => {
            const nestedLoopElement = createLoopElementForIndex(component, nestedIndex, dataTree, editor)
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
    // Clone the original element with attributes
    const clonedEl = originalEl.cloneNode(false) as HTMLElement
    
    // Copy all attributes including classes from the original element
    Array.from(originalEl.attributes).forEach(attr => {
      clonedEl.setAttribute(attr.name, attr.value)
    })
    
    // Set the previewIndex on this component's stored states before evaluation
    const privateStates = component.get('privateStates') || []
    
    // Store and modify previewIndex values for this component
    privateStates.forEach((state: {id: string, expression: StoredToken[], label?: string}) => {
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
          
          // Add click handler to select the original component for dynamic content
          if (editor) {
            clonedEl.addEventListener('click', (e) => {
              console.log('🎯 Dynamic element clicked in processComponentInLoopContext!', {
                clonedElement: clonedEl,
                originalComponent: component,
                componentId: component.getId?.() || component.id
              })
              e.stopPropagation()
              if (editor.select && typeof editor.select === 'function') {
                console.log('Selecting dynamic component:', component)
                editor.select(component)
              }
            })
          }
          
          // Return early - don't process children if innerHTML was set directly
          return clonedEl
        }
      } catch (e) {
        console.warn('Error evaluating innerHTML in loop context:', e)
      }
    }
    
    // Process attribute states with the updated previewIndex
    privateStates.forEach((state: {id: string, expression: StoredToken[], label?: string}) => {
      if (state.id && state.id !== Properties.innerHTML && state.id !== Properties.__data && state.expression) {
        try {
          const tokens = state.expression.map((token: StoredToken) => fromStored(token, dataTree, component.getId()))
          const evaluatedValue = dataTree.getValue(tokens, component, true)
          if (evaluatedValue !== null && evaluatedValue !== undefined) {
            clonedEl.setAttribute(state.label || state.id, String(evaluatedValue))
          }
        } catch (e) {
          console.warn(`Error evaluating attribute ${state.id} in loop context:`, e)
        }
      }
    })
    
    // Recursively process child components
    const childComponents = component.components()
    if (childComponents && childComponents.length > 0) {
      // Check if any child components have dynamic states that need loop processing
      let hasProcessedChildren = false
      childComponents.forEach((childComponent: Component) => {
        const childPrivateStates = childComponent.get('privateStates') || []
        const hasLoopStates = childPrivateStates.some((state: {id: string, expression: StoredToken[]}) => 
          state.expression && state.expression.length > 0
        )
        
        if (hasLoopStates) {
          // Process child with loop context
          const processedChild = processComponentInLoopContext(childComponent, index, dataTree, allModifiedStates, editor)
          if (processedChild) {
            clonedEl.appendChild(processedChild)
            hasProcessedChildren = true
          }
        } else {
          // Child has no dynamic states, just clone its original element
          const childEl = childComponent.view?.el
          if (childEl) {
            const clonedChildEl = childEl.cloneNode(true) as HTMLElement
            
            // Add click handler to select the original child component
            if (editor) {
              clonedChildEl.addEventListener('click', (e) => {
                console.log('🎯 Child element clicked in processComponentInLoopContext!', {
                  clonedElement: clonedChildEl,
                  originalChildComponent: childComponent,
                  childComponentId: childComponent.getId?.() || childComponent.id
                })
                e.stopPropagation()
                if (editor.select && typeof editor.select === 'function') {
                  console.log('Selecting child component:', childComponent)
                  editor.select(childComponent)
                }
              })
            }
            
            clonedEl.appendChild(clonedChildEl)
            hasProcessedChildren = true
          }
        }
      })
      
      // If no children were processed, preserve original content
      if (!hasProcessedChildren) {
        clonedEl.innerHTML = originalEl.innerHTML
      }
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

export function createLoopElementForIndex(component: Component, index: number, dataTree: DataTree, editor?: Editor): HTMLElement | null {
  try {
    // Clone the original element directly instead of creating a wrapper
    const originalEl = component.view?.el
    if (!originalEl) return null
    
    const loopEl = originalEl.cloneNode(false) as HTMLElement
    
    // Copy all attributes from original element
    Array.from(originalEl.attributes).forEach(attr => {
      loopEl.setAttribute(attr.name, attr.value)
    })
    
    // Ensure the cloned element is visible (don't inherit display: none from original)
    loopEl.style.display = ''
    
    // Modify the ID to make it unique for this loop instance
    if (loopEl.id) {
      loopEl.id = `${loopEl.id}-${index}`
    }
    
    // Add loop-specific attributes
    loopEl.setAttribute('data-loop-index', index.toString())
    loopEl.setAttribute('data-loop-original-id', originalEl.id || '')
    
    // Add click handler to the container itself to select the original component
    if (editor) {
      loopEl.addEventListener('click', (e) => {
        console.log('🎯 Loop container clicked!', {
          clonedElement: loopEl,
          originalComponent: component,
          componentId: component.getId?.() || component.id,
          loopIndex: index
        })
        e.stopPropagation()
        if (editor.select && typeof editor.select === 'function') {
          console.log('Selecting original component from container click:', component)
          editor.select(component)
        }
      })
    }
    
    // Note: Click handlers are also added to individual child elements
    
    // Track all modified states for restoration
    const allModifiedStates: {component: Component, stateId: string, tokenIdx: number, originalValue: number | undefined}[] = []
    
    // Set the previewIndex on the component's stored states before evaluation
    const privateStates = component.get('privateStates') || []
    
    // Store and modify previewIndex values for this loop iteration
    privateStates.forEach((state: {id: string, expression: StoredToken[], label?: string}) => {
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
    
    // Check visibility condition for this loop index after setting previewIndex
    if (!evaluateVisibilityCondition(component, dataTree, index)) {
      // Restore all modified previewIndex values before returning
      allModifiedStates.forEach(({component, stateId, tokenIdx, originalValue}) => {
        const privateStates = component.get('privateStates') || []
        const state = privateStates.find((s: {id: string}) => s.id === stateId)
        if (state && state.expression && state.expression[tokenIdx]) {
          (state.expression[tokenIdx] as StoredToken & {previewIndex?: number}).previewIndex = originalValue
        }
      })
      return null // Component should be hidden for this loop index
    }
    
    // Process innerHTML with the updated previewIndex
    const innerHTMLState = getState(component, Properties.innerHTML, false)
    if (innerHTMLState && innerHTMLState.expression && innerHTMLState.expression.length > 0) {
      try {
        const tokens = innerHTMLState.expression.map(token => fromStored(token, dataTree, component.getId()))
        const evaluatedValue = dataTree.getValue(tokens, component, true)
        if (evaluatedValue !== null && evaluatedValue !== undefined) {
          loopEl.innerHTML = String(evaluatedValue)
          
          // Add click handler to select the original component for dynamic content
          if (editor) {
            loopEl.addEventListener('click', (e) => {
              console.log('🎯 Dynamic element clicked in createLoopElementForIndex!', {
                clonedElement: loopEl,
                originalComponent: component,
                componentId: component.getId?.() || component.id,
                loopIndex: index
              })
              e.stopPropagation()
              if (editor.select && typeof editor.select === 'function') {
                console.log('Selecting dynamic component:', component)
                editor.select(component)
              }
            })
          }
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
          let hasProcessedChildren = false
          childComponents.forEach((childComponent: Component) => {
            const childPrivateStates = childComponent.get('privateStates') || []
            const hasLoopStates = childPrivateStates.some((state: {id: string, expression: StoredToken[]}) => 
              state.expression && state.expression.length > 0
            )
            
            if (hasLoopStates) {
              // Process child with loop context
              const processedChild = processComponentInLoopContext(childComponent, index, dataTree, allModifiedStates, editor)
              if (processedChild) {
                loopEl.appendChild(processedChild)
                hasProcessedChildren = true
              }
            } else {
              // Child has no dynamic states, just clone its original element
              const childEl = childComponent.view?.el
              if (childEl) {
                const clonedChildEl = childEl.cloneNode(true) as HTMLElement
                
                // Add click handler to select the original child component
                if (editor) {
                  clonedChildEl.addEventListener('click', (e) => {
                    console.log('🎯 Child element clicked in createLoopElementForIndex!', {
                      clonedElement: clonedChildEl,
                      originalChildComponent: childComponent,
                      childComponentId: childComponent.getId?.() || childComponent.id
                    })
                    e.stopPropagation()
                    if (editor.select && typeof editor.select === 'function') {
                      console.log('Selecting child component:', childComponent)
                      editor.select(childComponent)
                    }
                  })
                }
                
                loopEl.appendChild(clonedChildEl)
                hasProcessedChildren = true
              }
            }
          })
          
          // If no children were processed, use original content
          if (!hasProcessedChildren) {
            loopEl.innerHTML = originalContent
          }
        } else {
          // If no child components, just use the original content
          loopEl.innerHTML = originalContent
        }
      }
    }
    
    // Process attribute states with the updated previewIndex
    privateStates.forEach((state: {id: string, expression: StoredToken[], label?: string}) => {
      if (state.id && state.id !== Properties.innerHTML && state.id !== Properties.__data && state.expression) {
        try {
          const tokens = state.expression.map((token: StoredToken) => fromStored(token, dataTree, component.getId()))
          const evaluatedValue = dataTree.getValue(tokens, component, true)
          if (evaluatedValue !== null && evaluatedValue !== undefined) {
            loopEl.setAttribute(state.label || state.id, String(evaluatedValue))
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
  let modifiedStates: {stateId: string, tokenIdx: number, originalValue: number | undefined}[] = []
  
  try {
    const dataTree = getDataTreeFromUtils(editor)
    
    // Check for __data state (loop data) first
    const dataState = getState(component, Properties.__data, false)
    
    // For non-loop components, check visibility condition
    if (!dataState || !dataState.expression || dataState.expression.length === 0) {
      if (!evaluateVisibilityCondition(component, dataTree)) {
        el.style.display = 'none'
        return
      } else {
        // Ensure element is visible if condition passes
        if (el.style.display === 'none') {
          el.style.display = ''
        }
      }
    }
    
    if (dataState && dataState.expression && dataState.expression.length > 0) {
      try {
        const tokens = dataState.expression.map(token => fromStored(token, dataTree, component.getId()))
        const loopData = dataTree.getValue(tokens, component, false) // Don't resolve preview index to get full array
        
        if (Array.isArray(loopData) && loopData.length > 0) {
          // Store original element state if not already stored
          if (!el.hasAttribute('data-original-content')) {
            el.setAttribute('data-original-content', el.innerHTML)
          }
          if (!el.hasAttribute('data-original-display')) {
            el.setAttribute('data-original-display', el.style.display || '')
          }
          
          // Keep the original element visible as the first instance (index 0)
          // and create duplicates for the remaining items (index 1+)
          const parentElement = el.parentElement
          if (parentElement) {
            // Remove any existing loop elements first
            const existingLoops = parentElement.querySelectorAll(`[data-loop-original-id="${el.id}"]`)
            existingLoops.forEach(loopEl => loopEl.remove())
            
            // Create loop elements for indices 1 and above (skip index 0 since original element handles it)
            loopData.slice(1).forEach((item, arrayIndex) => {
              const loopIndex = arrayIndex + 1 // Adjust index since we sliced from 1
              const loopElement = createLoopElementForIndex(component, loopIndex, dataTree, editor)
              if (loopElement) {
                // Insert after the original element
                el.insertAdjacentElement('afterend', loopElement)
              }
            })
          }
          
          // Process the original element for index 0 by temporarily setting previewIndex
          const privateStates = component.get('privateStates') || []
          modifiedStates = []
          
          // Set previewIndex to 0 for all relevant tokens
          privateStates.forEach((state: {id: string, expression: StoredToken[]}) => {
            if (state.expression && state.expression.length > 0) {
              state.expression.forEach((token: StoredToken & {previewIndex?: number}, tokenIdx: number) => {
                modifiedStates.push({
                  stateId: state.id,
                  tokenIdx,
                  originalValue: token.previewIndex
                })
                
                if (token.type === 'state' && token.storedStateId === '__data') {
                  token.previewIndex = 0
                } else if (token.type === 'property' || token.type === 'filter') {
                  token.previewIndex = 0
                }
              })
            }
          })
          
          // Don't return early - continue processing other expressions for index 0
        } else {
          // No loop data - restore original element if it was previously hidden
          if (el.hasAttribute('data-original-display')) {
            el.style.display = el.getAttribute('data-original-display') || ''
            el.removeAttribute('data-original-display')
          }
          if (el.hasAttribute('data-original-content')) {
            el.innerHTML = el.getAttribute('data-original-content') || ''
            el.removeAttribute('data-original-content')
          }
          
          // Remove any existing loop elements
          const parentElement = el.parentElement
          if (parentElement) {
            const existingLoops = parentElement.querySelectorAll(`[data-loop-original-id="${el.id}"]`)
            existingLoops.forEach(loopEl => loopEl.remove())
          }
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
    privateStates.forEach((state: {id: string, expression: StoredToken[], label?: string}) => {
      if (state.id && state.id !== Properties.innerHTML && state.id !== Properties.__data && state.expression) {
        try {
          const tokens = state.expression.map((token: StoredToken) => fromStored(token, dataTree, component.getId()))
          const evaluatedValue = dataTree.getValue(tokens, component, true)
          if (evaluatedValue !== null && evaluatedValue !== undefined) {
            el.setAttribute(state.label || state.id, String(evaluatedValue))
          }
        } catch (e) {
          console.warn(`Error evaluating attribute ${state.id}:`, e)
        }
      }
    })
    
    // Restore modified states if we processed a loop
    if (modifiedStates.length > 0) {
      modifiedStates.forEach(({stateId, tokenIdx, originalValue}) => {
        const privateStates = component.get('privateStates') || []
        const state = privateStates.find((s: {id: string}) => s.id === stateId)
        if (state && state.expression && state.expression[tokenIdx]) {
          (state.expression[tokenIdx] as StoredToken & {previewIndex?: number}).previewIndex = originalValue
        }
      })
    }
    
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
