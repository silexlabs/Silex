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
goog.provide('silex.controller.StageController');

goog.require('silex.controller.ControllerBase');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase}
 * listen to the view events and call the main controller's methods}
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.StageController = function(model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.StageController, silex.controller.ControllerBase);


/**
 * empty/reset selection
 */
silex.controller.StageController.prototype.selectNone = function() {
  this.model.body.setSelection([this.model.body.getBodyElement()]);
};


/**
 * the user has selected an element
 * @param {Element} target selected element
 */
silex.controller.StageController.prototype.select = function(target) {
  this.model.body.setSelection([target]);
};


/**
 * the user has selected an element with shift
 * @param {Element} target selected element
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
 * @param {Element} target selected element
 */
silex.controller.StageController.prototype.deselect = function(target) {
  var selection = this.model.body.getSelection();
  goog.array.remove(selection, target);
  this.model.body.setSelection(selection);
};


/**
 * callback for the stage to notify a component has been moved or resized
 */
silex.controller.StageController.prototype.updateView = function() {
  // refresh the toolboxes
  var selection = this.model.body.getSelection();
  this.model.body.setSelection(selection);
};


/**
 * mark the state for undo/redo
 */
silex.controller.StageController.prototype.markAsUndoable = function() {
  // undo checkpoint
  this.undoCheckPoint();
};


/**
 * an element is dropped in a new container
 * @param {Element} container the container
 * @param {Element} element the dropped element
 */
silex.controller.StageController.prototype.newContainer = function(container, element) {
  if (element.parentNode !== container) {
    // initial positions
    var elementPos = goog.style.getPageOffset(element);
    var newContainerPos = goog.style.getPageOffset(container);
    // move to the new container
    element.parentNode.removeChild(element);
    container.appendChild(element);
    // restore position
    this.styleChanged('left', Math.round(elementPos.x - newContainerPos.x) + 'px', [element], false);
    this.styleChanged('top', Math.round(elementPos.y - newContainerPos.y) + 'px', [element], false);
  }
  // check if a parent is visible only on some pages,
  // then element should be visible everywhere
  this.checkElementVisibility(element);
};
