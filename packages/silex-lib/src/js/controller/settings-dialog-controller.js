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
 * the user clicked "browse" button in the publish settings panel
 */
silex.controller.SettingsDialogController.prototype.browsePublishPath =
    function() {
  this.view.fileExplorer.openDialog(
      goog.bind(function(url) {
        // undo checkpoint
        this.undoCheckPoint();
        // start with /api/...
        if (url.indexOf('/') != 0) {
          url = '/' + url;
        }
        // put instead of get
        url = url.replace('/exec/get', '/exec/put');
        // set the new publication path
        this.model.head.setPublicationPath(url);
        this.tracker.trackAction(
            'controller-events', 'success', 'publish.browse', 1);
      }, this),
      { 'mimetypes': ['text/directory'] },
      goog.bind(function(error) {
        silex.utils.Notification.notifyError(
            'Error: I could not select the publish path. <br /><br />' +
            (error.message || ''));
        this.tracker.trackAction(
            'controller-events', 'error', 'publish.browse', -1);
      }, this)
  );
};


/**
 * callback for the publication path text input
 * @param {?string=} opt_data
 */
silex.controller.SettingsDialogController.prototype.change =
    function(opt_data) {
  // undo checkpoint
  this.undoCheckPoint();
  this.model.head.setPublicationPath(opt_data);
};
