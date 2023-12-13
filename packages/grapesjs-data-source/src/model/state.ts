/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Component } from 'grapesjs'
import { Expression, StateId, State } from '../types'

/**
 * @fileoverview This file contains the model for components states
 * A state is a value which can be used in expressions
 * If exported it will be available in the context of child components
 */

// Keys to store the states in the component
const EXPORTED_STATES_KEY = 'publicStates'
const PRIVATE_STATES_KEY = 'privateStates'

/**
 * Override the prefix of state names
 */
export const COMPONENT_NAME_PREFIX = 'nameForDataSource'

/**
 * Types
 */
export interface StoredState {
  label?: string
  hidden?: boolean
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
  const newPersistantId = component.ccid as PersistantId
  component.set(PERSISTANT_ID_KEY, newPersistantId)
  return newPersistantId
}

export function getStateLabel(component: Component | null | undefined, state: State): string {
  const name = component?.getName() ?? '[Not found]'
  const prefix = component?.get(COMPONENT_NAME_PREFIX) ?? `${name}'s`
  return  `${prefix ? prefix + ' ' : ''}${state.label || state.storedStateId}`
}

/**
 * Find a component by its persistant ID in the current page
 */
export function getParentByPersistentId(id: PersistantId, component: Component | undefined): Component | null {
  if(!component) return null
  if(getPersistantId(component) === id) return component
  return getParentByPersistentId(id, component.parent())
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
export function getStateIds(component: Component, exported: boolean = true): StateId[] {
  return Object.keys(component.get(exported ? EXPORTED_STATES_KEY : PRIVATE_STATES_KEY) ?? {})
}

/**
 * Get the name of a state variable
 * Useful to generate code
 */
export function getStateVariableName(componentId: string, stateId: StateId): string {
  return `state_${ componentId }_${ stateId }`
}

/**
 * Get a state
 */
export function getState(component: Component, id: StateId, exported: boolean = true): StoredState {
  const states = component.get(exported ? EXPORTED_STATES_KEY : PRIVATE_STATES_KEY) ?? {}
  console.log('getState', component.cid, id, exported, states[id])
  return states[id]
}

/**
 * Set a state
 */
export function setState(component: Component, id: StateId, state: StoredState, exported: boolean = true): void {
  console.log('setState', component.cid, id, state, exported)
  const key = exported ? EXPORTED_STATES_KEY : PRIVATE_STATES_KEY
  component.set(key, {
    ...component.get(key) ?? {},
    [id]: state,
  })
  fireChange(state, component)
}

/**
 * Remove a state
 */
export function removeState(component: Component, id: StateId, exported: boolean = true): void {
  const key = exported ? EXPORTED_STATES_KEY : PRIVATE_STATES_KEY
  const states = component.get(key) ?? {}
  const newState = {
    ...states,
    [id]: undefined,
  } // This is needed to fire component:update
  delete newState[id]
  component.set(key, newState)
  fireChange(null, component)
}
