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
import {
  ElementData,
  ElementId,
  ElementType,
  FullBox,
  Point,
  Size
} from './types';
import { addMediaQuery, getDomElement } from './dom'
import { crudIdKey } from '../flux/crud-store'
import { getBody, getChildren, getElementById } from './filters';
import { getElements } from './store'
import { getSite } from '../site/store'
import { isComponent } from './component';
import { styleToString } from '../utils/styles';

/**
 * @fileoverview Cross platform, it needs to run client and server side
 *
 */


/**
 * constant for the prefix of the IDs given to Silex editable elements
 */
const ELEMENT_ID_PREFIX = 'silex-id-'

/**
 * constant for default size of an element
 */
export const INITIAL_ELEMENT_SIZE = 100

export function getEmptyElementData({id, type, isSectionContent, isBody}: {id: ElementId, type: ElementType, isSectionContent: boolean, isBody: boolean}): ElementData {
  return {
    [crudIdKey]: Symbol(),
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
export function getElementStyle(element: ElementData, styleName: string, mobile: boolean) {
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
 */
export function getElementSize(win: Window, element: ElementData, mobile: boolean): Size {
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
    const sectionContent = getChildren(element).find((el) => el.isSectionContent)
    if(sectionContent) result.height = getElementSize(win, sectionContent, mobile).height
    else result.height = 0
    // else result.height = parseInt(getStyle(sectionContent, 'height', mobile))
  } else {
    console.error('Error: container has no height', element)
    throw new Error('Can not get size of this element as it has no height')
  }
  return result
}

/**
 * compute new element data
 * center the element in the container
 */
export function center({element, parent, win, opt_offset = 0}: {
  win: Window,
  element: ElementData,
  parent: ElementData,
  opt_offset?: number,
}): Point {
  const parentSize = getElementSize(win, parent, false)
  const elementSize = getElementSize(win, element, false)

  const posX = Math.round((parentSize.width / 2) - (elementSize.width / 2))
  const posY = Math.round((parentSize.height / 2) - (elementSize.height / 2))
  return {
    top: opt_offset + posY,
    left: opt_offset + posX,
  }
}

/**
 * get the bounding box of some elements relative to their common parent
 * width, height, top, left, right integers in pixels
 * Achtung: elements need to have their top, left, width, height styles set
 */
export function getBoundingBox(elements: ElementData[], mobile: boolean): FullBox {
  // first check that elements have the required properties and share the same parent
  if (elements.some((element) => !['top', 'left', 'width', 'height'].every((prop) => getElementStyle(element, prop, mobile) !== undefined))) return null

  // compute the box dimentions
  return elements.reduce((aggr, element) => {
    const box: FullBox = {
      top: parseInt(getElementStyle(element, 'top', mobile)),
      left: parseInt(getElementStyle(element, 'left', mobile)),
      width: parseInt(getElementStyle(element, 'width', mobile)),
      height: parseInt(getElementStyle(element, 'height', mobile)),
      bottom: parseInt(getElementStyle(element, 'top', mobile)) + parseInt(getElementStyle(element, 'height', mobile)),
      right: parseInt(getElementStyle(element, 'left', mobile)) + parseInt(getElementStyle(element, 'width', mobile)),
    }
    return {
      top: Math.min(aggr.top, box.top),
      left: Math.min(aggr.left, box.left),
      bottom: Math.max(aggr.bottom, box.bottom),
      right: Math.max(aggr.right, box.right),
      width: Math.max(aggr.width, box.width),
      height: Math.max(aggr.height, box.height),
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

export function getCreationDropZone(isSection: boolean, stageEl: HTMLIFrameElement): ElementData {
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
export function getDisplayName(element: ElementData): string {
  if (isComponent(element)) {
    return `${ element.data.component.templateName}`
  }
  if (element.isSectionContent) {
    return 'Section Container';
  }

  switch (element.type) {
    case ElementType.TEXT: return 'Text';
    case ElementType.IMAGE: return 'Image';
    case ElementType.CONTAINER: return 'Container';
    case ElementType.HTML: return 'Html';
    // case ElementType.CONTAINER_CONTENT: return 'Container';
    case ElementType.SECTION: return 'Section';
  }
}

// /**
//  * set/get the image URL of an image element
//  * @param element  container created by silex which contains an image
//  * @return  the url of the image
//  */
// export function getImageUrl(element: HTMLElement): string {
//   let url = '';
//   if (element.getAttribute(Constants.TYPE_ATTR) === ElementType.IMAGE) {
//     // get the image tag
//     const img = getContentNode(element);
//     if (img) {
//       url = img.getAttribute('src');
//     } else {
//       console.error(
//           'The image could not be retrieved from the element.', element);
//     }
//   } else {
//     console.error('The element is not an image.', element);
//   }
//   return url;
// }

/**
 * @param doc docment of the iframe containing the website
 * @return the string defining all elements styles
 */
export function getAllStyles(): string {
  const {desktop, mobile} = getElements()
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
  return `${desktop}\n\n${addMediaQuery(mobile)}\n`;
}
