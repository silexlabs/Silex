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
    this.model.file.setHtml(rawHtml, goog.bind(function() {
      // undo redo reset
      this.undoReset();
      this.fileOperationSuccess(null, true);
      // QOS, track success
      this.tracker.trackAction('controller-events', 'success', 'file.new', 1);
      if (opt_cbk) {
        opt_cbk();
      }
    }, this));
  }, this), goog.bind(function(error) {
    this.tracker.trackAction('controller-events', 'error', 'file.new', -1);
    if (opt_errorCbk) {
      opt_errorCbk(error);
    }
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
        this.model.file.open(url, goog.bind(function(rawHtml) {
          this.model.file.setHtml(rawHtml, goog.bind(function() {
            // undo redo reset
            this.undoReset();
            // display and redraw
            this.fileOperationSuccess((this.model.head.getTitle() || 'Untitled website') + ' opened.', true);
            // QOS, track success
            this.tracker.trackAction('controller-events', 'success', 'file.open', 1);
            if (opt_cbk) {
              opt_cbk();
            }
          }, this));
        }, this),
        goog.bind(function(error) {
          silex.utils.Notification.notifyError('Error: I did not manage to open this file. \n' + (error.message || ''));
          this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
          if (opt_errorCbk) {
            opt_errorCbk(error);
          }
        }, this));
      }, this),
      {'mimetype': 'text/html'},
      goog.bind(function(error) {
        this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
        if (opt_errorCbk) {
          opt_errorCbk(error);
        }
      }, this));
};


/**
 * ask the user for a new file title
 * handle tracking and call the Dom helper
 */
silex.controller.FileMenuController.prototype.publish = function() {
  if(silex.utils.Notification.isActive) {
    console.warn('Publish canceled because a modal dialog is opened already.');
    return;
  }
  this.tracker.trackAction('controller-events', 'request', 'file.publish', 0);
  if (!this.model.head.getPublicationPath()) {
    silex.utils.Notification.alert('I do not know where to publish your site.' +
      'Select a folder in the settings pannel and do "publish" again.' +
      '\nNow I will open the publish settings.',
        goog.bind(function() {
          this.view.settingsDialog.openDialog(function() {
            //here the panel was closed
          });
          this.view.workspace.redraw(this.view);
          this.tracker.trackAction('controller-events', 'cancel', 'file.publish', 0);
        }, this));
  }
  else
  {
    silex.utils.Dom.publish(
        /** @type {string} */ (this.model.head.getPublicationPath()),
        this.model.file.getUrl(),
        this.model.file.getHtml(),
        goog.bind(function(status) {
          silex.utils.Notification.alert('<strong>I am about to publish your site. This may take several minutes.</strong>', () => clearInterval(timer), 'Close');
          setTimeout(() => silex.utils.Notification.setInfoPanel('<a href="http://crowdfunding.silex.me/" target="_blank"><p style="text-align: center; border-top: 1px solid grey; padding-top: 10px;">Participate to the crowd funding!<BR />For a better Silex, let us help you help us.</p><div style="width: 100%; height: 100%; background-image: url(http://www.silex.me/assets/silex-01.jpg); background-repeat: no-repeat; background-position-x: center; background-position-y: center;"></div></a>'), 2000);
          var timer = setInterval(() => {
            silex.service.SilexTasks.getInstance().publishState(json => {
              let msg = `<strong>${json['status']}</strong>`;
              if(json['stop'] === true) {
                clearInterval(timer);
                let path = this.model.head.getPublicationPath().replace('/exec/put/', '/exec/get/');
                msg += `<p>Preview <a target="_blanck" href="${path}/index.html">your published site here</a>.</p>`;
              }
              silex.utils.Notification.setText(msg);
            }, message => {
              console.error('Error: ', message);
              silex.utils.Notification.setText('<strong>An error unknown occured.</strong>');
              clearInterval(timer);
            });
          }, 1000);
          this.tracker.trackAction('controller-events', 'success', 'file.publish', 1);
        }, this),
        goog.bind(function(msg) {
          console.error('Error: I did not manage to publish the file. (2)', msg);
          silex.utils.Notification.notifyError('I did not manage to publish the file. You may want to check the publication settings and your internet connection. \nError message: ' + msg);
          this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
        }, this));
  }
};
