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

import { Constants } from '../../constants';
import { PageData } from '../../types';
import { getPages } from '../api';

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
export function getCurrentPage(win: Window): PageData {
  const name = getCurrentPageName(win)
  return getPages().find((p) => p.id === name)
}

// /**
//  * get the currently opened page from the dom
//  */
// export function getCurrentPage(): PageData {
//   // tslint:disable:no-string-literal
//   try {
//     return getPageData(getCurrentPageName())
//   } catch (e) {
//     // there was a problem in the pageable plugin, return the first page
//     console.warn(`warning, could not retrieve the current page, I will return the first page (${getPagesFromDom()[0]})`)
//     return getPagesFromDom()[0]
//   }
// }

/**
 * open the page
 */
export function openPageDom(win: Window, pageData: PageData) {
  console.log('openPage', pageData, pageData.id)
  // tslint:disable:no-string-literal
  const bodyElement = win.document.body
  if (win['jQuery'] && win['jQuery'](bodyElement).pageable) {
    win['jQuery'](bodyElement).pageable({
      currentPage: pageData.id,
    })
  }
}

// /**
//  * remove a page from the dom
//  * elements which are only in this page should be deleted
//  */
// export function removePage(pageData: PageData) {
//   pageData.element.remove()
// }

/**
 * move a page in the dom
 */
// export function movePage(pageData: PageData, newPageIdx: number) {
//   const pages = getPages()
//   const pageIdx = pages.findIndex((page) => page === pageData)
//   const container = getSiteDocument().body.querySelector('.' + Constants.PAGES_CONTAINER_CLASS_NAME)
//   if (typeof pageIdx === 'undefined' || newPageIdx < 0 || newPageIdx >= pages.length) {
//     console.error('I cannot move this page to this index', pageData, pages)
//   } else if (newPageIdx >= pages.length - 1) {
//     container.appendChild(pageData.element)
//   } else {
//     // handle the case where the next element is myself
//     const target = newPageIdx + 1 === pageIdx ? container.children[newPageIdx] : container.children[newPageIdx + 1]
//     container.insertBefore(pageData.element, target)
//   }
// }

// /**
//  * add a page to the dom
//  */
// export function createPage(name: string, displayName: string) {
//   const aTag = getSiteDocument().createElement('a')
//   aTag.setAttribute('id', name)
//   aTag.setAttribute('href', '#!' + name)
//   aTag.setAttribute('data-silex-type', Constants.TYPE_PAGE)
//   aTag.classList.add(Constants.TYPE_PAGE)
//   aTag.innerHTML = displayName
//   getSiteDocument().body.querySelector('.' + Constants.PAGES_CONTAINER_CLASS_NAME)
//     .appendChild(aTag)
// }
//
// /**
//  * rename a page in the dom
//  */
// export function renamePage(pageData: PageData, newName: string, newDisplayName: string) {
//   // update the dom element
//   pageData.element.setAttribute('id', newName)
//   pageData.element.setAttribute('href', '#!' + newName)
//   pageData.element.innerHTML = newDisplayName
// //
// //   if (pageData.id !== newName) {
// //     // update the links to this page
// //     getLinksToPage(pageData)
// //       .forEach((element) => {
// //         element.setAttribute('data-silex-href', '#!' + newName)
// //       })
// //
// //     // update the visibility of the compoents
// //     Array.from(getSiteDocument().body.getElementsByClassName(pageData.id))
// //       .forEach((element) => {
// //         element.classList.remove(pageData.id)
// //         element.classList.add(newName)
// //       })
// //   }
// }

// /**
//  * set/get a the visibility of an element in the given page
//  * remove from all pages if visible in all pages
//  */
// export function addToPage(element: HTMLElement, pageData: PageData) {
//     if (getPagesForElement(element).length + 1 === getPages().length) {
//     // from visible in some pages to visible everywhere
//     removeFromAllPages(element)
//     } else {
//     // still only visible on some pages
//     element.classList.add(pageData.id)
//     element.classList.add(Constants.PAGED_CLASS_NAME)
//   }
// }

/**
 * set/get a the visibility of an element in the given page
 * remove from all pages if visible in all pages
 */
export function setPages(element: HTMLElement, pages: PageData[]) {
  removeFromAllPages(element)
  pages.forEach((page) => {
    element.classList.add(page.id)
    element.classList.add(Constants.PAGED_CLASS_NAME)
  })
}
// /**
//  * remove an element from a page
//  */
// export function removeFromPage(element: HTMLElement, pageData: PageData) {
//   if (!isInPage(element, pageData)) {
//     console.error('Element is not in page', element, pageData.displayName)
//   } else {
//     const noSectionEl = noSectionContent(element)
//     if (getPagesForElement(noSectionEl).length - 1 === 0) {
//       // from visible in some pages to visible everywhere
//       removeFromAllPages(noSectionEl)
//     } else {
//       noSectionEl.classList.remove(pageData.id)
//     }
//   }
// }

/**
 * remove an element from all the pages
 * make it visible on all pages
 */
export function removeFromAllPages(element: HTMLElement) {
  getPagesForElement(element)
    .forEach((pageData) => {
      element.classList.remove(pageData.id)
    })

  // the element is not "paged" anymore
  element.classList.remove(Constants.PAGED_CLASS_NAME)
}

/**
 * get the pages on which this element is visible
 */
function getPagesForElement(element: HTMLElement): PageData[] {
  return getPages().filter((pageData) => element.classList.contains(pageData.id))
}

// /**
//  * get all elements visible when the given page is opened
//  */
// export function getElementsForPage(pageData: PageData): HTMLElement[] {
//   return (Array.from(getSiteDocument().querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}`)) as HTMLElement[])
//     .filter((el) => isVisible(el, pageData))
// }
//
// /**
//  * get all links to a given page
//  * these are only silex elements links, not elements in HTML boxes or text
//  */
// export function getLinksToPage(pageData: PageData): HTMLElement[] {
//   return Array.from(getSiteDocument().body.querySelectorAll('*[data-silex-href="#!' + pageData.id + '"]'))
// }
//
// /**
//  * check if an element is in the given page (current page by default)
//  */
// export function isInPage(element: HTMLElement, pageData = getPages().find((p) => p.opened)): boolean {
//   return noSectionContent(element).classList.contains(pageData.id)
// }
//
// /**
//  * check if an element is visible in the given page
//  * this means that the element is allways visible or it is visible in this page
//  */
// export function isVisible(element: HTMLElement, pageData: PageData = getPages().find((p) => p.opened)) {
//   if (element.classList.contains(Constants.PAGED_CLASS_NAME) && !isInPage(element, pageData)) {
//     return false
//   }
//   const parentPaged = getParentPage(element)
//   return !parentPaged || (isInPage(parentPaged, pageData) && isVisible(parentPaged, pageData))
// }
//
// /**
//  * retrieve the first parent which is visible only on some pages
//  * @return null or the element or one of its parents which has the css class
//  *     silex.model.Constants.PAGED_CLASS_NAME
//  */
// export function getParentPage(element: HTMLElement): HTMLElement {
//   let parent = element.parentElement as HTMLElement;
//   while (parent && !parent.classList.contains(Constants.PAGED_CLASS_NAME)) {
//     parent = parent.parentElement as HTMLElement;
//   }
//   return (parent as HTMLElement | null);
// }
