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
goog.provide('silex.controller.StageController');

goog.require('silex.controller.ControllerBase');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods}
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.StageController = function(controller, model, view) {
  // call super
  silex.controller.ControllerBase.call(this, controller, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.StageController, silex.controller.ControllerBase);


/**
 * the user has selected an element
 * @param {Element}   selected element
 */
silex.controller.StageController.prototype.select = function(target) {
  this.model.body.setSelection([target], true);
};


/**
 * the user has selected an element with shift
 * @param {Element}   selected element
 */
silex.controller.StageController.prototype.selectMultiple = function(target) {
  var selection = this.model.body.getSelection();
  selection.push(target);
  this.model.body.setSelection(selection);
};


/**
 * the user has clicked on an element
 * which was already selected,
 * with the shift key down
 */
silex.controller.StageController.prototype.deselect = function(target) {
  var selection = this.model.body.getSelection();
  goog.array.remove(selection, target);
  this.model.body.setSelection(selection);
};
silex.controller.StageController.prototype.change = function() {
  // refresh the toolboxes
  var selection = this.model.body.getSelection();
  this.model.body.setSelection(selection);
};


/**
 * an element is dropped in a new container
 * @param {Element}   the dropped element
 */
silex.controller.StageController.prototype.newContainer = function(target) {
  this.checkElementVisibility(target);

};
