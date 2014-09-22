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
 *
 *   All model classes are singletons
 */

goog.provide('silex.model.File');
goog.require('silex.Config');
goog.require('silex.service.SilexTasks');



/**
 * @constructor
 * @param  {silex.types.View} view  view class which holds the other views
 * @param  {silex.types.Model} model  model class which holds the other models
 */
silex.model.File = function(model, view) {
  this.model = model;
  this.view = view;
};


/**
 * name of the new file template
 */
silex.model.File.CREATION_TEMPLATE = 'creation-template.html';


/**
 * current file url
 * if the current file is a new file, it has no url
 * if set, this is an absolute URL, use silex.model.File::getUrl to get the relatvie URL
 */
silex.model.File.prototype.url = null;


/**
 * build the html content
 * Parse the raw html and fill the bodyElement and headElement
 * @param {string} rawHtml
 * @param {?function()=} opt_cbk
 * @param {?boolean=} opt_showLoader
 */
silex.model.File.prototype.setHtml = function(rawHtml, opt_cbk, opt_showLoader) {
  var iframeElement = /** @type {!HTMLIFrameElement} */ (goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));
  var contentDocument = goog.dom.getFrameContentDocument(iframeElement);
  // loading
  if (opt_showLoader !== false) {
    goog.dom.classlist.add(iframeElement, silex.model.Element.LOADING_ELEMENT_CSS_CLASS);
  }
  // cleanup
  this.model.body.setEditable(contentDocument.body, false);
  this.view.stage.removeEvents(contentDocument.body);
  // when the iframe content has changed
  goog.events.listenOnce(iframeElement, 'load', function() {
    // remove the "silex-runtime" css class from the body while editing
    goog.dom.classlist.remove(contentDocument.body, 'silex-runtime');
    // include edition tags and call onContentLoaded
    // the first time, it takes time to load the scripts
    // the second time, no load event, and jquery is already loaded
    if (!iframeElement.contentWindow.jQuery) {
      // first time in chrome, and always in firefox
      // load scripts for edition in the iframe
      this.includeEditionTags(goog.bind(function() {
        this.onContentLoaded(opt_cbk);
      }, this), goog.bind(function() {
        // error loading editable script
        console.error('error loading editable script');
        throw new Error('error loading editable script');
      }, this));
    }
    else {
      // second time in chrome, jquery already loaded
      // call include scripts with no callback
      this.includeEditionTags();
      iframeElement.contentWindow.jQuery(goog.bind(function() {
        this.onContentLoaded(opt_cbk);
      }, this));
    }
  }, false, this);
  // add base tag from the beginning
  // should not be needed since we change all  the URLs to absolute
  // but just in case abs/rel conversion bugs
  if (this.url) rawHtml = rawHtml.replace('<head>', '<head><base class="' + silex.model.Head.SILEX_TEMP_TAGS_CSS_CLASS + '" href="' + this.url + '" target="_blank">');
  // prevent scripts from executing
  rawHtml = rawHtml.replace(/type=\"text\/javascript\"/gi, 'type="text/notjavascript"');
  // convert to absolute urls
  if (this.url) {
    rawHtml = silex.utils.Url.relative2Absolute(rawHtml, this.url);
  }
  // write the content
  goog.dom.iframe.writeContent(iframeElement, rawHtml);
};


/**
 * copntent successfully changed in the iframe
 */
silex.model.File.prototype.onContentLoaded = function(opt_cbk) {
  var iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
  var contentDocument = goog.dom.getFrameContentDocument(iframeElement);
  var contentWindow = goog.dom.getFrameContentWindow(iframeElement);

  if (!goog.dom.classlist.contains(contentDocument.body, 'pageable-plugin-created')) {
    // let the time for the scripts to execute (e.g. pageable)
    setTimeout(goog.bind(function() {
      this.onContentLoaded(opt_cbk);
    }, this), 500);
    return;
  }

  // handle retrocompatibility issues
  silex.utils.BackwardCompat.process(contentDocument);
  // select the body
  this.model.body.setSelection([contentDocument.body]);
  // make editable again
  this.model.body.setEditable(contentDocument.body, true, true);
  // update text editor with the sebsite custom style
  this.model.head.setHeadStyle(this.model.head.getHeadStyle());
  // update site title
  this.model.head.setTitle(this.model.head.getTitle());
  // update the settings dialog
  this.model.head.setPublicationPath(this.model.head.getPublicationPath());
  //update loaded font list, as user might have choose a new one
  var neededFonts = this.model.body.getNeededFonts();
  this.model.head.refreshFontList(neededFonts);
  // restore event listeners
  this.view.stage.initEvents(contentWindow);
  // refresh the view
  //var page = this.model.page.getCurrentPage();
  //this.model.page.setCurrentPage(page);
  // notify the caller
  if (opt_cbk) opt_cbk();
  // loading
  setTimeout(goog.bind(function() {
    goog.dom.classlist.remove(iframeElement, silex.model.Element.LOADING_ELEMENT_CSS_CLASS);
  }, this), 200);
};


/**
 * load all scripts needed for edit and display
 * in the iframe
 * @param {?function()=} opt_onSuccess
 * @param {?function()=} opt_onError
 */
silex.model.File.prototype.includeEditionTags = function(opt_onSuccess, opt_onError) {
  var iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
  var contentDocument = goog.dom.getFrameContentDocument(iframeElement);
  var tags = [];
  // js script tags
  var scripts = [
    'libs/jquery/jquery.js',
    'libs/jquery/jquery-ui.js',
    'libs/jquery/pageable.js',
    'libs/jquery/editable.js',
    'js/front-end.js'
  ];
  goog.array.forEach(scripts, function(url) {
    var tag = contentDocument.createElement('script');
    tag.type = 'text/javascript';
    tag.src = silex.utils.Url.getAbsolutePath(url, window.location.href);
    tags.push(tag);
  });
  // css tags
  var styles = [
    'libs/jquery/editable.css',
    'libs/jquery/jquery.ui.core.css',
    'libs/jquery/jquery-ui.css',
    'css/front-end.css',
    'libs/normalize.css'
  ];
  goog.array.forEach(styles, function(url) {
    var tag = contentDocument.createElement('link');
    tag.rel = 'stylesheet';
    tag.href = silex.utils.Url.getAbsolutePath(url, window.location.href);
    tags.push(tag);
  });
  // load all tags
  this.model.head.addTempTag(tags, opt_onSuccess, opt_onError);
};


/**
 * build a string of the raw html content
 * use the bodyTag and headTag objects
 */
silex.model.File.prototype.getHtml = function() {
  var iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);
  var contentDocument = goog.dom.getFrameContentDocument(iframeElement);
  // cleanup
  //this.model.body.setEditable(contentDocument.body, false);
  // clone
  var cleanFile = /** @type {Node} */ (contentDocument.cloneNode(true));
  // make editable again
  //this.model.body.setEditable(contentDocument.body, true, true);
  // cleanup
  this.model.head.removeTempTags(/** @type {Document} */ (cleanFile).head);
  this.model.body.removeEditableClasses(/** @type {!Element} */ (cleanFile));
  silex.utils.Style.removeInternalClasses(/** @type {!Element} */ (cleanFile), false, true);
  // reset the style set by stage on the body
  goog.style.setStyle(/** @type {Document} */ (cleanFile).body, 'minWidth');
  goog.style.setStyle(/** @type {Document} */ (cleanFile).body, 'minHeight');
  // put back the "silex-runtime" css class after editing
  goog.dom.classlist.add(/** @type {Document} */ (cleanFile).body, 'silex-runtime');
  // get html
  var rawHtml = /** @type {Document} */ (cleanFile).documentElement.innerHTML;
  // put back the scripts
  rawHtml = rawHtml.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"');
  // remove cache control used to refresh images after editing by pixlr
  rawHtml = silex.utils.Dom.removeCacheControl(rawHtml);
  // convert to relative urls
  if (this.url) {
    rawHtml = silex.utils.Url.absolute2Relative(rawHtml, this.url);
  }
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
        if (cbk) cbk(rawHtml);
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
        if (cbk) cbk();
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
        if (cbk) cbk(rawHtml);
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
  if (this.url) {
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
