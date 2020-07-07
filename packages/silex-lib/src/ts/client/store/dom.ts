/**
 * @fileoverview Cross platform, it needs to run client and server side
 */

import { PersistantData } from './types'
import { Constants } from '../../constants'

/**
 * write elements and pages data to the dom for the components and scripts to use
 */
export function writeDataToDom(doc: HTMLDocument, data: PersistantData) {
  let tag: HTMLScriptElement = doc.querySelector('.' + Constants.JSON_STYLE_TAG_CLASS_NAME)
  if (!tag) {
    tag = doc.createElement('script')
    tag.classList.add(Constants.JSON_STYLE_TAG_CLASS_NAME)
  }
  // prevent from beeing deactivated in WebsiteRouter
  tag.setAttribute(Constants.STATIC_ASSET_ATTR, '')
  // set its content
  tag.innerHTML = `
    window.silex = window.silex || {}
    window.silex.data = ` + JSON.stringify({
    site: { // this is huge and contains html tags - e.g. userHead
      width: data.site.width,
    },
    pages: data.pages,
    // elements: data.elements, // not this one as it is huge and useless at runtime
  })
  // always insert as first child before all scripts
  tag.type = 'text/javascript'
  doc.head.insertBefore(tag, doc.head.firstChild)
}
