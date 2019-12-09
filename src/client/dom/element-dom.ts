import { Constants } from '../../constants';
import { ElementData, ElementId, ElementType, Link, PageData } from '../../types';
import { getSiteDocument } from '../components/UiElements';
import { CSSRuleInfo } from '../model/Property';
import { Style } from '../utils/Style';
import { model } from './wip-refacto-model';

export function getDomElement(doc: HTMLDocument, element: ElementData): HTMLElement {
  return getDomElementById(doc, element.id)
}

export function getDomElementById(doc: HTMLDocument, elementId: ElementId): HTMLElement {
  return doc.querySelector(`[${Constants.ELEMENT_ID_ATTR_NAME}="${elementId}"]`)
}

// export function moveToContainer(element: HTMLElement, parent: HTMLElement) {
//   parent.appendChild(element)
// }

export function reorderElements(elements: HTMLElement[]) {
  if (elements.length) {
    // check that they all belong to a container
    const parent = elements
      .map((el) => el.parentElement)
      .reduce((prev, el) => el === prev ? prev : null)
    if (parent) {
      elements.forEach((el) => parent.appendChild(el))
    } else {
      throw new Error('Can not reoder elements because they are not from the same container')
    }
  }
}
export function setLink(element: HTMLElement, link: Link) {
  model.element.setLink(element, !!link ? link.value : null)
}

///////////////////////////////////////////////
// WIP: need to update to the simpler abstract model decoupled from the dom

export const noSectionContent = (element: HTMLElement) => model.element.noSectionContent(element)
export const removeElement = (rootElement: HTMLElement) => model.element.removeElement(rootElement)
export const removeFromAllPages = (element: HTMLElement) => model.element.removeFromAllPages(element)
export const addToPage = (element: HTMLElement, page: PageData) => model.element.addToPage(element, page)
export const setClassName = (element: HTMLElement, opt_className?: string) => model.element.setClassName(element, opt_className)

/**
 * FIXME: move to element-dom
 * element creation
 * create a DOM element, attach it to this container
 * and returns a new component for the element
 * @param type  the type of the element to create,
 *    see TYPE_* constants of the class @see silex.model.Element
 * @return   the newly created element
 */
export function createElement(id: ElementId, type: ElementType): ElementData {
  // create the element
  let element: HTMLElement = null;
  switch (type) {
    // container
    case ElementType.CONTAINER:
      element = createContainerElement();
      break;

    // section
    case ElementType.SECTION:
      element = createSectionElement();
      break;

    // text
    case ElementType.TEXT:
      element = createTextElement();
      break;

    // HTML box
    case ElementType.HTML:
      element = createHtmlElement();
      break;

    // Image
    case ElementType.IMAGE:
      element = createImageElement();
      break;
  }
  // init the element
  element.classList.add(Constants.EDITABLE_CLASS_NAME);

  // add css class for Silex styles
  element.classList.add(type.toString());

  // return the element
  return {
    id,
    pageNames: [],
    classList: [],
    type,
    alt: null,
    title: null,
    parent: null,
    children: [],
    // children: Array.from(element.querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}`))
    //   .map((el: HTMLElement) => getElementId(el)),
    link: null,
    enableDrag: true,
    enableDrop: false,
    enableResize: {
      top: true,
      bottom: true,
      left: true,
      right: true,
    },
    selected: false,
    useMinHeight: true,
    visibility: {
      desktop: true,
      mobile: true,
    },
    style: {
      desktop: {},
      mobile: {},
    },
    data: {
      component: null,
    },
  }
}
/**
 * element creation method for a given type
 * called from createElement
 */
function createContainerElement(): HTMLElement {
  // create the conatiner
  const element = getSiteDocument().createElement('div');
  element.setAttribute(Constants.TYPE_ATTR, ElementType.CONTAINER);
  return element;
}
function createElementWithContent(className: string): HTMLElement {
  // create the element
  const element = getSiteDocument().createElement('div');
  element.setAttribute(Constants.TYPE_ATTR, className);

  // create the container for text content
  const content = getSiteDocument().createElement('div');

  // add empty content
  element.appendChild(content);

  // add a marker to find the inner content afterwards, with getContent
  content.classList.add(Constants.ELEMENT_CONTENT_CLASS_NAME);

  // done
  return element;
}

/**
 * FIXME: move to element-dom
 * element creation method for a given type
 * called from createElement
 */
function createSectionElement(): HTMLElement {
  // create the element
  const element = getSiteDocument().createElement('div');
  element.setAttribute(Constants.TYPE_ATTR, ElementType.CONTAINER);
  element.classList.add(Constants.PREVENT_DRAGGABLE_CLASS_NAME);
  element.classList.add(Constants.PREVENT_RESIZABLE_CLASS_NAME);
  element.classList.add(ElementType.CONTAINER);

  // // content element is both a container and a content element
  // const content = createElement(ElementType.CONTAINER);
  // content.classList.add(Constants.ELEMENT_CONTENT_CLASS_NAME);
  // content.classList.add(ElementType.CONTAINER_CONTENT);
  // content.classList.add(Constants.WEBSITE_WIDTH_CLASS_NAME);
  // content.classList.add(Constants.PREVENT_DRAGGABLE_CLASS_NAME);
  // element.appendChild(content);

  // done
  return element;
}

/**
 * element creation method for a given type
 * called from createElement
 */
function createTextElement(): HTMLElement {
  // create the element
  const element = createElementWithContent(ElementType.TEXT);

  // add default content
  const content = getContentNode(element);
  content.innerHTML = '<p>New text box</p>';

  // add normal class for default text formatting
  // sometimes there is only in text node in content
  // e.g. whe select all + remove formatting
  content.classList.add('normal');

  // done
  return element;
}

/**
 * element creation method for a given type
 * called from createElement
 */
function createHtmlElement(): HTMLElement {
  // create the element
  const element = getSiteDocument().createElement('div');
  element.setAttribute(Constants.TYPE_ATTR, ElementType.HTML);

  // create the container for html content
  const htmlContent = getSiteDocument().createElement('div');
  htmlContent.innerHTML = '<p>New HTML box</p>';
  element.appendChild(htmlContent);

  // add a marker to find the inner content afterwards, with getContent
  htmlContent.classList.add(Constants.ELEMENT_CONTENT_CLASS_NAME);
  return element;
}

/**
 * element creation method for a given type
 * called from createElement
 */
function createImageElement(): HTMLElement {
  // create the element
  const element = getSiteDocument().createElement('div');
  element.setAttribute(Constants.TYPE_ATTR, ElementType.IMAGE);
  return element;
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

export function writeStyleToDom(doc, elementId, style, isMobile) {
  // find the index of the rule for the given element
  const styleSheet = getInlineStyleSheet(doc)
  const cssRuleObject = findCssRule(styleSheet, elementId, isMobile)

  // update or create the rule
  if (cssRuleObject) {
    styleSheet.deleteRule(cssRuleObject.index);
  }
  // convert style to string
  // we use the class name because elements have their ID as a css class too
  const styleStr = '.' + elementId + '{' + Style.styleToString(style) + '} ';
  if (isMobile) {
    // add the rule to the dom to see the changes, mobile rules after
    // desktop ones
    styleSheet.insertRule(this.addMediaQuery(styleStr), styleSheet.cssRules.length);
  } else {
    styleSheet.insertRule(styleStr, 0);
  }
}

function getInlineStyleSheet(doc: Document): CSSStyleSheet {
  // make sure of the existance of the style tag with Silex definitions
  let styleTag: HTMLElement = doc.querySelector('.' + Constants.INLINE_STYLE_TAG_CLASS_NAME);
  if (!styleTag) {
    styleTag = doc.createElement('style');
    styleTag.classList.add(Constants.INLINE_STYLE_TAG_CLASS_NAME);
    styleTag.setAttribute('type', 'text/css');
    doc.head.appendChild(styleTag);
  }
  for (const s of doc.styleSheets) {
    if (s.ownerNode && s.ownerNode === styleTag) {
      return s as CSSStyleSheet;
    }
  }
  console.error('no stylesheet found');
  return null;
}

function findCssRule(styleSheet: CSSStyleSheet, elementId: string, isMobile: boolean): CSSRuleInfo {
  // find the rule for the given element
  for (let idx = 0; idx < styleSheet.cssRules.length; idx++) {
    const cssRule = styleSheet.cssRules[idx] as any; // FIXME: should be CSSRule ?
    // we use the class name because elements have their ID as a css class too
    if ((isMobile === false && cssRule.selectorText === '.' + elementId) ||
        (cssRule.media && cssRule.cssRules && cssRule.cssRules[0] &&
            cssRule.cssRules[0].selectorText === '.' + elementId)) {
      return {
        rule: cssRule,
        parent: styleSheet,
        index: idx,
      };
    }
  }
  return null;
}
