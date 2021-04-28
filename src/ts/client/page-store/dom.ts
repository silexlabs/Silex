

import { Constants } from '../../constants'
import { PageState } from './types'

/**
 * get the currently opened page from the dom
 * this returns only the name, used in getPageData
 */
export function getCurrentPageName(win: Window): string {
  // tslint:disable:no-string-literal
  return win['jQuery'](win.document.body).pageable('option', 'currentPage')
}

/**
 * get the currently opened page from the dom
 */
export function getCurrentPageFromDom(win: Window, pages: PageState[]): PageState {
  const name = getCurrentPageName(win)
  return pages.find((p) => p.id === name)
}

/**
 * open the page
 */
export function openPageDom(win: Window, pageData: PageState) {
  // tslint:disable:no-string-literal
  const bodyElement = win.document.body
  if (win['jQuery'] && win['jQuery'](bodyElement).pageable) {
    win['jQuery'](bodyElement).pageable({
      currentPage: pageData.id,
    })
  }
}

/**
 * set/get a the visibility of an element in the given page
 * remove from all pages if visible in all pages
 */
export function setPages(allPages: PageState[], element: HTMLElement, pages: PageState[]) {
  removeFromPages(allPages.map((p) => p.id), element)
  pages.forEach((page) => {
    if(page) {
      element.classList.add(page.id)
      element.classList.add(Constants.PAGED_CLASS_NAME)
    } else {
      // this should never happen
      // fixed 2021-03
      console.error('This page does not exist anymore')
    }
  })
}

/**
 * remove an element from all the pages
 * make it visible on all pages
 */
export function removeFromPages(pageIds: string[], element: HTMLElement) {
  pageIds.forEach((id) => {
    element.classList.remove(id)
  })

  // the element is not "paged" anymore
  element.classList.remove(Constants.PAGED_CLASS_NAME)

  // reset page visibility
  element.classList.remove(Constants.PAGED_VISIBLE_CLASS_NAME)
  element.classList.remove(Constants.PAGED_HIDDEN_CLASS_NAME)
}

/**
 * get the pages on which this element is visible
 */
function getPagesForElement(pages: PageState[], element: HTMLElement): PageState[] {
  return pages.filter((pageData) => element.classList.contains(pageData.id))
}

