import { applyMiddleware, createStore, Store } from 'redux'

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
  OPEN = 'PAGE_OPEN',
}

export const pageReducer = (state: PageData[] = [], action: any) => {
  // console.log('page reducer', state, action)
  switch (action.type) {
    case PageAction.OPEN: return state.map((item) => item.name === action.item.name ? Object.assign({}, action.item, { isOpen: true }) : item.isOpen ? Object.assign({}, item, { isOpen: false }) : item)
    default: return state
  }
}
