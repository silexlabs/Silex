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

goog.require('silex.controller.UiControllerBase');
goog.require('silex.Model');
goog.require('silex.View');
goog.require('silex.Controller');


/**
 * @constructor
 * @extends silex.controller.UiControllerBase
 * listen to the view events and call the main controller's methods
 * @param {silex.Model} model
 * @param {silex.View} view
 * @param {silex.Controller} controller
 */
silex.controller.PageToolController = function (model, view, controller) {
  // call super
  silex.controller.UiControllerBase.call(this, model, view, controller);
  // attach events to the view
  view.pageTool.onStatus = goog.bind(this.pageToolCallback, this);
};

// inherit from silex.controller.UiControllerBase
goog.inherits(silex.controller.UiControllerBase);


/**
 * pageTool event handler
 */
silex.controller.MainController.prototype.pageToolCallback = function(event) {
  this.tracker.trackAction('controller-events', 'request', event.type, 0);
  switch (event.type) {
    case 'changed':
      this.app.selection.setPage(event.page);
      if (event.page) {
        event.page.open();
      }
      break;
    case 'delete':
      // delete the page from the model
      this.removePage(event.page);
      break;
    case 'rename':
      // delete the page from the model
      this.renamePage(event.page);
      break;
  }
};


