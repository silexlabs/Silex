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

/**
 * @fileoverview This component displays the site opened by Silex,
 *   which is edited with the Stage component
 */

import { Constants } from '../../constants'
import { getSiteDocument, getSiteWindow } from '../ui/UiElements'
import { removeWysihtmlMarkup, addMediaQuery } from '../element/dom'
import { getElements } from '../element/store'
import { getUi, updateUi } from '../ui/store'
import { Style } from '../utils/Style'
import { getAllStyles } from '../element/utils'

///////////////////
// API for the outside world
let site: Site
export function initSiteComponent() {
  site = site || new Site()
}
export function setHtml(rawHtml: string, opt_cbk?: (() => any), opt_showLoader?: boolean) {
  return site.setHtml(rawHtml, opt_cbk, opt_showLoader)
}
export function getHtml() {
  return site.getHtml()
}

///////////////////
// Site class
// TODO: make this only methods and write tests
class Site {

  constructor() {
    // reset iframe content
    // this is needed since iframes can keep their content
    // after a refresh in firefox
    const contentDocument = getSiteDocument()
    contentDocument.open();
    contentDocument.write('');
    contentDocument.close();
  }

  /**
   * build the html content
   * Parse the raw html and fill the bodyElement and headElement
   * @export
   */
  setHtml(rawHtml: string, opt_cbk?: (() => any), opt_showLoader?: boolean) {
    const contentDocument = getSiteDocument()

    // reset iframe content
    contentDocument.open();
    contentDocument.write('');
    contentDocument.close();

    // loading
    updateUi({
      ...getUi(),
      loading: true,
    })

    // write the content
    contentDocument.open();
    contentDocument.write(rawHtml);
    contentDocument.close();
    this.contentChanged(opt_cbk);
  }

  /**
   * the content of the iframe changed
   */
  contentChanged(opt_cbk?: (() => any)) {
    const contentDocument = getSiteDocument()
    const contentWindow = getSiteWindow()

    // wait for the webste to be loaded
    // can not rely on the load event of the iframe because there may be missing
    // assets
    // tslint:disable:no-string-literal
    if (contentDocument.body === null || contentWindow === null || contentWindow['jQuery'] === null) {
      setTimeout(() => {
        this.contentChanged(opt_cbk);
      }, 10);
      return;
    }

    // notify the caller
    if (opt_cbk) {
      opt_cbk();
    }

    // loading
    updateUi({
      ...getUi(),
      loading: false,
    })
  }

  /**
   * build a string of the raw html content
   * remove all internal objects and attributes
   */
  getHtml() {
    const generator = this.getHtmlGenerator();
    let res = null;
    do {
      res = generator.next();
    } while (!res.done);
    return res.value;
  }

  /**
   * async verion of getHtml
   * this is an optimisation needed to speedup drag start (which creates an undo
   * point) it uses generator to lower the load induced by these operations
   */
  getHtmlAsync(cbk) {
    const generator = this.getHtmlGenerator();
    this.getHtmlNextStep(cbk, generator);
  }

  /**
   * does one more step of the async getHtml process
   */
  getHtmlNextStep(cbk, generator) {
    const res = generator.next();
    if (res.done) {
      setTimeout(() => cbk(res.value), 0);
    } else {
      setTimeout(() => this.getHtmlNextStep(cbk, generator), 0);
    }
  }

  /**
   * the async getHtml process
   * yield after each step
   * FIXME: we should be able to avoid creating an alternative dom and handle
   * everything on the server side
   */
  * getHtmlGenerator() {
    // update style tag (the dom do not update automatically when we change
    // document.styleSheets)
    const updatedStyles = getAllStyles();
    yield;

    // clone
    const contentDocument = getSiteDocument()
    const cleanFile = (contentDocument.cloneNode(true) as Document);
    yield;

    // apply styles in JSON to the DOM, this is to ensure we save the styles
    // untuched by the browser
    const styleTag = cleanFile.querySelector('.' + Constants.INLINE_STYLE_TAG_CLASS_NAME);
    styleTag.innerHTML = updatedStyles;
    yield;

    // get html
    removeWysihtmlMarkup(cleanFile);
    yield;
    let rawHtml = (cleanFile as Document).documentElement.outerHTML;
    yield;

    // add doctype
    rawHtml = '<!DOCTYPE html>' + rawHtml;
    return rawHtml;
  }
}
