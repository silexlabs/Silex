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
goog.provide('silex.controller.MenuController');

goog.require('silex.controller.ControllerBase');


/**
 * @constructor
 * @extends silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.MenuController = function (controller, model, view) {
  // call super
  silex.controller.ControllerBase.call(this, controller, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.MenuController, silex.controller.ControllerBase);


/**
 * toggle advanced / apollo mode
 */
silex.controller.MenuController.prototype.toggleAdvanced = function() {
  if (!goog.dom.classes.has(document.body, 'advanced-mode-on')) {
    goog.dom.classes.add(document.body, 'advanced-mode-on');
    goog.dom.classes.remove(document.body, 'advanced-mode-off');
  }
  else {
    goog.dom.classes.remove(document.body, 'advanced-mode-on');
    goog.dom.classes.add(document.body, 'advanced-mode-off');
  }
};
