import { subscribeToCrud } from '../flux/store'
import { connect } from '../flux/connect'
import { PageData } from './types'
import { PageAction } from '../flux/actions'
import { StateChange } from '../flux/crud-store'
import { SilexStore } from '../flux/types'

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

/**
 * @fileoverview this is the API used to interact with the store
 */

export const initializePages_ = (store: SilexStore, items: PageData[]) => store.dispatch({
  type: PageAction.INITIALIZE,
  items,
})
export const initializePages = connect<PageData[]>(initializePages_)

export const createPages_ = (store: SilexStore, items: PageData[]) => store.dispatch({
  type: PageAction.CREATE,
  items,
})
export const createPages = connect<PageData[]>(createPages_)

export const deletePages_ = (store: SilexStore, items: PageData[]) => store.dispatch({
  type: PageAction.DELETE,
  items,
})
export const deletePages = connect<PageData[]>(deletePages_)

export const updatePages_ = (store: SilexStore, changes: StateChange<PageData>[]) => store.dispatch({
  type: PageAction.UPDATE,
  changes,
})
export const updatePages = connect<StateChange<PageData>[]>(updatePages_)

export const movePage_ = (store: SilexStore, {page, idx}: {page: PageData, idx: number}) => store.dispatch({
  type: PageAction.MOVE,
  item: page,
  idx,
})
export const movePage = connect<{page: PageData, idx: number}>(movePage_)

export const getPages_ = (store: SilexStore) => store.getState().pages
export const getPages = connect<null, PageData[]>(getPages_)

export const subscribePages = (cbk: (prevState: PageData[], nextState: PageData[]) => void): () => void => {
  return subscribeToCrud<PageData>('pages', cbk)
}

