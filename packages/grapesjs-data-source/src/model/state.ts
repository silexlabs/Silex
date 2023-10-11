import { Component } from 'grapesjs'
import { Expression, TypeId } from '../types'

/**
 * @fileoverview This file contains the model for components states
 * A state is a value which can be used in expressions
 * If exported it will be available in the context of child components
 */

// Keys to store the states in the component
const EXPORTED_STATES_KEY = 'states'
const HIDDEN_STATES_KEY = 'hiddenStates'

/**
 * Types
 */
export type StateId = string
export interface State {
  typeId: TypeId
  expression: Expression
}

/**
 * Callbacks called when a state is changed
 * @returns A function to remove the callback
 */
const _callbacks: ((state: State | null, component: Component) => void)[] = []
export function onStateChange(callback: (state: State | null, component: Component) => void): () => void {
  _callbacks.push(callback)
  return () => {
    const index = _callbacks.indexOf(callback)
    if(index >= 0) _callbacks.splice(index, 1)
  }
}
function fireChange(state: State | null, component: Component) {
  _callbacks.forEach(callback => callback(state, component))
}

/**
 * List all exported states
 */
export function getExportedStates(component: Component): StateId[] {
  return Object.keys(component.get(EXPORTED_STATES_KEY) ?? {})
}

/**
 * Get a state
 */
export function getState(component: Component, id: StateId, exported: boolean): State {
  const states = component.get(exported ? EXPORTED_STATES_KEY : HIDDEN_STATES_KEY) ?? {}
  return states[id]
}

/**
 * Set a state
 */
export function setState(component: Component, id: StateId, state: State, exported: boolean): void {
  const key = exported ? EXPORTED_STATES_KEY : HIDDEN_STATES_KEY
  component.set(key, {
    ...component.get(key) ?? {},
    [id]: state,
  })
  fireChange(state, component)
}

/**
 * Remove a state
 */
export function removeState(component: Component, id: StateId, exported: boolean): void {
  const key = exported ? EXPORTED_STATES_KEY : HIDDEN_STATES_KEY
  const states = component.get(key) ?? {}
  const newState = {
    ...states,
    [id]: undefined,
  } // This is needed to fire component:update
  delete newState[id]
  component.set(key, newState)
  fireChange(null, component)
}
