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
goog.provide('silex.controller.CssEditorController');

goog.require('silex.controller.ControllerBase');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase}
 * listen to the view events and call the main controller's methods}
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.CssEditorController = function(model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
};


// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.CssEditorController, silex.controller.ControllerBase);


/**
 * cssEditor event handler
 * @param {string} content
 */
silex.controller.CssEditorController.prototype.changed = function(content) {
  // update content
  this.model.head.setHeadStyle(content);
};
