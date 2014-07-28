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
 * @constructor
 * base class for all UI controllers of the controller package
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.ControllerBase = function(controller, model, view) {
  // store the model
  this.model = model;
  this.controller = controller;
  this.view = view;

  // tracker
  this.tracker = silex.service.Tracker.getInstance();
};


/**
 * {silex.service.Tracker} tracker used to pull statistics on the user actions
 * @see     silex.service.Tracker
 */
silex.controller.ControllerBase.prototype.tracker = null;


/**
 * the {Array<Element>} array of elements in the clipboard
 * this is a static attribute
 * TODO: Move this elsewhere?
 */
silex.controller.ControllerBase.clipboard = null;


/**
 * the {Element} element wich is the origin container of the element in the clipboard
 * this is a static attribute
* TODO: Move this elsewhere?
 */
silex.controller.ControllerBase.clipboardParent = null;


/**
 * open file explorer, choose an image and set it as the background image of the current selection
 */
silex.controller.ControllerBase.prototype.browseBgImage = function() {
  this.tracker.trackAction('controller-events', 'request', 'selectBgImage', 0);

  var errCbk = function(error) {
    silex.utils.Notification.notifyError('Error: I could not load the image. \n' + (error.message || ''));
    this.tracker.trackAction('controller-events', 'error', type, -1);
  };

  var successCbk = function(url) {
    // update the model
    var element = this.model.body.getSelection()[0];
    // absolute url only on stage
    var baseUrl = silex.utils.Url.getBaseUrl();
    url = silex.utils.Url.getAbsolutePath(url, baseUrl);
    // load the image
    this.model.element.setBgImage(element, url);
    // tracking
    this.tracker.trackAction('controller-events', 'success', 'selectBgImage', 1);
  };

  // open the file browser
  this.view.fileExplorer.openDialog(
      goog.bind(successCbk, this),
      { mimetypes: ['image/jpeg', 'image/png', 'image/gif'] },
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
              this.tracker.trackAction('controller-events', 'error', 'insert.image', 1);
            }, this)
        );
      }, this),
      { mimetypes: ['image/jpeg', 'image/png', 'image/gif'] },
      goog.bind(function(error) {
        silex.utils.Notification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', 'insert.image', -1);
      }, this)
  );
  this.view.workspace.invalidate();
};


/**
 * set a given style to the current selection
 */
silex.controller.ControllerBase.prototype.styleChanged = function(name, value, opt_elements) {
  if (!opt_elements) opt_elements = this.model.body.getSelection();
  // apply the change to all elements
  goog.array.forEach(opt_elements, function(element) {
    // update the model
    this.model.element.setStyle(element, name, value);
    // update drop zones z index
    //this.model.body.resetEditable(this.model.body.getBodyElement(), true);
  }, this);
};


/**
 * set a given property to the current selection
 */
silex.controller.ControllerBase.prototype.propertyChanged = function(name, value, opt_elements, opt_applyToContent) {
  if (!opt_elements) opt_elements = this.model.body.getSelection();
  // apply the change to all elements
  goog.array.forEach(opt_elements, function(element) {
    // update the model
    this.model.element.setProperty(element, name, value, opt_applyToContent);
  }, this);
};


/**
 * set css class names
 */
silex.controller.ControllerBase.prototype.setClassName = function(name) {
  // apply the change to all elements
  var elements = this.model.body.getSelection();
  goog.array.forEach(elements, function(element) {
    // update the model
    this.model.element.setClassName(element, name);
  }, this);
};


/**
 * get css class names
 */
silex.controller.ControllerBase.prototype.getClassName = function(element) {
  return this.model.element.getClassName(element);
};


/**
 * open a page
 */
silex.controller.ControllerBase.prototype.openPage = function(pageName) {
  this.model.page.setCurrentPage(pageName);
};


/**
 * rename a page
 */
silex.controller.ControllerBase.prototype.renamePage = function(opt_pageName) {
  // default to the current page
  if (!opt_pageName) {
    opt_pageName = this.model.page.getCurrentPage();
  }
  this.getUserInputPageName(
      this.model.page.getDisplayName(opt_pageName),
      goog.bind(function(name, newDisplayName) {
        if (newDisplayName) {
          // update model
          this.model.page.renamePage(opt_pageName, name, newDisplayName);
        }
        else {
          // just open the new page
          this.openPage(opt_pageName);
        }
        // update view
      }, this));
};


/**
 * remvove a page
 */
silex.controller.ControllerBase.prototype.removePage = function(opt_pageName) {
  // default to the current page
  if (!opt_pageName) {
    opt_pageName = this.model.page.getCurrentPage(this.model.body.getBodyElement());
  }
  // confirm and delete
  silex.utils.Notification.confirm('I am about to <strong>delete the page "' +
      this.model.page.getDisplayName(opt_pageName) +
      '"</strong>, are you sure?',
      goog.bind(function(accept) {
        if (accept) {
          // update model
          this.model.page.removePage(opt_pageName);
        }
      }, this), 'delete', 'cancel');
};


/**
 * input a page name
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
          var pages = this.model.page.getPages(this.model.body.getBodyElement());
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
        cbk(null);
      }, this));
};


/**
 * check if the element's parents belong to a page, and if one of them do,
 * remove the element from the other pages
 *
 * if the element is in a container which is visible only on some pages,
 * then the element should be visible everywhere, i.e. in the same pages as its parent
 */
silex.controller.ControllerBase.prototype.checkElementVisibility = function(element) {
  var parentPage = this.model.page.getParentPage(element);
  if (parentPage !== null) {
    // get all the pages
    var pages = this.model.page.getPagesForElement(element);
    for (var idx in pages) {
      // remove the component from the page
      var pageName = pages[idx];
      this.model.page.removeFromPage(element, pageName);
    }
  }
};


/**
 * ask the user for a new file title
 */
silex.controller.ControllerBase.prototype.promptTitle = function() {
  silex.utils.Notification.prompt('What is the name of your website?',
      this.model.head.getTitle(),
      goog.bind(function(accept, name) {
        if (accept) {
          this.model.head.setTitle(name);
        }
      }, this));
};


/**
 * refresh font list in the text editor, and in the head tag
 */
silex.controller.ControllerBase.prototype.refreshFonts = function() {
  //update loaded font list, as user might have choose a new one
  var neededFonts = this.model.body.getNeededFonts();
  this.model.head.refreshFontList(neededFonts);
};


