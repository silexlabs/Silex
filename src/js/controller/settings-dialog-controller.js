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
goog.provide('silex.controller.SettingsDialogController');

goog.require('silex.controller.ControllerBase');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase}
 * listen to the view events and call the main controller's methods}
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.SettingsDialogController = function(model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.SettingsDialogController,
    silex.controller.ControllerBase);


/**
 * track actions
 * @param  {Promise.<FileInfo>} promise
 * @param  {string} trackActionName
 */
silex.controller.SettingsDialogController.prototype.track = function(promise, trackActionName) {
  this.tracker.trackAction('controller-events', 'request', trackActionName, 0);
  promise.then(fileInfo => {
    this.tracker.trackAction(
        'controller-events', 'success', trackActionName, 1);
    return fileInfo;
  })
  .catch(error => {
    this.tracker.trackAction(
        'controller-events', 'error', trackActionName, -1);
    throw(error);
  });
};


/**
 * enable undo/redo
 * @param  {Promise.<FileInfo>} promise
 */
silex.controller.SettingsDialogController.prototype.undoredo = function(promise) {
  promise.then(fileInfo => {
    if(fileInfo) {
      this.undoCheckPoint();
    }
    return fileInfo;
  });
};


/**
 * the user clicked "browse" button in the publish settings panel
 */
silex.controller.SettingsDialogController.prototype.browsePublishPath = function(opt_cbk) {
  // create the promise
  const promise = this.view.fileExplorer.openFolder();
  // add tracking and undo/redo checkpoint
  this.track(promise, 'publish.browse');
  this.undoredo(promise);
  // handle the result
  promise.then(fileInfo => {
    if(fileInfo) {
      // set the new publication path
      this.model.head.setPublicationPath(fileInfo);
      // notify caller (used to reopen settings)
      if(opt_cbk) opt_cbk();
    }
  })
  .catch(error => {
    silex.utils.Notification.notifyError(
      'Error: I could not select the publish path. <br /><br />' +
      (error.message || ''));
  });
};


/**
 * the user clicked "browse" button to choose a favicon
 */
silex.controller.SettingsDialogController.prototype.browseFaviconPath = function(opt_cbk) {
  // create the promise
  const promise = this.view.fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS);
  // add tracking and undo/redo checkpoint
  this.track(promise, 'favicon.browse');
  this.undoredo(promise);
  // handle the result
  promise.then(fileInfo => {
    if(fileInfo) {
      // set the new favicon path
      this.model.head.setFaviconPath(fileInfo.absPath);
      // notify caller (used to reopen settings)
      if(opt_cbk) opt_cbk();
    }
  })
  .catch(error => {
    silex.utils.Notification.notifyError(
      'Error: I could not select the favicon. <br /><br />' +
      (error.message || ''));
  });
};


/**
 * the user clicked "browse" button to choose a thumbnail for social netorks
 */
silex.controller.SettingsDialogController.prototype.browseThumbnailSocialPath = function(opt_cbk) {
  // create the promise
  const promise = this.view.fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS);
  // add tracking and undo/redo checkpoint
  this.track(promise, 'thumbnail-social.browse');
  this.undoredo(promise);
  // handle the result
  promise.then(fileInfo => {
    if(fileInfo) {
      // set the new path
      this.model.head.setThumbnailSocialPath(fileInfo.absPath);
      // notify caller (used to reopen settings)
      if(opt_cbk) opt_cbk();
    }
  })
  .catch(error => {
    silex.utils.Notification.notifyError(
      'Error: I could not select the thumbnail. <br /><br />' +
      (error.message || ''));
  });
};


/**
 * enable/disable mobile version
 */
silex.controller.SettingsDialogController.prototype.toggleEnableMobile =
    function() {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setEnableMobile(!this.model.head.getEnableMobile());
};


/**
 * set website width
 * @param {?string=} opt_data
 */
silex.controller.SettingsDialogController.prototype.setWebsiteWidth = function(opt_data) {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setWebsiteWidth(opt_data);
};


/**
 * callback for the publication path text input
 * @param {?FileInfo=} opt_data
 */
silex.controller.SettingsDialogController.prototype.setPublicationPath = function(opt_data) {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setPublicationPath(opt_data);
};


/**
 * callback for the publication path text input
 * @return {?FileInfo}
 */
silex.controller.SettingsDialogController.prototype.getPublicationPath = function() {
  return this.model.head.getPublicationPath();
};


/**
 * callback for the favicon path text input
 * @param {?string=} opt_data
 */
silex.controller.SettingsDialogController.prototype.setFaviconPath = function(opt_data) {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setFaviconPath(opt_data);
};


/**
 * set new file description
 * @param {?string=} opt_data
 */
silex.controller.SettingsDialogController.prototype.setDescription = function(opt_data) {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setDescription(opt_data);
};


/**
 * set new title for social networks
 * @param {?string=} opt_data
 */
silex.controller.SettingsDialogController.prototype.setTitleSocial = function(opt_data) {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setTitleSocial(opt_data);
};


/**
 * set new description for social networks
 * @param {?string=} opt_data
 */
silex.controller.SettingsDialogController.prototype.setDescriptionSocial = function(opt_data) {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setDescriptionSocial(opt_data);
};


/**
 * set new thumbnail for social networks
 * @param {?string=} opt_data
 */
silex.controller.SettingsDialogController.prototype.setThumbnailSocialPath = function(opt_data) {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setThumbnailSocialPath(opt_data);
};


/**
 * set twitter account
 * @param {?string=} opt_data
 */
silex.controller.SettingsDialogController.prototype.setTwitterSocial = function(opt_data) {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setTwitterSocial(opt_data);
};

