import { combineReducers, createStore, Store } from 'redux'
import { withCrud } from './flux/crud-store'
import { PageAction, PageData, pageReducer } from './flux/page-store'
import { ElementAction, ElementData, elementReducer } from './flux/element-store'

interface State {
  pages: PageData[],
  elements: ElementData[]
}

// //////////////////////
// Create the main store
export const store: Store<State> = createStore(combineReducers({
  pages: withCrud<PageData>(PageAction, pageReducer, 'Pages'),
  elements: withCrud<ElementData>(ElementAction, elementReducer, 'Elements'),
}))

const subscribeTo = (name: string, cbk: (prevState: State, nextState: State) => void): () => void => {
  return store.subscribe(() => {
    const state = store.getState()
    if (!prevState || state[name] !== prevState[name]) {
      cbk(prevState ? prevState[name] : null, state[name])
    }
  })
}

let prevState: State
let curState: State
store.subscribe(() => {
  prevState = curState
  curState = store.getState()
})

// //////////////////////
// Element API
export const initializeElements = (items: ElementData[]) => store.dispatch({
  type: ElementAction.INITIALIZE,
  items,
})

export const createElement = (item: ElementData) => store.dispatch({
  type: ElementAction.CREATE,
  item,
})

export const deleteElement = (item: ElementData) => store.dispatch({
  type: ElementAction.DELETE,
  item,
})

export const updateElement = (oldItem: ElementData, newItem: ElementData) => store.dispatch({
  type: ElementAction.UPDATE,
  oldItem,
  newItem,
})

export const getElements = () => store.getState().pages

export const subscribeElements = (cbk: (prevState: State, nextState: State) => void): () => void => {
  return subscribeTo('pages', cbk)
}

// //////////////////////
// Page API
export const initializePages = (items: PageData[]) => store.dispatch({
  type: PageAction.INITIALIZE,
  items,
})

export const createPage = (item: PageData) => store.dispatch({
  type: PageAction.CREATE,
  item,
})

export const deletePage = (item: PageData) => store.dispatch({
  type: PageAction.DELETE,
  item,
})

export const updatePage = (oldItem: PageData, newItem: PageData) => store.dispatch({
  type: PageAction.UPDATE,
  oldItem,
  newItem,
})

export const openPage = (item: PageData) => store.dispatch({
  type: PageAction.OPEN,
  item,
})

export const getPages = () => store.getState().pages

export const subscribePages = (cbk: (prevState: State, nextState: State) => void): () => void => {
  return subscribeTo('pages', cbk)
}

// //////////////////////
// Expose the API to JS
// tslint:disable:no-string-literal
window['silex'] = window['silex'] || {};
window['silex'].page = {
  initializePages, createPage, deletePage, updatePage, openPage, getPages,
}
