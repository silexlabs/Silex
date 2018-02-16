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

module.exports = class DomTools {
  static transformStylesheet(stylesheet, fn) {
    let cssText = '';
    for(let ruleIdx=0; ruleIdx<stylesheet.cssRules.length; ruleIdx++) {
      const rule = stylesheet.cssRules[ruleIdx];
      if(rule.style) for(let valIdx=0; valIdx<rule.style.length; valIdx++) {
        const valName = rule.style[valIdx];
        const value = rule.style[valName];
        if(value.indexOf('url(') === 0) {
          const valueArr = value.split('\'');
          const url = valueArr[1];
          const newUrl = fn(url, stylesheet);
          if(newUrl) {
            valueArr[1] = newUrl;
          }
          rule.style[valName] = valueArr.join('\'');
        }
      }
      cssText += rule.cssText;
    }
    return cssText;
  }
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
        if(el.hasAttribute('data-silex-static')) {
          continue;
        }
        const val = el.getAttribute(attr);
        const newVal = fn(val, el);
        if(newVal) el.setAttribute(attr, newVal);
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
        const cssText = DomTools.transformStylesheet(stylesheet, fn);
        matches.push({
          tag: tag,
          innerHTML: cssText,
        });
      }
    }
    matches.forEach(({tag, innerHTML}) => tag.innerHTML = innerHTML);
  }
}
