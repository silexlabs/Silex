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
goog.provide('silex.controller.PropertyToolController');

goog.require('silex.controller.ControllerBase');


/**
 * @constructor
 * @extends silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods
 * @param {silex.types.Model} model
 * @param {silex.types.View} view
 */
silex.controller.PropertyToolController = function (model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
  // attach events to the view
  view.propertyTool.onStatus = goog.bind(this.propertyToolCallback, this);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.PropertyToolController, silex.controller.ControllerBase);


/**
 * propertyTool event handler
 */
silex.controller.PropertyToolController.prototype.propertyToolCallback = function(type, opt_styleName, opt_styleValue) {
  //this.tracker.trackAction('controller-events', 'request', type, 0);
  switch (type) {
    case 'editHTML':
      this.controller.mainController.editElement();
      break;
    case 'editText':
      this.controller.mainController.editElement();
      break;
    case 'selectBgImage':
      var errCbk = function(error) {
        silex.utils.Notification.notifyError('Error: I could not load the image. <br /><br />' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', type, -1);
      };
      var successCbk = function(url) {
        // update the model
        var element = this.view.stage.getSelection()[0];
        this.model.element.setBgImage(element, url);
        // redraw the data
        this.view.propertyTool.redraw();
        this.tracker.trackAction('controller-events', 'success', type, 1);
      };
      // open the file browser
      this.view.fileExplorer.openDialog(
          goog.bind(successCbk, this),
          ['image/*', 'text/plain'],
          goog.bind(errCbk, this)
      );
      this.view.workspace.invalidate();
      break;
    case 'selectImage':
      this.controller.mainController.editElement();
      break;
    case 'styleChanged':
      // style of the element has changed
      var element = this.view.stage.getSelection()[0];
      if (element && opt_styleName){
        // update the model
        this.model.element.setStyle(element, opt_styleName, opt_styleValue);
        // redraw the data
        this.view.propertyTool.redraw();
      }
      else{
        console.error('can not set style ', opt_styleName, ' on element ', element);
      }
      break;
    case 'propertyChanged':
      console.error('not implemented');
      break;
  }
};


