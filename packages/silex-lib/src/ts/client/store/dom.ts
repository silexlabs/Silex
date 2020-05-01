import { PersistantData } from './types'
import { Constants } from '../../constants'

/**
 * @fileoverview Cross platform, it needs to run client and server side
 */

/**
 * write elements and pages data to the dom for the components and scripts to use
 */
export function writeDataToDom(doc: HTMLDocument, data: PersistantData) {
  let tag: HTMLScriptElement = doc.querySelector('.' + Constants.JSON_STYLE_TAG_CLASS_NAME)
  if (!tag) {
    tag = doc.createElement('script')
    tag.type = 'application/json'
    tag.classList.add(Constants.JSON_STYLE_TAG_CLASS_NAME)
    doc.head.appendChild(tag)
  }
  tag.innerHTML = JSON.stringify({
    site: data.site,
    pages: data.pages,
    // elements: data.elements, // not this one as it is huge and useless at runtime
  })
}
