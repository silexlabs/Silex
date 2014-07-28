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
 * the Silex CssEditor class, based on ace editor
 * @see     http://ace.c9.io/
 *
 *
 */

goog.provide('silex.view.dialog.CssEditor');

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
silex.view.dialog.CssEditor = function(element, view, controller) {
  // call super
  goog.base(this, element, view, controller);
};
// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.CssEditor, silex.view.dialog.AceEditorBase);


/**
 * init the menu and UIs
 */
silex.view.dialog.CssEditor.prototype.initUI = function() {
  // call super
  goog.base(this, 'initUI');
  // set mode
  this.ace.getSession().setMode('ace/mode/css');
};


/**
 * the content has changed, notify the controler
 */
silex.view.dialog.CssEditor.prototype.contentChanged = function() {
  this.controller.cssEditorController.changed(this.ace.getValue());
};
