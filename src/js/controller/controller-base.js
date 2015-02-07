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
 * @fileoverview In Silex, each UI of the view package,
 *      has a controller in the UI controller package which listens to its events,
 *      and call the main {silex.controller.Controller} controller's methods
 *      These UI controllers override the
 *      {silex.controller.ControllerBase} UiControllerBase class
 *
 */
goog.provide('silex.controller.ControllerBase');

goog.require('silex.utils.BackwardCompat');
goog.require('silex.utils.Notification');



/**
 * base class for all UI controllers of the controller package
 * @constructor
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.ControllerBase = function(model, view) {
  // store the model
  this.model = model;
  this.view = view;

  // tracker
  this.tracker = silex.service.Tracker.getInstance();
  window.onerror = goog.bind(function(msg, url, line){
    this.tracker.trackAction('controller-events', 'uncaught.error', msg + '- ' + url + ' - line: ' + line, -1);
  }, this);
};


/**
 * {silex.service.Tracker} tracker used to pull statistics on the user actions
 * @see     silex.service.Tracker
 */
silex.controller.ControllerBase.prototype.tracker = null;


/**
 * {Array.<string>} array of the states of the website
 */
silex.controller.ControllerBase.prototype.undoHistory = [];


/**
 * {Array.<string>} array of the states of the website
 */
silex.controller.ControllerBase.prototype.redoHistory = [];


/**
 * the {Array.<Element>|null} array of elements in the clipboard
 * this is a static attribute
 */
silex.controller.ControllerBase.prototype.clipboard = null;


/**
 * the {Element} element wich is the origin container of the element in the clipboard
 * this is a static attribute
 */
silex.controller.ControllerBase.prototype.clipboardParent = null;


/**
 * store the model state in order to undo/redo
 */
silex.controller.ControllerBase.prototype.undoCheckPoint = function() {
  this.redoHistory = [];
  var html = this.model.file.getHtml();
  var page = this.model.page.getCurrentPage();
  // if the previous state was different
  if (this.undoHistory.length === 0 ||
      this.undoHistory[this.undoHistory.length - 1].html !== html ||
      this.undoHistory[this.undoHistory.length - 1].page !== page) {
    this.undoHistory.push({
      html: html,
      page: page
    });
  }
};


/**
 * reset the undo/redo history
 */
silex.controller.ControllerBase.prototype.undoReset = function() {
  this.undoHistory = [];
  this.redoHistory = [];
};


/**
 * open file explorer, choose an image and set it as the background image of the current selection
 */
silex.controller.ControllerBase.prototype.browseBgImage = function() {
  this.tracker.trackAction('controller-events', 'request', 'selectBgImage', 0);

  var errCbk = function(error) {
    silex.utils.Notification.notifyError('Error: I could not load the image. \n' + (error.message || ''));
    this.tracker.trackAction('controller-events', 'error', 'selectBgImage', -1);
  };

  var successCbk = function(url) {
    // update the model
    var element = this.model.body.getSelection()[0];
    // absolute url only on stage
    var baseUrl = silex.utils.Url.getBaseUrl();
    url = silex.utils.Url.getAbsolutePath(url, baseUrl);
    // undo checkpoint
    this.undoCheckPoint();
    // load the image
    this.model.element.setBgImage(element, url);
    // tracking
    this.tracker.trackAction('controller-events', 'success', 'selectBgImage', 1);
  };

  // open the file browser
  this.view.fileExplorer.openDialog(
      goog.bind(successCbk, this),
      { 'mimetypes': ['image/jpeg', 'image/png', 'image/gif'] },
      goog.bind(errCbk, this)
  );
};


/**
 * open file explorer, choose an image and add it to the stage
 */
silex.controller.ControllerBase.prototype.browseAndAddImage = function() {
  this.tracker.trackAction('controller-events', 'request', 'insert.image', 0);
  this.view.fileExplorer.openDialog(
      goog.bind(function(url) {
        // absolute url only on stage
        var baseUrl = silex.utils.Url.getBaseUrl();
        url = silex.utils.Url.getAbsolutePath(url, baseUrl);
        // undo checkpoint
        this.undoCheckPoint();
        // create the element
        var img = this.addElement(silex.model.Element.TYPE_IMAGE);
        // load the image
        this.model.element.setImageUrl(img, url,
            goog.bind(function(element, img) {
              // update element size
              goog.style.setStyle(element, {
                width: img.naturalWidth + 'px',
                height: img.naturalHeight + 'px'
              });
              this.tracker.trackAction('controller-events', 'success', 'insert.image', 1);
            }, this),
            goog.bind(function(element, message) {
              silex.utils.Notification.notifyError('Error: I did not manage to load the image. \n' + message);
              this.model.element.removeElement(element);
              this.tracker.trackAction('controller-events', 'error', 'insert.image', -1);
            }, this)
        );
      }, this),
      { 'mimetypes': ['image/jpeg', 'image/png', 'image/gif'] },
      goog.bind(function(error) {
        silex.utils.Notification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', 'insert.image', -1);
      }, this)
  );
  this.view.workspace.invalidate(this.view);
};


/**
 * set a given style to the current selection
 * @param  {string} name
 * @param  {?string=} value
 * @param {?Array.<Element>=} opt_elements
 */
silex.controller.ControllerBase.prototype.styleChanged = function(name, value, opt_elements) {
  if (!opt_elements) opt_elements = this.model.body.getSelection();
  // undo checkpoint
  this.undoCheckPoint();
  // apply the change to all elements
  goog.array.forEach(opt_elements, function(element) {
    // update the model
    this.model.element.setStyle(element, name, value);
  }, this);
};


/**
 * set a given property to the current selection
 * @param  {string} name
 * @param  {?string=} value
 * @param {?Array.<Element>=} opt_elements
 * @param {?boolean=} opt_applyToContent
 */
silex.controller.ControllerBase.prototype.propertyChanged = function(name, value, opt_elements, opt_applyToContent) {
  if (!opt_elements) opt_elements = this.model.body.getSelection();
  // undo checkpoint
  this.undoCheckPoint();
  // apply the change to all elements
  goog.array.forEach(opt_elements, function(element) {
    // update the model
    this.model.element.setProperty(element, name, value, opt_applyToContent);
  }, this);
};


/**
 * set css class names
 * @param   {string} name
 */
silex.controller.ControllerBase.prototype.setClassName = function(name) {
  // undo checkpoint
  this.undoCheckPoint();
  // apply the change to all elements
  var elements = this.model.body.getSelection();
  goog.array.forEach(elements, function(element) {
    // update the model
    this.model.element.setClassName(element, name);
  }, this);
};


/**
 * get inline css styles
 * @param   {Element} element
 * @return {string} inline style of the element
 */
silex.controller.ControllerBase.prototype.getInlineStyle = function(element) {
  return this.model.element.getAllStyles(element);
};


/**
 * get css class names
 * @param   {Element} element
 * @return {string} css classes of the element (i.e. className attr)
 */
silex.controller.ControllerBase.prototype.getClassName = function(element) {
  return this.model.element.getClassName(element);
};


/**
 * promp user for page name
 * used in insert page, rename page...
 * @param   {string} defaultName
 * @param   {function(string=, string=)} cbk
 */
silex.controller.ControllerBase.prototype.getUserInputPageName = function(defaultName, cbk) {
  silex.utils.Notification.prompt('Enter a name for your page!', defaultName,
      goog.bind(function(accept, name) {
        if (accept && name && name.length > 0) {
          // keep the full name
          var displayName = name;
          // cleanup the page name
          name = name.replace(/\W+/g, '-').toLowerCase();
          // do not allow to start with an dash or number (see css specifications)
          name = 'page-' + name;
          // check if a page with this name exists
          var pages = this.model.page.getPages();
          var exists = false;
          goog.array.forEach(pages, function(pageName) {
            if (pageName === name)
              exists = true;
          });
          if (exists) {
            // just open the new page
            this.openPage(name);
          }
          else {
            cbk(name, displayName);
          }
        }
        cbk();
      }, this));
};


/**
 * called after an element has been created
 * add the element to the current page (only if it has not a container which is in a page)
 * redraw the tools and set the element as editable
 * @param {Element} element the element to add
 */
silex.controller.ControllerBase.prototype.doAddElement = function(element) {
  // only visible on the current page
  var currentPageName = this.model.page.getCurrentPage();
  this.model.page.removeFromAllPages(element);
  this.model.page.addToPage(element, currentPageName);
  // unless one of its parents is in a page already
  this.checkElementVisibility(element);
  // select the component
  this.model.body.setSelection([element]);
  // set element editable
  this.model.body.setEditable(element, true);
};


/**
 * check if the element's parents belong to a page, and if one of them do,
 * remove the element from the other pages
 *
 * if the element is in a container which is visible only on some pages,
 * then the element should be visible everywhere, i.e. in the same pages as its parent
 * @param   {Element} element
 */
silex.controller.ControllerBase.prototype.checkElementVisibility = function(element) {
  var parentPage = this.model.page.getParentPage(element);
  if (parentPage !== null) {
    // get all the pages
    var pages = this.model.page.getPagesForElement(element);
    for (let idx in pages) {
      // remove the component from the page
      var pageName = pages[idx];
      this.model.page.removeFromPage(element, pageName);
    }
  }
};


/**
 * ask the user for a new file title
 */
silex.controller.ControllerBase.prototype.setTitle = function(title) {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setTitle(title);
};


/**
 * refresh font list in the text editor, and in the head tag
 */
silex.controller.ControllerBase.prototype.refreshFonts = function() {
  //update loaded font list, as user might have choose a new one
  var neededFonts = this.model.body.getNeededFonts();
  // refresh the font list in the text editor
  var customFontsForTextEditor = this.model.head.refreshFontList(neededFonts);
  this.view.textEditor.setCustomFonts(customFontsForTextEditor);
};


