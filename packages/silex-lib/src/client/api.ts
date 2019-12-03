import { combineReducers, createStore, Store } from 'redux';
import { ElementData, PageData, SiteData, UiData } from '../types';
import { getStage } from './components/StageWrapper';
import { getDomElement } from './dom/element-dom';
import { withCrud } from './flux/crud-store';

interface State {
  pages: PageData[],
  elements: ElementData[],
  site: SiteData,
  ui: UiData,
}

// //////////////////////
// Actions and reducers
enum ElementAction {
  INITIALIZE = 'ELEMENT_INITIALISE',
  CREATE = 'ELEMENT_CREATE',
  DELETE = 'ELEMENT_DELETE',
  UPDATE = 'ELEMENT_UPDATE',
  MOVE = 'ELEMENT_MOVE',
}

const elementReducer = (state: ElementData[] = [], action: any): any => {
  switch (action.type) {
    default: return state
  }
}

enum PageAction {
  INITIALIZE = 'PAGE_INITIALIZE',
  CREATE = 'PAGE_CREATE',
  DELETE = 'PAGE_DELETE',
  UPDATE = 'PAGE_UPDATE',
  OPEN = 'PAGE_OPEN',
  MOVE = 'PAGE_MOVE',
}

const pageReducer = (state: PageData[] = [], action: any) => {
  // console.log('page reducer', state, action)
  switch (action.type) {
    case PageAction.OPEN: return state.map((item) => item.name === action.item.name ? Object.assign({}, action.item, { isOpen: true }) : item.isOpen ? Object.assign({}, item, { isOpen: false }) : item)
    default: return state
  }
}

enum SiteAction {
  INITIALIZE = 'SITE_INITIALIZE',
  UPDATE = 'SITE_UPDATE',
}

const siteReducer = (state: SiteData = {
  description: '',
  enableMobile: true,
  head: '',
  title: '',
  publicationPath: null,
  websiteUrl: '',
  faviconPath: '',
  thumbnailSocialPath: '',
  descriptionSocial: '',
  titleSocial: '',
  lang: '',
  width: -1,
  headStyle: '',
  headScript: '',
  userStyle: '',
  userScript: '',
  userHeadTag: '',
  hostingProvider: '',
  twitterSocial: '',
  dataSources: {},
  fonts: [],
}, action: any) => {
  // console.log('page reducer', state, action)
  switch (action.type) {
    case SiteAction.INITIALIZE: return {
      ...action.data,
    }
    case SiteAction.UPDATE: return {
      ...state,
      ...action.data,
    }
    default: return state
  }
}

enum UiAction {
  INITIALIZE = 'UI_INITIALIZE',
  UPDATE = 'UI_UPDATE',
}

const uiReducer = (state: UiData = {
    loading: true,
    loadingSite: false,
    mobileEditor: false,
  }, action: any) => {
  // console.log('page reducer', state, action)
  switch (action.type) {
    case UiAction.INITIALIZE: return {
      ...action.data,
    }
    case UiAction.UPDATE: return {
      ...state,
      ...action.data,
    }
    default: return state
  }
}

// //////////////////////
// Create the main store
const store: Store<State> = createStore(combineReducers({
  pages: withCrud<PageData>(PageAction, pageReducer, 'Pages'),
  elements: withCrud<ElementData>(ElementAction, elementReducer, 'Elements'),
  site: siteReducer,
  ui: uiReducer,
}))

function subscribeToCrud<T>(name: string, cbk: (prevState: T[], nextState: T[]) => void): () => void {
  return store.subscribe(() => {
    const state = store.getState()
    if (!prevState || state[name] !== prevState[name]) {
      cbk(prevState ? prevState[name] : null, state[name])
    }
  })
}

function subscribeTo<T>(name: string, cbk: (prevState: T, nextState: T) => void): () => void {
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

export const createElements = (items: ElementData[]) => store.dispatch({
  type: ElementAction.CREATE,
  items,
})

export const deleteElements = (items: ElementData[]) => store.dispatch({
  type: ElementAction.DELETE,
  items,
})

export const updateElements = (changes: Array<{from: ElementData, to: ElementData}>) => store.dispatch({
  type: ElementAction.UPDATE,
  changes,
})

export const moveElement = (item: ElementData, idx: number) => store.dispatch({
  type: ElementAction.MOVE,
  item,
  idx,
})

export const getElements = () => store.getState().elements

export const subscribeElements = (cbk: (prevState: ElementData[], nextState: ElementData[]) => void): () => void => {
  return subscribeToCrud<ElementData>('elements', cbk)
}

/////////////////////////
// Stage API
export const getStageState = (element: ElementData) => getStage().getState(getDomElement(element))

// //////////////////////
// Page API
export const initializePages = (items: PageData[]) => store.dispatch({
  type: PageAction.INITIALIZE,
  items,
})

export const createPages = (items: PageData[]) => store.dispatch({
  type: PageAction.CREATE,
  items,
})

export const deletePages = (items: PageData[]) => store.dispatch({
  type: PageAction.DELETE,
  items,
})

export const updatePages = (changes: Array<{from: PageData, to: PageData}>) => store.dispatch({
  type: PageAction.UPDATE,
  changes,
})

export const openPage = (item: PageData) => store.dispatch({
  type: PageAction.OPEN,
  item,
})

export const movePage = (item: PageData, idx: number) => store.dispatch({
  type: PageAction.MOVE,
  item,
  idx,
})

export const getPages = () => store.getState().pages

export const subscribePages = (cbk: (prevState: PageData[], nextState: PageData[]) => void): () => void => {
  return subscribeToCrud<PageData>('pages', cbk)
}

// //////////////////////
// Site API
export const initializeSite = (data: SiteData) => store.dispatch({
  type: SiteAction.INITIALIZE,
  data,
})

export const updateSite = (data: SiteData) => store.dispatch({
  type: SiteAction.UPDATE,
  data,
})

export const getSite = () => store.getState().site

export const subscribeSite = (cbk: (prevState: SiteData, nextState: SiteData) => void): () => void => {
  return subscribeTo<SiteData>('site', cbk)
}

// //////////////////////
// Ui API
export const initializeUi = (data: UiData) => store.dispatch({
  type: UiAction.INITIALIZE,
  data,
})

export const updateUi = (data: UiData) => store.dispatch({
  type: UiAction.UPDATE,
  data,
})

export const getUi = () => store.getState().ui

export const subscribeUi = (cbk: (prevState: UiData, nextState: UiData) => void): () => void => {
  return subscribeTo<UiData>('ui', cbk)
}
