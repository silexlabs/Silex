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
goog.provide('silex.controller.JsEditorController');

goog.require('silex.controller.ControllerBase');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase}
 * listen to the view events and call the main controller's methods}
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.JsEditorController = function(model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
};


// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.JsEditorController, silex.controller.ControllerBase);


/**
 * JsEditor event handler
 * @param {string} content
 */
silex.controller.JsEditorController.prototype.changed = function(content) {
  // update content
  this.model.head.setHeadScript(content);
};
