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

import { Constants } from '../../constants';
import { ElementData, ElementId, ElementType, Link } from './types';
import { getEmptyElementData } from '../element/utils';
import { Style } from '../utils/Style';
import { Url } from '../utils/Url'
import { CSSRuleInfo, DataSources } from '../site/types'
import { Prodotype } from '../externs'

/**
 * @fileoverview Dom manipulation methods, mostly used by observers. Cross platform, it needs to run client and server side
 *
 */

 export function getDomElement(doc: HTMLDocument, element: ElementData): HTMLElement {
  return getDomElementById(doc, element.id)
}

export function getDomElementById(doc: HTMLDocument, elementId: ElementId): HTMLElement {
  return doc.querySelector(`[${Constants.ELEMENT_ID_ATTR_NAME}="${elementId}"]`)
}

export function getId(element: HTMLElement): ElementId {
  return element.getAttribute(Constants.ELEMENT_ID_ATTR_NAME)
}

// export function moveToContainer(element: HTMLElement, parent: HTMLElement) {
//   parent.appendChild(element)
// }

export function reorderElements(parent: HTMLElement, elements: HTMLElement[]) {
  // attach to the new parent
  elements
    .forEach((el) => {
      parent.appendChild(el)
      // return el.parentElement !== parent
    })
  // TODO: check that they do not belong to an other element's children list
  // changed.filter((el) => {
  //   if (getElements().filter((el2) => !!el2.children.find((id) => id === el.id)))

  // })
}

/**
 * set/get a "silex style link" on an element
 */
export function setLink(element: HTMLElement, link: Link) {
  if (link) {
    element.setAttribute(Constants.LINK_ATTR, link.value);
  } else {
    element.removeAttribute(Constants.LINK_ATTR);
  }
}

/**
 * remove a DOM element
 */
export function removeElement(element: HTMLElement) {
  element.remove()
}

/**
 * element creation
 * create a DOM element, attach it to this container
 * and returns a new component for the element
 * @param type  the type of the element to create,
 *    see TYPE_* constants of the class @see silex.model.Element
 * @return   the newly created element
 */
export function createDomElement({doc, id, type, parent, isSectionContent}: {doc: HTMLDocument, id: ElementId, type: ElementType, parent: HTMLElement, isSectionContent: boolean}): ElementData {
  // create the element
  let element: HTMLElement = null;
  switch (type) {
    // container
    case ElementType.CONTAINER:
      element = createContainerElement(doc);
      break;

    // section
    case ElementType.SECTION:
      element = createSectionElement(doc);
      break;

    // text
    case ElementType.TEXT:
      element = createTextElement(doc);
      break;

    // HTML box
    case ElementType.HTML:
      element = createHtmlElement(doc);
      break;

    // Image
    case ElementType.IMAGE:
      element = createImageElement(doc);
      break;

    default: throw new Error('unknown type: ' + type)
  }

  // init the element
  element.classList.add(Constants.EDITABLE_CLASS_NAME);

  // add css class for Silex styles
  element.classList.add(type.toString());

  // element id
  element.setAttribute(Constants.ELEMENT_ID_ATTR_NAME, id)
  element.classList.add(id);

  if (parent) {
    // add to the body
    if (type === ElementType.SECTION && parent !== doc.body) {
      throw new Error('Section can only be added to the body')
    }
    parent.appendChild(element);
  } else {
    console.info('element not yet created in the dom')
  }

  // return the element
  return getEmptyElementData({id, type, isSectionContent, isBody: false});
}
/**
 * element creation method for a given type
 * called from createElement
 */
function createContainerElement(doc: HTMLDocument): HTMLElement {
  // create the conatiner
  const element = doc.createElement('div');
  element.setAttribute(Constants.TYPE_ATTR, ElementType.CONTAINER);
  return element;
}
function createElementWithContent(doc: HTMLDocument, className: string): HTMLElement {
  // create the element
  const element = doc.createElement('div');
  element.setAttribute(Constants.TYPE_ATTR, className);

  // create the container for text content
  const content = doc.createElement('div');

  // add empty content
  element.appendChild(content);

  // add a marker to find the inner content afterwards, with getContent
  content.classList.add(Constants.ELEMENT_CONTENT_CLASS_NAME);

  // done
  return element;
}

/**
 * element creation method for a given type
 * called from createElement
 */
function createSectionElement(doc: HTMLDocument): HTMLElement {
  // create the element
  const element = doc.createElement('div');
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
function createTextElement(doc: HTMLDocument): HTMLElement {
  // create the element
  const element = createElementWithContent(doc, ElementType.TEXT);

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
function createHtmlElement(doc: HTMLDocument): HTMLElement {
  // create the element
  const element = doc.createElement('div');
  element.setAttribute(Constants.TYPE_ATTR, ElementType.HTML);

  // create the container for html content
  const htmlContent = doc.createElement('div');
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
function createImageElement(doc: HTMLDocument): HTMLElement {
  // create the element
  const element = doc.createElement('div');
  element.setAttribute(Constants.TYPE_ATTR, ElementType.IMAGE);
  return element;
}

export function writeStyleToDom(doc: HTMLDocument, elementId, style, isMobile) {
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
    styleSheet.insertRule(addMediaQuery(styleStr), styleSheet.cssRules.length);
  } else {
    styleSheet.insertRule(styleStr, 0);
  }
}

function getInlineStyleSheet(doc: Document): CSSStyleSheet {
  // make sure of the existance of the style tag with Silex definitions
  let styleTag: HTMLStyleElement = doc.querySelector('.' + Constants.INLINE_STYLE_TAG_CLASS_NAME);
  if (!styleTag) {
    styleTag = doc.createElement('style');
    styleTag.classList.add(Constants.INLINE_STYLE_TAG_CLASS_NAME);
    styleTag.setAttribute('type', 'text/css');
    doc.head.appendChild(styleTag);
  }
  for (const s of doc.styleSheets) {
    const cssStyleSheet = s as CSSStyleSheet
    if (
      (cssStyleSheet.ownerNode && cssStyleSheet.ownerNode === styleTag) // case of browser
      || cssStyleSheet === styleTag.sheet) {
      return cssStyleSheet;
    }
  }
  console.error('no stylesheet found');
  return null;
}

function findCssRule(styleSheet: CSSStyleSheet, elementId: string, isMobile: boolean): CSSRuleInfo {
  // find the rule for the given element
  for (let idx = 0; idx < styleSheet.cssRules.length; idx++) {
    const cssRule = styleSheet.cssRules[idx] as any; // should it be CSSRule ?
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

export function hideOnDesktop(domEl) {
  domEl.classList.add(Constants.HIDE_ON_DESKTOP)
}

export function showOnDesktop(domEl) {
  domEl.classList.remove(Constants.HIDE_ON_DESKTOP)
}

export function hideOnMobile(domEl) {
  domEl.classList.add(Constants.HIDE_ON_MOBILE)
}

export function showOnMobile(domEl) {
  domEl.classList.remove(Constants.HIDE_ON_MOBILE)
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
  contentNode.innerHTML = deactivateScripts(innerHTML)
}

/**
 * get/set html from a container created by silex
 * @param element  created by silex, either a text box, image, ...
 * @return  the html content
 */
export function getInnerHtml(element: HTMLElement): string {
  let innerHTML = getContentNode(element).innerHTML

  // put back executable scripts
  innerHTML = reactivateScripts(innerHTML)
  return innerHTML
}

/**
 * prevent scripts from executing in components, html boxes...
 * @return a safe html string
 */
function deactivateScripts(html: string): string {
  return html.replace(
      /<script.*class="silex-script".*?>/gi,
      '<script type="text/notjavascript" class="silex-script">');
}

/**
 * undo the deactivateScript
 * @return the original html string
 */
function reactivateScripts(html: string): string {
  return html.replace(
      /type="text\/notjavascript"/gi, 'type="text/javascript"');
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

export function removeWysihtmlMarkup(root: HTMLElement|Document) {
  Array.from(root.querySelectorAll('.wysihtml-editor')).forEach((el) => {
    el.classList.remove('wysihtml-sandbox');
    el.removeAttribute('contenteditable');
  });
}

/**
 * set/get the image URL of an image element
 * FIXME: html sould be set to flux store using element.innerHtml
 */
export async function setImageUrl(
    element: HTMLElement, url: string,
    opt_callback?: ((naturalWidth: number, naturalheight: number) => void),
    opt_errorCallback?: ((p1: HTMLElement, p2: string) => void)) {
  if (element.getAttribute(Constants.TYPE_ATTR) === ElementType.IMAGE) {
    // get the image tag
    const img = getContentNode(element) as HTMLImageElement;
    if (img) {
      // add loading asset
      element.classList.add(Constants.LOADING_ELEMENT_CSS_CLASS);

      // remove previous img tag
      const imgTags = Array.from(element.querySelectorAll('img.' + Constants.ELEMENT_CONTENT_CLASS_NAME));
      imgTags.forEach((imgTag: HTMLImageElement) => {
        imgTag.parentElement.removeChild(imgTag);
      });

      try {
        // load the new image
        const loadedImg: HTMLImageElement = await loadImage(url);

        // callback
        if (opt_callback) {
          opt_callback(loadedImg.naturalWidth, loadedImg.naturalHeight);
        }

        // add the image to the element
        element.appendChild(loadedImg);

        // add a marker to find the inner content afterwards, with
        // getContent
        loadedImg.classList.add(Constants.ELEMENT_CONTENT_CLASS_NAME);

        // remove loading asset
        element.classList.remove(Constants.LOADING_ELEMENT_CSS_CLASS);
      } catch (e) {
        console.error('An error occured while loading the image.', element, e);

        // callback
        if (opt_errorCallback) {
          opt_errorCallback(element, 'An error occured while loading the image.');
        }
      }
    } else {
      console.error(
          'The image could not be retrieved from the element.', element);
      if (opt_errorCallback) {
        opt_errorCallback(
            element, 'The image could not be retrieved from the element.');
      }
    }
  } else {
    console.error('The element is not an image.', element);
    if (opt_errorCallback) {
      opt_errorCallback(element, 'The element is not an image.');
    }
  }
}

/**
 * set the img.src and promise the events
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = (e) => {
      img.onload = null;
      img.onerror = null;
      resolve(img);
    };
    img.onerror = (e: Event) => {
      img.onload = null;
      img.onerror = null;
      reject(e);
    };

    // add cache control
    const uncached = Url.addCacheControl(url)

    // start loading
    img.src = uncached;
  });
}


/**
 * prodotype render in dom
 */
export function renderWithProdotype(prodotypeInstance: Prodotype, options: {templateName: string, data: any, dataSources?: DataSources}) {
  return prodotypeInstance.decorate(options.templateName, options.data, options.dataSources)
}
