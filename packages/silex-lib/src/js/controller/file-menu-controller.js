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
 * @param {?function()=} opt_cbk
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.loadTemplate = function(url, opt_cbk, opt_errorCbk) {
    this.model.file.openFromUrl(url, rawHtml => this.onOpened(opt_cbk, rawHtml), (err, msg) => this.onOpenError(err, msg, opt_errorCbk));
};


/**
 * load blank template
 * @param {?function()=} opt_cbk
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.loadBlank = function(opt_cbk, opt_errorCbk) {
  const blankUrl = '/libs/templates/silex-blank-templates/desktop/editable.html';
  this.loadTemplate(blankUrl, opt_cbk, opt_errorCbk);
};


/**
 * open a file
 * @param {?function()=} opt_cbk
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.newFile = function(opt_cbk, opt_errorCbk) {

  this.tracker.trackAction('controller-events', 'request', 'file.new', 0);
  this.view.newWebsiteDialog.openDialog({
    openFileInfo: (fileInfo) => {
      if(!fileInfo && !this.model.file.hasContent()) {
        // if the user closes the dialog and no website is being edited then load default blank website
        this.loadBlank(opt_cbk, opt_errorCbk);
      }
      else if(fileInfo) {
        // a recent file was selected
        this.model.file.open(/** @type {FileInfo} */ (fileInfo), rawHtml => this.onOpened(opt_cbk, rawHtml), err => this.onOpenError(err, 'Could not open this recent file, are you connected to ' + fileInfo.service + '?', opt_errorCbk));
      }
    },
    openTemplate: (url) => {
      if(!url && !this.model.file.hasContent()) {
        // if the user closes the dialog and no website is being edited then load default blank website
        this.loadBlank(opt_cbk, opt_errorCbk);
      }
      else if(url) {
        // a template was selected
        this.loadTemplate(url, opt_cbk, opt_errorCbk);
      }
    },
    ready: () => {
      if(opt_cbk) {
        opt_cbk();
      }
    },
    error: err => {
      console.error('loading templates error');
      this.onOpenError(err, 'Loading templates error', opt_errorCbk);
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
  }, true); // with loader
  // QOS, track success
  this.tracker.trackAction('controller-events', 'success', 'file.new', 1);
  if(opt_cbk) {
    opt_cbk();
  }
};


/**
 * @param {Object} err
 * @param {string} msg
 * @param {?function(Object)=} opt_errorCbk
 */
silex.controller.FileMenuController.prototype.onOpenError = function(err, msg, opt_errorCbk) {
  console.error('opening template error', err);
  silex.utils.Notification.alert('An error occured. ' + msg, () => {});
  if (opt_errorCbk) {
    opt_errorCbk(err);
  }
  if(!this.model.file.hasContent()) {
    this.loadBlank();
  }
  this.tracker.trackAction('controller-events', 'error', 'file.new', -1);

};

/**
 * open a file
 * @param {?function(!FileInfo)=} opt_cbk
 * @param {?function(*)=} opt_errorCbk
 * @param {?function()=} opt_cancelCbk
 */
silex.controller.FileMenuController.prototype.openFile = function(opt_cbk, opt_errorCbk, opt_cancelCbk) {
  // QOS, track success
  this.tracker.trackAction('controller-events', 'request', 'file.open', 0);
  // let the user choose the file
  this.view.fileExplorer.openFile(FileExplorer.HTML_EXTENSIONS)
  .then(fileInfo => {
    if(fileInfo) {
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
        }, true); // with loader
      },
      (error, message) => {
        silex.utils.Notification.alert('Error: I did not manage to open this file. \n' + (message || error.message || ''), () => {
          if (opt_errorCbk) {
            opt_errorCbk(error);
          }
        });
        this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
      });
    }
    else {
      if(opt_cancelCbk) opt_cancelCbk();
    }
  })
  .catch(error => {
    this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
    if (opt_errorCbk) {
      opt_errorCbk(error);
    }
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
  const file = this.model.file.getFileInfo();
  const folder = this.model.head.getPublicationPath();
  this.tracker.trackAction('controller-events', 'request', 'file.publish', 0);
  if (!folder) {
    silex.utils.Notification.alert('I do not know where to publish your site.' +
      'Select a folder in the settings pannel and do "publish" again.' +
      '\nNow I will open the publish settings.',
        goog.bind(function() {
          this.view.settingsDialog.open(function() {
            //here the panel was closed
          }, 'publish-pane');
          this.view.workspace.redraw(this.view);
          this.tracker.trackAction('controller-events', 'cancel', 'file.publish', 0);
        }, this));
  }
  // the file must be saved somewhere because all URLs are made relative
  else if (!file) {
    console.error('The file must be saved before I can publish it.');
    silex.utils.Notification.notifyError('The file must be saved before I can publish it.');
    this.tracker.trackAction('controller-events', 'cancel', 'file.publish', 0);
  }
  else {
    let timer = -1;
    silex.utils.Notification.alert('<strong>I am about to publish your site. This may take several minutes.</strong>', () => {
      if(timer > 0) {
        clearInterval(timer);
      }
      timer = -1;
    }, 'Close');
    silex.service.SilexTasks.getInstance().publish(
      file,
      folder,
      () => {
        setTimeout(() => {
          // tip of the day
          const tipOfTheDayElement = /** @type {!Element} */ (document.createElement('div'));
          const tipOfTheDay = new silex.view.TipOfTheDay(tipOfTheDayElement);
          silex.utils.Notification.setInfoPanel(tipOfTheDayElement);
        }, 2000);
        timer = setInterval(() => {
          silex.service.SilexTasks.getInstance().publishState(json => {
            let msg = `<strong>${json['message']}</strong>`;
            if(json['stop'] === true) {
              clearInterval(timer);
              msg += `<p>Preview <a target="_blanck" href="${folder.url}/index.html">your published site here</a>.</p>`;
            }
            silex.utils.Notification.setText(msg);
          }, msg => {
            console.error('Error: ', msg);
            silex.utils.Notification.setText(`<strong>An error occured.</strong><p>I did not manage to publish the website. You may want to check the publication settings and your internet connection.</p><p>Error message: ${ msg }</p><p><a href="${ silex.Config.ISSUES_SILEX }" target="_blank">Get help in Silex forums.</a></p>`);
            clearInterval(timer);
          });
        }, 1000);
        this.tracker.trackAction('controller-events', 'success', 'file.publish', 1);
      },
      msg => {
        console.error('Error: I did not manage to publish the file. (2)', msg);
            silex.utils.Notification.setText(`<strong>An error occured.</strong><p>I did not manage to publish the website. You may want to check the publication settings and your internet connection.</p><p>Error message: ${ msg }</p><p><a href="${ silex.Config.ISSUES_SILEX }" target="_blank">Get help in Silex forums.</a></p>`);
        this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
      });
  }
};
