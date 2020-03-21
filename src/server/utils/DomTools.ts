//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

import { Constants } from '../../constants';
import { DataModel } from '../../client/flux/types';

export default class DomTools {
  /**
   * This method is the entry point for modifying all the URLs in a dom tree
   * with a function you provide
   * The algorithm will call your function with the URLs found in the stylsheets, the html markup, and the JSON data stored by Silex
   */
  static transformPaths(dom, data: DataModel, fn): DataModel {
    // images, videos, stylesheets, iframes...
    ['src', 'href'].forEach((attr) => {
      const elements = dom.window.document.querySelectorAll(`[${attr}]`);
      for (const el of elements) {
        if (el.tagName.toLowerCase() === 'a' || el.getAttribute('data-silex-href')) {
          // do nothing with <a> links
          continue;
        }
        if (el.tagName.toLowerCase() === 'link' &&
          el.getAttribute('rel').toLowerCase() !== 'stylesheet' &&
          el.getAttribute('rel').toLowerCase() !== 'shortcut icon'
        ) {
          // do nothing with <link> tags unless it is an external stylesheet or the favicon
          continue;
        }
        if (el.hasAttribute('data-silex-static')) {
          continue;
        }
        const val = el.getAttribute(attr);
        const newVal = fn(val, el, el.parentElement === dom.window.document.head);
        if (newVal) {
          el.setAttribute(attr, newVal);
        }
      }
    });
    // CSS rules
    // FIXME: it would be safer (?) to use CSSStyleSheet::ownerNode instead of browsing the DOM
    // see the bug in jsdom: https://github.com/jsdom/jsdom/issues/992
    const tags = dom.window.document.querySelectorAll('style');
    const stylesheets = dom.window.document.styleSheets;
    const matches = [];
    for (let stylesheetIdx = 0; stylesheetIdx < stylesheets.length; stylesheetIdx++) {
      const stylesheet = stylesheets[stylesheetIdx];
      if (tags[stylesheetIdx]) { // seems to happen sometimes?
        const tag = tags[stylesheetIdx];
        const cssText = DomTools.transformStylesheet(stylesheet, tag.parentElement === dom.window.document.head, fn);
        matches.push({
          tag,
          innerHTML: cssText,
        });
      }
    }
    matches.forEach(({tag, innerHTML}) => tag.innerHTML = innerHTML);
    if (data) {
      // JSON object of Silex (components and styles)
      return DomTools.transformDataModel(data, fn);
    } else {
      // no JSON data is normal, this is the case when publishing
      return null;
    }
  }

  /**
   * if value conatains `url('...')` this will be "transformed" by the provided function `fn`
   * @param {string} value, e.g. "transparent" or "100px" or "url('image/photo%20page%20accueil.png')"
   * @param {?CSSStyleSheet} stylesheet or null if the value comes from the JSON object holding silex data
   * @param {boolean} isInHead, true if the stylesheet is in the head tag
   * @param {function} fn
   */
  static transformValueUrlKeyword(value, stylesheet, isInHead, fn) {
    if (typeof value === 'string' && value.indexOf('url(') === 0) {
      // support url(...), url('...'), url("...")
      return `url(${
        value.replace(/url\('(.*)'\)|url\("(.*)"\)|url\((.*)\)/, (str, match1, match2, match3) => {
          const match = match1 || match2 || match3;
          return fn(match, stylesheet, isInHead) || match;
        })
      })`;
    }
    return null;
  }

  /**
   * FIXME: this removes comments from CSS
   */
  static transformStylesheet(stylesheet: CSSStyleSheet, isInHead, fn, isMediaQuerySubRule = false) {
    let cssText = '';
    for (const sheetOrRule of stylesheet.cssRules) {
      // have to play with types
      const rule: CSSStyleRule = sheetOrRule as CSSStyleRule;
      const sheet: CSSStyleSheet = sheetOrRule as any;
      if (rule.style) {
        for (const valName of Array.from(rule.style)) {
          const value = rule.style[valName as string];
          rule.style[valName as string] = DomTools.transformValueUrlKeyword(value, stylesheet, isInHead, fn) || value;
        }
      } else if (sheet.cssRules) {
        // case of a mediaquery
        DomTools.transformStylesheet(sheet, isInHead, fn, true);
      } else {
      }
      if (!isMediaQuerySubRule) {
        // if it is a media query then the parent rule will be written
        cssText += rule.cssText;
      }
    }
    return cssText;
  }

  /**
   * Transform the JSON object stored by Silex in the DOM
   * It contains all the components data, the elements styles, etc.
   * This is even more important than the URLs in the dom and stylesheets since it is re-applyed by Silex when the site is loaded in the editor
   */
  static transformDataModel(data: DataModel, fn): DataModel {
    function checkItOut(name: string, value: string): string {
      const valueUrlKeyword = DomTools.transformValueUrlKeyword(value, null, true, fn);
      if (valueUrlKeyword) {
        return valueUrlKeyword;
      } else {
        if (['src', 'href'].indexOf(name) >= 0) {
          return fn(value) || value;
        }
        return value;
      }
    }
    function recursiveCheck(name: string, dataObj: any) {
      if (typeof dataObj === 'object') {
        for (const elementId in dataObj) {
          dataObj[elementId] = recursiveCheck(elementId, dataObj[elementId])
        }
        return dataObj
      } else {
        return checkItOut(name, dataObj)
      }
    }
    const { elements, site, pages } = data
    const result = {
      site, // FIXME: handle URLS here too
      pages, // FIXME: handle URLS here too
      elements: elements.map((el) => ({
        ...el,
        link: el.link ? {
          ...el.link,
          value: checkItOut('href', el.link.value),
        } : null,
        data: recursiveCheck('data', el.data),
        style: recursiveCheck('data', el.style),
      })),
    }
    return result;
  }

  /**
   * Split the user editable head tag and silex head tags
   * the head tag edited by the user is a portion of the real head tag
   * it is delimited by specific comments
   * it can not be interpreted while editing, in case it has bad HTML tags, it could break the whole site, insert tags into the body instead of the head...
   * @param {string} headString   initial head tag
   * @return {{html: string, userHead: string}} split initial head tag and user editable head tag
   */
  static extractUserHeadTag(headString) {
    const regExp = new RegExp(Constants.HEAD_TAG_START + '([\\\s\\\S.]*)' + Constants.HEAD_TAG_STOP);
    const found = headString.match(regExp);
    if (found) {
      return {
        userHead: found[1],
        html: headString.replace(regExp, ''),
      };
    }
    return {
      userHead: '',
      html: headString,
    };
  }

  /**
   * insert the HEAD tag back into an HTML string
   * the head tag edited by the user is a portion of the real head tag
   * it is delimited by specific comments
   * it can not be interpreted while editing, in case it has bad HTML tags, it could break the whole site, insert tags into the body instead of the head...
   * @param {string} htmlString
   * @param {string} userHead
   * @return {string} the provided string with the user's head tags
   */
  static insertUserHeadTag(htmlString, userHead) {
    if (userHead) {
      return htmlString.replace(/<\/head>/i, Constants.HEAD_TAG_START + userHead + Constants.HEAD_TAG_STOP + '</head>');
    } else {
      return htmlString;
    }
  }

}
