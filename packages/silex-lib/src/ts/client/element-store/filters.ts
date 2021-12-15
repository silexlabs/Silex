/**
 * @fileoverview Useful filters used to retrieve items in the store. Cross platform, it needs to run client and server side
 *
 */

import { ElementId, ElementState } from './types'
import { getElements } from './index'
import { getDomElement } from './dom'

export const getElementById = (id: ElementId, elements = getElements()): ElementState => {
  const element = elements.find((el) => el.id === id)
  if (element) return element
  // Element not found, this happens when we generate a new ID and want to check that it does not exist
  return null
}
export const getElementByDomElement = (doc: HTMLDocument, element: HTMLElement, elements = getElements()) => elements.find((el) => element === getDomElement(doc, el))

export const getChildren = (element: ElementState, elements = getElements()): ElementState[] => element.children.map((id) => getElementById(id, elements))

export const getChildrenRecursive = (element: ElementState, elements = getElements()): ElementState[] => {
  return element.children
  .map((id) => getElementById(id, elements))
  .filter((el) => !!el)
  .concat(element.children.reduce((prev, id) => {
    const el = getElementById(id, elements)
    if (el) return prev.concat(getChildrenRecursive(el, elements))
    return prev
  }, []))
}

export const getParent = (element: ElementState, elements = getElements()): ElementState => elements.find((parent) => parent.children.includes(element.id))

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
  .filter((el) => el.selected) // first get selection
  .map((el) => noSectionContent(el, elements)) // then replace section contents with sections

/**
 * get the fist parent element which is "paged", i.e. not visible on all pages
 */
export function getFirstPagedParent(element: ElementState, elements = getElements()): ElementState {
  const parent = getParent(element, elements)
  if (!!parent) {
    if (parent.pageNames.length) {
      return parent
    }
    return getFirstPagedParent(parent, elements)
  }
  // body
  return null
}

