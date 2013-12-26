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

goog.require('silex.controller.UiControllerBase');
goog.require('silex.Model');
goog.require('silex.View');
goog.require('silex.Controller');


/**
 * @constructor
 * @extends silex.controller.UiControllerBase
 * listen to the view events and call the main controller's methods
 * @param {silex.Model} model
 * @param {silex.View} view
 * @param {silex.Controller} controller
 */
silex.controller.SettingsDialogController = function (model, view, controller) {
  // call super
  silex.controller.UiControllerBase.call(this, model, view, controller);
  // attach events to the view
  this.app.settingsDialog.onStatus = goog.bind(this.settingsDialogCallback, this);
};

// inherit from silex.controller.UiControllerBase
goog.inherits(silex.controller.UiControllerBase);


/**
 * settingsDialog event handler
 */
silex.controller.MainController.prototype.settingsDialogCallback = function(event) {
  switch (event.type) {
    case 'browsePublishPath':
      this.app.fileExplorer.openDialog(
          goog.bind(function(blob) {
            var url = blob.url.substring(blob.url.indexOf('/api/v1.0/'), blob.url.lastIndexOf('/'));
            //var url = blob.url.substring(blob.url.indexOf('api/v1.0/')+9, blob.url.lastIndexOf('/'));
            //var url = blob.url.substr(blob.url.indexOf('api/v1.0/')+9);
            url = url.replace('/exec/get', '/exec/put');
            this.app.file.setPublicationPath(url);
            this.tracker.trackAction('controller-events', 'success', event.type, 1);
          }, this),
          null,
          goog.bind(function(error) {
            this.notifyError('Error: I could not select the publish path. <br /><br />' + (error.message || ''));
            this.tracker.trackAction('controller-events', 'error', event.type, -1);
          }, this)
      );
      break;
    case 'change':
      this.app.file.setPublicationPath(event.data);
      break;
  }
};



