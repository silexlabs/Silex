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
 * @fileoverview A controller listens to a view element,
 *      and call the main {silex.controller.Controller} controller's methods
 *
 */
goog.provide('silex.controller.FileMenuController');

goog.require('silex.controller.ControllerBase');
goog.require('silex.service.SilexTasks');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase}
 * listen to the view events and call the main controller's methods}
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.FileMenuController = function(model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.FileMenuController, silex.controller.ControllerBase);


/**
 * open a file
 * @param {?function()=} opt_cbk
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.newFile = function(opt_cbk, opt_errorCbk) {

  this.tracker.trackAction('controller-events', 'request', 'file.new', 0);

  this.model.file.newFile(goog.bind(function(rawHtml) {
    // undo redo reset
    this.undoReset();
    this.model.file.setHtml(rawHtml, goog.bind(function() {
      this.fileOperationSuccess(null, true);
      // QOS, track success
      this.tracker.trackAction('controller-events', 'success', 'file.new', 1);
      if (opt_cbk) {
        opt_cbk();
      }
    }, this));
  }, this), goog.bind(function(error) {
    this.tracker.trackAction('controller-events', 'error', 'file.new', -1);
    if (opt_errorCbk) opt_errorCbk(error);
  }, this));
};


/**
 * open a file
 * @param {?function()=} opt_cbk
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.openFile = function(opt_cbk, opt_errorCbk) {
  // QOS, track success
  this.tracker.trackAction('controller-events', 'request', 'file.open', 0);
  // let the user choose the file
  this.view.fileExplorer.openDialog(
      goog.bind(function(url) {
        // undo redo reset
        this.undoReset();
        this.model.file.open(url, goog.bind(function(rawHtml) {
          this.model.file.setHtml(rawHtml, goog.bind(function() {
            // check that it is a Silex website (if we have at least 1 page and not the silex-published class)
            if (goog.dom.getElementByClass('page-element', this.model.body.getBodyElement()) && !goog.dom.classlist.contains(this.model.body.getBodyElement(), 'silex-published')) {
              // display and redraw
              this.fileOperationSuccess(this.model.head.getTitle() + ' opened.', true);
              // QOS, track success
              this.tracker.trackAction('controller-events', 'success', 'file.open', 1);
              if (opt_cbk) opt_cbk();
            }
            else {
              // this website is not an editable Silex website?
              var message = 'This file is not an editable Silex website.';
              silex.utils.Notification.notifyError('Error: ' + message);
              this.tracker.trackAction('controller-events', 'error', 'file.open_not.editable', -1);
              if (opt_errorCbk) opt_errorCbk({message: message});
            }
          }, this));
        }, this),
        goog.bind(function(error) {
          silex.utils.Notification.notifyError('Error: I did not manage to open this file. \n' + (error.message || ''));
          this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
          if (opt_errorCbk) opt_errorCbk(error);
        }, this));
      }, this),
      {'mimetype': 'text/html'},
      goog.bind(function(error) {
        this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
        if (opt_errorCbk) opt_errorCbk(error);
      }, this));
};


/**
 * save or save-as
 * @param {string} url
 * @param {?function()=} opt_cbk
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.doSave = function(url, opt_cbk, opt_errorCbk) {
  // undo redo reset
  if (this.model.file.getUrl() !== url) {
    this.undoReset();
  }
  // urls will be relative to the html file url
  this.model.file.setUrl(url);
  // relative urls only in the files
  var rawHtml = this.model.file.getHtml();
  // look for bug of firefox inserting quotes in url("")
  if (rawHtml.indexOf("url('&quot;") > -1) {
    this.tracker.trackAction('controller-events', 'warning', 'file.save.corrupted', -1);
    rawHtml = rawHtml.replace(/url\('&quot;()(.+?)\1&quot;'\)/gi, goog.bind(function(match, group1, group2) {
      return 'url(\'' + group2 + '\')';
    }, this));
  }
  // save to file
  this.model.file.saveAs(
      url,
      rawHtml,
      goog.bind(function() {
        this.tracker.trackAction('controller-events', 'success', 'file.save', 1);
        this.fileOperationSuccess('File is saved.', false);
        if (opt_cbk) opt_cbk();
      }, this),
      goog.bind(function(error) {
        silex.utils.Notification.notifyError('Error: I did not manage to save the file. \n' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', 'file.save', -1);
        if (opt_errorCbk) opt_errorCbk(error);
      }, this));
};


/**
 * save or save-as
 * @param {?string=} opt_url
 * @param {?function()=} opt_cbk
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.save = function(opt_url, opt_cbk, opt_errorCbk) {
  this.tracker.trackAction('controller-events', 'request', 'file.save', 0);
  if (opt_url) {
    this.doSave(opt_url, opt_cbk, opt_errorCbk);
  }
  else {
    // choose a new name
    this.view.fileExplorer.saveAsDialog(
        goog.bind(function(url) {
          this.doSave(url, opt_cbk, opt_errorCbk);
        }, this),
        {'mimetype': 'text/html'},
        goog.bind(function(error) {
          this.tracker.trackAction('controller-events', 'error', 'file.save', -1);
          if (opt_errorCbk) opt_errorCbk(error);
        }, this));
  }
};


/**
 * success of an operation involving changing the file model
 * @param {?string=} opt_message
 * @param {?boolean=} opt_updateTools
 */
silex.controller.FileMenuController.prototype.fileOperationSuccess = function(opt_message, opt_updateTools) {
  // update tools
  if (opt_updateTools) {
    // find default first page
    var pages = this.model.page.getPages();
    // open default page
    this.model.page.setCurrentPage(pages[0]);
    // update fonts
    this.refreshFonts();
  }
  if (opt_message) {
    // notify user
    silex.utils.Notification.notifySuccess(opt_message);
  }
};


/**
 * ask the user for a new file title
 */
silex.controller.FileMenuController.prototype.publish = function() {
  this.tracker.trackAction('controller-events', 'request', 'file.publish', 0);
  if (!this.model.head.getPublicationPath()) {
    silex.utils.Notification.alert('I do not know where to publish your site. \
      Select a folder in the settings pannel and do "publish" again. \
      \nNow I will open the publish settings.',
        goog.bind(function() {
          this.view.settingsDialog.openDialog(function() {
            //here the panel was closed
          });
          this.view.workspace.invalidate(this.view);
          this.tracker.trackAction('controller-events', 'cancel', 'file.publish', 0);
        }, this));
  }
  else
  {
    silex.utils.Dom.publish(
        this.model.head.getPublicationPath(),
        this.model.file.getUrl(),
        this.model.file.getHtml(),
        goog.bind(function(status) {
          if (status && status.success === false) {
            console.error('Error: I did not manage to publish the file. (1)');
            silex.utils.Notification.notifyError('I did not manage to publish the file. You may want to check the publication settings and your internet connection. \nError message: ' + (status.message || status.code || ''));
            this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
          }
          else {
            silex.utils.Notification.notifySuccess('I am about to publish your site. This may take several minutes.');
            this.tracker.trackAction('controller-events', 'success', 'file.publish', 1);
          }
        }, this),
        goog.bind(function(error) {
          var msg = '';
          if (error) msg = error;
          if (error.message) msg = error.message;
          console.error('Error: I did not manage to publish the file. (2)', msg);
          silex.utils.Notification.notifyError('I did not manage to publish the file. You may want to check the publication settings and your internet connection. \nError message: ' + msg);
          this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
        }, this));
  }
};
