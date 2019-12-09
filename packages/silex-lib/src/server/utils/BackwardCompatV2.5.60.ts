import * as cssBeautify from 'js-beautify';
import { CssRule, ProdotypeData, SilexData } from '../../client/model/Data';
import { Constants } from '../../constants';
import { ElementData, ElementId, ElementType, FileInfo, LinkType, PageData, SiteData } from '../../types';
import DomTools from './DomTools';

////////////////////////////////////////////////////////////
// Elements

interface DomData {
  fonts: any,
  dataSources: any,
  stylesObj: any,
  mobileStylesObj: any,
  prodotypeDataObj: any,
}

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

export function getElementDataBC(data: DomData, element: HTMLElement): ElementData {
  const linkValue = element.getAttribute(Constants.LINK_ATTR)
  const linkType = linkValue ? linkValue.startsWith('#!page-') ? LinkType.PAGE : LinkType.URL : null
  const id = getElementId(element)
  return {
    id,
    pageNames: [],
    classList: element.className
      .split(' ')
      .filter((c) => !Constants.SILEX_CLASS_NAMES.includes(c) && c !== id),
    type: getTypeBC(element),
    title: element.title,
    alt: Array.from(element.querySelectorAll(':scope > img'))
      .map((img: HTMLImageElement) => img.alt)[0],
    parent: element.parentElement ? getElementId(element.parentElement) : null,
    children: Array.from(element.querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}`))
      .map((el: HTMLElement) => getElementId(el)),
    link: linkType && linkValue ? {
      type: linkType,
      value: linkValue,
    } : null,
    enableDrag: !element.classList.contains(Constants.PREVENT_DRAGGABLE_CLASS_NAME),
    enableDrop: !element.classList.contains(Constants.PREVENT_DROPPABLE_CLASS_NAME),
    enableResize: {
      top: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME),
      bottom: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME),
      left: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME),
      right: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME),
    },
    selected: false,
    useMinHeight: !element.classList.contains(Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT),
    visibility: {
      desktop: !element.classList.contains(Constants.HIDE_ON_DESKTOP),
      mobile: !element.classList.contains(Constants.HIDE_ON_MOBILE),
    },
    style: {
      desktop: getStylesFromDomBC(data, element, false),
      mobile: getStylesFromDomBC(data, element, true),
    },
    data: {
      component: getComponentDataFromDomBC(data, element),
    },
  }
}

/**
 * get all elements visible when the given page is opened
 */
export function getElementsFromDomBC(doc: HTMLDocument): ElementData[] {
  const data = loadProperties(doc)
  return (Array.from(doc.querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}`)) as HTMLElement[])
    .map((element) => getElementDataBC(data, element))
}

function getStylesFromDomBC(data: DomData, element: HTMLElement, mobile: boolean) {
  const elementId = (getElementId(element) as ElementId);
  const targetObj = (mobile ? data.mobileStylesObj : data.stylesObj as SilexData);
  const style = (targetObj[elementId] as CssRule);
  if (!!style) {
    return {
      ...style,
      'height': style.height || style['min-height'],
      'min-height': null,
    };
  }
  return null;
}
function getComponentDataFromDomBC(data: DomData, element: HTMLElement) {
  const elementId = (getElementId(element) as ElementId);
  return data.prodotypeDataObj.component[elementId]
}
/**
 * get/set type of the element
 * @param element   created by silex, either a text box, image, ...
 * @return           the type of element
 * example: for a container this will return "container"
 */
export function getTypeBC(element: HTMLElement): ElementType {
  switch (element.getAttribute(Constants.TYPE_ATTR)) {
    case ElementType.CONTAINER.toString(): return element.classList.contains('section-element') ? ElementType.SECTION : ElementType.CONTAINER
    case ElementType.SECTION.toString(): return ElementType.SECTION
    case ElementType.IMAGE.toString(): return ElementType.IMAGE
    case ElementType.TEXT.toString(): return ElementType.TEXT
    case ElementType.HTML.toString(): return ElementType.HTML
  }
  throw new Error('unknown type ' + element.getAttribute(Constants.TYPE_ATTR))
}

////////////////////////////////////////////////////////////
// Pages

/**
 * Util function to get page data from name
 */
function getPageDataFromElement(element: HTMLAnchorElement): PageData {
  const pageName = element.getAttribute('id')
  return {
    id: pageName,
    displayName: element.innerHTML,
    link: {
      type: LinkType.PAGE,
      value: '#!' + pageName,
    },
    // isOpen: getCurrentPageName() === pageName,
    isOpen: false,
    canDelete: !element.hasAttribute(Constants.PAGE_PREVENT_DELETE),
    canProperties: !element.hasAttribute(Constants.PAGE_PREVENT_PROPERTIES),
    canMove: !element.hasAttribute(Constants.PAGE_PREVENT_MOVE),
    canRename: !element.hasAttribute(Constants.PAGE_PREVENT_RENAME),
  }
}

/**
 * Util function to get page data from name
 */
function getPageData(doc, pageName): PageData {
  const element = doc.getElementById(pageName) as HTMLAnchorElement
  if (element) {
    return getPageDataFromElement(element)
  } else {
    // this happens while undoing or redoing
    // or when the page does not exist
    return null
  }
}

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
    headTag: DomTools.extractUserHeadTag(doc.head.innerHTML).userHead,
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
    headStyle: getHeadStyle(doc),
    headScript: getHeadScript(doc),
    hostingProvider: getMeta(doc, 'hostingProvider'),
    twitterSocial: getMeta(doc, 'twitter:site'),
    dataSources: properties.dataSources,
    fonts: properties.fonts,
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
  return cssBeautify(silexStyle.innerHTML, BEAUTIFY_CSS_OPTIONS);
}
function getHeadScript(doc: HTMLDocument): string {
  // get silex scripts from the DOM
  const scriptTag = doc.querySelector('.' + Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS);
  if (!scriptTag) {
    return '';
  }
  return scriptTag.innerHTML;
}
