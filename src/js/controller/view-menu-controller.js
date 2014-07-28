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
goog.provide('silex.controller.ViewMenuController');

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
silex.controller.ViewMenuController = function(controller, model, view) {
  // call super
  silex.controller.ControllerBase.call(this, controller, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.ViewMenuController, silex.controller.ControllerBase);


/**
 * edit Silex editable css styles
 */
silex.controller.ViewMenuController.prototype.openCssEditor = function() {
  this.view.cssEditor.openEditor(this.model.head.getHeadStyle());
};


/**
 * edit Silex editable js scripts
 */
silex.controller.ViewMenuController.prototype.openJsEditor = function() {
  this.view.jsEditor.openEditor(this.model.head.getHeadScript());
};


/**
 * view this file in a new window
 */
silex.controller.ViewMenuController.prototype.preview = function() {
  this.tracker.trackAction('controller-events', 'request', 'view.file', 0);
  try {
    if (!this.model.file.getUrl()) {
      silex.utils.Notification.confirm('You need to save your file before it can be opened in a new window. Do you want me to <strong>save this file</strong> for you?', goog.bind(function(accept) {
        if (accept) {
          this.save(null, goog.bind(function() {
            window.open(this.model.file.getUrl());
            this.tracker.trackAction('controller-events', 'success', 'view.file', 1);
          }, this));
        }
      }, this), 'save', 'cancel');
    }
    else {
      window.open(this.model.file.getUrl());
      this.tracker.trackAction('controller-events', 'success', 'view.file', 1);
    }
  }
  catch (e) {
    this.tracker.trackAction('controller-events', 'error', 'view.file', -1);
  }
};


