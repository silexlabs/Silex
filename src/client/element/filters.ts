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

import { ElementId, ElementData } from './types'
import { getElements } from './store';
import { getDomElement } from './dom'

/**
 * @fileoverview Useful filters used to retrieve items in the store. Cross platform, it needs to run client and server side
 *
 */

export const getElementById = (id: ElementId): ElementData => getElements().find((el) => el.id === id)
export const getElementByDomElement = (doc: HTMLDocument, element: HTMLElement) => getElements().find((el) => element === getDomElement(doc, el))

export const getChildren = (element: ElementData): ElementData[] => element.children.map((id) => getElementById(id))

export const getChildrenRecursive = (element: ElementData): ElementData[] => {
  return element.children
  .map((id) => getElementById(id))
  .concat(element.children.reduce((prev, id) => getChildrenRecursive(getElementById(id)), []))
}

export const getParent = (element: ElementData): ElementData => getElements().find((parent) => {
  return parent.children.includes(element.id)
})

export const getAllParents = (element: ElementData): ElementData[] => {
  const parent = getParent(element)
  return !!parent ? [parent, ...getAllParents(parent)] : []
}

// FIXME: find a more relyable way to find the body, i.e. isBody or a type of element
export const isBody = (el: ElementData): boolean => !getParent(el)

export const getBody = (): ElementData => getElements().find((el) => isBody(el))

export const noSectionContent = (element: ElementData): ElementData => element.isSectionContent ? getParent(element) : element

// const defaultSelection = (selected) => selected.length ? selected : [getBody()]

export const getSelectedElements = () => getElements()
  .filter((el) => el.selected)

export const getSelectedElementsNoSectionContent = () => getElements()
  .map((el) => noSectionContent(el))
  .filter((el) => el.selected)

/**
 * check if the element's parents belong to a page, and if one of them do,
 * remove the element from the other pages
 *
 * if the element is in a container which is visible only on some pages,
 * then the element should be visible everywhere, i.e. in the same pages as
 * its parent
 */
export function getFirstPagedParent(element: ElementData): ElementData {
  const parent = getElements().find((el) => el.children.includes(element.id))
  if (!!parent) {
    if (parent.pageNames.length) {
      return parent
    }
    return getFirstPagedParent(parent)
  }
  // body
  return null
}