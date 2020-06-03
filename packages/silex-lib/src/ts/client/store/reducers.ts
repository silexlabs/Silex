

import { ElementState } from '../element-store/types'
import { LOADING, Toolboxes, UiState } from '../ui-store/types'
import { PageAction, SiteAction, UiAction } from './actions'
import { PageState } from '../page-store/types'
import { SiteState } from '../site-store/types'

export const elementReducer = (state: ElementState[] = [], action: any): any => {
  switch (action.type) {
    default: return state
  }
}

export const pageReducer = (state: PageState[] = [], action: any): PageState[] => {
  switch (action.type) {
    case PageAction.MOVE:
      // remove the item
      const idx = state.findIndex((item) => item === action.item)
      const withoutItem = [...state.slice(0, idx), ...state.slice(idx + 1)]
      // put it back
      return [...withoutItem.slice(0, action.idx), action.item, ...withoutItem.slice(action.idx)]

    default: return state
  }
}

export const siteReducer = (state: SiteState = {
  description: '',
  enableMobile: true,
  isTemplate: false,
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
  headUser: '',
  hostingProvider: '',
  twitterSocial: '',
  dataSources: {},
  fonts: [],
  styles: {},
  file: null,
  prodotypeDependencies: {}
}, action: any) => {
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

export const uiReducer = (state: UiState = {
  loading: LOADING.SILEX,
  dirty: false,
  mobileEditor: false,
  currentPageId: null,
  currentToolbox: Toolboxes.PROPERTIES,
  clipboard: null,
}, action: any) => {
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
