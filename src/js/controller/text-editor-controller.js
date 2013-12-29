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
goog.provide('silex.controller.TextEditorController');

goog.require('silex.controller.ControllerBase');


/**
 * @constructor
 * @extends silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods
 * @param {silex.types.Model} model
 * @param {silex.types.View} view
 */
silex.controller.TextEditorController = function (model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
  // attach events to the view
  view.textEditor.onStatus = goog.bind(this.textEditorCallback, this);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.TextEditorController, silex.controller.ControllerBase);


/**
 * textEditor event handler
 */
silex.controller.TextEditorController.prototype.textEditorCallback = function(type, content) {
  switch (type) {
    case 'changed':
      // update content
      var element = this.view.stage.getSelection()[0];
      this.model.element.setInnerHtml(element, content);
      // update fonts
      this.refreshFonts();
      break;
  }
};


