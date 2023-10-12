import { Component } from 'grapesjs'
import { Expression, StateId } from '../types'
import { DataSourceEditor } from '..'

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
export interface StoredState {
  expression: Expression
}

export type PersistantId = string

/**
 * Persistant ID is used to identify a component reliably
 * It will be stored with the website data
 */
const PERSISTANT_ID_KEY = 'id-plugin-data-source'

/**
 * Get the persistant ID of a component
 */
export function getPersistantId(component: Component): PersistantId | null {
  return component.get(PERSISTANT_ID_KEY) ?? null
}

/**
 * Get the persistant ID of a component and create it if it does not exist
 */
export function getOrCreatePersistantId(component: Component): PersistantId {
  const persistantId = component.get(PERSISTANT_ID_KEY)
  if(persistantId) return persistantId
  const newPersistantId = component.cid as PersistantId
  component.set(PERSISTANT_ID_KEY, newPersistantId)
  return newPersistantId
}

/**
 * Recursiveley get all children of a component
 */
function getAll(component: Component): Component[] {
  const children: Component[] = []
  component.components().forEach((c: Component) => {
    children.push(...getAll(c))
  })
  return [component, ...children]
}

/**
 * Find a component by its persistant ID in the current page
 */
export function findComponentByPersistentId(id: PersistantId, editor: DataSourceEditor): Component | null {
  const component = editor.Pages.getSelected()?.getMainComponent() as Component
  if(getPersistantId(component) === id) return component
  return getAll(component).find((c: Component) => getPersistantId(c) === id) ?? null
}

/**
 * Callbacks called when a state is changed
 * @returns A function to remove the callback
 */
const _callbacks: ((state: StoredState | null, component: Component) => void)[] = []
export function onStateChange(callback: (state: StoredState | null, component: Component) => void): () => void {
  _callbacks.push(callback)
  return () => {
    const index = _callbacks.indexOf(callback)
    if(index >= 0) _callbacks.splice(index, 1)
  }
}
function fireChange(state: StoredState | null, component: Component) {
  _callbacks.forEach(callback => callback(state, component))
}

/**
 * List all exported states
 */
export function getStateIds(component: Component, exported: boolean): StateId[] {
  return Object.keys(component.get(exported ? EXPORTED_STATES_KEY : HIDDEN_STATES_KEY) ?? {})
}

/**
 * Get a state
 */
export function getState(component: Component, id: StateId, exported: boolean): StoredState {
  const states = component.get(exported ? EXPORTED_STATES_KEY : HIDDEN_STATES_KEY) ?? {}
  return states[id]
}

/**
 * Set a state
 */
export function setState(component: Component, id: StateId, state: StoredState, exported: boolean): void {
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
