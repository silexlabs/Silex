import { createStore, Store, applyMiddleware } from 'redux'

/**
 * structure to store all of a page data
 * @struct
 */
export class PageData {
  name: string;
  displayName: string;
  element: HTMLAnchorElement;
  previewLink: string;
  idx: number; // FIXME: why this??
  isOpen: boolean;
  canDelete: boolean;
  canProperties: boolean;
  canMove: boolean;
  canRename: boolean;
}

enum PageActionName {
  INITIALIZE = 'INITIALIZE',
  CREATE = 'CREATE',
  DELETE = 'DELETE',
  UPDATE = 'UPDATE',
  MOVE = 'MOVE',
  OPEN = 'OPEN',
}
export const initializePages = (pages: PageData[]) => pageStore.dispatch({
  type: PageActionName.INITIALIZE,
  pages,
})

export const createPage = (page: PageData) => pageStore.dispatch({
  type: PageActionName.CREATE,
  page,
})

export const deletePage = (page: PageData) => pageStore.dispatch({
  type: PageActionName.DELETE,
  page,
})

export const updatePage = (oldPage: PageData, newPage: PageData) => pageStore.dispatch({
  type: PageActionName.UPDATE,
  oldPage,
  newPage,
})

export const movePage = (page: PageData, idx: number) => pageStore.dispatch({
  type: PageActionName.MOVE,
  page,
  idx,
})

export const openPage = (page: PageData) => pageStore.dispatch({
  type: PageActionName.OPEN,
  page,
})

const updateIdx = (page: PageData, idx: number) => page.idx !== idx ? Object.assign({}, page, { idx }) : page

function reduce(state = [], action) {
  console.log('reduce', action.type)
  switch (action.type) {
    case PageActionName.INITIALIZE: return action.pages.slice()
    case PageActionName.CREATE: return state.concat([action.page]).map(updateIdx)
    case PageActionName.DELETE: return state.filter((page) => page.name !== action.page.name).map(updateIdx)
    case PageActionName.UPDATE: return state.map((page) => page === action.oldPage ? action.newPage : page).map(updateIdx)
    case PageActionName.MOVE: return state.map((page, idx) => page.name === action.page.name ? page.idx === action.idx ? page : Object.assign({}, page, { idx: action.idx }) : page.idx === action.idx ? Object.assign({}, page, { idx: action.idx + 1 }) : page).sort((p1, p2) => p1.idx - p2.idx).map(updateIdx)
    case PageActionName.OPEN: return state.map((page) => page.name === action.page.name ? Object.assign({}, action.page, { isOpen: true }) : page.isOpen ? Object.assign({}, page, { isOpen: false }) : page)
    default: return state
  }
}

export const pageStore: Store<PageData[]> = createStore(reduce)

window['silex'] = window['silex'] || {};
window['silex']['pageStore'] = pageStore

