/**
 * @fileoverview Helper class used to cleanup the DOM when publishing a website
 *
 */

import { DOMWindow } from 'jsdom'

import { URL } from 'url'
import * as Path from 'path'

import { Action, File } from '../types'
import { Constants } from '../../constants'
import { PageData } from '../../client/page-store/types'
import { PersistantData } from '../../client/store/types'
import DomTools from '../utils/DomTools'

/**
 * cleanup the provided dom from markup useless outside the editor
 * remove Silex specific data from HTML
 * create an external CSS file
 * generates a list of js scripts and assets to be eported with the file
 */
export function cleanup(win: DOMWindow): void {
  const doc = win.document

  // cleanupFirefoxInlines();

  // remove publication path
  // remove JSON styles
  // remove prodotype previews
  Array.from(doc.querySelectorAll(Constants.ELEMENTS_TO_REMOVE_AT_PUBLISH.join(', ')))
  .forEach((tagToRemove: HTMLElement) => {
    tagToRemove.parentElement.removeChild(tagToRemove)
  })
  // remove data-silex-id
  // remove data-silex-static (will then be downloaded like any other script, not striped by DomTools.transformPath)
  // remove data-dependency
  // do NOT remove data-silex-type because it is used by front-end.js at runtime
  // remove linktype
  ;[
    Constants.TYPE_ATTR,
    Constants.ELEMENT_ID_ATTR_NAME,
    Constants.STATIC_ASSET_ATTR,
    Constants.PRODOTYPE_DEPENDENCY_ATTR,
    Constants.PREVENT_RESIZABLE_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME,
    Constants.PREVENT_SELECTABLE_CLASS_NAME,
    Constants.PREVENT_DRAGGABLE_CLASS_NAME,
    Constants.PREVENT_DROPPABLE_CLASS_NAME,
    'linktype',
  ]
  .forEach((attr: string) => {
    Array.from(doc.querySelectorAll(`[${attr}]`))
    .forEach((el: HTMLElement) => {
      el.removeAttribute(attr)
    })
  })
  // remote type attribute of JS script tags
  // remove w3c warning "The type attribute is unnecessary for JavaScript resources"
  // FIXME: we should just remove type from all the components and silex script tags, but for now it is useful to keep it during edition as some selectors rely on it for now
  Array.from(doc.querySelectorAll('script[type="text/javascript"]'))
  .forEach((el: HTMLElement) => {
    el.removeAttribute('type')
  })
  // remove empty style attributes
  Array.from(doc.querySelectorAll('[style=""]'))
  .forEach((el: HTMLElement) => {
    el.removeAttribute('style')
  })
}

/**
 * build an array of assets to be included in the publication, with their destination paths
 * baseUrl: url of the folder containing the website HTML file, e.g `http://localhost:6805/ce/fs/get/tmp/`
 * rootUrl: url of the folder where we will publish, e.g `http://localhost:6805/ce/fs/get/tmp/pub/`
 * hookedRootUrl: url returned by getRootUrl from the hosting provider
 * rootPath: absolute path of the publication folder, e.g  `tmp/pub`
 * getDestFolder: destination folder for each file, possibly modified by the hosting probider hooks
 * win: the mutable DOM
 */
export function extractAssets({
  baseUrl,
  rootUrl,
  hookedRootUrl,
  rootPath,
  win,
  getDestFolder,
}: {
  baseUrl: string,
  rootUrl: string,
  hookedRootUrl: string,
  win: DOMWindow,
  rootPath: string,
  getDestFolder: (ext: string, tagName: string) => string,
}): File[] {
  const files: File[] = []
  DomTools.transformPaths(win, null, (path, el, isInHead) => {
    // el may be null if the path comes from the JSON object holding Silex data
    // This is never supposed to happen because the tag holding the JSON object
    // is removed from the head tag in DomPublisher::cleanup.
    // But sometimes it appears that the tags are in the body
    // Maybe we should change cleanup to look for the tagsToRemove also in the body?
    const tagName = el ? el.tagName : null

    const url = new URL(path, baseUrl)

    if (isDownloadable(url, rootUrl)) {
      const fileName = Path.basename(url.pathname)
      const destFolder = getDestFolder(Path.extname(url.pathname), tagName)
      if (destFolder) {
        const destPath = `${destFolder}/${fileName}`
        files.push({
          original: path,
          srcPath: url.href,
          destPath: rootPath + '/' + destPath,
          tagName,
          displayName: fileName,
        })
        if (!!hookedRootUrl) {
          return hookedRootUrl + destPath
        } else if (tagName) {
          // not an URL from a style sheet
          return destPath
        } else  {
          // URL from a style sheet
          // called from '/css'
          return '../' + destPath
        }
      }
    }
    return null
  })
  return files
}

/**
 * extract the js and css from the single editable HTML file
 * insert the user head tag in the DOM
 * converts custom links of editable version to standard <a> tags
 */
export function splitInFiles({
  hookedRootUrl,
  win,
  userHead,
}: {
  rootUrl?: string,
  hookedRootUrl: string,
  win: DOMWindow
  userHead: string,
}): {
  scriptTags: HTMLElement[],
  styleTags: HTMLElement[],
} {
  const doc = win.document

  // final js script to store in js/script.js
  const scriptTags = []
  Array.from(doc.head.querySelectorAll('script'))
  .forEach((tag: HTMLScriptElement) => {
    if (!tag.src && tag.innerHTML) {
      tag.parentElement.removeChild(tag)
      scriptTags.push(tag)
    }
  })

  // link the user's script
  if (scriptTags.length > 0) {
    const scriptTagSrc = doc.createElement('script')
    scriptTagSrc.src = `${ hookedRootUrl || '' }js/script.js`
    doc.head.appendChild(scriptTagSrc)
  }

  // add head css
  // and components css
  const styleTags = []
  Array.from(doc.querySelectorAll('style'))
  .forEach((tag: HTMLElement) => {
    tag.parentElement.removeChild(tag)
    styleTags.push(tag)
  })

  // link the user's stylesheet
  if (styleTags.length > 0) {
    const cssTagSrc = doc.createElement('link')
    cssTagSrc.href = `${ hookedRootUrl || '' }css/styles.css`
    cssTagSrc.rel = 'stylesheet'
    doc.head.appendChild(cssTagSrc)
  }

  // put back the user head now that all other scrips and styles are moved to external files
  doc.head.innerHTML += userHead
  // doc.head.appendChild(doc.createTextNode(userHead));

  return {
    scriptTags,
    styleTags,
  }
}

/**
 * det if a given URL is supposed to be downloaded locally
 * @returns true if the url is relative or it is a known domain (sttic.silex.me)
 */
function isDownloadable(url: URL, rootUrl: string): boolean {
  // do not download files with GET params since it is probably dynamic
  return url.search === ''
    // do not download data:* images
    && url.protocol !== 'data:'
    && (!rootUrl || rootUrl.startsWith(url.origin))
}

/**
 * get a page name, with a hook and default value (index.html for the first page)
 */
function getPageName(permalinkHook: (name: string) => string, pageName: string, initialFirstPageName: string, newFirstPageName: string) {
  return permalinkHook(pageName === initialFirstPageName && newFirstPageName ? newFirstPageName : pageName + '.html')
}

/**
 * convert a list of html elements to unifile write operations
 */
export function domToFileOperations(tags: HTMLElement[], path: string, displayName: string): Action {
  return {
    name: 'writefile',
    displayName,
    path,
    content: tags.reduce((prev, tag) => prev + '\n' + tag.innerHTML, ''),
  }
}

/**
 * split the editable HTML into pages
 * @returns unifile actions to write files
 */
export function splitPages({
  newFirstPageName,
  permalinkHook,
  pageTitleHook,
  pageLinkHook,
  win,
  data,
  rootPath,
  getDestFolder,
}: {
  newFirstPageName: string,
  permalinkHook: (pageName: string) => string,
  pageTitleHook: (page: PageData) => string,
  pageLinkHook: (href: string) => string,
  win: DOMWindow,
  data: PersistantData,
  rootPath: string,
  getDestFolder: (ext: string, tagName: string) => string,
}): Action[] {

  const doc: HTMLDocument = win.document

  doc.body.classList.add(Constants.WEBSITE_CONTEXT_PUBLISHED_CLASS_NAME);

  // remove unused scripts when there is no deeplink navigation anymore
  ['js/jquery-ui.js', 'js/pageable.js']
  .map((path) => doc.querySelector(`script[src="${ path }"]`))
  .filter((el) => !!el) // when not updated yet to the latest version, the URLs are not relative
  .forEach((el) => el.parentElement.removeChild(el))

  // split in multiple pages
  if (data.pages.length === 0) { throw new Error('The website has 0 pages.') }
  const initialFirstPageName = data.pages[0].id
  return data.pages
  .map((page: PageData) => {
    return  {
      name: page.id,
      fileName: getPageName(permalinkHook, page.id, initialFirstPageName, newFirstPageName),
      page,
    }
  })
  .map(({name, fileName, page}) => {
    // clone the document
    const clone = doc.cloneNode(true) as HTMLDocument
    // update title
    const titleTag: HTMLTitleElement = clone.head.querySelector('title')
    if (titleTag) {
      titleTag.innerHTML = pageTitleHook(page)
    }
    // add page name on the body (used in front-end.js)
    clone.body.setAttribute('data-current-page', name)
    // remove elements from other pages
    Array.from(clone.querySelectorAll(`.${Constants.PAGED_CLASS_NAME}`))
    .forEach((el) => {
      if (el.classList.contains(name)) {
        el.classList.add(Constants.PAGED_VISIBLE_CLASS_NAME)
      } else {
        el.parentElement.removeChild(el)
      }
    })
    // update links
    Array.from(clone.querySelectorAll('a'))
    .filter((el) => el.hash.startsWith(Constants.PAGE_NAME_PREFIX + Constants.PAGE_ID_PREFIX))
    .forEach((el) => {
      // split page name and anchor, e.g. #!page-page-1#anchor1
      const [pageName, anchor] = el.hash.substr(Constants.PAGE_NAME_PREFIX.length).split('#')
      // get the name of the page, with hook and default name (index.html for the first page)
      const newName = getPageName(permalinkHook, pageName, initialFirstPageName, newFirstPageName)
      el.href = pageLinkHook(newName) + (anchor ? '#' + anchor : '')
      // mark link as active if it links to the current page
      if (pageName ===  name) {
        el.classList.add(Constants.PAGE_LINK_ACTIVE_CLASS_NAME)
      } else {
        el.classList.remove(Constants.PAGE_LINK_ACTIVE_CLASS_NAME) // may be added when you save the file
      }
    })

    // remove useless css classes
    // do not do this before as these classes are needed until the last moment, e.g. to select paged elements
    Constants.SILEX_CLASS_NAMES_TO_REMOVE_AT_PUBLISH.forEach((className) => {
      Array.from(clone.getElementsByClassName(className))
      .forEach((el: HTMLElement) => el.classList.remove(className))
    })

    // create a unifile batch action
    return {
      name: 'writefile',
      path: rootPath + '/' + getDestFolder('.html', null) + '/' + fileName,
      displayName: fileName, // FIXME: this is not part of a unifile action
      content: '<!doctype html>' + clone.documentElement.outerHTML,
    }
  })
}

