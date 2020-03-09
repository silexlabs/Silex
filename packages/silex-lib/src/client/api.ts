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

import { DataModel, ElementData, ElementId, PageData, SiteData, UiData } from '../types';
import { DomDirection } from './ClientTypes';
import { ElementAction, PageAction, SiteAction, UiAction } from './flux/actions';
import { StateChange } from './flux/crud-store';
import { store, subscribeTo, subscribeToCrud } from './flux/store';

// //////////////////////
// The whole model API

export const getData = (): DataModel => store.getState()

// //////////////////////
// Element API

export const initializeElements = (items: ElementData[]) => store.dispatch({
  type: ElementAction.INITIALIZE,
  items,
})

export const createElements = (items: ElementData[]) => store.dispatch({
  type: ElementAction.CREATE,
  items,
})

export const deleteElements = (items: ElementData[]) => store.dispatch({
  type: ElementAction.DELETE,
  items,
})

export const updateElements = (changes: StateChange<ElementData>[]) => store.dispatch({
  type: ElementAction.UPDATE,
  changes,
})

export const getElements = () => store.getState().elements

export const subscribeElements = (cbk: (prevState: ElementData[], nextState: ElementData[]) => void): () => void => {
  return subscribeToCrud<ElementData>('elements', cbk)
}

// ///////////////////
// utils

export const getElement = (id: ElementId): ElementData => getElements().find((el) => el.id === id)

export const getChildren = (element: ElementData): ElementData[] => element.children.map((id) => getElement(id))

export const getChildrenRecursive = (element: ElementData): ElementData[] => element.children.map((id) => getElement(id)).concat(element.children.reduce((prev, id) => getChildrenRecursive(getElement(id)), []))

export const getParent = (element: ElementData): ElementData => getElements().find((parent) => {
  return parent.children.includes(element.id)
})

export const getAllParents = (element: ElementData): ElementData[] => {
  const parent = getParent(element)
  return !!parent ? [parent, ...getAllParents(parent)] : []
}

export const isBody = (el: ElementData): boolean => !getParent(el)
export const getBody = (): ElementData => getElements().find((el) => isBody(el))
export const selectBody = () => {
  const body = getBody()
  if (body && body.selected === false) {
    updateElements([{
      from: body,
      to: {
        ...body,
        selected: true,
      },
    }])
  } else {
    console.warn('Select body: no body or body already selected', body)
  }
}

export const noSectionContent = (element: ElementData): ElementData => element.isSectionContent ? getParent(element) : element

// const defaultSelection = (selected) => selected.length ? selected : [getBody()]

export const getSelectedElements = () => getElements()
  .filter((el) => el.selected)

export const getSelectedElementsNoSectionContent = () => getElements()
  .map((el) => noSectionContent(el))
  .filter((el) => el.selected)

// move elements order in their parent's children array
export const moveElements = (elements: ElementData[], direction: DomDirection) => {
  console.log('moveElements', elements, direction)
  updateElements(elements
    .map((el) => ({
      el,
      parent: getParent(noSectionContent(el)), // move the parent instead of the section content
    }))
    .filter(({el, parent}) => {
      if (!parent) {
        console.warn('No parent, is this the body??', el)
      }
      return !!el && !!parent
    })
    .map(({el, parent}) => ({
      el,
      parent,
      idx: parent.children.findIndex((c) => c === el.id),
    }))
    .map(({el, parent, idx}) => ({
      from: parent,
      to: {
        ...parent,
        children: parent.children
          .filter((c) => c !== el.id)
          .splice(direction === DomDirection.UP ? idx - 1 : DomDirection.DOWN ? idx + 1 : DomDirection.TOP ? 0 : parent.children.length - 1, 0, el.id),
      },
    })),
  )
}

// //////////////////////
// Page API

export const initializePages = (items: PageData[]) => store.dispatch({
  type: PageAction.INITIALIZE,
  items,
})

export const createPages = (items: PageData[]) => store.dispatch({
  type: PageAction.CREATE,
  items,
})

export const deletePages = (items: PageData[]) => store.dispatch({
  type: PageAction.DELETE,
  items,
})

export const updatePages = (changes: StateChange<PageData>[]) => store.dispatch({
  type: PageAction.UPDATE,
  changes,
})

export const openPage = (item: PageData) => store.dispatch({
  type: PageAction.OPEN,
  item,
})

export const movePage = (item: PageData, idx: number) => store.dispatch({
  type: PageAction.MOVE,
  item,
  idx,
})

export const getPages = () => store.getState().pages

export const subscribePages = (cbk: (prevState: PageData[], nextState: PageData[]) => void): () => void => {
  return subscribeToCrud<PageData>('pages', cbk)
}

// ///////////////////
// utils

export const getCurrentPage = () => getPages()
  .find((p) => p.opened)

// //////////////////////
// Site API

export const initializeSite = (data: SiteData) => store.dispatch({
  type: SiteAction.INITIALIZE,
  data,
})

export const updateSite = (data: SiteData) => store.dispatch({
  type: SiteAction.UPDATE,
  data,
})

export const getSite = () => store.getState().site

export const subscribeSite = (cbk: (prevState: SiteData, nextState: SiteData) => void): () => void => {
  return subscribeTo<SiteData>('site', cbk)
}

// //////////////////////
// Ui API

export const initializeUi = (data: UiData) => store.dispatch({
  type: UiAction.INITIALIZE,
  data,
})

export const updateUi = (data: UiData) => store.dispatch({
  type: UiAction.UPDATE,
  data,
})

export const getUi = () => store.getState().ui

export const subscribeUi = (cbk: (prevState: UiData, nextState: UiData) => void): () => void => {
  return subscribeTo<UiData>('ui', cbk)
}
