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
 * @fileoverview In Silex, each UI of the view package,
 *      has a controller in the UI controller package which listens to its events,
 *      and call the main {silex.controller.Controller} controller's methods
 *      These UI controllers override the
 *      {silex.controller.UiControllerBase} UiControllerBase class
 *
 */
goog.provide('silex.controller.UiControllerBase');

goog.require('silex.controller.MainController');


/**
 * @constructor
 * base class for all UI controllers of the controller package
 */
silex.controller.UiControllerBase = function (model, view, controller) {
  // store the model and view
  this.model = model;
  this.view = view;
  this.controller = controller;
};

/**
 * reference to the {object} model, an object with properties file, head, body...
 */
silex.controller.UiControllerBase.prototype.model;


/**
 * reference to the {object} view, an object with properties menu, stage...
 */
silex.controller.UiControllerBase.prototype.view;


/**
 * reference to the main {silex.controller.Controller} controller
 * @see silex.controller.Controller
 */
silex.controller.UiControllerBase.prototype.controller;


