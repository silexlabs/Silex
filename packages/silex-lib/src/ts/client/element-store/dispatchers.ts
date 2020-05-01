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

import { Constants } from '../../constants'
import { CssRule } from '../site-store/types'
import {
  DomDirection,
  ElementState,
  ElementType,
  Link,
  StyleObject
} from './types';
import { PageState } from '../page-store/types'
import { addToMobileOrDesktopStyle } from '../utils/styles';
import {
  createElements,
  deleteElements,
  getElements,
  updateElements
} from './index';
import {
  getBody,
  getChildrenRecursive,
  getElementById,
  getFirstPagedParent,
  getParent,
  getSelectedElements,
  isBody,
  noSectionContent
} from './filters';
import { getUi } from '../ui-store/index'
import { store } from '../store/index'
import { getCreateAction } from './utils'

/**
 * @fileoverview helpers to dispatch common actions on the store
 *
 */

/**
 * select the body and only the body
 */
export const selectBody = (elements = getElements(), dispatch = store.dispatch) => {
  selectElements([getBody(elements)], elements, dispatch)
}

/**
 * select a set of elements
 */
export const selectElements = (selection: ElementState[], elements = getElements(), dispatch = store.dispatch) => {
  updateElements(getSelectedElements(elements)
    // unselect all but the one to select
    .filter((el) => !selection.includes(el))
    .map((el) => ({ ...el, selected: false, }))
    // select the once to select
    .concat(selection
      .map((el) => ({
        ...el,
        selected: true,
      }))),
    dispatch)
}

/**
 * move elements order in their parent's children array
 */
export const moveElements = (selection: ElementState[], direction: DomDirection, elements = getElements(), dispatch = store.dispatch) => {
  updateElements(selection
    .map((el) => ({
      el,
      parent: getParent(noSectionContent(el), elements), // move the parent instead of the section content
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
      el, parent,
      idx: direction === DomDirection.UP ? idx - 1 : direction === DomDirection.DOWN ? idx + 1 : direction === DomDirection.TOP ? 0 : parent.children.length - 1,
      children: parent.children.filter(((c) => c !== el.id)), // remove the element in order to insert it at the right spot
    }))
    .map(({el, parent, idx, children}) => ({
      ...parent,
      children: [
        ...children.slice(0, idx),
        el.id,
        ...children.slice(idx),
      ],
    })),
    dispatch,
  )
}

/**
 * get/set the "hide on desktop" property
 * @param hide, true if the element has to be hidden on desktop
 */
export const setHideOnDesktop = (element: ElementState, hide: boolean, elements = getElements(), dispatch = store.dispatch) => {
  updateElements([{
    ...element,
    visibility: {
      ...element.visibility,
      desktop: hide,
    },
  }], dispatch);
}


/**
 * set a given style to the current selection
 * @param opt_isUndoable default is true
 * FIXME: useless method
 */
export const styleChanged = (name: string, value: string, selection: ElementState[], isMobile = getUi().mobileEditor, dispatch = store.dispatch) => {
  // if (opt_isUndoable !== false) {
  //   // undo checkpoint
  //     //  undoCheckPoint();
  // }

  // build the style change object
  const newStyle = {};
  newStyle[name] = value,

  multipleStylesChanged(newStyle, selection, isMobile, dispatch);
}

/**
 * set a set of styles to the current selection
 */
export const multipleStylesChanged = (style: CssRule, selection: ElementState[], isMobile = getUi().mobileEditor, dispatch = store.dispatch) => {
  // undo checkpoint
    //  undoCheckPoint();

  // apply the change to all elements
  updateElements(selection.map((el) => ({
    ...el,
    style: addToMobileOrDesktopStyle(isMobile, el.style, style),
  })), dispatch);
}


/**
 * set css class names
 */
export function setClassName(name: string, elements = getElements(), dispatch = store.dispatch) {
  // undo checkpoint
    //  undoCheckPoint();

  // apply the change to all elements
  updateElements(getSelectedElements(elements)
    .map((el) => ({
      ...el,
      classList: name.split(' '),
    })), dispatch)
}

/**
 * create an element and add it to the stage
 * componentName the desired component type if it is a component
 * @return [element, updatedParent]
 */
export function addElement({type, parent, style, componentName} : {
  type: ElementType,
  parent: ElementState,
  style: StyleObject,
  componentName?: string,
}, elements = getElements(), dispatch = store.dispatch): [ElementState, ElementState] {
  // create an element
  const [newElementState, updatedParentState] = getCreateAction({
    type,
    parent,
    componentName,
    isSectionContent: false,
  })

  // add it to the current page only if it has no parent which already are in a page
  const { currentPageId } = getUi()
  const newElementStatePaged = {
    ...newElementState,
    pageNames: !!parent.pageNames.length || !!getFirstPagedParent(parent) ? [] : [currentPageId],
  }
  console.warn('todo: handle add in mobile')

  const element = ((() => {
    // if it is a section add its container element
    if (type === ElementType.SECTION) {

      if (!isBody(parent)) throw new Error('Sections can only be added to the body')
      const [contentElement, newElementStateWithContent] = getCreateAction({
        type: ElementType.CONTAINER,
        parent: newElementStatePaged,
        componentName: null,
        isSectionContent: true,
      })
      const contentElementWithCssClasses = {
        ...contentElement,
        classList: contentElement.classList.concat([
          Constants.ELEMENT_CONTENT_CLASS_NAME,
          Constants.WEBSITE_WIDTH_CLASS_NAME,
          Constants.PREVENT_DRAGGABLE_CLASS_NAME,
        ]),
      }
      // add the elements to the store
      createElements([newElementStateWithContent, contentElementWithCssClasses], dispatch);
      return getElementById(newElementStateWithContent.id, getElements())
    } else {
      // add the elements to the store
      createElements([newElementStatePaged], dispatch);
      return getElementById(newElementStatePaged.id, getElements())
    }
  })())

  updateElements(
    // unselect all
    getSelectedElements(getElements())
    .filter((el) => el !== parent && el !== element) // will be updated bellow
    .map((el) => ({
      ...el,
      selected: false,
    }))
    // apply style + select the created element
    .concat([{
      ...element,
      selected: true,
      style: {
        mobile: {
          ...element.style.mobile,
          ...style.mobile,
        },
        desktop: {
          ...element.style.desktop,
          ...style.desktop,
        },
      },
    },
    // update the parent element
    {
      ...updatedParentState,
      selected: false,
    }]), dispatch)

  console.log('TODO: drag to insert?')
  // TODO: drag to insert?
  // getStage().startDrag()

  return [getElementById(newElementStatePaged.id, getElements()), getElementById(updatedParentState.id, getElements())]
}

export function removeElementsWithoutConfirm(selection, dispatch = store.dispatch) {
  // get the elements and their children
  const deleted = selection.concat(selection
    .reduce((prev, el) => prev.concat(getChildrenRecursive(el)), []))

  // delete the elements from the store
  deleteElements(deleted, dispatch)

  // update the parents to remove deleted elements from children lists
  updateElements(selection
    .filter((element: ElementState) => element.children.some((id) => !!deleted.find((el) => el.id === id))) // keep the parents
    .map((element: ElementState) => ({
      from: element,
      to: {
        ...element,
        children: element.children.filter((id) => !deleted.find((el) => el.id === id)),
      }
    })), dispatch)
}

/**
 * add the provided elements to a given page
 */
export function addToPage(selection: ElementState[], page: PageState, elements = getElements(), dispatch = store.dispatch) {
  updateElements(selection
    .map((el) => noSectionContent(el, elements))
    .map((el) => ({
      ...el,
      pageNames: el.pageNames.concat([page.id]),
    })), dispatch)
}

/**
 * remove the provided elements from a given page
 */
export function removeFromPage(selection: ElementState[], page: PageState, dispatch = store.dispatch) {
  updateElements(selection
    .map((el) => ({
      ...el,
      pageNames: el.pageNames.filter((name) => name === page.id),
    })), dispatch)
}

/**
 * add provided elements to all pages
 */
export function visibleOnAllPages(selection: ElementState[], dispatch = store.dispatch) {
  // undo checkpoint
    //  undoCheckPoint();
  updateElements(selection
    .map((el) => ({
      ...el,
      pageNames: [],
    })), dispatch)
}

/**
 * add link to the provided elements
 */
export function addLink(selection: ElementState[], link: Link, dispatch = store.dispatch) {
  // undo checkpoint
    //  undoCheckPoint();
  updateElements(selection
    .map((el) => ({
      ...el,
      link,
    })), dispatch)

}

/**
 * remove link from the provided elements
 */
export function removeLink(selection: ElementState[], dispatch = store.dispatch) {
  // undo checkpoint
    //  undoCheckPoint();
  updateElements(selection
    .map((el) => ({
      ...el,
      link: null,
    })), dispatch)
}
