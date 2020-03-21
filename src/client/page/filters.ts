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

import { PageData } from './types'

/**
 * @fileoverview Useful filters used to retrieve items in the store
 *
 */


export const getCurrentPage = (pages: PageData[]) => pages
  .find((p) => p.opened)

