import { FullBox } from '../../../node_modules/drag-drop-stage-component/src/ts/Types';
import { Constants } from '../../constants';
import { CssRule, ElementData, ElementId, ElementType } from '../../types';
import { getAllParents, getBody, getParent } from '../api';
import { getDomElement } from '../dom/element-dom';
import { crudIdKey } from '../flux/crud-store';
import { Dom } from './Dom';

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
 * Used in copy element
 */
function generateElementId(elements: ElementData[]): ElementId {
  let uniqueId
  do {
    uniqueId = Date.now().toString() + '-' + nextId++
  } while (elements.find((el) => el.id === uniqueId))
  return uniqueId
}

export function getNewId(elements: ElementData[]) {
  return ELEMENT_ID_PREFIX + generateElementId(elements)
}

/**
 * check if the element's parents belong to a page, and if one of them do,
 * remove the element from the other pages
 *
 * if the element is in a container which is visible only on some pages,
 * then the element should be visible everywhere, i.e. in the same pages as
 * its parent
 */
export function getFirstPagedParent(element: ElementData): ElementData {
  const parent = getParent(element)
  if (!!parent) {
    if (parent.pageNames.length) {
      return parent
    }
    return getFirstPagedParent(parent)
  }
  // body
  return null
}

/**
 * get/set element from a container created by silex
 * @param element  created by silex, either a text box, image, ...
 * @return  the element which holds the content, i.e. a div, an image, ...
 */
export function getContentNode(element: HTMLElement): HTMLElement {
  const content: HTMLElement = element.querySelector(':scope > .' + Constants.ELEMENT_CONTENT_CLASS_NAME)
  return content || element
}

/**
 * get/set element from a container created by silex
 * @param element  created by silex, either a text box, image, ...
 * @param innerHTML the html content
 */
export function setInnerHtml(element: HTMLElement, innerHTML: string) {
  // get the container of the html content of the element
  const contentNode = getContentNode(element)

  // deactivate executable scripts and set html
  contentNode.innerHTML = Dom.deactivateScripts(innerHTML)
}

/**
 * get/set html from a container created by silex
 * @param element  created by silex, either a text box, image, ...
 * @return  the html content
 */
export function getInnerHtml(element: HTMLElement): string {
  let innerHTML = getContentNode(element).innerHTML

  // put back executable scripts
  innerHTML = Dom.reactivateScripts(innerHTML)
  return innerHTML
}

/**
 * add a media query around the style string
 * will make the style mobile-only
 */
export function addMediaQuery(styleStr: string) {
  return '@media ' + Constants.MOBILE_MEDIA_QUERY + '{' + styleStr + '}'
}

/**
 * eval the scripts found in an element
 * this is useful when we render a template, since the scripts are executed
 * only when the page loads
 */
export function executeScripts(win: Window, element: HTMLElement) {
  // execute the scripts
  const scripts = element.querySelectorAll('script')
  for (const el of scripts) {
    // tslint:disable:no-string-literal
    win['eval'](el.innerText)
  }
}

/**
 * compute new element data
 * center the element in the container
 */
export function center(element: ElementData, parent: ElementData, mobile: boolean, opt_offset: number = 0): ElementData {
  const mobileOrDesktop = mobile ? element.style.mobile : element.style.desktop
  const mobileOrDesktopParent = mobile ? parent.style.mobile : parent.style.desktop
  const posX = Math.round((parseInt(mobileOrDesktopParent.width) / 2) - (parseInt(mobileOrDesktop.width) / 2))
  const posY = Math.round((parseInt(mobileOrDesktopParent.height) / 2) - (parseInt(mobileOrDesktop.height) / 2))
  return {
    ...element,
    style: {
      ...element.style,
      desktop: mobile ? element.style.desktop : {
        ...element.style.desktop,
        left: opt_offset + posX + 'px',
        top: opt_offset + posY + 'px',
      },
      mobile: mobile ? {
        ...element.style.mobile,
        left: opt_offset + posX + 'px',
        top: opt_offset + posY + 'px',
      } : element.style.mobile,
    },
  }
}

/**
 * get the bounding box of some elements
 * width, height, top, left, right integers in pixels
 * Achtung: elements and their parents need to have their top, left, width, height styles set
 */
export function getBoundingBox(elements: ElementData[], mobile: boolean): FullBox {
  // retrieve a style value, either the mobile or desktop
  // when retrieving mobile value, defaults to desktop value
  const error = (style, prop) => {
    throw new Error('No value found for `' + prop + '` on `' + style + '`')
  }
  const getStyle = (style: { mobile: CssRule, desktop: CssRule }, prop: string): number => mobile && style.mobile[prop]
    ? parseInt(style.mobile[prop])
    : !!style.desktop[prop] ? parseInt(style.desktop[prop]) : error(style, prop)

  return elements.reduce((aggr, element) => {
    const parents = getAllParents(element)
    const offset = parents.reduce((o, el) => ({
      top: o.top + getStyle(el.style, 'top'),
      left: o.left + getStyle(el.style, 'left'),
    }), {top: 0, left: 0})
    const box: FullBox = {
      top: offset.top + getStyle(element.style, 'top'),
      left: offset.left + getStyle(element.style, 'left'),
      width: getStyle(element.style, 'width'),
      height: getStyle(element.style, 'height'),
      bottom: offset.top + getStyle(element.style, 'top') + getStyle(element.style, 'height'),
      right: offset.left + getStyle(element.style, 'left') + getStyle(element.style, 'width'),
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

// FIXME: remove (with UT) because it is not used
export function getCreationDropZone(isSection: boolean, stageEl: HTMLIFrameElement, elements: ElementData[]): ElementData {
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
    .map((domEl) => elements.find((el) => getDomElement(doc, el) === domEl))
    .filter((el) => !!el && el.enableDrop)
    // just the top most element
    .shift()
}
