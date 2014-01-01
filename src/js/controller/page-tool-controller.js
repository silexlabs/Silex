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
goog.provide('silex.controller.PageToolController');

goog.require('silex.controller.ControllerBase');


/**
 * @constructor
 * @extends silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods
 * @param {silex.types.Model} model
 * @param {silex.types.View} view
 */
silex.controller.PageToolController = function (model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
  // attach events to the view
  view.pageTool.onStatus = goog.bind(this.pageToolCallback, this);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.PageToolController, silex.controller.ControllerBase);


/**
 * pageTool event handler
 */
silex.controller.PageToolController.prototype.pageToolCallback = function(type, pageName) {
  this.tracker.trackAction('controller-events', 'request', type, 0);
  switch (type) {
    case 'changed':
      // open the page
      this.openPage(pageName);
      break;
    case 'delete':
      // delete the page
      this.removePage(pageName);
      break;
    case 'rename':
      // rename the page
      this.renamePage(pageName);
      break;
  }
};


