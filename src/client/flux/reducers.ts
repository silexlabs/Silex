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

import { PageAction, SiteAction, UiAction } from './actions';
import { ElementData } from '../element/types';
import { PageData } from '../page/types';
import { SiteData } from '../site/types';
import { UiData } from '../ui/types';

// FIXME:  split this file in the packages page, element, site, ui

export const elementReducer = (state: ElementData[] = [], action: any): any => {
  switch (action.type) {
    default: return state
  }
}

export const pageReducer = (state: PageData[] = [], action: any): PageData[] => {
  switch (action.type) {
    case PageAction.OPEN:
      return state
        .map((item) => item.id === action.item.id ? Object.assign({}, action.item, { opened: true }) : item.opened ? Object.assign({}, item, { opened: false }) : item)
    case PageAction.MOVE:
      // remove the item
      const idx = state.findIndex((item) => item === action.item)
      const withoutItem = [...state.slice(0, idx), ...state.slice(idx + 1)]
      // put it back
      return [...withoutItem.slice(0, action.idx), action.item, ...withoutItem.slice(action.idx)]

    default: return state
  }
}

export const siteReducer = (state: SiteData = {
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
  style: {},
  file: null,
  prodotypeDependencies: {}
},                          action: any) => {
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

export const uiReducer = (state: UiData = {
  loading: true,
  mobileEditor: false,
},                        action: any) => {
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
