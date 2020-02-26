import * as jsBeautify from 'js-beautify';
import { writeStyleToDom } from '../../client/dom/element-dom';
import { setWebsiteWidth } from '../../client/dom/site-dom';
import { crudIdKey } from '../../client/flux/crud-store';
import { getContentNode, getDefaultStyle, getInnerHtml } from '../../client/utils/ElementUtils';
import { Constants } from '../../constants';
import { ComponentData, CssRule, ElementData, ElementId, ElementType, FileInfo, LinkType, PageData, SiteData, StyleData } from '../../types';
import DomTools from './DomTools';

////////////////////////////////////////////////////////////
// Old data structures

export interface ProdotypeData {
  component: {[key: string]: ComponentData};
  style: {[key: string]: StyleData};
}

interface DomData {
  fonts: any,
  dataSources: any,
  stylesObj: any,
  mobileStylesObj: any,
  prodotypeDataObj: any,
}

////////////////////////////////////////////////////////////
// Elements

/**
 * get/set Silex ID
 * @return uniqueId
 */
function getElementId(element: HTMLElement): ElementId {
  return element.getAttribute(Constants.ELEMENT_ID_ATTR_NAME);
}

const EMPTY_PRODOTYPE_DATA: ProdotypeData = {component: {}, style: {}};

export function loadProperties(doc: HTMLDocument): DomData {
  const styleTag = doc.querySelector('.' + Constants.JSON_STYLE_TAG_CLASS_NAME);
  if (styleTag != null ) {
    const styles = (JSON.parse(styleTag.innerHTML)[0] as any);
    return {
      fonts: styles.fonts || [],
      dataSources: styles.dataSources || {},
      stylesObj: styles.desktop || {},
      mobileStylesObj: styles.mobile || {},
      prodotypeDataObj: styles.prodotypeData &&
              styles.prodotypeData.component &&
              styles.prodotypeData.style ?
          ({
            component: styles.prodotypeData.component,
            style: styles.prodotypeData.style,
          } as ProdotypeData) :
          EMPTY_PRODOTYPE_DATA,
    }
  } else {
    console.info('Warning: no JSON styles array found in the dom');
    return {
      fonts: [],
      dataSources: {},
      stylesObj: {},
      mobileStylesObj: {},
      prodotypeDataObj: EMPTY_PRODOTYPE_DATA,
    }
  }
}

export function getElementDataBC(doc: HTMLDocument, data: DomData, element: HTMLElement): ElementData {
  const linkValue = element.getAttribute(Constants.LINK_ATTR)
  const linkType = linkValue ? linkValue.startsWith('#!page-') ? LinkType.PAGE : LinkType.URL : null
  const id = getElementId(element)
  const type = getTypeBC(element)
  const isSectionContent = element.classList.contains(Constants.ELEMENT_CONTENT_CLASS_NAME)
  const isBody = element.classList.contains('body-initial')
  const contentElement = getContentNode(element)
  return {
    [crudIdKey]: Symbol(),
    id,
    pageNames: getPagesForElementBC(doc, element).map((p) => p.id),
    classList: element.className
      .split(' ')
      .filter((c) => !Constants.SILEX_CLASS_NAMES.includes(c) && c !== id),
    type,
    isSectionContent,
    title: element.title,
    alt: type === ElementType.IMAGE && !!contentElement ? (contentElement as HTMLImageElement).alt : null,
    children: Array.from(element.children)
      .filter((child) => child.classList.contains(Constants.EDITABLE_CLASS_NAME))
      .map((el: HTMLElement) => getElementId(el)),
    link: linkType && linkValue ? {
      type: linkType,
      value: linkValue,
    } : null,
    enableDrag: !element.classList.contains(Constants.PREVENT_DRAGGABLE_CLASS_NAME),
    enableDrop: (type === ElementType.CONTAINER || type === ElementType.SECTION) && !element.classList.contains(Constants.PREVENT_DROPPABLE_CLASS_NAME),
    enableResize: {
      top: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME),
      bottom: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME),
      left: type !== ElementType.SECTION && !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME),
      right: type !== ElementType.SECTION && !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME),
    },
    selected: false,
    useMinHeight: !element.classList.contains(Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT),
    visibility: {
      desktop: !element.classList.contains(Constants.HIDE_ON_DESKTOP),
      mobile: !element.classList.contains(Constants.HIDE_ON_MOBILE),
    },
    style: {
      desktop: getStylesFromDomBC({
        data,
        element,
        mobile: false,
        type,
        isSectionContent,
        isBody,
      }),
      mobile: getStylesFromDomBC({
        data,
        element,
        mobile: true,
        type,
        isSectionContent,
        isBody,
      }),
    },
    data: {
      component: getComponentDataFromDomBC(data, element),
    },
    innerHtml: type === ElementType.COMPONENT || type === ElementType.HTML || type === ElementType.TEXT ? getInnerHtml(element) : '',
  }
}

/**
 * get all elements visible when the given page is opened
 */
export function getElementsFromDomBC(doc: HTMLDocument): ElementData[] {
  const data = loadProperties(doc)
  return (Array.from(doc.querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}`)) as HTMLElement[])
    .map((element) => getElementDataBC(doc, data, element))
}

export function writeStyles(doc: HTMLDocument, elements: ElementData[]) {
  elements.forEach((el) => {
    writeStyleToDom(doc, el.id, el.style.desktop, false)
    writeStyleToDom(doc, el.id, el.style.mobile, true)
  })
}

export function writeSiteStyles(doc: HTMLDocument, site: SiteData) {
  // website width
  setWebsiteWidth(doc, site.width)
}

function getStylesFromDomBC({data, element, mobile, type, isSectionContent, isBody}: {data: DomData, element: HTMLElement, mobile: boolean, type: ElementType, isSectionContent: boolean, isBody: boolean}) {
  const elementId = (getElementId(element) as ElementId);
  const targetObj = (mobile ? data.mobileStylesObj : data.stylesObj as StyleData);
  const style = (targetObj[elementId] as CssRule) || {};
  // create the style applied byt the editor
  const silexInlineStyle = {
    ...style,
    height: style.height || style['min-height'],
    // 'min-height': undefined,
  }
  delete silexInlineStyle['min-height']
  if (isBody) {
    delete silexInlineStyle.height
  }
  if (mobile) {
    return {
      ...silexInlineStyle,
    }
  } else {
    return JSON.parse(JSON.stringify({ // this will remove the undefined props
      ...silexInlineStyle,
      ...getDefaultStyle({type, isSectionContent, isBody}),
    }))
  }
}
function getComponentDataFromDomBC(data: DomData, element: HTMLElement): ComponentData {
  const elementId = (getElementId(element) as ElementId);
  if (data.prodotypeDataObj.component[elementId]) {
    const justData = {
      ...data.prodotypeDataObj.component[elementId],
    }
    delete justData.displayName
    delete justData.name
    delete justData.templateName
    return {
      displayName: data.prodotypeDataObj.component[elementId].displayName,
      name: data.prodotypeDataObj.component[elementId].name,
      templateName: data.prodotypeDataObj.component[elementId].templateName,
      data: justData,
    }
  }
  return null;
}

/**
 * get/set type of the element
 * @param element   created by silex, either a text box, image, ...
 * @return           the type of element
 * example: for a container this will return "container"
 */
function getTypeBC(element: HTMLElement): ElementType {
  if (element.classList.contains(Constants.COMPONENT_CLASS_NAME)) {
    return ElementType.COMPONENT
  }
  switch (element.getAttribute(Constants.TYPE_ATTR)) {
    case ElementType.CONTAINER.toString(): return element.classList.contains('section-element') ? ElementType.SECTION : ElementType.CONTAINER
    case ElementType.SECTION.toString(): return ElementType.SECTION
    case ElementType.IMAGE.toString(): return ElementType.IMAGE
    case ElementType.TEXT.toString(): return ElementType.TEXT
    case ElementType.HTML.toString(): return ElementType.HTML
  }
  throw new Error('unknown type ' + element.getAttribute(Constants.TYPE_ATTR))
}

/**
 * get the pages on which this element is visible
 */
function getPagesForElementBC(doc: HTMLDocument, element: HTMLElement): PageData[] {
  return getPagesFromDom(doc).filter((pageData) => element.classList.contains(pageData.id))
}

////////////////////////////////////////////////////////////
// Pages

/**
 * Util function to get page data from name
 */
function getPageDataFromElement(element: HTMLAnchorElement): PageData {
  const pageName = element.getAttribute('id')
  return {
    [crudIdKey]: Symbol(),
    id: pageName,
    displayName: element.innerHTML,
    link: {
      type: LinkType.PAGE,
      value: '#!' + pageName,
    },
    // opened: getCurrentPageName() === pageName,
    opened: false,
    canDelete: !element.hasAttribute(Constants.PAGE_PREVENT_DELETE),
    canProperties: !element.hasAttribute(Constants.PAGE_PREVENT_PROPERTIES),
    canMove: !element.hasAttribute(Constants.PAGE_PREVENT_MOVE),
    canRename: !element.hasAttribute(Constants.PAGE_PREVENT_RENAME),
  }
}

// /**
//  * Util function to get page data from name
//  */
// function getPageData(doc, pageName): PageData {
//   const element = doc.getElementById(pageName) as HTMLAnchorElement
//   if (element) {
//     return getPageDataFromElement(element)
//   } else {
//     // this happens while undoing or redoing
//     // or when the page does not exist
//     return null
//   }
// }

/**
 * get the pages from the dom
 * @return an array of the page names I have found in the DOM
 */
export function getPagesFromDom(doc: HTMLDocument): PageData[] {
  return Array.from(doc.body.querySelectorAll(`a[data-silex-type="${Constants.TYPE_PAGE}"]`))
    .map((element) => getPageDataFromElement(element as HTMLAnchorElement))
}

/////////////////////////////////////////////////////////////////////////
// Site

export function getSiteFromDom(doc: HTMLDocument): SiteData {
  const properties = loadProperties(doc)
  return {
    title: doc.querySelector('title').innerHTML,
    description: getMeta(doc, 'description'),
    enableMobile: doc.body.classList.contains(Constants.ENABLE_MOBILE_CSS_CLASS),
    publicationPath: getPublicationPath(doc),
    websiteUrl: getMeta(doc, 'websiteUrl'),
    faviconPath: getFaviconPath(doc),
    thumbnailSocialPath: getMeta(doc, 'og:image') || getMeta(doc, 'twitter:image'),
    descriptionSocial: getMeta(doc, 'twitter:description') || getMeta(doc, 'og:description'),
    titleSocial: getMeta(doc, 'twitter:title') || getMeta(doc, 'og:title'),
    lang: doc.querySelector('html').lang,
    width: getWebsiteWidth(doc),
    headTag: DomTools.extractUserHeadTag(doc.head.innerHTML).userHead,
    headStyle: getHeadStyle(doc),
    headScript: getHeadScript(doc),
    hostingProvider: getMeta(doc, 'hostingProvider'),
    twitterSocial: getMeta(doc, 'twitter:site'),
    dataSources: properties.dataSources,
    fonts: properties.fonts,
    style: properties.prodotypeDataObj.style,
  }
}
function getMeta(doc, name: string): string {
  const metaNode = doc.querySelector(
      'meta[name="' + name + '"]');
  if (metaNode) {
    return metaNode.getAttribute('content');
  } else {
    return null;
  }
}

export function getPublicationPath(doc: HTMLDocument): FileInfo {
  const fileInfo = getMeta(doc, 'publicationPath');
  try {
    return fileInfo == null ? null : (JSON.parse(fileInfo) as FileInfo);
  } catch (e) {
    // this happens with old publication path (just a string)
    return null;
  }
}

function getFaviconPath(doc: HTMLDocument): string {
  const faviconTag = doc.querySelector('link[rel="shortcut icon"]');
  if (faviconTag) {
    return faviconTag.getAttribute('href');
  }
  return null;
}
function getWebsiteWidth(doc: HTMLDocument): number {
  const width = getMeta(doc, 'website-width');
  return !!width ? parseInt(width) : null;
}
const BEAUTIFY_CSS_OPTIONS = {
  indent_size: 2,
};
function getHeadStyle(doc: HTMLDocument): string {
  // get silex styles from the DOM
  const silexStyle = doc.head.querySelector('.' + Constants.SILEX_STYLE_ELEMENT_CSS_CLASS);
  if (!silexStyle) {
    console.warn('no silex editable styles defined');
    return '';
  }
  // tslint:disable:no-string-literal
  return jsBeautify.css_beautify(silexStyle.innerHTML, BEAUTIFY_CSS_OPTIONS);
}
function getHeadScript(doc: HTMLDocument): string {
  // get silex scripts from the DOM
  const scriptTag = doc.querySelector('.' + Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS);
  if (!scriptTag) {
    return '';
  }
  return scriptTag.innerHTML;
}
