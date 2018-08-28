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

const constants = require('./Constants.json');

module.exports = class DomTools {
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
        if(el.tagName.toLowerCase() === 'link' && el.getAttribute('rel') !== 'stylesheet') {
          // do nothing with <link> tags unless it is an external stylesheet
          continue;
        }
        if(el.hasAttribute('data-silex-static')) {
          continue;
        }
        const val = el.getAttribute(attr);
        const newVal = fn(val, el, el.parentNode === dom.window.document.head);
        if(newVal) {
          el.setAttribute(attr, newVal);
          if(val != newVal) console.log('URL transformed:', attr, val, '=>', newVal);
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
        const cssText = DomTools.transformStylesheet(stylesheet, tag.parentNode === dom.window.document.head, fn);
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
      console.log('URL transformed:', url, '=>', newUrl);
      return valueArr.join('\'');
    }
    return null;
  }


  static transformStylesheet(stylesheet, isInHead, fn) {
    let cssText = '';
    for(let ruleIdx=0; ruleIdx<stylesheet.cssRules.length; ruleIdx++) {
      const rule = stylesheet.cssRules[ruleIdx];
      if(rule.style) for(let valIdx=0; valIdx<rule.style.length; valIdx++) {
        const valName = rule.style[valIdx];
        const value = rule.style[valName];
        rule.style[valName] = DomTools.transformValueUrlKeyword(value, stylesheet, isInHead, fn) || value;
      }
      cssText += rule.cssText;
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
                console.log('URL transformed:', propName, propValue, '=>', elementData[propName]);
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
    var styleTag = doc.querySelector('.' + constants.JSON_STYLE_TAG_CLASS_NAME);
    if (styleTag != null) {
      return JSON.parse(styleTag.innerHTML)[0];
    }
    console.info('Warning: no JSON styles array found in the dom (ok when publishing)');
    return null;
  }


  /**
   * Saves the styles to a script tag
   * This code comes from the client side class property.js
   */
  static setProperties(doc, value) {
    var styleTag = doc.querySelector('.' + constants.JSON_STYLE_TAG_CLASS_NAME);
    if (styleTag != null) {
      styleTag.innerHTML = JSON.stringify([value]);
    }
    else {
      console.error('Error: no JSON styles array found in the dom');
    }
  }
}
