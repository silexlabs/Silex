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
 * @extends silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods
 * @param {silex.types.Model} model
 * @param {silex.types.View} view
 */
silex.controller.SettingsDialogController = function (model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
  // attach events to the view
  this.view.settingsDialog.onStatus = goog.bind(this.settingsDialogCallback, this);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.SettingsDialogController, silex.controller.ControllerBase);


/**
 * settingsDialog event handler
 */
silex.controller.SettingsDialogController.prototype.settingsDialogCallback = function(type, opt_data) {
  switch (type) {
    case 'browsePublishPath':
      this.view.fileExplorer.openDialog(
          goog.bind(function(url) {
            url = url.substring(url.indexOf('/api/v1.0/'), url.lastIndexOf('/'));
            url = url.replace('/exec/get', '/exec/put');
            this.model.head.setPublicationPath(url);
            this.view.settingsDialog.redraw();
            this.tracker.trackAction('controller-events', 'success', type, 1);
          }, this),
          {'mimetype': 'folder'},
          goog.bind(function(error) {
            silex.utils.Notification.notifyError('Error: I could not select the publish path. <br /><br />' + (error.message || ''));
            this.tracker.trackAction('controller-events', 'error', type, -1);
          }, this)
      );
      break;
    case 'change':
      this.model.head.setPublicationPath(opt_data);
      this.view.settingsDialog.redraw();
      break;
  }
};



