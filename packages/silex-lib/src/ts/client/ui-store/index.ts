import { UiState } from './types'
import { UiAction } from '../store/actions'
import { subscribeTo, store } from '../store/index'
import { SilexStore } from '../store/types'

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

export const initializeUi = (data: UiState, dispatch = store.dispatch) => dispatch({
  type: UiAction.INITIALIZE,
  data,
})

export const updateUi = (data: UiState, dispatch = store.dispatch) => dispatch({
  type: UiAction.UPDATE,
  data,
})

export const getUi = () => store.getState().ui

export const subscribeUi = (cbk: (prevState: UiState, nextState: UiState) => void, subscribe = store.subscribe): () => void => {
  return subscribeTo<UiState>('ui', cbk, subscribe)
}
