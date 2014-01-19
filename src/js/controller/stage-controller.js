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
 * @extends silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods
 * @param {silex.types.Model} model
 * @param {silex.types.View} view
 */
silex.controller.StageController = function (model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
  // attach events to the view
  view.stage.onStatus = goog.bind(this.stageCallback, this);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.StageController, silex.controller.ControllerBase);


/**
 * stage event handler
 */
silex.controller.StageController.prototype.stageCallback = function(type, opt_target) {
  //this.tracker.trackAction('controller-events', 'request', event.type, 0);
  switch (type) {
    case 'select': // the user has selected an element
      this.model.element.setSelected(opt_target, true);
      this.view.propertyTool.redraw();
      break;
    case 'change': // size or position of the element has changed
      this.view.propertyTool.redraw();
      // update drop zones z index
      silex.utils.EditablePlugin.resetEditable(this.model.body.bodyElement, true);
      break;
    case 'newContainer': // an element is dropped in a new container
      var element = this.view.stage.getSelection()[0];
      this.checkElementVisibility(element);
      // update drop zones z index
      silex.utils.EditablePlugin.resetEditable(this.model.body.bodyElement, true);
      break;
    case 'edit':
      // size or position of the element has changed
      this.editElement();
      break;
  }
};


