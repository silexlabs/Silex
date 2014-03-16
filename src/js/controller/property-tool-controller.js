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
silex.controller.PropertyToolController.prototype.propertyToolCallback = function(type, opt_name, opt_value, opt_elements) {
  //this.tracker.trackAction('controller-events', 'request', type, 0);
  switch (type) {
    case 'editHTML':
      this.editElement();
      break;
    case 'editText':
      this.editElement();
      break;
    case 'selectBgImage':
      this.browseBgImage();
      break;
    case 'selectImage':
      this.editElement();
      break;
    case 'styleChanged':
      this.styleChanged(opt_name, opt_value, opt_elements);
      break;
    case 'classNameChanged':
      this.setClassName(opt_name);
      break;
    case 'propertyChanged':
      this.propertyChanged(opt_name, opt_value);
      break;
    case 'addToPage':
      // apply the change to all elements
      var elements = this.view.stage.getSelection();
      goog.array.forEach(elements, function (element) {
        if (silex.utils.PageablePlugin.getBodyElement() != element) {
          silex.utils.PageablePlugin.addToPage(element, opt_name);
        }
        else{
          console.error('could not add this element (', element, ') to a page because it is the stage element');
        }
      }, this);
      this.view.propertyTool.redraw();
      break;
    case 'removeFromPage':
      // apply the change to all elements
      var elements = this.view.stage.getSelection();
      goog.array.forEach(elements, function (element) {
        if (silex.utils.PageablePlugin.getBodyElement() != element) {
          silex.utils.PageablePlugin.removeFromPage(element, opt_name);
        }
        else{
          console.error('could not remove this element (', element, ') from a page because it is the stage element');
        }
      }, this);
      this.view.propertyTool.redraw();
      break;
    case 'addLink':
      // apply the change to all elements
      var elements = this.view.stage.getSelection();
      goog.array.forEach(elements, function (element) {
        if (silex.utils.PageablePlugin.getBodyElement() != element) {
          silex.utils.PageablePlugin.setLink(element, opt_name);
        }
        else{
          console.error('could not add a link to this element (', element, ') because it is the stage element');
        }
      }, this);
      this.view.propertyTool.redraw();
      break;
    case 'removeLink':
      // apply the change to all elements
      var elements = this.view.stage.getSelection();
      goog.array.forEach(elements, function (element) {
        if (silex.utils.PageablePlugin.getBodyElement() != element) {
          silex.utils.PageablePlugin.setLink(element);
        }
        else{
          console.error('could not remove link of this element (', element, ') because it is the stage element');
        }
      }, this);
      this.view.propertyTool.redraw();
      break;
  }
};
