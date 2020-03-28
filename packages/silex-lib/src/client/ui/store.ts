import { UiData } from './types'
import { UiAction } from '../flux/actions'
import { subscribeTo } from '../flux/store'
import { connect } from '../flux/connect';
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

export const initializeUi_ = (store: SilexStore, data: UiData) => store.dispatch({
  type: UiAction.INITIALIZE,
  data,
})
export const initializeUi = connect<UiData>(initializeUi_)

export const updateUi_ = (store: SilexStore, data: UiData) => store.dispatch({
  type: UiAction.UPDATE,
  data,
})
export const updateUi = connect<UiData>(updateUi_)

export const getUi_ = (store: SilexStore) => store.getState().ui
export const getUi = connect<null, UiData>(getUi_)

export const subscribeUi = (cbk: (prevState: UiData, nextState: UiData) => void): () => void => {
  return subscribeTo<UiData>('ui', cbk)
}
