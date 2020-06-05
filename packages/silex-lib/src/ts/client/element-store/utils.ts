/**
 * @fileoverview Cross platform, it needs to run client and server side
 *
 */

import { Constants } from '../../constants'
import {
  ElementState,
  ElementId,
  ElementRect,
  ElementType,
  FullBox,
  Rect,
  Size,
  ElementData,
  LinkData
} from './types'
import { FileExplorer } from '../components/dialog/FileExplorer'
import { SilexNotification } from '../components/Notification'
import { addMediaQuery, getDomElement } from './dom'
import { getAllParents, getBody, getChildren, getElementById, getSelectedElements } from './filters'
import { getElements, fromElementData } from './index'
import { getSite } from '../site-store/index'
import { initComponent, isComponent } from './component'
import { openLinkDialog } from '../components/dialog/LinkDialog'
import { removeElementsWithoutConfirm, selectBody } from './dispatchers'
import { styleToString } from '../utils/styles'
import { FileInfo } from '../io/CloudStorage'

/**
 * constant for the prefix of the IDs given to Silex editable elements
 */
const ELEMENT_ID_PREFIX = 'silex-id-'

/**
 * constant for default size of an element
 */
export const INITIAL_ELEMENT_SIZE = 100

/**
 * get the states needed to add a new element to the store
 * @returns [elementToBeCreated, parentToBeUpdated]
 */
export async function getCreateAction({type, parent, isSectionContent, componentName}: {
  type: ElementType,
  parent: ElementState,
  isSectionContent: boolean,
  componentName?: string,
}): Promise<[ElementState, ElementState]> {
  // create the element ready to be added to the stage
  const [element] = fromElementData([
    getEmptyElementData({
      id: getNewId(),
      type,
      isSectionContent,
      isBody: false
    })
  ])
  const newParent = {
    ...parent,
    children: parent.children.concat(element.id),
  }

  // apply component styles etc
  if (!!componentName) {
    const newElement = await initComponent(element, componentName)
    return [{
        ...newElement,
        selected: true,
      },
      newParent,
    ]
  }
  return [{
      ...element,
      selected: true,
    },
    newParent,
  ]
}

export function getEmptyElementData({id, type, isSectionContent, isBody}: {id: ElementId, type: ElementType, isSectionContent: boolean, isBody: boolean}): ElementData {
  return {
    id,
    type,
    alt: null,
    title: null,
    isSectionContent,
    visibility: {
      desktop: true,
      mobile: true,
    },
    style: {
      desktop: JSON.parse(JSON.stringify({ // this will remove the undefined props
        'width': INITIAL_ELEMENT_SIZE + 'px',
        'height': INITIAL_ELEMENT_SIZE + 'px',
        'background-color': type === ElementType.HTML || type === ElementType.CONTAINER ? 'rgb(255, 255, 255)' : undefined,
        ...getDefaultStyle({type, isSectionContent, isBody}),
      })),
      mobile: {},
    },
    data: {
      component: null,
    },
    children: [],
    pageNames: [],
    classList: [],
    link: null,
    enableEdit: type !== ElementType.SECTION && type !== ElementType.CONTAINER,
    enableDrag: /* type !== ElementType.SECTION && */ !isSectionContent,
    enableDrop: type === ElementType.SECTION || type === ElementType.CONTAINER,
    enableResize: type === ElementType.SECTION ? { top: false, bottom: false, left: false, right: false }
      : isSectionContent ? { top: true, bottom: true, left: true, right: true }
      : { top: true, bottom: true, left: true, right: true },
    selected: false, // we sill make it selected afterwards so that observer get it
    useMinHeight: type !== ElementType.IMAGE,
    innerHtml: type === ElementType.TEXT ? 'New text box'
      : type === ElementType.HTML ? '<p>New <strong>HTML</strong> box</p>'
      : '',
  }
}

export function getDefaultStyle({type, isSectionContent, isBody}: {type: ElementType, isSectionContent: boolean, isBody: boolean}) {
    // define the type specific styles
    const editableStyle = { // all elements
      position: 'absolute',
    }
    const bodyStyle = { // only the body
      position: 'static',
    }
    const section = { // sections
      'position': 'static',
      'margin-top': '-1px',
      'top': undefined,
      'left': undefined,
      'height': undefined,
      'width': undefined,
    }
    const sectionContent = { // section containers
      'position': 'relative',
      'top': undefined,
      'left': undefined,
      'width': undefined,
      'margin-left': 'auto',
      'margin-right': 'auto',
    }
    return Object.assign(editableStyle, type === ElementType.SECTION ? section : isSectionContent ? sectionContent : isBody ? bodyStyle : {})
}

let nextId = 0

/**
 * Create new IDs
 */
function generateElementId(): ElementId {
  let uniqueId
  do {
    uniqueId = Date.now().toString() + '-' + nextId++
  } while (getElementById(uniqueId))
  return uniqueId
}

export function getNewId() {
  return ELEMENT_ID_PREFIX + generateElementId()
}

/**
 * get a given style for an element
 * to get the mobile style we may return the desktop style
 * because on mobile we apply the desktop style unless overriden for mobile only
 */
export function getElementStyle(element: ElementState, styleName: string, mobile: boolean) {
  if (mobile) {
    return typeof(element.style.mobile[styleName]) !== 'undefined' ?
      element.style.mobile[styleName] :
      (styleName === 'left' || styleName === 'top') && (!element.style.mobile.display || element.style.mobile.display === 'static') ?
        undefined :
        element.style.desktop[styleName]
  }
  return element.style.desktop[styleName]
}

/**
 * get an element size
 * this takes into account all cases, i.e. element with style, section width, section height, section container whidth
 * also takes the max width in mobile editor
 * TODO: make better UT, should not depend on getSite
 */
export function getElementSize(win: Window, element: ElementState, mobile: boolean, elements = getElements()): Size {
  const result: Size = {width: -1, height: -1}
  const width = getElementStyle(element, 'width', mobile)
  if (width) result.width = parseInt(width)
  else if (element.type === ElementType.SECTION) result.width = win.innerWidth
  else if (element.isSectionContent) result.width = getSite().width
  else {
    console.error('Error: container has no width', element)
    throw new Error('Can not get size of this element as it has no width')
  }
  if (mobile) result.width = Math.min(result.width, Constants.MOBILE_BREAKPOINT)

  console.warn('todo sections bg: take the height of section container')

  const height = getElementStyle(element, 'height', mobile)
  if (height) result.height = parseInt(height)
  else if (element.type === ElementType.SECTION) {
    const sectionContent = getChildren(element, elements).find((el) => el.isSectionContent)
    if(sectionContent) result.height = getElementSize(win, sectionContent, mobile).height
    else result.height = 0
    // else result.height = parseInt(getStyle(sectionContent, 'height', mobile))
  } else {
    console.error('Error: container has no height', element)
    throw new Error('Can not get size of this element as it has no height')
  }
  return result
}

// /**
//  * compute new element data
//  * center the element in the container
//  */
// export function center({element, parent, win, opt_offset = 0}: {
//   win: Window,
//   element: ElementState,
//   parent: ElementState,
//   opt_offset?: number,
// }): Point {
//   const parentSize = getElementSize(win, parent, false)
//   const elementSize = getElementSize(win, element, false)
//
//   const posX = Math.round((parentSize.width / 2) - (elementSize.width / 2))
//   const posY = Math.round((parentSize.height / 2) - (elementSize.height / 2))
//   return {
//     top: opt_offset + posY,
//     left: opt_offset + posX,
//   }
// }

export function getElementRect(element: ElementState, mobile: boolean): ElementRect {
  if (element.isSectionContent && !mobile) return {
    top: null,
    left: null,
    width: getSite().width + 'px',
    height: getElementStyle(element, 'height', mobile),
  }
  else return {
    top: getElementStyle(element, 'top', mobile),
    left: getElementStyle(element, 'left', mobile),
    width: getElementStyle(element, 'width', mobile),
    height: getElementStyle(element, 'height', mobile),
  }
}

/**
 * get the bounding box of some elements relative to their common parent
 * width, height, top, left, right integers in pixels
 * Achtung: elements need to have their top, left, width, height styles set
 */
export function getBoundingBox(rects: ElementRect[]): FullBox {
  return rects.reduce((aggr, rect) => {
    const box: FullBox = {
      top: parseInt(rect.top || '0'),
      left: parseInt(rect.left || '0'),
      width: parseInt(rect.width || '0'),
      height: parseInt(rect.height || '0'),
      bottom: parseInt(rect.top || '0') + parseInt(rect.height || '0'),
      right: parseInt(rect.left || '0') + parseInt(rect.width || '0'),
    }
    const newRect: Rect<number> = {
      top: Math.min(aggr.top, box.top),
      left: Math.min(aggr.left, box.left),
      bottom: Math.max(aggr.bottom, box.bottom),
      right: Math.max(aggr.right, box.right),
    }
    return {
      ...newRect,
      width: newRect.right - newRect.left,
      height: newRect.bottom - newRect.top,
    }
  }, {
    top: Infinity,
    left: Infinity,
    bottom: -Infinity,
    right: -Infinity,
    width: -Infinity,
    height: -Infinity,
  } as FullBox)
}

// /**
//  * get the bounding box of some elements relative to their common parent
//  * width, height, top, left, right integers in pixels
//  * Achtung: elements need to have their top, left, width, height styles set
//  */
// export function getBoundingBox(elements: ElementData[], mobile: boolean): FullBox {
//   // first check that elements have the required properties and share the same parent
//   if (elements
//     .some((element) => !['top', 'left', 'width', 'height']
//         .every((prop) => getElementStyle(element, prop, mobile) !== undefined))) {
//     return null
//   }
//
//   // compute the box dimentions
//   return elements.reduce((aggr, element) => {
//     const box: FullBox = {
//       top: parseInt(getElementStyle(element, 'top', mobile)),
//       left: parseInt(getElementStyle(element, 'left', mobile)),
//       width: parseInt(getElementStyle(element, 'width', mobile)),
//       height: parseInt(getElementStyle(element, 'height', mobile)),
//       bottom: parseInt(getElementStyle(element, 'top', mobile)) + parseInt(getElementStyle(element, 'height', mobile)),
//       right: parseInt(getElementStyle(element, 'left', mobile)) + parseInt(getElementStyle(element, 'width', mobile)),
//     }
//     return {
//       top: Math.min(aggr.top, box.top),
//       left: Math.min(aggr.left, box.left),
//       bottom: Math.max(aggr.bottom, box.bottom),
//       right: Math.max(aggr.right, box.right),
//       width: Math.max(aggr.width, box.width),
//       height: Math.max(aggr.height, box.height),
//     }
//   }, {
//     top: Infinity,
//     left: Infinity,
//     bottom: -Infinity,
//     right: -Infinity,
//     width: -Infinity,
//     height: -Infinity,
//   } as FullBox)
// }

export function getCreationDropZone(isSection: boolean, stageEl: HTMLIFrameElement): ElementState {
  if (isSection) {
    return getBody()
  }
  // other than sections
  // find the topmost element in the middle of the stage
  const doc = stageEl.contentDocument

  // compute stage size
  const stageSize = stageEl.getBoundingClientRect()
  const posX = Math.round((stageSize.width / 2)) // - (width / 2))
  const posY = Math.round((stageSize.height / 2)) // - (height / 2))

  // find the tpopmost in the DOM
  return doc.elementsFromPoint(posX, posY)
      // retrieve the model which holds this HTML element
    .map((domEl) => getElements().find((el) => getDomElement(doc, el) === domEl))
    .filter((el) => !!el && el.enableDrop)
    // just the top most element
    .shift()
}

/**
 * get a human readable name for this element
 */
export function getDisplayName(element: ElementState): string {
  if (isComponent(element)) {
    return `${ element.data.component.templateName}`
  }
  if (element.isSectionContent) {
    return 'Section Container'
  }

  switch (element.type) {
    case ElementType.TEXT: return 'Text'
    case ElementType.IMAGE: return 'Image'
    case ElementType.CONTAINER: return 'Container'
    case ElementType.HTML: return 'Html'
    // case ElementType.CONTAINER_CONTENT: return 'Container';
    case ElementType.SECTION: return 'Section'
  }
}

/**
 * @param doc docment of the iframe containing the website
 * @return the string defining all elements styles
 */
export function getAllStyles(): string {
  const styles = getElements()
  .map((el) => ({
    desktop: Object.keys(el.style.desktop).length ? el.style.desktop : null,
    mobile: Object.keys(el.style.mobile).length ? el.style.mobile : null,
    useMinHeight: el.useMinHeight,
    id: el.id,
  }))
  .reduce((prev, {mobile, desktop, useMinHeight, id}) => ({
    desktop: prev.desktop + (desktop ? `\n.${id} {\n${styleToString(desktop, useMinHeight, '\n    ')}\n}\n` : ''),
    mobile: prev.mobile + (mobile ? `\n.${id} {\n${styleToString(mobile, useMinHeight, '\n    ')}\n}\n` : ''),
  }), {
    desktop: '',
    mobile: '',
  })
  return `${styles.desktop}\n\n${addMediaQuery(styles.mobile)}\n`
}

/**
 * @returns true if the element and all of its parents are visible in the given page
 */
export function isVisibleInPage(element: ElementState, pageId: string): boolean {
  return !getAllParents(element)
    .concat(element)
    // find one which is not visible => break
    .find((el) => el.pageNames.length > 0 && !el.pageNames.includes(pageId))
}


/**
 * remove selected elements from the stage
 */
export function removeElements(elements = getSelectedElements()) {
  const body = getBody()
  const toDelete = elements.filter((el) => el !== body)
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

export function editLink(e: Event, linkData: LinkData, cbk: (p1: LinkData) => any) {
  e.preventDefault()
  openLinkDialog({
    data: linkData,
    cbk,
  })
}

export function browse(e: Event, cbk: (p1: FileInfo[]) => any) {
  e.preventDefault()

  // browse with CE
  const promise = FileExplorer.getInstance().openFile()

  // handle the result
  promise
  .then((fileInfo: FileInfo) => {
    if (fileInfo) {
      cbk([fileInfo])
    }
  })
  .catch((error) => {
    SilexNotification.notifyError('Error: I could not select the file. <br /><br />' + (error.message || ''))
  })
}

/**
 * get the index of the element in the DOM
 */
export function indexOfElement(element: HTMLElement): number {
  const len = element.parentElement.childNodes.length
  for (let idx = 0; idx < len; idx++) {
    if (element.parentElement.childNodes[idx] === element) {
      return idx
    }
  }
  return -1
}

