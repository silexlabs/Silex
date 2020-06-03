/**
 * @fileoverview Useful filters used to retrieve items in the store
 *
 */

import { PageState } from './types'
import { getPages } from './index'
import { getUi } from '../ui-store/index'

export const getPageById = (id: string, pages = getPages()): PageState => {
  return pages.find((p) => p.id === id)
}

export const getCurrentPage = (ui = getUi(), pages = getPages()): PageState => {
  return getPageById(ui.currentPageId, pages)
}

