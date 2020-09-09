/**
 * @fileoverview this is the API used to interact with the store
 */

import { subscribeToCrud, store } from '../store/index'
import { PageState, PageData } from './types'
import { PageAction } from '../store/actions'
import { fromData, toData } from '../store/crud-store'

export const fromPageData = (pages: PageData[]): PageState[] => fromData<PageData, PageState>(pages)
export const toPageData = (pages: PageState[]): PageData[] => toData<PageState, PageData>(pages)

export const initializePages = (items: PageState[], dispatch = store.dispatch) => dispatch({
  type: PageAction.INITIALIZE,
  items,
})

export const createPages = (items: PageState[], dispatch = store.dispatch) => dispatch({
  type: PageAction.CREATE,
  items,
})

export const deletePages = (items: PageState[], dispatch = store.dispatch) => dispatch({
  type: PageAction.DELETE,
  items,
})

export const updatePages = (items: PageState[], dispatch = store.dispatch) => dispatch({
  type: PageAction.UPDATE,
  items,
})

export const movePage = ({page, idx}: {page: PageState, idx: number}, dispatch = store.dispatch) => dispatch({
  type: PageAction.MOVE,
  item: page,
  idx,
})

export const getPages = () => store.getState().present.pages

export const subscribePages = (cbk: (prevState: PageState[], nextState: PageState[]) => void, subscribe = store.subscribe): () => void => {
  return subscribeToCrud<PageState>('pages', cbk, subscribe)
}
