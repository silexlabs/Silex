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

import { subscribeTo, store } from '../store/index'
import { SiteState } from './types'
import { SiteAction } from '../store/actions'

/**
 * @fileoverview this is the API used to interact with the store
 */

export const initializeSite = (data: SiteState, dispatch = store.dispatch) => dispatch({
  type: SiteAction.INITIALIZE,
  data,
})

export const updateSite = (data: SiteState, dispatch = store.dispatch) => dispatch({
  type: SiteAction.UPDATE,
  data,
})

export const getSite = () => store.getState().site

export const subscribeSite = (cbk: (prevState: SiteState, nextState: SiteState) => void, subscribe = store.subscribe): () => void => {
  return subscribeTo<SiteState>('site', cbk, subscribe)
}

