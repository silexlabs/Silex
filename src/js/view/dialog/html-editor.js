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
 * @fileoverview
 * the Silex HtmlEditor class, based on ace editor
 * @see     http://ace.c9.io/
 *
 *
 */

goog.provide('silex.view.dialog.HtmlEditor');

goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('silex.view.dialog.AceEditorBase');



/**
 * @constructor
 * @extends {silex.view.dialog.AceEditorBase}
 * @param {!Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                               the controller instances
 */
silex.view.dialog.HtmlEditor = function(element, model, controller) {
  // call super
  goog.base(this, element, model, controller);
  // set the visibility css class
  this.visibilityClass = 'html-editor';
};

// inherit from silex.view.dialog.AceEditorBase
goog.inherits(silex.view.dialog.HtmlEditor, silex.view.dialog.AceEditorBase);


/**
 * init the menu and UIs
 */
silex.view.dialog.HtmlEditor.prototype.buildUi = function() {
  // call super
  goog.base(this, 'buildUi');
  // set mode
  // for some reason, this.ace.getSession().* is undefined,
  //    closure renames it despite the fact that that it is declared in the externs.js file
  this.ace.getSession()['setMode']('ace/mode/html');
};


/**
 * the content has changed, notify the controler
 */
silex.view.dialog.HtmlEditor.prototype.contentChanged = function() {
  this.controller.htmlEditorController.changed(this.ace.getValue());
};
