/**
 * @fileoverview this is the API used to interact with the store
 */

import { UiState } from './types'
import { UiAction } from '../store/actions'
import { subscribeTo, store } from '../store/index'

export const initializeUi = (data: UiState, dispatch = store.dispatch) => dispatch({
  type: UiAction.INITIALIZE,
  data,
})

export const updateUi = (data: UiState, dispatch = store.dispatch) => dispatch({
  type: UiAction.UPDATE,
  data,
})

export const getUi = () => store.getState().present.ui

export const subscribeUi = (cbk: (prevState: UiState, nextState: UiState) => void, subscribe = store.subscribe): () => void => {
  return subscribeTo<UiState>('ui', cbk, subscribe)
}
