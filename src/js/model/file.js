
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
};


/**
 * name of the new file template
 * @const
 */
silex.model.File.CREATION_TEMPLATE = 'creation-template.html';


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
 * current file url
 * if the current file is a new file, it has no url
 * if set, this is an absolute URL, use silex.model.File::getUrl to get the relatvie URL
 * @type {?string}
 */
silex.model.File.prototype.url = null;


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
 * build the html content
 * Parse the raw html and fill the bodyElement and headElement
 * @param {string} rawHtml
 * @param {?function()=} opt_cbk
 * @param {?boolean=} opt_showLoader
 */
silex.model.File.prototype.setHtml = function(rawHtml, opt_cbk, opt_showLoader) {
  // loading
  if (opt_showLoader !== false) {
    goog.dom.classlist.add(this.view.stage.element, silex.model.File.LOADING_CSS_CLASS);
  }
  else {
    goog.dom.classlist.add(this.view.stage.element, silex.model.File.LOADING_LIGHT_CSS_CLASS);
  }
  // cleanup
  this.model.body.setEditable(this.contentDocument_.body, false);
  this.view.stage.removeEvents(this.contentDocument_.body);
  // when the iframe content has changed
  goog.events.listenOnce(this.iFrameElement_, 'load', function() {
    // remove the "silex-runtime" css class from the body while editing
    goog.dom.classlist.remove(this.contentDocument_.body, 'silex-runtime');
    // include edition tags and call onContentLoaded
    // the first time, it takes time to load the scripts
    // the second time, no load event, and jquery is already loaded

    // first time in chrome, and always in firefox
    // load scripts for edition in the iframe
    this.includeEditionTags(goog.bind(function() {
      this.onContentLoaded(opt_cbk);
    }, this), goog.bind(function() {
      // error loading editable script
      console.error('error loading editable script');
      throw new Error('error loading editable script');
    }, this));
  }, false, this);
  // add base tag from the beginning
  // should not be needed since we change all  the URLs to absolute
  // but just in case abs/rel conversion bugs
  if (this.url) {
    rawHtml = rawHtml.replace('<head>', '<head><base class="' + silex.model.Head.SILEX_TEMP_TAGS_CSS_CLASS + '" href="' + this.url + '" target="_blank">');
  }
  // remove user's head tag before it is interprated by the browser
  // - in case it has bad HTML tags, it could break the whole site, insert tags into the body instead of the head...
  rawHtml = this.model.head.extractUserHeadTag(rawHtml);
  // prepare HTML
  rawHtml = this.model.element.prepareHtmlForEdit(rawHtml);
  // write the content
  goog.dom.iframe.writeContent(this.iFrameElement_, rawHtml);
};


/**
 * copntent successfully changed in the iframe
 * @param {function()} opt_cbk
 */
silex.model.File.prototype.onContentLoaded = function(opt_cbk) {
  if (!goog.dom.classlist.contains(this.contentDocument_.body, 'pageable-plugin-created')) {
    // let the time for the scripts to execute (e.g. pageable)
    setTimeout(goog.bind(function() {
      this.onContentLoaded(opt_cbk);
    }, this), 1);
    return;
  }

  // handle retrocompatibility issues
  silex.utils.BackwardCompat.process(this.contentDocument_, this.model, () => {
    // check the integrity and store silex style sheet which holds silex elements styles
    this.model.property.initSilexStyleTag(this.contentDocument_);
    this.model.property.setCurrentSilexStyleSheet(this.model.property.getSilexStyleSheet(this.contentDocument_));
    // select the body
    this.model.body.setSelection([this.contentDocument_.body]);
    // make editable again
    this.model.body.setEditable(this.contentDocument_.body, true, true);
    // update text editor with the website custom styles and script
    this.model.head.setHeadStyle(this.model.head.getHeadStyle());
    this.model.head.setHeadScript(this.model.head.getHeadScript());
    // update the settings
    this.model.head.updateFromDom();
    // restore event listeners
    this.view.stage.initEvents(this.contentWindow_);
    // refresh the view
    //var page = this.model.page.getCurrentPage();
    //this.model.page.setCurrentPage(page);
    // notify the caller
    if (opt_cbk) {
      opt_cbk();
    }
    // loading
    setTimeout(goog.bind(function() {
      goog.dom.classlist.remove(this.view.stage.element, silex.model.File.LOADING_CSS_CLASS);
      goog.dom.classlist.remove(this.view.stage.element, silex.model.File.LOADING_LIGHT_CSS_CLASS);
      // refresh the view (workaround for a bug where no page is opened after open a website or undo)
      var page = this.model.page.getCurrentPage();
      this.model.page.setCurrentPage(page);
      setTimeout(goog.bind(function() {
        this.model.page.setCurrentPage(page);
      }, this), 300);
    }, this), 100);
  });
};


/**
 * load all scripts needed for edit and display
 * in the iframe
 * WARNING:
 *    this is not used when the scripts are cached by the browser (see how this method is called, only the 1st time the website is loaded)
 * @param {?function()=} opt_onSuccess
 * @param {?function()=} opt_onError
 */
silex.model.File.prototype.includeEditionTags = function(opt_onSuccess, opt_onError) {
  var tags = [];
  // css tags
  var styles = [
    'css/editable.css'
  ];
  goog.array.forEach(styles, function(url) {
    var tag = this.contentDocument_.createElement('link');
    tag.rel = 'stylesheet';
    tag.href = silex.utils.Url.getAbsolutePath(url, window.location.href);
    tags.push(tag);
  }, this);
  // load all tags
  this.model.head.addTempTag(tags, opt_onSuccess, opt_onError);
};


/**
 * build a string of the raw html content
 * use the bodyTag and headTag objects
 */
silex.model.File.prototype.getHtml = function() {
  // cleanup
  //this.model.body.setEditable(this.contentDocument_.body, false);
  // clone
  var cleanFile = /** @type {Node} */ (this.contentDocument_.cloneNode(true));
  // update style tag (the dom do not update automatically when we change document.styleSheets)
  this.model.property.updateSilexStyleTag(/** @type {Document} */ (cleanFile));
  // cleanup
  this.model.head.removeTempTags(/** @type {Document} */ (cleanFile).head);
  this.model.body.removeEditableClasses(/** @type {!Element} */ (cleanFile));
  silex.utils.Style.removeInternalClasses(/** @type {!Element} */ (cleanFile), false, true);
  silex.utils.Dom.cleanupFirefoxInlines(this.contentDocument_);
  // reset the style set by stage on the body
  goog.style.setStyle(/** @type {Document} */ (cleanFile).body, 'minWidth', '');
  goog.style.setStyle(/** @type {Document} */ (cleanFile).body, 'minHeight', '');
  // put back the "silex-runtime" css class after editing
  goog.dom.classlist.add(/** @type {Document} */ (cleanFile).body, 'silex-runtime');
  // get html
  var rawHtml = /** @type {Document} */ (cleanFile).documentElement.innerHTML;
  // add the outer html (html tag)
  rawHtml = '<html>' + rawHtml + '</html>';
  // add doctype
  rawHtml = '<!DOCTYPE html>' + rawHtml;
  // cleanup HTML
  rawHtml = this.model.element.unprepareHtmlForEdit(rawHtml);
  // add the user's head tag
  rawHtml = this.model.head.insertUserHeadTag(rawHtml);
  // beutify html
  rawHtml = window['html_beautify'](rawHtml);
  return rawHtml;
};


/**
 * load an empty new file
 */
silex.model.File.prototype.newFile = function(cbk, opt_errCbk) {
  this.openFromUrl(silex.model.File.CREATION_TEMPLATE, cbk, opt_errCbk);
};


/**
 * load an arbitrary url as a silex html file
 * will not be able to save
 */
silex.model.File.prototype.openFromUrl = function(url, cbk, opt_errCbk) {
  silex.service.CloudStorage.getInstance().loadLocal(url,
      goog.bind(function(rawHtml) {
        this.setUrl(null);
        if (cbk) {
          cbk(rawHtml);
        }
      }, this), opt_errCbk);
};


/**
 * save a file with a new name
 */
silex.model.File.prototype.saveAs = function(url, rawHtml, cbk, opt_errCbk) {
  // save the data
  this.setUrl(url);
  this.save(rawHtml, cbk, opt_errCbk);
};


/**
 * write content to the file
 */
silex.model.File.prototype.save = function(rawHtml, cbk, opt_errCbk) {
  silex.service.CloudStorage.getInstance().save(
      this.getUrl(),
      rawHtml,
      function() {
        if (cbk) {
          cbk();
        }
      },
      opt_errCbk);
};


/**
 * load a new file
 */
silex.model.File.prototype.open = function(url, cbk, opt_errCbk) {
  silex.service.CloudStorage.getInstance().load(
      url,
      goog.bind(function(rawHtml) {
        // update model
        this.close();
        this.setUrl(url);
        if (cbk) {
          cbk(rawHtml);
        }
      }, this), opt_errCbk);
};


/**
 * reset data, close file
 */
silex.model.File.prototype.close = function() {
  this.url = null;
};


/**
 * get the url of the file
 */

silex.model.File.prototype.getUrl = function() {
  // revert to relative URL
  if (this.url){
    var baseUrl = silex.utils.Url.getBaseUrl();
    return silex.utils.Url.getRelativePath(this.url, baseUrl);
  }
  return this.url;
};


/**
 * store url of this file
 * @param {?string} url
 */
silex.model.File.prototype.setUrl = function(url) {
  if (url) {
    var baseUrl = silex.utils.Url.getBaseUrl();
    url = silex.utils.Url.getAbsolutePath(url, baseUrl);
  }
  this.url = url;
};
