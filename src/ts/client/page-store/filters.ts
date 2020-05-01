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

import { PageState } from './types';
import { getPages } from './index'
import { getUi } from '../ui-store/index';

/**
 * @fileoverview Useful filters used to retrieve items in the store
 *
 */


export const getPageById = (id: string, pages = getPages()): PageState => {
  return pages.find((p) => p.id === id)
}

export const getCurrentPage = (ui = getUi(), pages = getPages()): PageState => {
  return getPageById(ui.currentPageId, pages)
}

