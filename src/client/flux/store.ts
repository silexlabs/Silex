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

import { combineReducers, createStore, Store } from 'redux'
import { ElementData } from '../element/types'
import { withCrudReducer } from '../flux/crud-store'
import { PageData } from '../page/types'
import { SiteData } from '../site/types'
import { UiData } from '../ui/types'
import { ElementAction, PageAction } from './actions'
import { elementReducer, pageReducer, siteReducer, uiReducer } from './reducers'
import { DataModel } from './types'

// //////////////////////
// The main store

export interface State {
  pages: PageData[],
  elements: ElementData[],
  site: SiteData,
  ui: UiData,
}

export type SilexStore = Store<State>
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

let prevState: State
let curState: State
store.subscribe(() => {
  prevState = curState
  curState = store.getState()
})

export function subscribeToCrud<T>(name: string, cbk: (prevState: T[], nextState: T[]) => void): () => void {
  return store.subscribe(() => {
    const state = store.getState()
    if (!prevState || state[name] !== prevState[name]) {
      cbk(prevState ? prevState[name] : null, state[name])
    }
  })
}

export function subscribeTo<T>(name: string, cbk: (prevState: T, nextState: T) => void): () => void {
  return store.subscribe(() => {
    const state = store.getState()
    if (!prevState || state[name] !== prevState[name]) {
      cbk(prevState ? prevState[name] : null, state[name])
    }
  })
}

// get the whole state object
export const getData = (): DataModel => store.getState()
