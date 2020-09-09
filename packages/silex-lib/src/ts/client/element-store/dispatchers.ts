/**
 * @fileoverview helpers to dispatch common actions on the store
 * TODO: 1- remove all references to the store or dispatch => every function should take ElementState[] and return the changes to be made as an ElementState[]
 * TODO: 2- move this file to a cross platform package (e.g. in src/ts/helpers/)
 */

import { Constants } from '../../constants'
import { CssRule } from '../site-store/types'
import {
  DomDirection,
  ElementState,
  ElementType,
  Link,
  StyleObject
} from './types'
import { PageState } from '../page-store/types'
import { SilexNotification } from '../components/Notification'
import { addToMobileOrDesktopStyle } from '../utils/styles'
import {
  createElements,
  deleteElements,
  getElements,
  updateElements
} from './index'
import {
  getBody,
  getChildrenRecursive,
  getElementById,
  getFirstPagedParent,
  getParent,
  getSelectedElements,
  isBody,
  noSectionContent,
  getSelectedElementsNoSectionContent
} from './filters'
import { getCreateAction } from './utils'
import { getDomElement } from './dom'
import { getSiteDocument } from '../components/SiteFrame'
import { getUi } from '../ui-store/index'
import { insertAt } from '../utils/array'
import { store } from '../store/index'

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
  updateElements(elements
    .filter((el) => el.selected !== selection.map((e) => e.id).includes(el.id))
    .map((el) => ({
      ...el,
      selected: !el.selected,
    })),
    dispatch)
}

/**
 * move elements order in their parent's children array
 * @return the parent elements to be updated
 */
export const moveElements = (selection: ElementState[], direction: DomDirection, elements = getElements(), dispatch = store.dispatch, debug = false) => {
  const getIdx = (el, children) => children.findIndex((c) => c === el.id)
  const getTargetIdx = (el, parent) => {
    const idx = getIdx(el, parent.children)
    return direction === DomDirection.UP ? idx - 1 : direction === DomDirection.DOWN ? idx + 1 : direction === DomDirection.TOP ? 0 : parent.children.length - 1
  }
  const changes = selection
    .map((el) => ({
      el,
      parent: getParent(el, elements),
    }))
    .filter(({el, parent}) => {
      if (!parent) {
        console.warn('No parent, are you trying to move the root element?', {el, parent})
      }
      return !!el && !!parent
    })
    .map(({el, parent}) => ({
      el,
      parent,
      idx: getTargetIdx(el, parent),
    }))
    .sort((o1, o2) => (o2.idx - o1.idx) * (direction === DomDirection.UP || direction === DomDirection.TOP ? -1 : 1))
    .reduce((acc, {el, parent, idx}) => {
      const stored = acc.has(parent) ? acc.get(parent) : {
        children: parent.children,
        parent,
        beforeMe: 0,
        errored: false,
      }
      // how many elements have been moved before me
      const currentIdx = getIdx(el, stored.children)
      const targetIdx = idx // + (direction === DomDirection.TOP ? 0 : direction === DomDirection.BOTTOM ? 0 : 0)
      acc.set(parent, {
        parent: stored.parent,
        children: targetIdx !== currentIdx ? insertAt(stored.children.filter((c, i) => i !== currentIdx), targetIdx, el.id) : stored.children,
        errored: stored.errored || targetIdx < 0 || targetIdx >= stored.parent.children.length,
        beforeMe: stored.beforeMe + 1,
      })
      return acc
    }, new Map())
    const states = Array.from(changes.values())
      .filter((change) => !change.errored && JSON.stringify(change.children) !== JSON.stringify(change.parent.children))
      .map((change) => ({
        ...change.parent,
        children: change.children,
      })) as ElementState[]

  if (states.length) updateElements(states, dispatch)
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
  }], dispatch)
}


/**
 * set a given style to the current selection
 * @param opt_isUndoable default is true
 * FIXME: useless method
 */
export const styleChanged = (name: string, value: string, selection: ElementState[], isMobile = getUi().mobileEditor, dispatch = store.dispatch) => {
  // build the style change object
  const newStyle = {}
  newStyle[name] = value,

  multipleStylesChanged(newStyle, selection, isMobile, dispatch)
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
  })), dispatch)
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
      // note: `new Set` to make sure names are unique
      classList: [...new Set(name
        .split(' ')
        .filter((className) => className !== ''))],
    })), dispatch)
}

/**
 * create an element and add it to the stage
 * componentName the desired component type if it is a component
 * TODO: refactore add element to be able to unit test
 * @return [element, updatedParent]
 */
export async function addElement({type, parent, style, componentName} : {
  type: ElementType,
  parent: ElementState,
  style: StyleObject,
  componentName?: string,
}, dispatch = store.dispatch): Promise<[ElementState, ElementState]> {
  // create an element
  const [newElementState, updatedParentState] = await getCreateAction({
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

  const element = (await (async () => {
    // if it is a section add its container element
    if (type === ElementType.SECTION) {
      if (!isBody(parent)) throw new Error('Sections can only be added to the body')
      const [contentElement, newElementStateWithContent] = await getCreateAction({
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
      createElements([newElementStateWithContent, contentElementWithCssClasses], dispatch)
      return getElementById(newElementStateWithContent.id, getElements()) // here it is important to use getElements(), not store elements of before the dispatch
    } else {
      // add the elements to the store
      createElements([newElementStatePaged], dispatch)
      return getElementById(newElementStatePaged.id, getElements()) // here it is important to use getElements(), not store elements of before the dispatch
    }
  })())

  updateElements(
    // unselect all
    getSelectedElements(getElements()) // here it is important to use getElements(), not store elements of before the dispatch
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

  // TODO: drag to insert?
  // getStage().startDrag()

  return [getElementById(newElementStatePaged.id, getElements()), getElementById(updatedParentState.id, getElements())] // here it is important to use getElements(), not store elements of before the dispatch
}

/**
 * remove selected elements from the stage
 */
export function removeElements(elements = getSelectedElements()) {
  const body = getBody()
  const toDelete: ElementState[] = elements.filter((el: ElementState) => el !== body)
  if (toDelete.length <= 0) {
    SilexNotification.alert('Delete elements',
      'Error: Please select an element to delete.',
      () => {},
    )
  } else {
    // confirm and delete
    SilexNotification.confirm('Delete elements', `I am about to <strong>delete ${toDelete.length} element(s)</strong>, are you sure?`,
      (accept) => {
        if (accept) {
          removeElementsWithoutConfirm(toDelete)
          selectBody()
        }
      }, 'delete', 'cancel',
    )
  }
}

export function removeElementsWithoutConfirm(selection: ElementState[], elements = getElements(), dispatch = store.dispatch) {
  // get the elements and their children
  const selectionNoSectionContent = selection
    .map((el) => noSectionContent(el, elements))

  const deleted = selectionNoSectionContent
    .concat(selectionNoSectionContent
      .reduce((prev, el) => prev.concat(getChildrenRecursive(el, elements)), []))

  // update the parents to remove deleted elements from children lists
  updateElements(elements
    .filter((element: ElementState) => !deleted.includes(element)) // not in the deleted elements
    .filter((element: ElementState) => element.children.some((id) => !!deleted.find((el) => el.id === id))) // keep the parents
    .map((element: ElementState) => ({
      ...element,
      children: element.children.filter((id) => !deleted.find((el) => el.id === id)),
    })), dispatch)

  // delete the elements from the store
  deleteElements(deleted, dispatch)
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
export function removeFromPage(selection: ElementState[], page: PageState, elements = getElements(), dispatch = store.dispatch) {
  updateElements(selection
    .map((el) => noSectionContent(el))
    .map((el) => ({
      ...el,
      pageNames: el.pageNames.filter((name) => name !== page.id),
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

/**
 * Move the selected elements in the DOM
 */
function move(direction: DomDirection) {
  moveElements(getSelectedElementsNoSectionContent(), direction)
}

/**
 * Move the selected elements in the DOM
 * This will move its over or under other elements if the z-index CSS
 * properties are not set
 */
export function moveUp() {
  move(DomDirection.UP)
}

/**
 * Move the selected elements in the DOM
 * This will move its over or under other elements if the z-index CSS
 * properties are not set
 */
export function moveDown() {
  move(DomDirection.DOWN)
}

/**
 * Move the selected elements in the DOM
 * This will move its over or under other elements if the z-index CSS
 * properties are not set
 */
export function moveToTop() {
  move(DomDirection.TOP)
}

/**
 * Move the selected elements in the DOM
 * This will move its over or under other elements if the z-index CSS
 * properties are not set
 */
export function moveToBottom() {
  move(DomDirection.BOTTOM)
}

/**
 * set/get the image URL of an image element
 */
export function setImageUrl(image: ElementState, url: string) {
  updateElements([{
    ...image,
    // innerHtml: `<div class="${Constants.ELEMENT_CONTENT_CLASS_NAME}" ><img src="${url}" /></div>`
    // innerHtml: `<img src="${url}" class="${Constants.ELEMENT_CONTENT_CLASS_NAME}" />`
    innerHtml: `<img src="${url}" />`
  }])
  // get the image tag
  const img: HTMLImageElement = getDomElement(getSiteDocument(), image)
  .querySelector('img')
  // when loaded, update the element size
  img.addEventListener('load', () => {
    // get the up to date image data
    const updated = getElementById(image.id)
    updateElements([{
      ...updated,
      style: {
        ...updated.style,
        desktop: {
          ...updated.style.desktop,
          width: img.naturalWidth + 'px',
          height: img.naturalHeight + 'px',
        },
      },
    }])
  })
}
