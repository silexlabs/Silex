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
 * @fileoverview
 *   This class represents a File opened by Silex,
 *   which is rendered by the Stage class
 *   It has methods to manipulate the File
 */

import { Property } from '../model/property';
import { CloudStorage } from '../service/cloud-storage';
import { FileInfo, Model, View } from '../types';
// import { Stage } from 'stage'; // this is not recognized by my IDE
import { getUiElements } from '../view/UiElements';

/**
 * @param model  model class which holds the other models
 * @param view  view class which holds the other views
 */
export class File {
  /**
   * max number of items in recent files
   */
  static MAX_RECENT_FILES = 5;

  /**
   * loading css class
   */
  static LOADING_CSS_CLASS = 'loading-website';

  /**
   * loading css class
   */
  static LOADING_LIGHT_CSS_CLASS = 'loading-website-light';

  /**
   * current file url and path and info returned by CE
   * if the current file is a new file, it has no FileInfo
   * if set, this is an absolute URL, use silex.model.File::getFileInfo to get
   * the relatvie URL
   */
  fileInfo: FileInfo = null;

  /**
   * true if the opened file is a template
   * this means that one must "save as" and not "save"
   */
  isTemplate: boolean = false;

  // store the iframe window and document
  /**
   * the iframe element
   */
  private iFrameElement_: HTMLIFrameElement;

  /**
   * iframe document
   */
  private contentDocument_: Document;

  /**
   * iframe window
   */
  private contentWindow_: Window;

  constructor(public model: Model, public view: View) {
    this.iFrameElement_ = getUiElements().stage;
    this.contentDocument_ = this.iFrameElement_.contentDocument;
    this.contentWindow_ = this.iFrameElement_.contentWindow;

    // reset iframe content
    // this is needed since iframes can keep their content
    // after a refresh in firefox
    this.contentDocument_.open();
    this.getContentDocument().write('');
    this.contentDocument_.close();
  }

  /**
   * get the iframe document
   */
  getContentDocument(): Document {
    return this.contentDocument_;
  }

  /**
   * get the iframe window
   */
  getContentWindow(): Window {
    return this.contentWindow_;
  }

  /**
   * @return true if a website is being edited
   */
  hasContent(): boolean {
    return !!this.contentDocument_.body &&
        this.contentDocument_.body.childNodes.length > 0;
  }

  /**
   * build the html content
   * Parse the raw html and fill the bodyElement and headElement
   * @export
   */
  setHtml(
      rawHtml: string, opt_cbk?: (() => any),
      opt_showLoader?: boolean) {

    // reset iframe content
    this.view.stageWrapper.cleanup();
    this.contentDocument_.open();
    this.getContentDocument().write('');
    this.contentDocument_.close();

    // loading
    if (opt_showLoader !== false) {
      this.iFrameElement_.classList.add(File.LOADING_CSS_CLASS);
    } else {
      this.iFrameElement_.classList.add(File.LOADING_LIGHT_CSS_CLASS);
    }

    // write the content
    this.contentDocument_.open();
    this.contentDocument_.write(rawHtml);
    this.contentDocument_.close();
    this.contentChanged(opt_cbk);
  }

  /**
   * the content of the iframe changed
   */
  contentChanged(opt_cbk?: (() => any)) {
    // wait for the webste to be loaded
    // can not rely on the load event of the iframe because there may be missing
    // assets
    this.contentDocument_ = this.iFrameElement_.contentDocument;
    this.contentWindow_ = this.iFrameElement_.contentWindow;
    if (this.contentDocument_.body === null || this.contentWindow_ === null ||
        this.contentWindow_['$'] === null) {
      setTimeout(() => {
        this.contentChanged(opt_cbk);
      }, 100);
      return;
    }

    // check the integrity and store silex style sheet which holds silex
    // elements styles
    this.model.property.initStyles(this.contentDocument_);
    this.model.property.loadProperties(this.contentDocument_);
    this.model.component.initStyles(this.contentDocument_);

    // select the body
    this.model.body.setSelection([this.contentDocument_.body]);

    // update the settings
    this.model.head.updateFromDom();

    // notify the caller
    if (opt_cbk) {
      opt_cbk();
    }

    // loading
    this.iFrameElement_.classList.remove(File.LOADING_CSS_CLASS);
    this.iFrameElement_.classList.remove(File.LOADING_LIGHT_CSS_CLASS);

    // refresh the view
    let page = this.model.page.getCurrentPage();
    this.model.page.setCurrentPage(page);

    // remove publication path for templates
    if (this.isTemplate) {
      this.model.head.setPublicationPath(null);
    }

    setTimeout(() => {
      // restore the stage
      this.view.stageWrapper.init(this.iFrameElement_);
    }, 1000);
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
    let res = generator.next();
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
    let updatedStyles = this.model.property.getAllStyles(this.contentDocument_);
    this.model.property.saveProperties(this.contentDocument_);

    // clone
    let cleanFile = (this.contentDocument_.cloneNode(true) as Document);
    yield;

    // apply styles in JSON to the DOM, this is to ensure we save the styles
    // untuched by the browser
    let styleTag = cleanFile.querySelector('.' + Property.INLINE_STYLE_TAG_CLASS_NAME);
    styleTag.innerHTML = updatedStyles;
    yield;

    // get html
    this.model.body.removeWysihtmlMarkup(cleanFile);
    yield;
    let rawHtml = (cleanFile as Document).documentElement.outerHTML;
    yield;

    // add doctype
    rawHtml = '<!DOCTYPE html>' + rawHtml;
    return rawHtml;
  }

  /**
   * load an arbitrary url as a silex html file
   * will not be able to save
   * @export
   */
  openFromUrl(
      url: string, opt_cbk: ((p1: string) => any) = null,
      opt_errCbk: ((p1: Object, p2: string) => any) = null) {
    this.isTemplate = true;
    CloudStorage.getInstance().loadLocal(
        url, (rawHtml, userHead) => {
          this.fileInfo =
              ({isDir: false, mime: 'text/html', url: url} as FileInfo);
          this.model.head.setUserHeadTag(userHead);
          if (opt_cbk) {
            opt_cbk(rawHtml);
          }
        }, opt_errCbk);
  }

  /**
   * save a file with a new name
   * @param cbk receives the raw HTML
   * @export
   */
  saveAs(
      fileInfo: FileInfo, rawHtml: string, cbk: () => any,
      opt_errCbk?: ((p1: Object, p2: string) => any)) {
    // save the data
    this.fileInfo = fileInfo;
    this.addToLatestFiles(this.fileInfo);
    this.save(rawHtml, cbk, opt_errCbk);
  }

  /**
   * write content to the file
   * @export
   */
  save(
      rawHtml: string, cbk: () => any,
      opt_errCbk?: ((p1: Object, p2: string) => any)) {
    if (this.fileInfo == null) {
      throw new Error('Can not save, fileInfo is null');
    }
    CloudStorage.getInstance().write(
        (this.fileInfo as FileInfo), rawHtml,
        this.model.head.getUserHeadTag(), () => {
          this.isTemplate = false;
          if (cbk) {
            cbk();
          }
        }, opt_errCbk);
  }

  /**
   * load a new file
   * @param cbk receives the raw HTML
   */
  open(
      fileInfo: FileInfo, cbk: (p1: string) => any,
      opt_errCbk?: ((p1: Object, p2: string) => any)) {
    this.isTemplate = false;
    CloudStorage.getInstance().read(
      fileInfo, (rawHtml, userHead) => {
        // update model
        this.close();
        this.fileInfo = fileInfo;
        this.addToLatestFiles(this.fileInfo);
        this.model.head.setUserHeadTag(userHead);
        if (cbk) {
          cbk(rawHtml);
        }
      }, opt_errCbk);
  }

  /**
   * reset data, close file
   */
  close() {
    this.fileInfo = null;
  }

  /**
   * get the url of the file
   */
  getFileInfo(): FileInfo {
    return this.fileInfo;
  }

  /**
   * clear the recent files
   */
  clearLatestFiles() {
    window.localStorage.removeItem('silex:recent-files');
  }

  /**
   * get the latest opened files
   */
  getLatestFiles(): FileInfo[] {
    const str = window.localStorage.getItem('silex:recent-files');
    if (str) {
      return (JSON.parse(str) as FileInfo[]);
    } else {
      return [];
    }
  }

  /**
   * store this file in the latest opened files
   */
  addToLatestFiles(fileInfo: FileInfo) {
    const latestFiles = [fileInfo].concat(this.getLatestFiles().filter(
        (item, idx) =>
            item.absPath !== fileInfo.absPath && idx < File.MAX_RECENT_FILES));
    window.localStorage.setItem(
        'silex:recent-files', JSON.stringify(latestFiles));
  }
}
