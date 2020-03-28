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
import { crudIdKey } from '../flux/crud-store'
import { getSite } from '../site/store'
import { Style } from '../utils/Style'
import { addMediaQuery, getDomElement } from './dom'
import { getBody, getChildren, getElementById, getParent, noSectionContent } from './filters'
import { getElements } from './store'
import { ElementData, ElementId, ElementType, Point, Size } from './types'

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
const INITIAL_ELEMENT_SIZE = 100

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
        'background-color': type === ElementType.HTML || type === ElementType.CONTAINER ? 'rgb(255, 255, 255)' : null,
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
    enableEdit: true,
    enableDrag: true,
    enableDrop: type === ElementType.CONTAINER, // FIXME: sections to?
    enableResize: { top: true, bottom: true, left: true, right: true }, // FIXME: handle sections?
    selected: false, // we sill make it selected afterwards so that observer get it
    useMinHeight: true,
    innerHtml: '',
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
 * clone elements
 * reset the ID of the element and its children
 * the elements need to be in the store already (and dom)
 */
export function cloneElement(element: ElementData, parentId: ElementId = null): ElementData[] {
  const newId = getNewId()
  const res: ElementData[] = [{
    ...JSON.parse(JSON.stringify(element)),
    id: newId,
    parent: parentId,
    selected: parentId === null,
  }]
  res[0].children
    .forEach((id) => res.push(...cloneElement(getElementById(id), newId)))

  return res
}

// FIXME: flat seems to be missing on array in UT
export const flat = (arr) => arr.reduce((acc, val) => acc.concat(val), []);

/**
 * duplicate elements for later paste or for duplicate
 * returns a is a flat array of elements with new IDs and updated children list
 * only root elements are selected
 * @returns [allElements, rootElements]
 */
export function cloneElements(selection: ElementData[]): ElementData[][] {
  const body = getBody()
  const all = flat(selection
    // do not allow the body to be cloned
    .filter((el) => el !== body)
    // take the section instead of section container
    .map((el) => noSectionContent(el))
    // do not clone elements twice:
    // remove elements which have a parent who is already being cloned
    // remove elements which are in the list multiple times due to noSectionContent
    .filter((el) => !selection.includes(getParent(el)) && 1 === selection.filter((e) => e === el).length)
    .map((el) => cloneElement(el)))

  return [all, all.filter((el) => el.selected)]
}

/**
 * get a given style for an element
 * to get the mobile style we may return the desktop style
 * because on mobile we apply the desktop style unless overriden for mobile only
 */
export function getElementStyle(element: ElementData, styleName: string, mobile: boolean) {
  return mobile && typeof(element.style.mobile[styleName]) !== 'undefined' ? element.style.mobile[styleName] : element.style.desktop[styleName]
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
export function center(element: Size, parent: Size, opt_offset: number = 0): Point {
  // const doc = win.document
  // const elementDom = getDomElement(doc, element)
  // const parentDom = getDomElement(doc, parent)
  // const elementStyle = win.getComputedStyle(elementDom)
  // const parentStyle = win.getComputedStyle(parentDom)
  // const posX = Math.round((parseInt(parentStyle.width) / 2) - (parseInt(elementStyle.width) / 2))
  // const posY = Math.round((parseInt(parentStyle.height) / 2) - (parseInt(elementStyle.height) / 2))

  // const mobileOrDesktop = mobile ? element.style.mobile : element.style.desktop
  // const mobileOrDesktopParent = mobile ? parent.style.mobile : parent.style.desktop
  // const posX = Math.round((parseInt(mobileOrDesktopParent.width) / 2) - (parseInt(mobileOrDesktop.width) / 2))
  // const posY = Math.round((parseInt(mobileOrDesktopParent.height) / 2) - (parseInt(mobileOrDesktop.height) / 2))
  // return {
  //   ...element,
  //   style: {
  //     ...element.style,
  //     desktop: mobile ? element.style.desktop : {
  //       ...element.style.desktop,
  //       left: opt_offset + posX + 'px',
  //       top: opt_offset + posY + 'px',
  //     },
  //     mobile: mobile ? {
  //       ...element.style.mobile,
  //       left: opt_offset + posX + 'px',
  //       top: opt_offset + posY + 'px',
  //     } : element.style.mobile,
  //   },
  // }

  const posX = Math.round((parent.width / 2) - (element.width / 2))
  const posY = Math.round((parent.height / 2) - (element.height / 2))
  return {
    top: opt_offset + posY,
    left: opt_offset + posX,
  }
}

// /**
//  * get the bounding box of some elements
//  * width, height, top, left, right integers in pixels
//  * Achtung: elements and their parents need to have their top, left, width, height styles set
//  * DOES NOT WORK BECAUSE ELEMENTS ARE IN A SECTION CONTENT CONTAINER WHICH HAVE NO TOP, LEFT => FAIL
//  */
// export function getBoundingBox(elements: ElementData[], mobile: boolean): FullBox {
//   return elements.reduce((aggr, element) => {
//     const parents = getAllParents(element)
//     const offset = parents.reduce((o, el) => ({
//       top: o.top + parseInt(getElementStyle(el, 'top', mobile)),
//       left: o.left + parseInt(getElementStyle(el, 'left', mobile)),
//     }), {top: 0, left: 0})
//     const box: FullBox = {
//       top: offset.top + parseInt(getElementStyle(element, 'top', mobile)),
//       left: offset.left + parseInt(getElementStyle(element, 'left', mobile)),
//       width: parseInt(getElementStyle(element, 'width', mobile)),
//       height: parseInt(getElementStyle(element, 'height', mobile)),
//       bottom: offset.top + parseInt(getElementStyle(element, 'top', mobile)) + parseInt(getElementStyle(element, 'height', mobile)),
//       right: offset.left + parseInt(getElementStyle(element, 'left', mobile)) + parseInt(getElementStyle(element, 'width', mobile)),
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
    default: return element.type.toString();
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
  .reduce((prev, el) => ({
    desktop: `${prev.desktop}\n.${el.id} {\n${Style.styleToString(el.style.desktop, '\n    ')}\n}\n`,
    mobile: `${prev.mobile}\n.${el.id} {\n${Style.styleToString(el.style.mobile, '\n    ')}\n}\n`,
  }), {
    desktop: '',
    mobile: '',
  })
  return `${desktop}\n\n${addMediaQuery(mobile)}\n`;
}

