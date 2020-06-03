/**
 * @fileoverview this is the API used to interact with the store
 */

import { subscribeTo, store } from '../store/index'
import { SiteState } from './types'
import { SiteAction } from '../store/actions'

export const initializeSite = (data: SiteState, dispatch = store.dispatch) => dispatch({
  type: SiteAction.INITIALIZE,
  data,
})

export const updateSite = (data: SiteState, dispatch = store.dispatch) => dispatch({
  type: SiteAction.UPDATE,
  data,
})

export const getSite = () => store.getState().present.site

export const subscribeSite = (cbk: (prevState: SiteState, nextState: SiteState) => void, subscribe = store.subscribe): () => void => {
  return subscribeTo<SiteState>('site', cbk, subscribe)
}

