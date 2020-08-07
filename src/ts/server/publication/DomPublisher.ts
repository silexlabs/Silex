/**
 * @fileoverview Helper class used to cleanup the DOM when publishing a website
 *
 */

import { URL } from 'url'
import * as Path from 'path'

import { DOMWindow } from 'jsdom'

import { Constants } from '../../constants'
import { PageData } from '../../client/page-store/types'
import { PersistantData } from '../../client/store/types'
import DomTools from '../utils/DomTools'

export interface File {
  original: string
  srcPath: string
  destPath: string
  tagName: string
  displayName: string
}

export interface Action {
  name: string
  path: string
  displayName: string
  content: string|Buffer
}

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
  Array.from(doc.querySelectorAll(`[${Constants.TYPE_ATTR}], [${Constants.ELEMENT_ID_ATTR_NAME}], [${Constants.STATIC_ASSET_ATTR}]`))
  .forEach((tagToClean: HTMLElement) => {
    tagToClean.removeAttribute(Constants.ELEMENT_ID_ATTR_NAME)
    tagToClean.removeAttribute(Constants.STATIC_ASSET_ATTR)
    tagToClean.removeAttribute('data-dependency')
  })
}

/**
 * build an array of assets to be included in the publication, with their destination paths
 * baseUrl: url of the folder containing the website HTML file, e.g `http://localhost:6805/ce/fs/get/tmp/`
 * rootUrl: url of the folder where we will publish, e.g `http://localhost:6805/ce/fs/get/tmp/pub/`
 * rootPath: absolute path of the publication folder, e.g  `tmp/pub`
 * getDestFolder: hook to specify a destination folder for each file
 * win: the mutable DOM
 */
export function extractAssets({
  baseUrl,
  rootUrl,
  rootPath,
  win,
  getDestFolder,
}: {
  baseUrl: string,
  rootUrl: string,
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
        if (!!rootUrl) {
          return rootUrl + destPath
        } else if (tagName) {
          // not an URL from a style sheet
          return destPath
        } else if (isInHead) {
          // URL from a style sheet
          // called from '/css'
          return '../' + destPath
        }
        // URL from a style sheet
        // called from './' because it is in the body and not moved to an external CSS
        return destPath
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
  rootUrl,
  win,
  userHead,
}: {
  rootUrl?: string,
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
  .forEach((tag) => {
    if (!tag.src && tag.innerHTML) {
      tag.parentElement.removeChild(tag)
      scriptTags.push(tag)
    }
  })

  // link the user's script
  if (scriptTags.length > 0) {
    const scriptTagSrc = doc.createElement('script')
    scriptTagSrc.src = `${ rootUrl || '' }js/script.js`
    scriptTagSrc.type = 'text/javascript'
    doc.head.appendChild(scriptTagSrc)
  }

  // add head css
  const styleTags = []
  Array.from(doc.head.querySelectorAll('style'))
  .forEach((tag) => {
    tag.parentElement.removeChild(tag)
    styleTags.push(tag)
  })

  // link the user's stylesheet
  if (styleTags.length > 0) {
    const cssTagSrc = doc.createElement('link')
    cssTagSrc.href = `${ rootUrl || '' }css/styles.css`
    cssTagSrc.rel = 'stylesheet'
    cssTagSrc.type = 'text/css'
    doc.head.appendChild(cssTagSrc)
  }

  // put back the user head now that all other scrips and styles are moved to external files
  doc.head.innerHTML += userHead
  // doc.head.appendChild(doc.createTextNode(userHead));

  // replace internal links <div data-silex-href="..." by <a href="..."
  // do a first pass, in order to avoid replacing the elements in the <a> containers
  Array.from(doc.body.querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}[${Constants.LINK_ATTR}]`))
  .forEach((element: HTMLElement) => {
    const href = element.getAttribute(Constants.LINK_ATTR)
    element.removeAttribute(Constants.LINK_ATTR)

    const replacement = doc.createElement('a')
    replacement.setAttribute('href', href)
    replacement.innerHTML = element.innerHTML
    for (let attrIdx = 0; attrIdx < element.attributes.length; attrIdx++) {
      const nodeName = element.attributes.item(attrIdx).nodeName
      const nodeValue = element.attributes.item(attrIdx).nodeValue
      replacement.setAttribute(nodeName, nodeValue)
    }
    // insert the clone at the place of the original and remove the original
    // FIXME: bug when there is a link in the content of an element with an external link set
    // see issue https://github.com/silexlabs/Silex/issues/56
    element.parentElement.replaceChild(replacement, element)
  })

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
    && rootUrl.startsWith(url.origin)
}

/**
 * split the editable HTML into pages
 * @returns unifile actions to write files
 */
export function splitPages({
  newFirstPageName,
  permalinkHook,
  win,
  data,
  rootPath,
  getDestFolder,
}: {
  newFirstPageName: string,
  permalinkHook: (pageName: string) => string,
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
      displayName: page.displayName,
      fileName: permalinkHook(page.id === initialFirstPageName ? newFirstPageName || 'index.html' : page.id + '.html'),
    }
  })
  // TODO: use page.link.linkType and page.link.href instead of adding 'page-' to page id
  .map(({displayName, name, fileName}) => {
    // clone the document
    const clone = doc.cloneNode(true) as HTMLDocument;
    // update title
    (clone.head.querySelector('title') || ({} as HTMLTitleElement)).innerHTML += ' - ' + displayName
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
      const [pageName, anchor] = el.hash.substr(Constants.PAGE_NAME_PREFIX.length).split('#')
      el.href = permalinkHook(pageName === initialFirstPageName && newFirstPageName ? newFirstPageName : pageName + '.html') + (anchor ? '#' + anchor : '')
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

// /**
//  * remove the javascript and css files which firefox inlines
//  * the inlined tags are script type="text/javascript" style="display:none"
//  * @param {Document} doc
//  */
// cleanupFirefoxInlines() {
//   // remove inlined scripts and styles
//   ['script', 'style'].forEach((tagName) => {
//     Array.from(doc.querySelectorAll(`${tagName}[style="display:none"]`))
//     .forEach((element) => {
//       element.parentElement.removeChild(element)
//     })
//   })
// }


