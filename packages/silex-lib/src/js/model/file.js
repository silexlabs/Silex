
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

goog.provide('silex.model.File');
goog.require('silex.Config');
goog.require('silex.service.SilexTasks');



/**
 * @constructor
 * @param  {silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.File = function(model, view) {
  // store the model and the view
  /**
   * @type {silex.types.Model}
   */
  this.model = model;
  /**
   * @type {silex.types.View}
   */
  this.view = view;
  // store the iframe window and document
  /**
   * the iframe element
   * @type {!HTMLIFrameElement}
   * @private
   */
  this.iFrameElement_ = /** @type {!HTMLIFrameElement} */ (goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));


  /**
   * iframe document
   * @type {Document}
   * @private
   */
  this.contentDocument_ = goog.dom.getFrameContentDocument(this.iFrameElement_);


  /**
   * iframe window
   * @type {Window}
   * @private
   */
  this.contentWindow_ = goog.dom.getFrameContentWindow(this.iFrameElement_);


  // reset iframe content
  // this is needed since iframes can keep their content
  // after a refresh in firefox
  this.contentDocument_.open();
  this.getContentDocument().write('');
  this.contentDocument_.close();
};


/**
 * max number of items in recent files
 * @const
 */
silex.model.File.MAX_RECENT_FILES = 5;


/**
 * loading css class
 * @const
 */
silex.model.File.LOADING_CSS_CLASS = 'loading-website';


/**
 * loading css class
 * @const
 */
silex.model.File.LOADING_LIGHT_CSS_CLASS = 'loading-website-light';


/**
 * current file url and path and info returned by CE
 * if the current file is a new file, it has no fileInfo
 * if set, this is an absolute URL, use silex.model.File::getFileInfo to get the relatvie URL
 * @type {?FileInfo}
 */
silex.model.File.prototype.fileInfo = null;


/**
 * true if the opened file is a template
 * this means that one must "save as" and not "save"
 * @type {boolean}
 */
silex.model.File.prototype.isTemplate = false;


/**
 * the get the iframe element
 * @return {HTMLIFrameElement}
 */
silex.model.File.prototype.getIFrameElement = function() {
  return this.iFrameElement_;
};


/**
 * get the iframe document
 * @return {Document}
 */
silex.model.File.prototype.getContentDocument = function() {
  return this.contentDocument_;
};


/**
 * get the iframe window
 * @return {Window}
 */
silex.model.File.prototype.getContentWindow = function() {
  return this.contentWindow_;
};


/**
 * @return {boolean} true if a website is being edited
 */
silex.model.File.prototype.hasContent = function() {
  return !!this.contentDocument_.body && this.contentDocument_.body.childNodes.length > 0;
};


/**
 * build the html content
 * Parse the raw html and fill the bodyElement and headElement
 * @param {string} rawHtml
 * @param {?function()=} opt_cbk
 * @param {?boolean=} opt_showLoader
 * @export
 */
silex.model.File.prototype.setHtml = function(rawHtml, opt_cbk, opt_showLoader) {
  // cleanup
  this.view.stage.removeEvents(this.contentDocument_.body);
  // reset iframe content
  this.contentDocument_.open();
  this.getContentDocument().write('');
  this.contentDocument_.close();
  // loading
  if (opt_showLoader !== false) {
    this.view.stage.element.classList.add(silex.model.File.LOADING_CSS_CLASS);
  }
  else {
    this.view.stage.element.classList.add(silex.model.File.LOADING_LIGHT_CSS_CLASS);
  }
  // remove user's head tag before it is interprated by the browser
  // - in case it has bad HTML tags, it could break the whole site, insert tags into the body instead of the head...
  rawHtml = this.model.head.extractUserHeadTag(rawHtml);

  // write the content
  this.contentDocument_.open();
  this.contentDocument_.write(rawHtml);
  this.contentDocument_.close();
  this.contentChanged(opt_cbk);
};



/**
 * the content of the iframe changed
 * @param {?function()=} opt_cbk
 */
silex.model.File.prototype.contentChanged = function(opt_cbk) {
  // wait for the webste to be loaded
  // can not rely on the load event of the iframe because there may be missing assets
  this.contentDocument_ = goog.dom.getFrameContentDocument(this.iFrameElement_);
  this.contentWindow_ = goog.dom.getFrameContentWindow(this.iFrameElement_);
  if (this.contentDocument_.body === null ||
    this.contentWindow_ === null ||
    this.contentWindow_['$'] === null) {
    setTimeout(() => {
      this.contentChanged(opt_cbk);
    }, 100);
    return;
  }

  // check the integrity and store silex style sheet which holds silex elements styles
  this.model.property.initStyles(this.contentDocument_);
  this.model.property.loadProperties(this.contentDocument_);
  // select the body
  this.model.body.setSelection([this.contentDocument_.body]);
  // update the settings
  this.model.head.updateFromDom();
  // restore event listeners
  this.view.stage.initEvents(this.contentWindow_);
  // notify the caller
  if (opt_cbk) {
    opt_cbk();
  }
  // loading
  this.view.stage.element.classList.remove(silex.model.File.LOADING_CSS_CLASS);
  this.view.stage.element.classList.remove(silex.model.File.LOADING_LIGHT_CSS_CLASS);
  // refresh the view
  var page = this.model.page.getCurrentPage();
  this.model.page.setCurrentPage(page);
  // remove publication path for templates
  if(this.isTemplate) this.model.head.setPublicationPath(null);
};


/**
 * build a string of the raw html content
 * remove all internal objects and attributes
 */
silex.model.File.prototype.getHtml = function() {
  const generator = this.getHtmlGenerator();
  let res = null;
  do {
    res = generator.next();
  } while(!res.done);
  return res.value;
};


/**
 * async verion of getHtml
 * this is an optimisation needed to speedup drag start (which creates an undo point)
 * it uses generator to lower the load induced by these operations
 */
silex.model.File.prototype.getHtmlAsync = function (cbk) {
  const generator = this.getHtmlGenerator();
  this.getHtmlNextStep(cbk, generator);
};


/**
 * does one more step of the async getHtml process
 */
silex.model.File.prototype.getHtmlNextStep = function (cbk, generator) {
  let res = generator.next();
  if(res.done) {
    setTimeout(() => cbk(res.value), 0);
  }
  else {
    setTimeout(() => this.getHtmlNextStep(cbk, generator), 0);
  }
};


/**
 * the async getHtml process
 * yield after each step
 * FIXME: we should be able to avoid creating an alternative dom and handle everything on the server side
 */
silex.model.File.prototype.getHtmlGenerator = function* () {
  // update style tag (the dom do not update automatically when we change document.styleSheets)
  let updatedStyles = this.model.property.getAllStyles(this.contentDocument_);
  this.model.property.saveProperties(this.contentDocument_);
  // clone
  var cleanFile = /** @type {Node} */ (this.contentDocument_.cloneNode(true));
  yield;
  var styleTag = cleanFile.querySelector('.' + silex.model.Property.INLINE_STYLE_TAG_CLASS_NAME);
  styleTag.innerHTML = updatedStyles;
  yield;
  // get html
  var rawHtml = /** @type {Document} */ (cleanFile).documentElement.innerHTML;
  yield;
  // add the outer html (html tag)
  rawHtml = '<html>' + rawHtml + '</html>';
  yield;
  // add doctype
  rawHtml = '<!DOCTYPE html>' + rawHtml;
  yield;
  // add the user's head tag
  rawHtml = this.model.head.insertUserHeadTag(rawHtml);
  yield;
  // beutify html
  rawHtml = window['html_beautify'](rawHtml);
  return rawHtml;
};


/**
 * load an arbitrary url as a silex html file
 * will not be able to save
 * @param {string} url
 * @param {?function(string)=} opt_cbk
 * @param  {?function(Object, string)=} opt_errCbk
 * @export
 */
silex.model.File.prototype.openFromUrl = function(url, opt_cbk = null, opt_errCbk = null) {
  this.isTemplate = true;
  silex.service.CloudStorage.getInstance().loadLocal(url, (rawHtml) => {
    this.fileInfo = /** @type {FileInfo} */ ({
      isDir: false,
      mime: 'text/html',
      url: url
    });
    if (opt_cbk) {
      opt_cbk(rawHtml);
    }
  }, opt_errCbk);
};


/**
 * save a file with a new name
 * @param {FileInfo} fileInfo
 * @param {string} rawHtml
 * @param {function()} cbk receives the raw HTML
 * @param {?function(Object)=} opt_errCbk
 * @export
 */
silex.model.File.prototype.saveAs = function(fileInfo, rawHtml, cbk, opt_errCbk) {
  // save the data
  this.fileInfo = fileInfo;
  this.addToLatestFiles(this.fileInfo);
  this.save(rawHtml, cbk, opt_errCbk);
};


/**
 * write content to the file
 * @param {string} rawHtml
 * @param {function()} cbk
 * @param {?function(Object)=} opt_errCbk
 * @export
 */
silex.model.File.prototype.save = function(rawHtml, cbk, opt_errCbk) {
  if(this.fileInfo == null) throw new Error('Can not save, fileInfo is null');
  silex.service.CloudStorage.getInstance().write(
      /** @type {FileInfo} */ (this.fileInfo),
      rawHtml,
      () => {
        this.isTemplate = false;
        if (cbk) {
          cbk();
        }
      },
      opt_errCbk);
};


/**
 * load a new file
 * @param {FileInfo} fileInfo
 * @param {function(string)} cbk receives the raw HTML
 * @param  {?function(Object, string)=} opt_errCbk
 */
silex.model.File.prototype.open = function(fileInfo, cbk, opt_errCbk) {
  this.isTemplate = false;
  silex.service.CloudStorage.getInstance().read(
      fileInfo,
      (rawHtml) => {
        // update model
        this.close();
        this.fileInfo = fileInfo;
        this.addToLatestFiles(this.fileInfo);
        if (cbk) {
          cbk(rawHtml);
        }
      }, opt_errCbk);
};


/**
 * reset data, close file
 */
silex.model.File.prototype.close = function() {
  this.fileInfo = null;
};


/**
 * get the url of the file
 * @return {?FileInfo}
 */
silex.model.File.prototype.getFileInfo = function() {
  return this.fileInfo;
};


/**
 * clear the recent files
 */
silex.model.File.prototype.clearLatestFiles = function() {
  window.localStorage.removeItem('silex:recent-files');
};


/**
 * get the latest opened files
 * @return {Array.<FileInfo>}
 */
silex.model.File.prototype.getLatestFiles = function() {
  const str = window.localStorage.getItem('silex:recent-files');
  if(str) {
    return (/** @type {Array.<FileInfo>} */ (JSON.parse(str)))
      // remove old URLs from previous CE version
      .filter(fileInfo => fileInfo.name != null);
  }
  else return [];
};


/**
 * store this file in the latest opened files
 * @param {?FileInfo} fileInfo
 */
silex.model.File.prototype.addToLatestFiles = function(fileInfo) {
  // url= http://localhost:6805/api/1.0/github/exec/get/silex-tests/gh-pages/abcd.html
  const latestFiles = this.getLatestFiles();
  // remove if it is already in the array
  // so that it goes back to the top of the list
  let foundIndex = -1;
  latestFiles.forEach((item, idx) => item.url === fileInfo.absPath ? foundIndex = idx : null);
  if(foundIndex > -1) {
    latestFiles.splice(foundIndex, 1);
  }
  latestFiles.unshift(fileInfo);
  // limit size
  if(latestFiles.length > silex.model.File.MAX_RECENT_FILES) {
    latestFiles.splice(silex.model.File.MAX_RECENT_FILES, latestFiles.length - silex.model.File.MAX_RECENT_FILES);
  }
  window.localStorage.setItem('silex:recent-files', JSON.stringify(latestFiles));
};

