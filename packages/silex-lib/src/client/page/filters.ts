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

import { PageData } from './types';
import { getPages } from './store'
import { getUi } from '../ui/store';

/**
 * @fileoverview Useful filters used to retrieve items in the store
 *
 */


export const getPageById = (id: string): PageData => {
  return getPages().find((p) => p.id === id)
}

export const getCurrentPage = (): PageData => {
  const { currentPageId } = getUi()
  return getPageById(currentPageId)
}

