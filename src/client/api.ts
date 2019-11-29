import { createStore, Store, combineReducers } from 'redux'
import { PageData, PageAction, pages } from './flux/page-store'

interface State {
  pages: PageData[],
  // elements: ElementData[]
}

// //////////////////////
// Create the main store
export const store: Store<State> = createStore(combineReducers({
  pages,
  // elements,
}))

// //////////////////////
// Page functions
export const initializePages = (pages: PageData[]) => store.dispatch({
  type: PageAction.INITIALIZE,
  pages,
})

export const createPage = (page: PageData) => store.dispatch({
  type: PageAction.CREATE,
  page,
})

export const deletePage = (page: PageData) => store.dispatch({
  type: PageAction.DELETE,
  page,
})

export const updatePage = (oldPage: PageData, newPage: PageData) => store.dispatch({
  type: PageAction.UPDATE,
  oldPage,
  newPage,
})

export const movePage = (page: PageData, idx: number) => store.dispatch({
  type: PageAction.MOVE,
  page,
  idx,
})

export const openPage = (page: PageData) => store.dispatch({
  type: PageAction.OPEN,
  page,
})

export const getPages = () => store.getState().pages

const subscribeTo = (name: string, cbk: (prevState: State, nextState: State) => void): () => void => {
  return store.subscribe(() => {
    const state = store.getState()
    if(!prevState || state[name] !== prevState[name]) {
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

export const subscribePages = (cbk: (prevState: State, nextState: State) => void): () => void => {
  return subscribeTo('pages', cbk)
}

// //////////////////////
// Expose the API to JS
window['silex'] = window['silex'] || {};
window['silex']['page'] = {
  initializePages, createPage, deletePage, updatePage, movePage, openPage, getPages,
}

