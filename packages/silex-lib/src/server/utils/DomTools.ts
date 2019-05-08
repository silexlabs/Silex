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

import {Constants} from '../../Constants.js';

export default class DomTools {
  /**
   * This method is the entry point for modifying all the URLs in a dom tree
   * with a function you provide
   * The algorithm will call your function with the URLs found in the stylsheets, the html markup, and the JSON data stored by Silex
   */
  static transformPaths(dom, fn) {
    // images, videos, stylesheets, iframes...
    ['src', 'href'].forEach(attr => {
      const elements = dom.window.document.querySelectorAll(`[${attr}]`);
      for(let idx=0; idx<elements.length; idx++) {
        const el = elements[idx];
        if(el.tagName.toLowerCase() === 'a' || el.getAttribute('data-silex-href')) {
          // do nothing with <a> links
          continue;
        }
        if(el.tagName.toLowerCase() === 'link' &&
          el.getAttribute('rel').toLowerCase() !== 'stylesheet' &&
          el.getAttribute('rel').toLowerCase() !== 'shortcut icon'
        ) {
          // do nothing with <link> tags unless it is an external stylesheet or the favicon
          continue;
        }
        if(el.hasAttribute('data-silex-static')) {
          continue;
        }
        const val = el.getAttribute(attr);
        const newVal = fn(val, el, el.parentElement === dom.window.document.head);
        if(newVal) {
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
    for(let stylesheetIdx=0; stylesheetIdx<stylesheets.length; stylesheetIdx++) {
      const stylesheet = stylesheets[stylesheetIdx];
      if(tags[stylesheetIdx]) { // seems to happen sometimes?
        const tag = tags[stylesheetIdx];
        const cssText = DomTools.transformStylesheet(stylesheet, tag.parentElement === dom.window.document.head, fn);
        matches.push({
          tag: tag,
          innerHTML: cssText,
        });
      }
    }
    matches.forEach(({tag, innerHTML}) => tag.innerHTML = innerHTML);
    // JSON object of Silex (components and styles)
    DomTools.transformJson(dom, fn);
  }


  /**
   * if value conatains `url('...')` this will be "transformed" by the provided function `fn`
   * @param {string} value, e.g. "transparent" or "100px" or "url('image/photo%20page%20accueil.png')"
   * @param {?CSSStyleSheet} stylesheet or null if the value comes from the JSON object holding silex data
   * @param {boolean} isInHead, true if the stylesheet is in the head tag
   * @param {function} fn
   */
  static transformValueUrlKeyword(value, stylesheet, isInHead, fn) {
    if(typeof value === 'string' && value.indexOf('url(') === 0) {
      const valueArr = value.split('\'');
      const url = valueArr[1];
      const newUrl = fn(url, stylesheet, isInHead);
      if(newUrl) {
        valueArr[1] = newUrl;
      }
      return valueArr.join('\'');
    }
    return null;
  }


  static transformStylesheet(stylesheet, isInHead, fn, isMediaQuerySubRule = false) {
    let cssText = '';
    for(let ruleIdx=0; ruleIdx<stylesheet.cssRules.length; ruleIdx++) {
      const rule = stylesheet.cssRules[ruleIdx];
      if(rule.style) for(let valIdx=0; valIdx<rule.style.length; valIdx++) {
        const valName = rule.style[valIdx];
        const value = rule.style[valName];
        rule.style[valName] = DomTools.transformValueUrlKeyword(value, stylesheet, isInHead, fn) || value;
      }
      else if(rule.cssRules) {
        // case of a mediaquery
        DomTools.transformStylesheet(rule, isInHead, fn, true);
      }
      if(!isMediaQuerySubRule) {
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
  static transformJson(dom, fn) {
    const jsonData = DomTools.getProperties(dom.window.document);
    if(jsonData) {
      for(let dataObjName in jsonData) {
        const dataObj = jsonData[dataObjName];
        for(let elementId in dataObj) {
          const elementData = dataObj[elementId];
          for(let propName in elementData) {
            const propValue = elementData[propName];
            const valueUrlKeyword = DomTools.transformValueUrlKeyword(propValue, null, true, fn);
            if(valueUrlKeyword) {
              elementData[propName] = valueUrlKeyword;
            }
            else {
              if(['src', 'href'].indexOf(propName) >= 0) {
                elementData[propName] = fn(propValue) || propValue;
              }
            }
          }
        }
      }
      DomTools.setProperties(dom.window.document, jsonData);
    }
  }


  /**
   * Load the styles from the json saved in a script tag
   * This code comes from the client side class property.js
   */
  static getProperties(doc) {
    var styleTag = doc.querySelector('.' + Constants.JSON_STYLE_TAG_CLASS_NAME);
    if (styleTag != null) {
      return JSON.parse(styleTag.innerHTML)[0];
    }
    // no JSON styles array found in the dom
    // this is ok when publishing
    return null;
  }


  /**
   * Saves the styles to a script tag
   * This code comes from the client side class property.js
   */
  static setProperties(doc, value) {
    var styleTag = doc.querySelector('.' + Constants.JSON_STYLE_TAG_CLASS_NAME);
    if (styleTag != null) {
      styleTag.innerHTML = JSON.stringify([value]);
    }
    else {
      console.error('Error: no JSON styles array found in the dom');
    }
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
  };


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
    if(userHead) {
      return htmlString.replace(/<\/head>/i, Constants.HEAD_TAG_START + userHead + Constants.HEAD_TAG_STOP + '</head>');
    }
    else {
      return htmlString;
    }
  };



}
