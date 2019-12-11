import { Constants } from '../../constants';
import { ElementData, ElementId, ElementType } from '../../types';
import { Dom } from './Dom';

/**
 * constant for the prefix of the IDs given to Silex editable elements
 */
const ELEMENT_ID_PREFIX = 'silex-id-';

/**
 * constant for default size of an element
 */
const INITIAL_ELEMENT_SIZE = 100;

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
      desktop: {
        'width': INITIAL_ELEMENT_SIZE + 'px',
        'height': INITIAL_ELEMENT_SIZE + 'px',
        'background-color': type === ElementType.HTML || type === ElementType.CONTAINER ? 'rgb(255, 255, 255)' : null,
        ...getDefaultStyle({type, isSectionContent, isBody}),
      },
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
      'top': '',
      'left': '',
    }
    const sectionContent = { // section containers
      'position': 'relative',
      'top': '',
      'left': '',
      'margin-left': 'auto',
      'margin-right': 'auto',
    }
    return Object.assign(editableStyle, type === ElementType.SECTION ? section : isSectionContent ? sectionContent : isBody ? bodyStyle : {})
}

let nextId = 0

/**
 * @param doc docment of the iframe containing the website
 * Used in copy element
 */
function generateElementId(elements: ElementData[]): ElementId {
  let uniqueId;
  do {
    uniqueId = Date.now().toString() + '-' + nextId++;
  } while (elements.find((el) => el.id === uniqueId));
  return uniqueId;
}

export function getNewId(elements: ElementData[]) {
  return ELEMENT_ID_PREFIX + generateElementId(elements);
}

/**
 * check if the element's parents belong to a page, and if one of them do,
 * remove the element from the other pages
 *
 * if the element is in a container which is visible only on some pages,
 * then the element should be visible everywhere, i.e. in the same pages as
 * its parent
 */
export function getFirstPagedParent(elements: ElementData[], element: ElementData): ElementData {
  const parent = elements.find((el) => !!el.children.find((id) => element.id === id))
  if (!!parent) {
    if (parent.pageNames.length) {
      return parent;
    }
    return getFirstPagedParent(elements, parent);
  }
  // body
  return null;
}

/**
 * get/set element from a container created by silex
 * @param element  created by silex, either a text box, image, ...
 * @return  the element which holds the content, i.e. a div, an image, ...
 */
export function getContentNode(element: HTMLElement): HTMLElement {
  const content: HTMLElement = element.querySelector(':scope > .' + Constants.ELEMENT_CONTENT_CLASS_NAME);
  return content || element;
}

/**
 * get/set element from a container created by silex
 * @param element  created by silex, either a text box, image, ...
 * @param innerHTML the html content
 */
export function setInnerHtml(element: HTMLElement, innerHTML: string) {
  // get the container of the html content of the element
  const contentNode = getContentNode(element);

  // deactivate executable scripts and set html
  contentNode.innerHTML = Dom.deactivateScripts(innerHTML);
}

/**
 * get/set html from a container created by silex
 * @param element  created by silex, either a text box, image, ...
 * @return  the html content
 */
export function getInnerHtml(element: HTMLElement): string {
  let innerHTML = getContentNode(element).innerHTML;

  // put back executable scripts
  innerHTML = Dom.reactivateScripts(innerHTML);
  return innerHTML;
}

/**
 * add a media query around the style string
 * will make the style mobile-only
 */
export function addMediaQuery(styleStr: string) {
  return '@media ' + Constants.MOBILE_MEDIA_QUERY + '{' + styleStr + '}';
}

/**
 * eval the scripts found in an element
 * this is useful when we render a template, since the scripts are executed
 * only when the page loads
 */
export function executeScripts(win: Window, element: HTMLElement) {
  // execute the scripts
  const scripts = element.querySelectorAll('script');
  for (const el of scripts) {
    // tslint:disable:no-string-literal
    win['eval'](el.innerText);
  }
}
