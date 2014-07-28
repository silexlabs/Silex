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
 * @fileoverview A controller listens to a view element,
 *      and call the main {silex.controller.Controller} controller's methods
 *
 */
goog.provide('silex.controller.SettingsDialogController');

goog.require('silex.controller.ControllerBase');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods}
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.SettingsDialogController = function(controller, model, view) {
  // call super
  silex.controller.ControllerBase.call(this, controller, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.SettingsDialogController, silex.controller.ControllerBase);


silex.controller.SettingsDialogController.prototype.browsePublishPath = function(type) {
  this.view.fileExplorer.openDialog(
      goog.bind(function(url) {
        // start with /api/...
        if (url.indexOf('/') != 0) {
          url = '/' + url;
        }
        // put instead of get
        url = url.replace('/exec/get', '/exec/put');
        // set the new publication path
        this.model.head.setPublicationPath(url);
        this.tracker.trackAction('controller-events', 'success', type, 1);
      }, this),
      { mimetype: 'text/directory' },
      goog.bind(function(error) {
        silex.utils.Notification.notifyError('Error: I could not select the publish path. <br /><br />' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', type, -1);
      }, this)
  );
};
silex.controller.SettingsDialogController.prototype.change = function(opt_data) {
  this.model.head.setPublicationPath(opt_data);
};
