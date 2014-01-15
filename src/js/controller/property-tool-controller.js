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
silex.controller.PropertyToolController.prototype.propertyToolCallback = function(type, opt_name, opt_value) {
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
      this.styleChanged(opt_name, opt_value);
      break;
    case 'classNameChanged':
      this.setClassName(opt_name);
      break;
    case 'propertyChanged':
      this.propertyChanged(opt_name, opt_value);
      break;
    case 'addToPage':
      silex.utils.PageablePlugin.addToPage(this.view.stage.getSelection()[0], opt_name);
      this.view.propertyTool.redraw();
      break;
    case 'removeFromPage':
      silex.utils.PageablePlugin.removeFromPage(this.view.stage.getSelection()[0], opt_name);
      this.view.propertyTool.redraw();
      break;
    case 'addLink':
      silex.utils.PageablePlugin.setLink(this.view.stage.getSelection()[0], opt_name);
      this.view.propertyTool.redraw();
      break;
    case 'removeLink':
      silex.utils.PageablePlugin.setLink(this.view.stage.getSelection()[0]);
      this.view.propertyTool.redraw();
      break;
  }
};


