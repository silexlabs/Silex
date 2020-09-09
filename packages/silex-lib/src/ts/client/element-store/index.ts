/**
 * @fileoverview this is the API used to interact with the store
 */

import { ElementAction } from '../store/actions'
import { store } from '../store/index'
import { subscribeToCrud } from '../store/index'
import { ElementData, ElementState } from './types'
import { fromData, toData } from '../store/crud-store'

export const fromElementData = (elements: ElementData[]): ElementState[] => fromData<ElementData, ElementState>(elements)
export const toElementData = (elements: ElementState[]): ElementData[] => toData<ElementState, ElementData>(elements)

export const initializeElements = (items: ElementState[], dispatch = store.dispatch) => dispatch({
  type: ElementAction.INITIALIZE,
  items,
})

export const createElements = (items: ElementState[], dispatch = store.dispatch) => dispatch({
  type: ElementAction.CREATE,
  items,
})

export const deleteElements = (items: ElementState[], dispatch = store.dispatch) => dispatch({
  type: ElementAction.DELETE,
  items,
})

export const updateElements = (items: ElementState[], dispatch = store.dispatch) => dispatch({
  type: ElementAction.UPDATE,
  items,
})

export const getElements = () => store.getState().present.elements

export const subscribeElements = (cbk: (prevState: ElementState[], nextState: ElementState[]) => void, subscribe = store.subscribe): () => void => {
  return subscribeToCrud<ElementState>('elements', cbk, subscribe)
}
