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
goog.provide('silex.controller.HtmlEditorController');

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
silex.controller.HtmlEditorController = function (model, view, controller) {
  // call super
  silex.controller.UiControllerBase.call(this, model, view, controller);
  // attach events to the view
  view.htmlEditor.onStatus = goog.bind(this.htmlEditorCallback, this);
};

// inherit from silex.controller.UiControllerBase
goog.inherits(silex.controller.UiControllerBase);


/**
 * htmlEditor event handler
 */
silex.controller.MainController.prototype.htmlEditorCallback = function(event) {
  switch (event.type) {
    case 'changed':
      // update content
      var element = this.view.stage.getSelection()[0];
      this.model.element.setInnerHtml(element, event.content);
      break;
  }
};


