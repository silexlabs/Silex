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
goog.provide('silex.controller.InsertMenuController');

goog.require('silex.controller.ControllerBase');
goog.require('silex.service.SilexTasks');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase}
 * listen to the view events and call the main controller's methods}
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.InsertMenuController = function(model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.InsertMenuController, silex.controller.ControllerBase);


/**
 * create an element and add it to the stage
 * @param {string} type the desired type for the new element
 * @param {?string=} opt_componentName the desired component type if it is a component
 * @return {Element} the new element
 */
silex.controller.InsertMenuController.prototype.addElement = function(type, opt_componentName) {
  this.tracker.trackAction('controller-events', 'request', 'insert.' + type, 0);
  // undo checkpoint
  this.undoCheckPoint();
  // create the element and add it to the stage
  var element = this.model.element.createElement(type);
  // apply component styles etc
  if(!!opt_componentName) {
    this.model.component.initComponent(element, opt_componentName);
  }
  // apply default size
  this.model.element.initElement(element);
  // make element editable and visible on current page
  this.doAddElement(element);
  // tracking
  this.tracker.trackAction('controller-events', 'success', 'insert.' + type, 1);
  return element;
};


/**
 * create a page
 * @param {?function()=} successCbk
 * @param {?function()=} cancelCbk
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
      if (successCbk) {
        successCbk();
      }
      this.tracker.trackAction('controller-events', 'success', 'insert.page', 1);
    }
    else {
      if (cancelCbk) {
        cancelCbk();
      }
      this.tracker.trackAction('controller-events', 'cancel', 'insert.page', 0);
    }
  }, this));
};


