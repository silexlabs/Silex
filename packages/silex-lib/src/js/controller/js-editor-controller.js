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
goog.provide('silex.controller.JsEditorController');

goog.require('silex.controller.ControllerBase');

/**
 * @constructor
 * @extends silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods
 * @param {silex.types.Model} model
 * @param {silex.types.View} view
 */
silex.controller.JsEditorController = function (model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
  // attach events to the view
  view.jsEditor.onStatus = goog.bind(this.jsEditorCallback, this);
};


// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.JsEditorController, silex.controller.ControllerBase);


/**
 * JsEditor event handler
 */
silex.controller.JsEditorController.prototype.jsEditorCallback = function(type, content) {
  switch (type) {
    case 'changed':
      // update content
      this.model.head.setHeadScript(content);
      break;
  }
};
