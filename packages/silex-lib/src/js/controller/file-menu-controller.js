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

  this.view.newWebsiteDialog.openDialog({
    close: (url, isTemplate) => {
      if(!url && !this.model.file.hasContent()) {
        // if the user closes the dialog and no website is being edited
        // then load default blank website
        // otherwise just close the dialog
        url = 'libs/templates/silex-blank-templates/desktop/editable.html';
        isTemplate = true;
      }
      if(url) {
        if(isTemplate) {
          this.model.file.openFromUrl(url, rawHtml => this.onOpened(opt_cbk, rawHtml), (err, msg) => this.onOpenError(opt_errorCbk, err, msg));
        }
        else {
          this.model.file.open(url, rawHtml => this.onOpened(opt_cbk, rawHtml), (err, msg) => this.onOpenError(opt_errorCbk, err, msg));
        }
      }
    },
    ready: () => {
      if(opt_cbk) {
        opt_cbk();
      }
    },
    error: err => {
      console.error('loading templates error');
      this.onOpenError(opt_errorCbk, err, 'loading templates error');
    },
  });
};

silex.controller.FileMenuController.prototype.onOpened = function(opt_cbk, rawHtml) {
  // reset file URL in order to "save as" instead of "save"
  // this.model.file.setUrl(null);
  this.model.file.setHtml(rawHtml, () => {
    // undo redo reset
    this.undoReset();
    this.fileOperationSuccess(null, true);
  }, true, false); // with loader and backward compat check
  // QOS, track success
  this.tracker.trackAction('controller-events', 'success', 'file.new', 1);
  if(opt_cbk) {
    opt_cbk();
  }
};

silex.controller.FileMenuController.prototype.onOpenError = function(opt_errorCbk, err, msg) {
  console.error('opening template error', err);
  silex.utils.Notification.alert('An error occured, I could not open the file. ' + msg, () => {});
  if (opt_errorCbk) {
    opt_errorCbk(err);
  }
  this.tracker.trackAction('controller-events', 'error', 'file.new', -1);

};

/**
 * open a file
 * @param {?function(FileInfo)=} opt_cbk
 * @param {?function(Object)=} opt_errorCbk
 * @param {?function()=} opt_cancelCbk
 */
silex.controller.FileMenuController.prototype.openFile = function(opt_cbk, opt_errorCbk, opt_cancelCbk) {
  // QOS, track success
  this.tracker.trackAction('controller-events', 'request', 'file.open', 0);
  // let the user choose the file
  this.view.fileExplorer.openFile(
      fileInfo => {
        this.model.file.open(fileInfo, rawHtml => {
          this.model.file.setHtml(rawHtml, () => {
            // undo redo reset
            this.undoReset();
            // display and redraw
            this.fileOperationSuccess((this.model.head.getTitle() || 'Untitled website') + ' opened.', true);
            // QOS, track success
            this.tracker.trackAction('controller-events', 'success', 'file.open', 1);
            if (opt_cbk) {
              opt_cbk(/** @type {FileInfo} */ (fileInfo));
            }
          }, true, false); // with loader and backward compat check
        },
        error => {
          silex.utils.Notification.notifyError('Error: I did not manage to open this file. \n' + (error.message || ''));
          this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
          if (opt_errorCbk) {
            opt_errorCbk(error);
          }
        });
      },
      {'mimetype': 'text/html'},
      error => {
        this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
        if (opt_errorCbk) {
          opt_errorCbk(error);
        }
      },
      () => {
        if(opt_cancelCbk) opt_cancelCbk();
      });
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
          }, 'publish-pane');
          this.view.workspace.redraw(this.view);
          this.tracker.trackAction('controller-events', 'cancel', 'file.publish', 0);
        }, this));
  }
  else
  {
    silex.utils.Dom.publish(
        /** @type {string} */ (this.model.head.getPublicationPath()),
        this.model.file.getFileInfo().path,
        this.model.file.getHtml(),
        goog.bind(function(status) {
          silex.utils.Notification.alert('<strong>I am about to publish your site. This may take several minutes.</strong>', () => clearInterval(timer), 'Close');
          setTimeout(() => {
            // tip of the day
            const tipOfTheDayElement = /** @type {!Element} */ (document.createElement('div'));
            const tipOfTheDay = new silex.view.TipOfTheDay(tipOfTheDayElement);
            silex.utils.Notification.setInfoPanel(tipOfTheDayElement);
          }, 2000);
          var timer = setInterval(() => {
            silex.service.SilexTasks.getInstance().publishState(json => {
              let msg = `<strong>${json['status']}</strong>`;
              if(json['stop'] === true) {
                clearInterval(timer);
                const url = this.model.head.getPublicationPath().url;
                msg += `<p>Preview <a target="_blanck" href="${url}/index.html">your published site here</a>.</p>`;
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
