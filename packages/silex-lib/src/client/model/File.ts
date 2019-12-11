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

import { Constants } from '../../constants';
import { DataModel, FileInfo } from '../../types';
import { getElements, initializeElements, initializePages, initializeSite, openPage, updateUi, getUi } from '../api';
import { Model, View } from '../ClientTypes';
import { getUiElements } from '../components/UiElements';
import { startObservers, stopObservers } from '../observers/index';
import { CloudStorage } from '../service/CloudStorage';

/**
 * @param model  model class which holds the other models
 * @param view  view class which holds the other views
 */
export class File {
  /**
   * max number of items in recent files
   */
  static MAX_RECENT_FILES = 5;

  // /**
  //  * loading css class
  //  */
  // static LOADING_CSS_CLASS = 'loading-website';

  // /**
  //  * loading css class
  //  */
  // static LOADING_LIGHT_CSS_CLASS = 'loading-website-light';

  /**
   * current file info returned by CE
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
    this.contentDocument_.write('');
    this.contentDocument_.close();
  }

  // /**
  //  * get the iframe document
  //  */
  // getContentDocument(): Document {
  //   return this.contentDocument_;
  // }

  // /**
  //  * get the iframe window
  //  */
  // getContentWindow(): Window {
  //   return this.contentWindow_;
  // }

  /**
   * @return true if a website is being edited
   */
  hasContent(): boolean {
    return !!this.contentDocument_.body &&
        this.contentDocument_.body.childNodes.length > 0;
  }

  setData(data: DataModel) {
    const { site, pages, elements }  = data;

    // update model
    stopObservers();

    initializeSite(site);

    initializePages(pages);
    openPage(pages[0]);

    initializeElements(elements);

    // create the stage
    this.view.stageWrapper.init(this.iFrameElement_);

    startObservers();
  }

  /**
   * build the html content
   * Parse the raw html and fill the bodyElement and headElement
   * @export
   */
  setHtml(rawHtml: string, opt_cbk?: (() => any), opt_showLoader?: boolean) {

    // reset iframe content
    this.view.stageWrapper.cleanup();
    this.contentDocument_.open();
    this.contentDocument_.write('');
    this.contentDocument_.close();

    // loading
    updateUi({
      ...getUi(),
      loading: true,
    })

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
    // tslint:disable:no-string-literal
    if (this.contentDocument_.body === null || this.contentWindow_ === null || this.contentWindow_['jQuery'] === null) {
      setTimeout(() => {
        this.contentChanged(opt_cbk);
      }, 10);
      return;
    }

    // check the integrity and store silex style sheet which holds silex
    // elements styles
    // this.model.property.initStyles(this.contentDocument_);
    // this.model.property.loadProperties(this.contentDocument_);
    // this.model.component.initStyles(this.contentDocument_);

    // // update model
    // stopObservers();

    // const { site, pages, elements }  = readDataFromDom(getUiElements().stage.contentDocument);

    // initializeSite(site);

    // initializePages(pages);
    // openPage(pages[0]);

    // initializeElements(elements);

    // // create the stage
    // this.view.stageWrapper.init(this.iFrameElement_);

    // startObservers();

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
    const updatedStyles = this.model.property.getAllStyles(getElements());
    yield;

    // clone
    const cleanFile = (this.contentDocument_.cloneNode(true) as Document);
    yield;

    // apply styles in JSON to the DOM, this is to ensure we save the styles
    // untuched by the browser
    const styleTag = cleanFile.querySelector('.' + Constants.INLINE_STYLE_TAG_CLASS_NAME);
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
   * load an arbitrary url as a silex html editable file
   * will not be able to save
   * @export
   */
  openFromUrl(
      url: string, opt_cbk: ((p1: string, data: DataModel) => any) = null,
      opt_errCbk: ((p1: any, p2: string) => any) = null) {
    this.isTemplate = true;
    CloudStorage.getInstance().loadLocal(
        url, (rawHtml: string, data: DataModel) => {
          this.close();
          this.fileInfo =
              ({isDir: false, mime: 'text/html'} as FileInfo);
          if (opt_cbk) {
            opt_cbk(rawHtml, data);
          }
        }, opt_errCbk);
  }

  /**
   * save a file with a new name
   * @param cbk receives the raw HTML
   * @export
   */
  saveAs(fileInfo: FileInfo, rawHtml: string, data: DataModel, cbk: () => any, opt_errCbk?: ((p1: any, p2: string) => any)) {
    // save the data
    this.fileInfo = fileInfo;
    this.addToLatestFiles(this.fileInfo);
    this.save(rawHtml, data, cbk, opt_errCbk);
  }

  /**
   * write content to the file
   * @export
   */
  save(rawHtml: string, data: DataModel, cbk: () => any, opt_errCbk?: ((p1: any, msg: string, code: number) => any)) {
    if (this.fileInfo == null) {
      throw new Error('Can not save, fileInfo is null');
    }
    CloudStorage.getInstance().write(
        (this.fileInfo as FileInfo), rawHtml,
        data, () => {
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
      fileInfo: FileInfo, cbk: (p1: string, data: DataModel) => any,
      opt_errCbk?: ((p1: any, msg: string, code: number) => any)) {
    this.isTemplate = false;
    CloudStorage.getInstance().read(
      fileInfo, (rawHtml: string, data: DataModel) => {
        // update model
        this.close();
        this.fileInfo = fileInfo;
        this.addToLatestFiles(this.fileInfo);
        if (cbk) {
          cbk(rawHtml, data);
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
   * get the info of the current file
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
