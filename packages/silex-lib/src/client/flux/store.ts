/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

import { combineReducers, createStore } from 'redux'
import { ElementData } from '../element/types'
import { withCrudReducer } from '../flux/crud-store'
import { PageData } from '../page/types'
import { ElementAction, PageAction } from './actions'
import { elementReducer, pageReducer, siteReducer, uiReducer } from './reducers'
import { PersistantData, SilexStore, State } from './types'

// create the main store
export const store: SilexStore = createStore(combineReducers({
  pages: withCrudReducer<PageData>({
    actionEnum: PageAction,
    reducer: pageReducer,
    label: 'Pages',
  }),
  elements: withCrudReducer<ElementData>({
    actionEnum: ElementAction,
    reducer: elementReducer,
    label: 'Elements',
  }),
  site: siteReducer,
  ui: uiReducer,
}))

// update previous and current states before other listeners fire
let curState: State = store.getState()
let prevState: State = null
store.subscribe(() => {
  prevState = curState
  curState = store.getState()
})

/**
 * special subscribe for CRUD states, i.e. elements and pages
 * provides the listener with prev and next state
 * only the states piece relevant to the CRUD state
 */
export function subscribeToCrud<T>(name: string, cbk: (prevState: T[], nextState: T[]) => void): () => void {
  return store.subscribe(() => {
    const state = store.getState()
    if (!prevState || state[name] !== prevState[name]) {
      cbk(prevState ? prevState[name] : null, state[name])
    }
  })
}

/**
 * special subscribe for states, i.e. site and ui
 * provides the listener with prev and next state
 * only the states piece relevant to the CRUD state
 */
export function subscribeTo<T>(name: string, cbk: (prevState: T, nextState: T) => void): () => void {
  return store.subscribe(() => {
    const state = store.getState()
    if (!prevState || state[name] !== prevState[name]) {
      cbk(prevState ? prevState[name] : null, state[name])
    }
  })
}

/**
 * get the whole state object
 * used to save the state for example
 */
export const getState = (): PersistantData => store.getState()
