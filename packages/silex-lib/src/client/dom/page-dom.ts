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
import { getSiteDocument, getSiteWindow } from '../components/UiElements';
import { noSectionContent } from './element-dom';

/**
 * get the currently opened page from the dom
 * this returns only the name, used in getPageData
 */
export function getCurrentPageName(): string {
  // tslint:disable:no-string-literal
  return getSiteWindow()['jQuery'](getSiteDocument().body).pageable('option', 'currentPage')
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
export function openPage(pageData: PageData) {
  // tslint:disable:no-string-literal
  const bodyElement = getSiteDocument().body
  if (getSiteWindow()['jQuery'] && getSiteWindow()['jQuery'](bodyElement).pageable) {
    getSiteWindow()['jQuery'](bodyElement).pageable({
      currentPage: pageData.id,
    })
  }
}

/**
 * remove a page from the dom
 * elements which are only in this page should be deleted
 */
export function removePage(pageData: PageData) {
  pageData.element.remove()
}

/**
 * move a page in the dom
 */
export function movePage(pageData: PageData, newPageIdx: number) {
  const pages = getPages()
  const pageIdx = pages.findIndex((page) => page === pageData)
  const container = getSiteDocument().body.querySelector('.' + Constants.PAGES_CONTAINER_CLASS_NAME)
  if (typeof pageIdx === 'undefined' || newPageIdx < 0 || newPageIdx >= pages.length) {
    console.error('I cannot move this page to this index', pageData, pages)
  } else if (newPageIdx >= pages.length - 1) {
    container.appendChild(pageData.element)
  } else {
    // handle the case where the next element is myself
    const target = newPageIdx + 1 === pageIdx ? container.children[newPageIdx] : container.children[newPageIdx + 1]
    container.insertBefore(pageData.element, target)
  }
}

/**
 * add a page to the dom
 */
export function createPage(name: string, displayName: string) {
  const aTag = getSiteDocument().createElement('a')
  aTag.setAttribute('id', name)
  aTag.setAttribute('href', '#!' + name)
  aTag.setAttribute('data-silex-type', Constants.TYPE_PAGE)
  aTag.classList.add(Constants.TYPE_PAGE)
  aTag.innerHTML = displayName
  getSiteDocument().body.querySelector('.' + Constants.PAGES_CONTAINER_CLASS_NAME)
    .appendChild(aTag)
}

/**
 * rename a page in the dom
 */
export function renamePage(pageData: PageData, newName: string, newDisplayName: string) {
  // update the dom element
  pageData.element.setAttribute('id', newName)
  pageData.element.setAttribute('href', '#!' + newName)
  pageData.element.innerHTML = newDisplayName
//
//   if (pageData.id !== newName) {
//     // update the links to this page
//     getLinksToPage(pageData)
//       .forEach((element) => {
//         element.setAttribute('data-silex-href', '#!' + newName)
//       })
//
//     // update the visibility of the compoents
//     Array.from(getSiteDocument().body.getElementsByClassName(pageData.id))
//       .forEach((element) => {
//         element.classList.remove(pageData.id)
//         element.classList.add(newName)
//       })
//   }
}

/**
 * set/get a the visibility of an element in the given page
 * remove from all pages if visible in all pages
 */
export function addToPage(element: HTMLElement, pageData: PageData) {
  if (isInPage(element, pageData)) {
    console.error('Element is already in page', element, pageData)
  } else {
    const noSectionEl = noSectionContent(element)
    if (getPagesForElement(noSectionEl).length + 1 === getPages().length) {
      // from visible in some pages to visible everywhere
      removeFromAllPages(noSectionEl)
    } else {
      // still only visible on some pages
      noSectionEl.classList.add(pageData.id)
      noSectionEl.classList.add(Constants.PAGED_CLASS_NAME)
    }
  }
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
  const noSectionEl = noSectionContent(element)
  getPagesForElement(noSectionEl)
    .forEach((pageData) => {
      noSectionEl.classList.remove(pageData.id)
    })

  // the element is not "paged" anymore
  noSectionEl.classList.remove(Constants.PAGED_CLASS_NAME)
}

/**
 * get the pages on which this element is visible
 */
export function getPagesForElement(element: HTMLElement): PageData[] {
  const noSectionEl = noSectionContent(element)
  return getPages().filter(
      (pageData) => noSectionEl.classList.contains(pageData.id))
}

/**
 * get all elements visible when the given page is opened
 */
export function getElementsForPage(pageData: PageData): HTMLElement[] {
  return (Array.from(getSiteDocument().querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}`)) as HTMLElement[])
    .filter((el) => isVisible(el, pageData))
}

/**
 * get all links to a given page
 * these are only silex elements links, not elements in HTML boxes or text
 */
export function getLinksToPage(pageData: PageData): HTMLElement[] {
  return Array.from(getSiteDocument().body.querySelectorAll('*[data-silex-href="#!' + pageData.id + '"]'))
}

/**
 * check if an element is in the given page (current page by default)
 */
export function isInPage(element: HTMLElement, pageData = getPages().find((p) => p.isOpen)): boolean {
  return noSectionContent(element).classList.contains(pageData.id)
}

/**
 * check if an element is visible in the given page
 * this means that the element is allways visible or it is visible in this page
 */
export function isVisible(element: HTMLElement, pageData: PageData = getPages().find((p) => p.isOpen)) {
  if (element.classList.contains(Constants.PAGED_CLASS_NAME) && !isInPage(element, pageData)) {
    return false
  }
  const parentPaged = getParentPage(element)
  return !parentPaged || (isInPage(parentPaged, pageData) && isVisible(parentPaged, pageData))
}

/**
 * retrieve the first parent which is visible only on some pages
 * @return null or the element or one of its parents which has the css class
 *     silex.model.Constants.PAGED_CLASS_NAME
 */
export function getParentPage(element: HTMLElement): HTMLElement {
  let parent = element.parentElement as HTMLElement;
  while (parent && !parent.classList.contains(Constants.PAGED_CLASS_NAME)) {
    parent = parent.parentElement as HTMLElement;
  }
  return (parent as HTMLElement | null);
}
