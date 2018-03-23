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

const { URL } = require('url');
const Path = require('path');
const DomTools = require('./DomTools.js');
const constants = require('./Constants.json');

/**
 * @fileoverview Helper class used to cleanup the DOM when publishing a website
 *
 */


module.exports = class DomPublisher {

  constructor(dom) {
    this.dom = dom;
    this.doc = dom.window.document;
  }

  /**
   * remove the javascript and css files which firefox inlines
   * the inlined tags are script type="text/javascript" style="display:none"
   * @param {Document} doc
   */
  cleanupFirefoxInlines() {
    // remove inlined scripts and styles
    ['script', 'style'].forEach(tagName => {
      const elements = this.doc.querySelectorAll(`${tagName}[style="display:none"]`);
      for (let idx=0; idx<elements.length; idx++) {
        const element = elements[idx];
        element.parentNode.removeChild(element);
      }
    });
    silex.utils.Dom.addMandatoryTags(this.doc);
  };


  /**
   * cleanup html page
   * remove Silex specific data from HTML
   * create an external CSS file
   * generates a list of js scripts and assets to be eported with the file
   * @return {{htmlString: string, cssString: string, jsString: string, files: Array.<Object>}} an object with
   *      html: the cleaned up raw HTML {string} or null if an error occured
   *      css: list of css files
   *      js: a script included in the html
   *      files: list of assets files
   */
  cleanup() {
    // this.cleanupFirefoxInlines();

    // remove publication path
    // remove JSON styles
    const tagsToRemove = this.doc.head.querySelectorAll(`meta[name="publicationPath"], .${constants.JSON_STYLE_TAG_CLASS_NAME}`);
    for(let idx=0; idx<tagsToRemove.length; idx++) {
      tagsToRemove[idx].parentNode.removeChild(tagsToRemove[idx]);
    }
    // remove data-silex-type
    // remove data-silex-id
    // remove data-silex-static (will then be downloaded like any other script, not striped by DomTools.transformPath)
    // remove data-dependency
    const tagsToClean = this.doc.querySelectorAll(`[data-silex-type], [data-silex-id], [data-silex-static]`);
    for(let idx=0; idx<tagsToClean.length; idx++) {
      tagsToClean[idx].removeAttribute('data-silex-type');
      tagsToClean[idx].removeAttribute('data-silex-id');
      tagsToClean[idx].removeAttribute('data-silex-static');
      tagsToClean[idx].removeAttribute('data-dependency');
    }
  }

  getDestFolder(ext, tagName) {
    // tags
    if(tagName) {
      switch(tagName.toLowerCase()) {
        case 'script':
          return 'js';
        case 'link':
          return 'css';
        case 'img':
        case 'source':
        case 'video':
          return 'assets';
      }
      // could be an iframe
      return null;
    }
    // css url()
    else  {
      return 'assets';
    }
  }

  split(baseUrl) {
    // all scripts, styles and assets from head => local
    const actions = [];
    DomTools.transformPaths(this.dom, (path, el, isInHead) => {
      const url = new URL(path, baseUrl);
      if(this.isDownloadable(url)) {
        const fileName = Path.basename(url.pathname);
        const destFolder = this.getDestFolder(Path.extname(url.pathname), el.tagName);
        if(destFolder) {
          const destPath = `${destFolder}/${fileName}`;
          actions.push({
            original: path,
            srcPath: url.href,
            destPath: destPath,
            tagName: el.tagName,
            displayName: fileName,
          });
          console.log(el.tagName, el.className, isInHead, destPath);
          if(el.tagName) {
            // not an URL from a style sheet
            return destPath;
          }
          else if(isInHead) {
            // URL from a style sheet
            // called from '/css'
            return '../' + destPath;
          }
          // URL from a style sheet
          // called from './' because it is in the body and not moved to an external CSS
          return destPath;
        }
      }
      return null;
    });

    // final js script to store in js/script.js
    const scriptTags = [];
    const scripts = this.doc.head.querySelectorAll('script');
    for(let idx=0; idx<scripts.length; idx++) {
      const tag = scripts[idx];
      if(!tag.src && tag.innerHTML) {
        tag.parentNode.removeChild(tag);
        scriptTags.push(tag);
      }
    }
    // link the user's script
    if(scriptTags.length > 0) {
      const scriptTagSrc = this.doc.createElement('script');
      scriptTagSrc.src = 'js/script.js';
      scriptTagSrc.type = 'text/javascript';
      this.doc.head.appendChild(scriptTagSrc);
    }
    else {
      console.warn('no scripts found in head');
    }

    // add head css
    const styleTags = [];
    const styles = this.doc.head.querySelectorAll('style');
    for(let idx=0; idx<styles.length; idx++) {
      const tag = styles[idx];
      tag.parentNode.removeChild(tag);
      styleTags.push(tag);
    }
    // link the user's stylesheet
    if(styleTags.length > 0) {
      const cssTagSrc = this.doc.createElement('link');
      cssTagSrc.href = 'css/styles.css';
      cssTagSrc.rel = 'stylesheet';
      cssTagSrc.type = 'text/css';
      this.doc.head.appendChild(cssTagSrc);
    }
    else {
      console.warn('no styles found in head');
    }

    // cleanup classes used by Silex during edition
    // DomTools.removeInternalClasses(this.dom);

    // replace internal links <div data-silex-href="..." by <a href="..."
    // do a first pass, in order to avoid replacing the elements in the <a> containers
    const links = this.doc.body.querySelectorAll(`.${constants.EDITABLE_CLASS_NAME}[${constants.LINK_ATTR}]`);
    for(let idx=0; idx<links.length; idx++) {
      const element = links[idx];
      const href = element.getAttribute(constants.LINK_ATTR);
      element.removeAttribute(constants.LINK_ATTR);

      const replacement = this.doc.createElement('a');
      replacement.setAttribute('href', href);
      replacement.innerHTML = element.innerHTML;
      for(let attrIdx=0; attrIdx<element.attributes.length; attrIdx++) {
        const nodeName = element.attributes.item(attrIdx).nodeName;
        const nodeValue = element.attributes.item(attrIdx).nodeValue;
        replacement.setAttribute(nodeName, nodeValue);
      }
      // insert the clone at the place of the original and remove the original
      // FIXME: bug when there is a link in the content of an element with an external link set
      // see issue https://github.com/silexlabs/Silex/issues/56
      element.parentNode.replaceChild(replacement, element);
    };

    this.doc.body.classList.add('silex-published');

    const res = {
      scriptTags: scriptTags,
      styleTags: styleTags,
      actions: actions,
    };
    return res;
  }


  /**
   * det if a given URL is supposed to be downloaded locally
   * @param {string} url
   * @return {boolean} true if the url is relative or it is a known domain (sttic.silex.me)
   */
  isDownloadable(url) {
    // do not download files with GET params since it is probably dynamic
    return url.search === ''
    // do not download data:* images
    && url.protocol !== 'data:';
  }

}

