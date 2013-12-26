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
silex.controller.StageController = function (model, view, controller) {
  // call super
  silex.controller.UiControllerBase.call(this, model, view, controller);
  // attach events to the view
  view.stage.onStatus = goog.bind(this.stageCallback, this);
};

// inherit from silex.controller.UiControllerBase
goog.inherits(silex.controller.UiControllerBase);


/**
 * stage event handler
 */
silex.controller.StageController.prototype.stageCallback = function(event) {
  //this.tracker.trackAction('controller-events', 'request', event.type, 0);
  switch (event.type) {
    case 'select':
      this.model.element.setSelected(event.element, true);
      break;
    case 'change':
      // size or position of the element has changed
      this.app.selection.getComponent().setBoundingBox(
          this.app.selection.getComponent().getBoundingBox()
      );
      this.app.propertiesTool.redraw();
      break;
    case 'newContainer':
      // an element is dropped in a new container
      var component = this.app.selection.getComponent();
      // if it is dropped in a container which is visible only on some pages,
      // then the dropped element should be visible everywhere, i.e. in the same pages as its parent
      if (component.getFirstPageableParent() !== null) {
        // get all the pages in which this element is visible
        var pages = silex.model.Page.getPagesForElement(component.element);
        for (idx in pages) {
          var page = pages[idx];
          // remove the component from the page
          page.removeComponent(component);
        }
        // redraw the tool box in order to reflect the changes
        this.app.propertiesTool.redraw();
      }
      break;
    case 'edit':
      // size or position of the element has changed
      this.editSelection();
      break;
  }
};


