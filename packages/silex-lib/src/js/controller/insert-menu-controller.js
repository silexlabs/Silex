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
goog.provide('silex.controller.InsertMenuController');

goog.require('silex.controller.ControllerBase');
goog.require('silex.service.SilexTasks');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods}
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.InsertMenuController = function(controller, model, view) {
  // call super
  silex.controller.ControllerBase.call(this, controller, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.InsertMenuController, silex.controller.ControllerBase);


/**
 * create an element and add it to the stage
 * @param {string} the desired type for the new element
 * @return {Element} the new element
 */
silex.controller.InsertMenuController.prototype.addElement = function(type) {
  this.tracker.trackAction('controller-events', 'request', 'insert.' + type, 0);
  // undo checkpoint
  this.undoCheckPoint();
  var element = null;
  try {
    // create the element and add it to the stage
    element = this.model.element.createElement(type);
    this.doAddElement(element);
    this.tracker.trackAction('controller-events', 'success', 'insert.' + type, 1);
  }
  catch (e) {
    this.tracker.trackAction('controller-events', 'error', 'insert.' + type, -1);
    console.error('could not add element of type', type, ' - ', e.message);
  }
  return element;
};


/**
 * called after an element has been created
 * add the element to the current page (only if it has not a container which is in a page)
 * redraw the tools and set the element as editable
 * @param {Element} the element to add
 */
silex.controller.InsertMenuController.prototype.doAddElement = function(element) {
  // only visible on the current page
  var currentPageName = this.model.page.getCurrentPage();
  this.model.page.removeFromAllPages(element);
  this.model.page.addToPage(element, currentPageName);
  // unless one of its parents is in a page already
  this.checkElementVisibility(element);
  // select the component
  this.model.body.setSelection([element]);
  // update drop zones z index
  //this.model.body.resetEditable(this.model.body.getBodyElement(), true);
  // set element editable
  this.model.body.setEditable(element, true);
};


/**
 * create a page
 */
silex.controller.InsertMenuController.prototype.createPage = function(successCbk, cancelCbk) {
  this.tracker.trackAction('controller-events', 'request', 'insert.page', 0);
  this.getUserInputPageName('Your new page name', goog.bind(function(name, displayName) {
    if (name) {
      // undo checkpoint
      this.undoCheckPoint();
      // create the page model
      this.model.page.createPage(name, displayName);
      // update view
      if (successCbk) successCbk();
      this.tracker.trackAction('controller-events', 'success', 'insert.page', 1);
    }
    else {
      if (cancelCbk) cancelCbk();
      this.tracker.trackAction('controller-events', 'cancel', 'insert.page', 0);
    }
  }, this));
};


