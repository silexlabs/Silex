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

import { SilexStore, subscribeTo } from '../flux/store'
import { SiteData } from './types'
import { SiteAction } from '../flux/actions'
import { connect } from '../flux/connect'

/**
 * @fileoverview this is the API used to interact with the store
 */

export const initializeSite_ = (store: SilexStore, data: SiteData) => store.dispatch({
  type: SiteAction.INITIALIZE,
  data,
})
export const initializeSite = connect<SiteData>(initializeSite_)

export const updateSite_ = (store: SilexStore, data: SiteData) => store.dispatch({
  type: SiteAction.UPDATE,
  data,
})
export const updateSite = connect<SiteData>(updateSite_)

export const getSite_ = (store: SilexStore) => store.getState().site
export const getSite = connect<null, SiteData>(getSite_)

export const subscribeSite = (cbk: (prevState: SiteData, nextState: SiteData) => void): () => void => {
  return subscribeTo<SiteData>('site', cbk)
}

