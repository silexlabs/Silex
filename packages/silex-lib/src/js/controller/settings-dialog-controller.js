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
 * browse and notify result, track actions, enable undo/redo
 * @param  {string} trackActionName
 * @param  {{mimetypes: (Array.<string>|undefined)}} mimetypes
 * @param  {function(string, ?Object=)} cbk
 */
silex.controller.SettingsDialogController.prototype.browse = function(trackActionName, mimetypes, cbk) {
  this.tracker.trackAction(
      'controller-events', 'request', trackActionName, 0);
  this.view.fileExplorer.openDialog(
      (url, blob) => {
        // undo checkpoint
        this.undoCheckPoint();
        // start with /api/...
        if (url.indexOf('/') !== 0) {
          url = '/' + url;
        }
        // notify the caller
        cbk(url, blob);
        // QA
        this.tracker.trackAction(
            'controller-events', 'success', trackActionName, 1);
      },
      mimetypes,
      (error) => {
        silex.utils.Notification.notifyError(
            'Error: I could not select the publish path. <br /><br />' +
            (error.message || ''));
        this.tracker.trackAction(
            'controller-events', 'error', trackActionName, -1);
      }
  );
};


/**
 * the user clicked "browse" button in the publish settings panel
 */
silex.controller.SettingsDialogController.prototype.browsePublishPath = function(opt_cbk) {
  this.browse(
    'publish.browse',
    { 'mimetypes': ['text/directory'] },
    (url, blob) => {
      // put instead of get
      url = url.replace('/exec/get', '/exec/put');
      // set the new publication path
      this.model.head.setPublicationPath(url);
      // notify caller (used to reopen settings)
      if(opt_cbk) opt_cbk();
    });
};


/**
 * the user clicked "browse" button to choose a favicon
 */
silex.controller.SettingsDialogController.prototype.browseFaviconPath = function(opt_cbk) {
  this.browse(
    'favicon.browse',
    { 'mimetypes': ['image/jpeg', 'image/png', 'image/gif', 'image/ico'] },
    (url, blob) => {
      // set the new publication path
      this.model.head.setFaviconPath(url);
      // notify caller (used to reopen settings)
      if(opt_cbk) opt_cbk();
    });
};


/**
 * the user clicked "browse" button to choose a thumbnail for social netorks
 */
silex.controller.SettingsDialogController.prototype.browseThumbnailSocialPath = function(opt_cbk) {
  this.browse(
    'thumbnail-social.browse',
    { 'mimetypes': ['image/jpeg', 'image/png', 'image/gif', 'image/ico'] },
    (url, blob) => {
      // set the new path
      this.model.head.setThumbnailSocialPath(url);
      // notify caller (used to reopen settings)
      if(opt_cbk) opt_cbk();
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
 * @param {?string=} opt_data
 */
silex.controller.SettingsDialogController.prototype.setPublicationPath = function(opt_data) {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setPublicationPath(opt_data);
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

