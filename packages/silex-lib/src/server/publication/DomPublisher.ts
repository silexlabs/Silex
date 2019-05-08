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

import * as Path from 'path';
import { URL } from 'url';
import { Constants } from '../../Constants';
import DomTools from '../utils/DomTools';

export interface File {
  original: string;
  srcPath: string;
  destPath: string;
  tagName: string;
  displayName: string;
}
export interface Action {
  name: string;
  path: string;
  displayName: string;
  content: string;
}

/**
 * @fileoverview Helper class used to cleanup the DOM when publishing a website
 *
 */

export class DomPublisher {

  private doc: HTMLDocument;

  constructor(private dom, private userHead, private rootUrl, private rootPath, private getDestFolder) {
    this.doc = dom.window.document;
  }

  /**
   * remove the javascript and css files which firefox inlines
   * the inlined tags are script type="text/javascript" style="display:none"
   * @param {Document} doc
   */
  cleanupFirefoxInlines() {
    // remove inlined scripts and styles
    ['script', 'style'].forEach((tagName) => {
      Array.from(this.doc.querySelectorAll(`${tagName}[style="display:none"]`))
      .forEach((element) => {
        element.parentElement.removeChild(element);
      });
    });
  }

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
    Array.from(this.doc.head.querySelectorAll(`meta[name="publicationPath"], .${Constants.JSON_STYLE_TAG_CLASS_NAME}`))
    .forEach((tagToRemove) => {
      tagToRemove.parentElement.removeChild(tagToRemove);
    });
    // remove data-silex-id
    // remove data-silex-static (will then be downloaded like any other script, not striped by DomTools.transformPath)
    // remove data-dependency
    // do NOT remove data-silex-type because it is used by front-end.js at runtime
    Array.from(this.doc.querySelectorAll(`[${Constants.TYPE_ATTR}], [${Constants.ELEMENT_ID_ATTR_NAME}], [${Constants.STATIC_ASSET_ATTR}]`))
    .forEach((tagToClean) => {
      tagToClean.removeAttribute(Constants.ELEMENT_ID_ATTR_NAME);
      tagToClean.removeAttribute(Constants.STATIC_ASSET_ATTR);
      tagToClean.removeAttribute('data-dependency');
    });
  }

  split(newFirstPageName: string): Action[] {
    this.doc.body.classList.add(Constants.WEBSITE_CONTEXT_PUBLISHED_CLASS_NAME);

    // remove unused scripts when there is no deeplink navigation anymore
    ['js/jquery-ui.js', 'js/pageable.js']
    .map((path) => this.doc.querySelector(`script[src="${ path }"]`))
    .filter((el) => !!el) // when not updated yet to the latest version, the URLs are not relative
    .forEach((el) => el.parentElement.removeChild(el));
    // split in multiple pages
    const pages = Array.from(this.doc.querySelectorAll(`a[${Constants.TYPE_ATTR}="${Constants.TYPE_PAGE}"]`));
    const initialFirstPageName = pages[0].getAttribute('id');
    return pages
    .map((el, idx) => {
      return  {
        name: el.getAttribute('id'),
        displayName: el.innerHTML,
        fileName: el.getAttribute('id') === initialFirstPageName && newFirstPageName ? 'index.html' : (el.getAttribute('id').substr('page-'.length) + '.html'),
      };
    })
    .map(({displayName, name, fileName}) => {
      // clone the document
      const clone = this.doc.cloneNode(true) as HTMLDocument;
      // update title (TODO: description and SEO)
      (clone.head.querySelector('title') || ({} as HTMLTitleElement)).innerHTML += ' - ' + displayName;
      // remove elements from other pages
      Array.from(clone.querySelectorAll(`.${Constants.PAGED_CLASS_NAME}`))
      .forEach((el) => {
        if (el.classList.contains(name)) {
          el.classList.add('page-link-active');
        } else {
          el.parentElement.removeChild(el);
        }
      });
      // update links
      Array.from(clone.querySelectorAll('a'))
      .filter((el) => el.hash.startsWith('#!'))
      .forEach((el) => {
        const [pageName, anchor] = el.hash.substr('#!'.length).split('#');
        el.href = (pageName === initialFirstPageName && newFirstPageName ? 'index.html' : pageName.substr('page-'.length) + '.html') + (anchor ? '#' + anchor : '');
        if (pageName ===  name) {
          el.classList.add('page-link-active');
        } else {
          el.classList.remove('page-link-active'); // set when you save the file
        }
      });

      // remove useless css classes
      // do not do this before as these classes are needed until the last moment, e.g. to select paged elements
      Constants.SILEX_CLASS_NAMES_TO_REMOVE_AT_PUBLISH.forEach((className) => {
        Array.from(clone.getElementsByClassName(className))
        .forEach((el: HTMLElement) => el.classList.remove(className));
      });

      // create a unifile batch action
      return {
        name: 'writefile',
        path: this.rootPath + '/' + this.getDestFolder('.html', null) + '/' + fileName,
        displayName: fileName,
        content: '<!doctype html>' + clone.documentElement.outerHTML,
      };
    });
  }

  extractAssets(baseUrl: string|URL): {scriptTags: HTMLElement[], styleTags: HTMLElement[], files: File[]} {
    // all scripts, styles and assets from head => local
    const files: File[] = [];
    DomTools.transformPaths(this.dom, (path, el, isInHead) => {
      // el may be null if the path comes from the JSON object holding Silex data
      // This is never supposed to happen because the tag holding the JSON object
      // is removed from the head tag in DomPublisher::cleanup.
      // But sometimes it appears that the tags are in the body
      // Maybe we should change cleanup to look for the tagsToRemove also in the body?
      const tagName = el ? el.tagName : null;

      const url = new URL(path, baseUrl);

      if (this.isDownloadable(url)) {
        const fileName = Path.basename(url.pathname);
        const destFolder = this.getDestFolder(Path.extname(url.pathname), tagName);
        if (destFolder) {
          const destPath = `${destFolder}/${fileName}`;
          files.push({
            original: path,
            srcPath: url.href,
            destPath: this.rootPath + '/' + destPath,
            tagName,
            displayName: fileName,
          });
          if (tagName) {
            // not an URL from a style sheet
            return destPath;
          } else if (isInHead) {
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
    Array.from(this.doc.head.querySelectorAll('script'))
    .forEach((tag) => {
      if (!tag.src && tag.innerHTML) {
        tag.parentElement.removeChild(tag);
        scriptTags.push(tag);
      }
    });

    // link the user's script
    if (scriptTags.length > 0) {
      const scriptTagSrc = this.doc.createElement('script');
      scriptTagSrc.src = 'js/script.js';
      scriptTagSrc.type = 'text/javascript';
      this.doc.head.appendChild(scriptTagSrc);
    } else {
      console.info('no script found in head');
    }

    // add head css
    const styleTags = [];
    Array.from(this.doc.head.querySelectorAll('style'))
    .forEach((tag) => {
      tag.parentElement.removeChild(tag);
      styleTags.push(tag);
    });

    // link the user's stylesheet
    if (styleTags.length > 0) {
      const cssTagSrc = this.doc.createElement('link');
      cssTagSrc.href = 'css/styles.css';
      cssTagSrc.rel = 'stylesheet';
      cssTagSrc.type = 'text/css';
      this.doc.head.appendChild(cssTagSrc);
    } else {
      console.warn('no styles found in head');
    }

    // put back the user head now that all other scrips and styles are moved to external files
    this.doc.head.innerHTML += this.userHead;
    // this.doc.head.appendChild(this.doc.createTextNode(this.userHead));

    // cleanup classes used by Silex during edition
    // DomTools.removeInternalClasses(this.dom);

    // replace internal links <div data-silex-href="..." by <a href="..."
    // do a first pass, in order to avoid replacing the elements in the <a> containers
    const links = Array.from(this.doc.body.querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}[${Constants.LINK_ATTR}]`))
    .forEach((element: HTMLElement) => {
      const href = element.getAttribute(Constants.LINK_ATTR);
      element.removeAttribute(Constants.LINK_ATTR);

      const replacement = this.doc.createElement('a');
      replacement.setAttribute('href', href);
      replacement.innerHTML = element.innerHTML;
      for (let attrIdx = 0; attrIdx < element.attributes.length; attrIdx++) {
        const nodeName = element.attributes.item(attrIdx).nodeName;
        const nodeValue = element.attributes.item(attrIdx).nodeValue;
        replacement.setAttribute(nodeName, nodeValue);
      }
      // insert the clone at the place of the original and remove the original
      // FIXME: bug when there is a link in the content of an element with an external link set
      // see issue https://github.com/silexlabs/Silex/issues/56
      element.parentElement.replaceChild(replacement, element);
    });

    return {
      scriptTags,
      styleTags,
      files,
    };
  }

  /**
   * det if a given URL is supposed to be downloaded locally
   * @param {string} url
   * @return {boolean} true if the url is relative or it is a known domain (sttic.silex.me)
   */
  isDownloadable(url): boolean {
    // do not download files with GET params since it is probably dynamic
    return url.search === ''
    // do not download data:* images
    && url.protocol !== 'data:'
    && url.origin === this.rootUrl;
  }

}
