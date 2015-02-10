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
goog.provide('silex.controller.ViewMenuController');

goog.require('silex.controller.ControllerBase');
goog.require('silex.service.SilexTasks');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase}
 * listen to the view events and call the main controller's methods}
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.ViewMenuController = function(model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.ViewMenuController, silex.controller.ControllerBase);


/**
 * edit Silex editable css styles
 */
silex.controller.ViewMenuController.prototype.openCssEditor = function() {
  // undo checkpoint
  this.undoCheckPoint();
  // open the editor
  this.view.cssEditor.openEditor();
  this.view.cssEditor.setValue(this.model.head.getHeadStyle());
};


/**
 * edit HTML head tag
 */
silex.controller.ViewMenuController.prototype.openHtmlHeadEditor = function() {
  // undo checkpoint
  this.undoCheckPoint();
  // deselect all elements
  this.model.body.setSelection([]);
  // open the editor
  this.view.htmlEditor.openEditor();
  this.view.htmlEditor.setValue(this.model.head.getHeadTag());
};


/**
 * edit Silex editable js scripts
 */
silex.controller.ViewMenuController.prototype.openJsEditor = function() {
  // undo checkpoint
  this.undoCheckPoint();
  // open the editor
  this.view.jsEditor.openEditor();
  this.view.jsEditor.setValue(this.model.head.getHeadScript());
};


/**
 * view this file in a new window
 */
silex.controller.ViewMenuController.prototype.preview = function() {
  this.tracker.trackAction('controller-events', 'request', 'view.file', 0);
  var doOpenPreview = function() {
    window.open(this.model.file.getUrl());
    this.tracker.trackAction('controller-events', 'success', 'view.file', 1);
  }.bind(this);
  if (!this.model.file.getUrl()) {
    silex.utils.Notification.confirm('You need to save your file before it can be opened in a new windo. Do you want me to <strong>save this file</strong> for you?', goog.bind(function(accept) {
      if (accept) {
        // choose a new name
        this.view.fileExplorer.saveAsDialog(
            goog.bind(function(url) {
              doOpenPreview();
            }, this),
            {'mimetype': 'text/html'},
            goog.bind(function(err) {
              this.tracker.trackAction('controller-events', 'error', 'view.file', -1);
            }, this),
        );
      }
    }, this), 'save', 'cancel');
  }
  else {
    doOpenPreview();
  }
};


