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
import { DataSourceEditor } from '..'

/**
 * @fileoverview This file contains the model for components states
 * A state is a value which can be used in expressions
 * If exported it will be available in the context of child components
 */

// Keys to store the states in the component
const EXPORTED_STATES_KEY = 'publicStates'
const PRIVATE_STATES_KEY = 'privateStates'

/**
 * Persistant ID is used to identify a component reliably
 * It will be stored with the website data
 */
const PERSISTANT_ID_KEY = 'id-plugin-data-source'

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

export interface StoredStateWithId extends StoredState {
  id: StateId
}

export type PersistantId = string

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
  const newPersistantId = `${component.ccid}-${Math.round(Math.random() * 10000)}` as PersistantId
  component.set(PERSISTANT_ID_KEY, newPersistantId)
  return newPersistantId
}

/**
 * Find a component by its persistant ID in the current page
 */
export function getComponentByPersistentId(id: PersistantId, editor: DataSourceEditor): Component | null {
  const pages = editor.Pages.getAll()
  for(const page of pages) {
    const body = page.getMainComponent()
    const component = getChildByPersistantId(id, body)
    if(component) return component
  }
  return null
}

/**
 * Find a component by its persistant ID in 
 */
export function getChildByPersistantId(id: PersistantId, parent: Component): Component | null {
  if(getPersistantId(parent) === id) return parent
  for(const child of parent.components()) {
    const component = getChildByPersistantId(id, child)
    if(component) return component
  }
  return null
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
 * Get the display name of a state
 */
export function getStateDisplayName(child: Component, state: State): string {
  const component = getParentByPersistentId(state.componentId, child)
  //const name = component?.getName() ?? '[Not found]'
  const prefix = component?.get(COMPONENT_NAME_PREFIX) ?? '' // `${name}'s`
  return  `${prefix ? prefix + ' ' : ''}${state.label || state.storedStateId}`
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
export function getStateIds(component: Component, exported: boolean = true, before?: StateId): StateId[] {
  try {
    const states = component.get(exported ? EXPORTED_STATES_KEY : PRIVATE_STATES_KEY) as StoredStateWithId[] ?? []
    const allStates = states
      .sort(a => a.hidden ? -1 : 0) // Hidden states first
      .map(state => state.id)
    if(before) {
      const index = allStates.indexOf(before)
      if(index < 0) return allStates
      return allStates.slice(0, index)
    }
    return allStates
  } catch(e) {
    // this happens when the old deprecated state system is used
    console.error('Error while getting state ids', e)
    return []
  }
}

/**
 * List all exported states
 */
export function getStates(component: Component, exported: boolean = true): StoredState[] {
  const states = component.get(exported ? EXPORTED_STATES_KEY : PRIVATE_STATES_KEY) as StoredStateWithId[] ?? []
  return states.map(state => ({
    label: state.label,
    hidden: state.hidden,
    expression: state.expression,
  }))
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
export function getState(component: Component, id: StateId, exported: boolean = true): StoredState | null {
  const states = component.get(exported ? EXPORTED_STATES_KEY : PRIVATE_STATES_KEY) as StoredStateWithId[] ?? []
  const state = states.find(state => state.id === id) ?? null
  if(!state) {
    return null
  }
  return {
    label: state.label,
    hidden: state.hidden,
    expression: state.expression,
  }
}

/**
 * Set a state
 * The state will be updated or created at the end of the list
 * Note: index is not used in this project anymore (maybe in apps using this plugins)
 */
export function setState(component: Component, id: StateId, state: StoredState, exported = true, index = -1): void {
  const key = exported ? EXPORTED_STATES_KEY : PRIVATE_STATES_KEY
  const states = component.get(key) as StoredStateWithId[] ?? []
  const existing = states.find(s => s.id === id) ?? null
  if(existing) {
    component.set(key, states.map(s => s.id !== id ? s : {
      id,
      ...state,
    }))
  } else {
    component.set(key, [
      ...states,
      {
        id,
        ...state,
      }
    ])
  }
  // Set the index if needed
  if(index >= 0) {
    const states = [...component.get(key) as StoredStateWithId[]]
    const state = states.find(s => s.id === id)
    if(state && index < states.length) {
      states.splice(states.indexOf(state), 1)
      states.splice(index, 0, state)
      component.set(key, states)
    }
  }
  // Notify the change
  fireChange({
    label: state.label,
    hidden: state.hidden,
    expression: state.expression,
  }, component)
}

/**
 * Remove a state
 */
export function removeState(component: Component, id: StateId, exported: boolean = true): void {
  const key = exported ? EXPORTED_STATES_KEY : PRIVATE_STATES_KEY
  const states = component.get(key) as StoredStateWithId[] ?? []
  const newStates = states.filter(s => s.id !== id)
  component.set(key, newStates)
  fireChange(null, component)
}
