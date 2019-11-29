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

export enum PageAction {
  INITIALIZE = 'PAGE_INITIALIZE',
  CREATE = 'PAGE_CREATE',
  DELETE = 'PAGE_DELETE',
  UPDATE = 'PAGE_UPDATE',
  MOVE = 'PAGE_MOVE',
  OPEN = 'PAGE_OPEN',
}

const updateIdx = (page: PageData, idx: number) => page.idx !== idx ? Object.assign({}, page, { idx }) : page

export const pages = (state: PageData[] = [], action) => {
  switch (action.type) {
    case PageAction.INITIALIZE: return action.pages.slice()
    case PageAction.CREATE: return state.concat([action.page]).map(updateIdx)
    case PageAction.DELETE: return state.filter((page) => page.name !== action.page.name).map(updateIdx)
    case PageAction.UPDATE: return state.map((page) => page === action.oldPage ? action.newPage : page).map(updateIdx)
    case PageAction.MOVE: return state.map((page, idx) => page.name === action.page.name ? page.idx === action.idx ? page : Object.assign({}, page, { idx: action.idx }) : page.idx === action.idx ? Object.assign({}, page, { idx: action.idx + 1 }) : page).sort((p1, p2) => p1.idx - p2.idx).map(updateIdx)
    case PageAction.OPEN: return state.map((page) => page.name === action.page.name ? Object.assign({}, action.page, { isOpen: true }) : page.isOpen ? Object.assign({}, page, { isOpen: false }) : page)
    default: return state
  }
}

