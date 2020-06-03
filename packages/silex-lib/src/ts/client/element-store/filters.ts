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

import { ElementId, ElementState } from './types'
import { getElements } from './index'
import { getDomElement } from './dom'

/**
 * @fileoverview Useful filters used to retrieve items in the store. Cross platform, it needs to run client and server side
 *
 */

export const getElementById = (id: ElementId, elements = getElements()): ElementState => elements.find((el) => el.id === id)
export const getElementByDomElement = (doc: HTMLDocument, element: HTMLElement, elements = getElements()) => elements.find((el) => element === getDomElement(doc, el))

export const getChildren = (element: ElementState, elements = getElements()): ElementState[] => element.children.map((id) => getElementById(id, elements))

export const getChildrenRecursive = (element: ElementState, elements = getElements()): ElementState[] => {
  return element.children
  .map((id) => getElementById(id, elements))
  .concat(element.children.reduce((prev, id) => getChildrenRecursive(getElementById(id, elements), elements), []))
}

export const getParent = (element: ElementState, elements = getElements()): ElementState => elements.find((parent) => {
  return parent.children.includes(element.id)
})

export const getAllParents = (element: ElementState, elements = getElements()): ElementState[] => {
  const parent = getParent(element, elements)
  return !!parent ? [parent, ...getAllParents(parent, elements)] : []
}

// FIXME: find a more relyable way to find the body, i.e. isBody or a type of element
export const isBody = (el: ElementState, elements = getElements()): boolean => !getParent(el, elements)

export const getBody = (elements = getElements()): ElementState => elements.find((el) => isBody(el, elements))

export const noSectionContent = (element: ElementState, elements = getElements()): ElementState => element.isSectionContent ? getParent(element, elements) : element

// const defaultSelection = (selected) => selected.length ? selected : [getBody()]

export const getSelectedElements = (elements = getElements()) => elements
  .filter((el) => el.selected)

export const getSelectedElementsNoSectionContent = (elements = getElements()) => elements
  .map((el) => noSectionContent(el, elements))
  .filter((el) => el.selected)

/**
 * get the fist parent element which is "paged", i.e. not visible on all pages
 */
export function getFirstPagedParent(element: ElementState, elements = getElements()): ElementState {
  const parent = getParent(element)
  if (!!parent) {
    if (parent.pageNames.length) {
      return parent
    }
    return getFirstPagedParent(parent, elements)
  }
  // body
  return null
}

