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

/**
 * @fileoverview Useful filters used to retrieve items in the store
 *
 */


export const getCurrentPage = () => getPages()
  .find((p) => p.opened)

