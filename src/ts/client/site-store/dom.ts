/**
 * @fileoverview Site dom manipulation. Cross platform, it needs to run client and server side
 *
 */

import { Constants } from '../../constants'
import { Font } from './types'

/**
 * set/get silex editable js script
 * @param jsString   the string defining Silex script
 */
export function setHeadScript(doc: HTMLDocument, jsString: string) {
  let scriptTag = doc.head.querySelector('.' + Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS) as HTMLScriptElement
  if (!scriptTag) {
    scriptTag = doc.createElement('script')
    scriptTag.type = 'text/javascript'
    scriptTag.className = Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS
    doc.head.appendChild(scriptTag)
  }
  scriptTag.innerHTML = jsString
}

/**
 * set/get silex editable css styles
 * @param cssString   the css string defining all Silex styles
 */
export function setHeadStyle(doc: HTMLDocument, cssString: string) {
  let silexStyle = doc.head.querySelector('.' + Constants.SILEX_STYLE_ELEMENT_CSS_CLASS) as HTMLStyleElement
  if (!silexStyle) {
    silexStyle = doc.createElement('style')
    silexStyle.className = Constants.SILEX_STYLE_ELEMENT_CSS_CLASS
    doc.head.appendChild(silexStyle)
  }
  silexStyle.innerHTML = cssString
}

/**
 * get/set a meta data
 */
export function setMeta(doc: HTMLDocument, name: string, opt_value: string, opt_propertyOrName: string='property') {
  // update the DOM element
  let metaNode = doc.querySelector(`meta[${opt_propertyOrName}="${name}"], meta[name="${name}"]`) as HTMLMetaElement // additional `meta[name="${name}]"` is for backward compat
  if (!metaNode && opt_value && opt_value !== '') {
    // create the DOM element
    metaNode = doc.createElement('meta')
    metaNode.setAttribute(opt_propertyOrName, name)
    metaNode.content = opt_value
    doc.head.appendChild(metaNode)
  } else {
    if (opt_value && opt_value !== '') {
      // update opt_value
      metaNode.setAttribute('content', opt_value)
      metaNode.removeAttribute('name') // for backward compat
      metaNode.setAttribute(opt_propertyOrName, name) // for backward compat
    } else {
      // remove the opt_value
      if (metaNode) { metaNode.parentElement.removeChild(metaNode) }
    }
  }
}

/**
 * enable/disable the mobile version
 */
export function setEnableMobile(doc: HTMLDocument, enable: boolean) {
  if (doc.body === null) {
    // body is null, this happens while undoing or redoing
    return
  }
  let viewport = doc.querySelector('meta[name=viewport]') as HTMLMetaElement
  if (enable === true) {
    doc.body.classList.add(Constants.ENABLE_MOBILE_CSS_CLASS)
    if (!viewport) {
      viewport = doc.createElement('meta') as HTMLMetaElement
      viewport.name = 'viewport'
      viewport.content = 'width=device-width, initial-scale=1'
      doc.head.appendChild(viewport)
    }
  } else {
    doc.body.classList.remove(Constants.ENABLE_MOBILE_CSS_CLASS)
    if (viewport) {
      doc.head.removeChild(viewport)
    }
  }
}

/**
 * get/set the website width
 */
export function setWebsiteWidthInDom(doc: HTMLDocument, width: number) {
  let silexStyle = doc.head.querySelector('.silex-style-settings') as HTMLStyleElement
  if (!silexStyle) {
    silexStyle = doc.createElement('style')
    silexStyle.className = 'silex-style-settings'
    doc.head.appendChild(silexStyle)
  }
  silexStyle.innerHTML = `
  .${Constants.WEBSITE_WIDTH_CLASS_NAME} {
    width: ${width}px;
  }
  @media (min-width: ${Constants.MOBILE_BREAKPOINT+1}px) {
    .silex-editor {
      min-width: ${width + 200}px;
    }
  }
`
}

/**
 * get/set the description
 */
export function setDescription(doc: HTMLDocument, opt_description?: string) {
  setMeta(doc, 'description', opt_description)
}

/**
 * website title
 */
export function setTitle(doc: HTMLDocument, name: string) {
  // find or create the title tag in the head section
  let titleNode = doc.head.querySelector('title') as HTMLTitleElement
  if (!titleNode) {
    titleNode = doc.createElement('title')
    doc.head.appendChild(titleNode)
  }

  // update website title
  titleNode.innerHTML = name || ''
}

/**
 * website default website language
 */
export function setLang(doc: HTMLDocument, name: string) {
  doc.querySelector('html').lang =
      name || ''
}

/**
 * website favicon
 */
export function setFaviconPath(doc: HTMLDocument, opt_path?: string) {
  let faviconTag =
      doc.head.querySelector('link[rel="shortcut icon"]')
  if (!faviconTag) {
    if (opt_path) {
    faviconTag = doc.createElement('link')
    faviconTag.setAttribute('href', opt_path)
    faviconTag.setAttribute('rel', 'shortcut icon')
    doc.head.appendChild(faviconTag)
    }
  } else {
    if (!opt_path) {
      faviconTag.parentElement.removeChild(faviconTag)
    }
  }
  if (opt_path) {
    // update website title
    faviconTag.setAttribute('href', opt_path)
  }
}

/**
 * get/set the title for social networks
 */
export function setTitleSocial(doc: HTMLDocument, opt_data?: string) {
  setMeta(doc, 'twitter:card', opt_data ? 'summary_large_image' : '', 'name')
  setMeta(doc, 'og:type', opt_data ? 'website' : '')
  setMeta(doc, 'twitter:title', opt_data)
  setMeta(doc, 'og:title', opt_data)
}

/**
 * get/set the description for social networks
 */
export function setDescriptionSocial(doc: HTMLDocument, opt_data?: string) {
  setMeta(doc, 'twitter:card', opt_data ? 'summary' : '')
  setMeta(doc, 'twitter:description', opt_data)
  setMeta(doc, 'og:description', opt_data)
}

/**
 * get/set the thumbnail image for social networks
 */
export function setThumbnailSocialPath(doc: HTMLDocument, opt_path?: string) {
  setMeta(doc, 'twitter:card', opt_path ? 'summary' : '')
  setMeta(doc, 'twitter:image', opt_path)
  setMeta(doc, 'og:image', opt_path)
}

/**
 * get/set the twitter account
 */
export function setTwitterSocial(doc: HTMLDocument, opt_data?: string) {
  setMeta(doc, 'twitter:card', opt_data ? 'summary' : '')
  setMeta(doc, 'twitter:site', opt_data)
}

export function setFonts(doc: HTMLDocument, fonts: Font[]) {
  // remove all fonts
  Array.from(doc.head.querySelectorAll(`link.${Constants.CUSTOM_FONTS_CSS_CLASS}`))
    .forEach((tag) => {
      tag.remove()
    })

  // add new fonts
  fonts
    .forEach((font) => {
      const link = doc.createElement('link')
      link.href = font.href
      link.rel = 'stylesheet'
      link.className = Constants.CUSTOM_FONTS_CSS_CLASS
      doc.head.appendChild(link)
    })
}
