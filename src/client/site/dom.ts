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
import { DataModel } from '../flux/types';
import { Font } from './types';

/**
 * @fileoverview Site dom manipulation. Cross platform, it needs to run client and server side
 *
 */

export function writeDataToDom(doc: HTMLDocument, data: DataModel) {
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

// export function readDataFromDom(doc: HTMLDocument): DataModel {
//   const tag: HTMLScriptElement = doc.querySelector('.' + Constants.JSON_STYLE_TAG_CLASS_NAME)
//   return JSON.parse(tag.innerHTML)
// }

/**
 * set/get silex editable js script
 * @param jsString   the string defining Silex script
 */
export function setHeadScript(doc: HTMLDocument, jsString: string) {
  let scriptTag = doc.head.querySelector('.' + Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS) as HTMLScriptElement;
  if (!scriptTag) {
    scriptTag = doc.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.className = Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS;
    doc.head.appendChild(scriptTag);
  }
  scriptTag.innerHTML = jsString;
}

/**
 * set/get silex editable css styles
 * @param cssString   the css string defining all Silex styles
 */
export function setHeadStyle(doc: HTMLDocument, cssString: string) {
  let silexStyle = doc.head.querySelector('.' + Constants.SILEX_STYLE_ELEMENT_CSS_CLASS) as HTMLStyleElement;
  if (!silexStyle) {
    silexStyle = doc.createElement('style');
    silexStyle.type = 'text/css';
    silexStyle.className = Constants.SILEX_STYLE_ELEMENT_CSS_CLASS;
    doc.head.appendChild(silexStyle);
  }
  silexStyle.innerHTML = cssString;
}

/**
 * get/set a meta data
 */
export function setMeta(doc: HTMLDocument, name: string, opt_value?: string) {
  // update the DOM element
  let metaNode = doc.querySelector('meta[name="' + name + '"]') as HTMLMetaElement;
  if (!metaNode && opt_value && opt_value !== '') {
    // create the DOM element
    metaNode = doc.createElement('meta');
    metaNode.name = name;
    metaNode.content = opt_value;
    doc.head.appendChild(metaNode);
  } else {
    if (opt_value && opt_value !== '') {
      // update opt_value
      metaNode.setAttribute('content', opt_value);
    } else {
      // remove the opt_value
      if (metaNode) { metaNode.parentElement.removeChild(metaNode); }
    }
  }
}

/**
 * enable/disable the mobile version
 */
export function setEnableMobile(doc: HTMLDocument, enable: boolean) {
  if (doc.body === null) {
    // body is null, this happens while undoing or redoing
    return;
  }
  let viewport = doc.querySelector('meta[name=viewport]') as HTMLMetaElement;
  if (enable === true) {
    doc.body.classList.add(Constants.ENABLE_MOBILE_CSS_CLASS);
    if (!viewport) {
      viewport = doc.createElement('meta') as HTMLMetaElement;
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1';
      doc.head.appendChild(viewport);
    }
  } else {
    doc.body.classList.remove(Constants.ENABLE_MOBILE_CSS_CLASS);
    if (viewport) {
      doc.head.removeChild(viewport);
    }
  }
}

/**
 * get/set the website width
 */
export function setWebsiteWidth(doc: HTMLDocument, width: number) {
  let silexStyle = doc.head.querySelector('.silex-style-settings') as HTMLStyleElement;
  if (!silexStyle) {
    silexStyle = doc.createElement('style');
    silexStyle.type = 'text/css';
    silexStyle.className = 'silex-style-settings';
    doc.head.appendChild(silexStyle);
  }
  silexStyle.innerHTML = `
  .${Constants.WEBSITE_WIDTH_CLASS_NAME} {
    width: ${width}px;
  }
  @media (min-width:481px) {
    .silex-editor {
      min-width: ${width + 200}px;
    }
  }
`;
}

/**
 * get/set the description
 */
export function setDescription(doc: HTMLDocument, opt_description?: string) {
  setMeta(doc, 'description', opt_description);
}

/**
 * website title
 */
export function setTitle(doc: HTMLDocument, name: string) {
  // find or create the title tag in the head section
  let titleNode = doc.head.querySelector('title') as HTMLTitleElement;
  if (!titleNode) {
    titleNode = doc.createElement('title');
    doc.head.appendChild(titleNode);
  }

  // update website title
  titleNode.innerHTML = name || '';
}

/**
 * website default website language
 */
export function setLang(doc: HTMLDocument, name: string) {
  doc.querySelector('html').lang =
      name || '';
}

/**
 * website favicon
 */
export function setFaviconPath(doc: HTMLDocument, opt_path?: string) {
  let faviconTag =
      doc.head.querySelector('link[rel="shortcut icon"]');
  if (!faviconTag) {
    if (opt_path) {
    faviconTag = doc.createElement('link');
    faviconTag.setAttribute('href', opt_path);
    faviconTag.setAttribute('rel', 'shortcut icon');
    doc.head.appendChild(faviconTag);
    }
  } else {
    if (!opt_path) {
      faviconTag.parentElement.removeChild(faviconTag);
    }
  }
  if (opt_path) {
    // update website title
    faviconTag.setAttribute('href', opt_path);
  }
}

/**
 * get/set the title for social networks
 */
export function setTitleSocial(doc: HTMLDocument, opt_data?: string) {
  setMeta(doc, 'twitter:card', opt_data ? 'summary' : '');
  setMeta(doc, 'twitter:title', opt_data);
  setMeta(doc, 'og:title', opt_data);
}

/**
 * get/set the description for social networks
 */
export function setDescriptionSocial(doc: HTMLDocument, opt_data?: string) {
  setMeta(doc, 'twitter:card', opt_data ? 'summary' : '');
  setMeta(doc, 'twitter:description', opt_data);
  setMeta(doc, 'og:description', opt_data);
}

/**
 * get/set the thumbnail image for social networks
 */
export function setThumbnailSocialPath(doc: HTMLDocument, opt_path?: string) {
  setMeta(doc, 'twitter:card', opt_path ? 'summary' : '');
  setMeta(doc, 'twitter:image', opt_path);
  setMeta(doc, 'og:image', opt_path);
}

/**
 * get/set the twitter account
 */
export function setTwitterSocial(doc: HTMLDocument, opt_data?: string) {
  setMeta(doc, 'twitter:card', opt_data ? 'summary' : '');
  setMeta(doc, 'twitter:site', opt_data);
}

export function setFonts(doc: HTMLDocument, fonts: Font[]) {
  /**
   * @return true if the fonts are the same
   */
  function compareFonts(f1: Font, f2: Font): boolean {
    return f1.family === f2.family && f1.href === f2.href;
  }

  // remove fonts which are not in fonts anymore
  const head = doc.head;
  Array.from(head.querySelectorAll(`a.${Constants.CUSTOM_FONTS_CSS_CLASS}`))
    .filter((tag: HTMLAnchorElement) => !fonts.find((font: Font) => font.href === tag.href))
    .forEach((tag) => {
      tag.remove();
    });

  // add new fonts
  fonts
    .filter((font) => !head.querySelector(`link[href="${font.href}"]`))
    .forEach((font) => {
      const link = doc.createElement('link');
      link.href = font.href;
      link.rel = 'stylesheet';
      link.className = Constants.CUSTOM_FONTS_CSS_CLASS;
      head.appendChild(link);
    });
}
