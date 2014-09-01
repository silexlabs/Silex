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
 * @extends {silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods}
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.PropertyToolController = function(controller, model, view) {
  // call super
  silex.controller.ControllerBase.call(this, controller, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.PropertyToolController, silex.controller.ControllerBase);


/**
 * add the provided element to a given page
 */
silex.controller.PropertyToolController.prototype.addToPage = function(elements, name) {
  // undo checkpoint
  this.undoCheckPoint();
  goog.array.forEach(elements, function(element) {
    this.model.page.addToPage(element, name);
  }, this);
};


/**
 * remove the provided element from a given page
 */
silex.controller.PropertyToolController.prototype.removeFromPage = function(elements, name) {
  // undo checkpoint
  this.undoCheckPoint();
  goog.array.forEach(elements, function(element) {
    this.model.page.removeFromPage(element, name);
  }, this);
};


/**
 * add link to the provided element
 */
silex.controller.PropertyToolController.prototype.addLink = function(elements, name) {
  // undo checkpoint
  this.undoCheckPoint();
  goog.array.forEach(elements, function(element) {
    this.model.element.setLink(element, name);
  }, this);
};


/**
 * remove link from the provided element
 */
silex.controller.PropertyToolController.prototype.removeLink = function(elements) {
  // undo checkpoint
  this.undoCheckPoint();
  goog.array.forEach(elements, function(element) {
    this.model.element.setLink(element);
  }, this);
};
