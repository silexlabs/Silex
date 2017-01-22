
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
 * @expose
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
  // make everything protocol agnostic to avoid problems with silex being https
  rawHtml = rawHtml.replace('http://', '//', 'g');
  // detect non-silex websites
  if (rawHtml.indexOf('silex-runtime') < 0) {
    console.error('This is not a website editable in Silex.');
    silex.utils.Notification.alert('I can not open this website. I can only open website made with Silex. <a target="_blank" href="https://github.com/silexlabs/Silex/issues/282">More info here</a>.', function() {});
    return;
  }
  else if (rawHtml.indexOf('silex-published') >= 0) {
    console.error('This is a published website.');
    silex.utils.Notification.alert('I can not open this website. It is a published version of a Silex website. <a target="_blank" href="https://github.com/silexlabs/Silex/issues/282">More info here</a>.', function() {});
    return;
  }
  // remove the "silex-runtime" css class from the body while editing
  // this must be done before rendering the dom, because it is used in front-end.js
  rawHtml = rawHtml.replace(/<body(.*)(silex-runtime).*>/, function(match, p1, p2) {
    if (p1.indexOf('>') >= 0) {
      return match;
    }
    return match.replace('silex-runtime', '');
  }, 'g');
  // write the content
  goog.dom.iframe.writeContent(this.iFrameElement_, rawHtml);
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
    setTimeout(goog.bind(function() {
      this.contentChanged(opt_cbk);
    }, this), 0);
    return;
  }

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
};


/**
 * copntent successfully changed in the iframe
 * @param {?function()=} opt_cbk
 */
silex.model.File.prototype.onContentLoaded = function(opt_cbk) {
  // handle retrocompatibility issues
  silex.utils.BackwardCompat.process(this.contentDocument_, this.model, (hasUpgraded) => {
    // check the integrity and store silex style sheet which holds silex elements styles
    this.model.property.initStyles(this.contentDocument_);
    this.model.property.loadProperties(this.contentDocument_);
    // select the body
    this.model.body.setSelection([this.contentDocument_.body]);
    // make editable again
    this.model.body.setEditable(this.contentDocument_.body, true);
    // update text editor with the website custom styles and script
    this.model.head.setHeadStyle(this.model.head.getHeadStyle());
    this.model.head.setHeadScript(this.model.head.getHeadScript());
    // update the settings
    this.model.head.updateFromDom();
    // restore event listeners
    this.view.stage.initEvents(this.contentWindow_);
    // if upgraded, relaod everything
    /*
    if(hasUpgraded) {
      // wait for the BC to complete and the dom to update
      setTimeout(() => {
        this.setHtml(this.getHtml(), opt_cbk);
      }, 200);
      return;
    }
    */
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
 * remove all internal objects and attributes
 */
silex.model.File.prototype.getHtml = function() {
  // clone
  var cleanFile = /** @type {Node} */ (this.contentDocument_.cloneNode(true));
  // update style tag (the dom do not update automatically when we change document.styleSheets)
  this.model.property.updateStylesInDom(/** @type {Document} */ (cleanFile));
  this.model.property.saveProperties(this.contentDocument_);
  // cleanup
  this.model.head.removeTempTags(/** @type {Document} */ (cleanFile).head);
  this.model.body.removeEditableClasses(/** @type {!Element} */ (cleanFile));
  silex.utils.Style.removeInternalClasses(/** @type {!Element} */ (cleanFile), false, true);
  silex.utils.DomCleaner.cleanupFirefoxInlines(this.contentDocument_);
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
 * async verion of getHtml
 * this is an optimisation needed to speedup drag start (which creates an undo point)
 * it uses generator to lower the load induced by these operations
 */
silex.model.File.prototype.getHtmlAsync = function (cbk) {
  var generator = this.getHtmlGenerator();
  this.getHtmlNextStep(cbk, generator);
};


/**
 * does one more step of the async getHtml process
 */
silex.model.File.prototype.getHtmlNextStep = function (cbk, generator) {
  let res = generator.next();
  if(res.done) {
    setTimeout(() => cbk(res.value), 100);
  }
  else {
    setTimeout(() => this.getHtmlNextStep(cbk, generator), 100);
  }
};


/**
 * the async getHtml process
 * yield after each step
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
  // cleanup
  this.model.head.removeTempTags(/** @type {Document} */ (cleanFile).head);
  yield;
  this.model.body.removeEditableClasses(/** @type {!Element} */ (cleanFile));
  yield;
  silex.utils.Style.removeInternalClasses(/** @type {!Element} */ (cleanFile), false, true);
  yield;
  silex.utils.DomCleaner.cleanupFirefoxInlines(this.contentDocument_);
  yield;
  // reset the style set by stage on the body
  goog.style.setStyle(/** @type {Document} */ (cleanFile).body, 'minWidth', '');
  yield;
  goog.style.setStyle(/** @type {Document} */ (cleanFile).body, 'minHeight', '');
  yield;
  // put back the "silex-runtime" css class after editing
  goog.dom.classlist.add(/** @type {Document} */ (cleanFile).body, 'silex-runtime');
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
  // cleanup HTML
  rawHtml = this.model.element.unprepareHtmlForEdit(rawHtml);
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
 * @param {?function(Object, string)=} opt_errCbk
 * @expose
 */
silex.model.File.prototype.openFromUrl = function(url, opt_cbk, opt_errCbk) {
  silex.service.CloudStorage.getInstance().loadLocal(url,
      goog.bind(function(rawHtml) {
        this.setUrl(url);
        if (opt_cbk) {
          opt_cbk(rawHtml);
        }
      }, this), opt_errCbk);
};


/**
 * save a file with a new name
 * @expose
 */
silex.model.File.prototype.saveAs = function(url, rawHtml, cbk, opt_errCbk) {
  // save the data
  this.setUrl(url);
  this.save(rawHtml, cbk, opt_errCbk);
};


/**
 * write content to the file
 * @expose
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
    this.addToLatestFiles(url);
  }
  this.url = url;
};


/**
 * clear the recent files
 */
silex.model.File.prototype.clearLatestFiles = function() {
  window.localStorage.removeItem('silex:recent-files');
};


/**
 * get the latest opened files
 * @return {Array.<{name:string, path:string, cloudIcon:string}>}
 */
silex.model.File.prototype.getLatestFiles = function() {
  const str = window.localStorage.getItem('silex:recent-files');
  if(str) return /** @type {Array.<{name:string, path:string, cloudIcon:string}>} */ (JSON.parse(str));
  else return [];
};


/**
 * store this file in the latest opened files
 * @param {?string} url
 */
silex.model.File.prototype.addToLatestFiles = function(url) {
  // url= http://localhost:6805/api/1.0/github/exec/get/silex-tests/gh-pages/abcd.html
  const latestFiles = this.getLatestFiles();
  const versionIdx = url.indexOf('/api/1.0/');
  if(versionIdx >= 0) {
    // path= /api/1.0/github/exec/get/silex-tests/gh-pages/abcd.html
    const path = url.substr(versionIdx);
    // remove if it is already in the array
    // so that it goes back to the top of the list
    let foundIndex = -1;
    latestFiles.forEach((item, idx) => item.path === path ? foundIndex = idx : null);
    if(foundIndex > -1) {
      latestFiles.splice(foundIndex, 1);
    }
    const serviceIdx = versionIdx + '/api/1.0/'.length;
    // folder= /silex-tests/gh-pages/abcd.html
    const folder = url.substr(url.indexOf('exec/get', serviceIdx) + 'exec/get'.length);
    // service= github
    const service = url.substring(serviceIdx, url.indexOf('/', serviceIdx));
    // cloudIcon= fa-github | fa-dropbox | fa-server | fa-cloud | fa-cloud-download
    const cloudIcon = 'fa-' + (['github', 'dropbox'].indexOf(service) === 0 ? service : (service === 'webdav' ? 'cloud-download' : (service === 'ftp' ? 'server' : 'cloud')));
    latestFiles.unshift({
      'url': url,
      'path': path,
      'folder': folder,
      'service': service,
      'cloudIcon': cloudIcon,
    });
    // limit size
    if(latestFiles.length > silex.model.File.MAX_RECENT_FILES) {
      latestFiles.splice(silex.model.File.MAX_RECENT_FILES, latestFiles.length - silex.model.File.MAX_RECENT_FILES);
    }
    window.localStorage.setItem('silex:recent-files', JSON.stringify(latestFiles));
  }
};
