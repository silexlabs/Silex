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

import { ElementAction } from '../flux/actions'
import { connect } from '../flux/connect'
import { subscribeToCrud } from '../flux/store'
import { ElementData } from './types'
import { StateChange } from '../flux/crud-store';
import { SilexStore } from '../flux/types'

/**
 * @fileoverview this is the API used to interact with the store
 */

export const initializeElements_ = (store: SilexStore, items: ElementData[]) => store.dispatch({
  type: ElementAction.INITIALIZE,
  items,
})
export const initializeElements = connect<ElementData[]>(initializeElements_)

export const createElements_ = (store: SilexStore, items: ElementData[]) => store.dispatch({
  type: ElementAction.CREATE,
  items,
})
export const createElements = connect<ElementData[]>(createElements_)

export const deleteElements_ = (store: SilexStore, items: ElementData[]) => store.dispatch({
  type: ElementAction.DELETE,
  items,
})
export const deleteElements = connect<ElementData[]>(deleteElements_)

export const updateElements_ = (store: SilexStore, changes: StateChange<ElementData>[]) => store.dispatch({
  type: ElementAction.UPDATE,
  changes,
})
export const updateElements = connect<StateChange<ElementData>[]>(updateElements_)

export const getElements_ = (store: SilexStore) => store.getState().elements
export const getElements = connect(getElements_)

export const subscribeElements = (cbk: (prevState: ElementData[], nextState: ElementData[]) => void): () => void => {
  return subscribeToCrud<ElementData>('elements', cbk)
}

