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

import { getPages } from './store'
import { getUi } from '../ui/store';

/**
 * @fileoverview Useful filters used to retrieve items in the store
 *
 */


export const getCurrentPage = () => {
  const { currentPageId } = getUi()
  return getPages()
    .find((p) => p.id === currentPageId)
}
