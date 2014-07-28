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
 * @fileoverview
 * the Silex JsEditor class, based on ace editor
 * @see     http://ace.c9.io/
 *
 *
 */


goog.provide('silex.view.dialog.JsEditor');

goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('silex.view.dialog.AceEditorBase');



/**
 * @constructor
 * @extend silex.view.dialog.AceEditorBase
 * @param {Element} element   container to render the UI
 * @param  {silex.types.View} view  view class which holds the other views
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 */
silex.view.dialog.JsEditor = function(element, view, controller) {
  // call super
  goog.base(this, element, view, controller);
};

// inherit from silex.view.dialog.AceEditorBase
goog.inherits(silex.view.dialog.JsEditor, silex.view.dialog.AceEditorBase);


/**
 * init the menu and UIs
 */
silex.view.dialog.JsEditor.prototype.initUI = function() {
  // call super
  goog.base(this, 'initUI');
  // set mode
  this.ace.getSession().setMode('ace/mode/javascript');
};


/**
 * the content has changed, notify the controler
 */
silex.view.dialog.JsEditor.prototype.contentChanged = function() {
  this.controller.jsEditorController.changed(this.ace.getValue());
};
