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
goog.provide('silex.controller.PropertiesToolController');

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
silex.controller.PropertiesToolController = function (model, view, controller) {
  // call super
  silex.controller.UiControllerBase.call(this, model, view, controller);
  // attach events to the view
  view.propertiesTool.onStatus = goog.bind(this.propertiesToolCallback, this);
};

// inherit from silex.controller.UiControllerBase
goog.inherits(silex.controller.UiControllerBase);


/**
 * propertiesTool event handler
 */
silex.controller.MainController.prototype.propertiesToolCallback = function(event) {
  //this.tracker.trackAction('controller-events', 'request', event.type, 0);
  switch (event.type) {
    case 'editHTML':
      this.editSelection();
      break;
    case 'editText':
      this.editSelection();
      break;
    case 'selectBgImage':
      var errCbk = function(error) {
        this.notifyError('Error: I could not load the image. <br /><br />' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', event.type, -1);
      };
      var successCbk = function(blob) {
        this.app.propertiesTool.setBgImage(blob.url);
        this.tracker.trackAction('controller-events', 'success', event.type, 1);
      };
      // open the file browser
      this.app.fileExplorer.openDialog(
          goog.bind(successCbk, this),
          ['image/*', 'text/plain'],
          goog.bind(errCbk, this)
      );
      this.app.workspace.invalidate();
      break;
    case 'selectImage':
      this.editSelection();
      break;
    case 'contextChanged':
      // style of the element has changed
      this.app.selection.setContext(event.context);
      this.app.selection.getComponent().setContext(event.context);
      break;
    case 'styleChanged':
      // style of the element has changed
      this.app.selection.getComponent().setStyle(event.style, event.context);
      break;
    case 'propertiesChanged':
      break;
  }
};


