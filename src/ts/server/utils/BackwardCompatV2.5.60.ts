import * as jsBeautify from 'js-beautify'

import { ComponentData, ElementId, LinkType, ElementType, ProdotypeDependency, ElementData } from '../../client/element-store/types'
import { Constants } from '../../constants'
import { FileInfo } from '../../client/io/CloudStorage'
import { PageData } from '../../client/page-store/types'
import { SiteState, StyleData, CssRule } from '../../client/site-store/types'
import { getDefaultStyle } from '../../client/element-store/utils'
import { setWebsiteWidthInDom } from '../../client/site-store/dom'
import { writeStyleToDom, getContentNode, getInnerHtml } from '../../client/element-store/dom'
import DomTools from './DomTools'
import componentDef from './componentsV2.5.60'

////////////////////////////////////////////////////////////
// Old data structures

export interface ProdotypeData {
  component: {[key: string]: ComponentData}
  style: {[key: string]: StyleData}
}

interface DomData {
  fonts: any,
  dataSources: any,
  stylesObj: any,
  mobileStylesObj: any,
  prodotypeDataObj: ProdotypeData,
}

const SILEX_CLASS_NAMES_TO_IGNORE = [
  'silex-container-content',
  Constants.PREVENT_DROPPABLE_CLASS_NAME,
  Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT,
  Constants.PREVENT_RESIZABLE_CLASS_NAME,
  Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME,
  Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME,
  Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME,
  Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME,
  Constants.PREVENT_SELECTABLE_CLASS_NAME,
  Constants.PREVENT_DRAGGABLE_CLASS_NAME,
  Constants.EDITABLE_CLASS_NAME,
  Constants.ENABLE_MOBILE_CSS_CLASS,
  Constants.PAGED_CLASS_NAME,
  Constants.PAGED_HIDDEN_CLASS_NAME,
  Constants.PAGED_VISIBLE_CLASS_NAME,
  Constants.PAGEABLE_PLUGIN_READY_CLASS_NAME,
  Constants.PAGE_LINK_ACTIVE_CLASS_NAME,
  Constants.STAGE_COMPONENT_SELECTED_CLASS_NAME,
  Constants.STAGE_COMPONENT_NOT_SELECTED_CLASS_NAME,
  Constants.SELECTED_CLASS_NAME,
  Constants.RESIZING_CLASS_NAME,
  Constants.DRAGGING_CLASS_NAME,
  ElementType.CONTAINER,
  ElementType.SECTION,
  ElementType.IMAGE,
  ElementType.TEXT,
  ElementType.HTML,
  Constants.ELEMENT_CONTENT_CLASS_NAME,
  Constants.HIDE_ON_MOBILE,
  Constants.HIDE_ON_DESKTOP,
  Constants.COMPONENT_CLASS_NAME,
  Constants.WEBSITE_CONTEXT_EDITOR_CLASS_NAME,
  Constants.WEBSITE_CONTEXT_PUBLISHED_CLASS_NAME,
  Constants.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME,
  Constants.BODY_STYLE_CSS_CLASS,
]

////////////////////////////////////////////////////////////
// Elements

/**
 * get/set Silex ID
 * @return uniqueId
 */
function getElementId(element: HTMLElement): ElementId {
  return element.getAttribute(Constants.ELEMENT_ID_ATTR_NAME)
}

const EMPTY_PRODOTYPE_DATA: ProdotypeData = {component: {}, style: {}}

export function loadProperties(doc: HTMLDocument): DomData {
  const styleTag = doc.querySelector('.' + Constants.JSON_STYLE_TAG_CLASS_NAME)
  if (styleTag != null ) {
    const styles = (JSON.parse(styleTag.innerHTML)[0] as any)
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
    console.info('Warning: no JSON styles array found in the dom')
    return {
      fonts: [],
      dataSources: {},
      stylesObj: {},
      mobileStylesObj: {},
      prodotypeDataObj: EMPTY_PRODOTYPE_DATA,
    }
  }
}

const EDITABLE = [ElementType.HTML, ElementType.IMAGE, ElementType.TEXT]
const DROPPABLE = [ElementType.CONTAINER, ElementType.SECTION]
const HAVE_INNER_HTML = [ElementType.HTML, ElementType.TEXT, ElementType.IMAGE]
const HAVE_ALT = [ElementType.IMAGE]


export function getElementDataBC(doc: HTMLDocument, data: DomData, element: HTMLElement): any {
  const linkValue = element.getAttribute('data-silex-href')
  const linkType = linkValue ? linkValue.startsWith('#!page-') ? LinkType.PAGE : LinkType.URL : null
  const id = getElementId(element)
  const isBody = element.classList.contains('body-initial')
  const type = isBody ? ElementType.CONTAINER : getTypeBC(element) // sometimes body has no type attr
  const isSectionContent = element.classList.contains(Constants.ELEMENT_CONTENT_CLASS_NAME)
  const pages = getPagesForElementBC(doc, element)
  return {
    id,
    pageNames: pages.map((p) => p.id),
    classList: element.className
      .split(' ')
      .filter((c) => c !== id)
      .filter((c) => !pages.find((p) => p.id === c))
      .filter((c) => !SILEX_CLASS_NAMES_TO_IGNORE.includes(c)),
    tagName: 'DIV',
    type,
    isSectionContent,
    title: element.title,
    alt: HAVE_ALT.includes(type) ? (element.querySelector('img') as HTMLImageElement).alt : null,
    children: Array.from(element.children)
      .filter((child) => child.classList.contains(Constants.EDITABLE_CLASS_NAME))
      .map((el: HTMLElement) => getElementId(el)),
    link: linkType && linkValue ? {
      linkType,
      href: linkValue,
    } : null,
    enableEdit: EDITABLE.includes(type),
    enableDrag: type === ElementType.SECTION || !element.classList.contains(Constants.PREVENT_DRAGGABLE_CLASS_NAME), // New feature: make all sections draggable
    enableDrop: DROPPABLE.includes(type) && !element.classList.contains(Constants.PREVENT_DROPPABLE_CLASS_NAME),
    enableResize: {
      top: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME),
      bottom: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME),
      left: type !== ElementType.SECTION && !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME),
      right: type !== ElementType.SECTION && !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME),
    },
    selected: false,
    useMinHeight: type !== ElementType.IMAGE && !element.classList.contains(Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT),
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
    innerHtml: HAVE_INNER_HTML.includes(type) ? getInnerHtml(element) : '',
  }
}

/**
 * cleanup the dom before converting all elements
 */
export function cleanupBefore(doc: HTMLDocument) {
  Array.from(doc.querySelectorAll('.image-element img'))
  .forEach((element: HTMLImageElement) => element.classList.remove(Constants.ELEMENT_CONTENT_CLASS_NAME))
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
    writeStyleToDom(doc, el, false)
    writeStyleToDom(doc, el, true)
  })
}

export function writeSiteStyles(doc: HTMLDocument, site: SiteState) {
  // website width
  setWebsiteWidthInDom(doc, site.width)
}

function getStylesFromDomBC({data, element, mobile, type, isSectionContent, isBody}: {data: DomData, element: HTMLElement, mobile: boolean, type: ElementType, isSectionContent: boolean, isBody: boolean}) {
  const elementId = (getElementId(element) as ElementId)
  const targetObj = (mobile ? data.mobileStylesObj : data.stylesObj as StyleData)
  const style = (targetObj[elementId] as CssRule) || {}
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
  const elementId = (getElementId(element) as ElementId)
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
  return null
}

/**
 * get/set type of the element
 * @param element   created by silex, either a text box, image, ...
 * @return           the type of element
 * example: for a container this will return "container"
 */
function getTypeBC(element: HTMLElement): ElementType {
  switch (element.getAttribute(Constants.TYPE_ATTR)) {
    case ElementType.CONTAINER.toString(): return element.classList.contains('section-element') ? ElementType.SECTION : ElementType.CONTAINER
    case ElementType.SECTION.toString(): return ElementType.SECTION
    case ElementType.IMAGE.toString(): return ElementType.IMAGE
    case ElementType.TEXT.toString(): return ElementType.TEXT
    case ElementType.HTML.toString(): return ElementType.HTML
  }
  console.error('unknown type', element)
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
    id: pageName,
    displayName: element.innerHTML,
    link: {
      linkType: LinkType.PAGE,
      href: '#!' + pageName,
    },
    // opened: getCurrentPageName() === pageName,
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

export function getSiteFromDom(doc: HTMLDocument): SiteState {
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
    headUser: DomTools.extractUserHeadTag(doc.head.innerHTML).userHead,
    headStyle: getHeadStyle(doc),
    headScript: getHeadScript(doc),
    hostingProvider: getMeta(doc, 'hostingProvider'),
    twitterSocial: getMeta(doc, 'twitter:site'),
    dataSources: properties.dataSources,
    fonts: properties.fonts,
    styles: properties.prodotypeDataObj.style,
    isTemplate: false, // backward compat is only about loaded websites, not templates
    file: null,
    prodotypeDependencies: getDependenciesFromDom(properties),
    data: {},
  }
}

function getDependenciesFromDom(properties: DomData): ProdotypeDependency {
  const res: ProdotypeDependency = {}

  Object.keys(properties.prodotypeDataObj.component)
  .map((compName) => ({
    compName,
    templateName: properties.prodotypeDataObj.component[compName].templateName,
  }))
  .map(({compName, templateName}) => ({
    compName,
    dependencies: componentDef[templateName] ? componentDef[templateName].dependencies : [], // if the component is not found, then defaults to no dependencies
  }))
  .filter(({dependencies}) => !!dependencies)
  .forEach(({compName, dependencies}) => {
    res[compName] = [dependencies]
  })

  return res
}
function getMeta(doc, name: string): string {
  const metaNode = doc.querySelector(
      'meta[name="' + name + '"]')
  if (metaNode) {
    return metaNode.getAttribute('content')
  } else {
    return null
  }
}

export function getPublicationPath(doc: HTMLDocument): FileInfo {
  const fileInfo = getMeta(doc, 'publicationPath')
  try {
    return fileInfo == null ? null : (JSON.parse(fileInfo) as FileInfo)
  } catch (e) {
    // this happens with old publication path (just a string)
    return null
  }
}

function getFaviconPath(doc: HTMLDocument): string {
  const faviconTag = doc.querySelector('link[rel="shortcut icon"]')
  if (faviconTag) {
    return faviconTag.getAttribute('href')
  }
  return null
}
function getWebsiteWidth(doc: HTMLDocument): number {
  const width = getMeta(doc, 'website-width')
  return !!width ? parseInt(width) : null
}
const BEAUTIFY_CSS_OPTIONS = {
  indent_size: 2,
}
function getHeadStyle(doc: HTMLDocument): string {
  // get silex styles from the DOM
  const silexStyle = doc.head.querySelector('.' + Constants.SILEX_STYLE_ELEMENT_CSS_CLASS)
  if (!silexStyle) {
    console.warn('no silex editable styles defined')
    return ''
  }
  // tslint:disable:no-string-literal
  return jsBeautify.css_beautify(silexStyle.innerHTML, BEAUTIFY_CSS_OPTIONS)
}
function getHeadScript(doc: HTMLDocument): string {
  // get silex scripts from the DOM
  const scriptTag = doc.querySelector('.' + Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS)
  if (!scriptTag) {
    return ''
  }
  return scriptTag.innerHTML
}
