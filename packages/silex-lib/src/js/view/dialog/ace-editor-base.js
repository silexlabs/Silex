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
 * the Silex JsEditorBase class, based on ace editor
 * base class for all editors based on ace editor
 * @see     http://ace.c9.io/
 *
 *
 */

goog.provide('silex.view.dialog.AceEditorBase');

goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('silex.view.dialog.DialogBase');



/**
 * @constructor
 * @extend silex.view.dialog.DialogBase
 * @param {Element} element   container to render the UI
 * @param  {silex.types.View} view  view class which holds the other views
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 */
silex.view.dialog.AceEditorBase = function(element, view, controller) {
  // call super
  goog.base(this, element, view, controller);
  // keep a reference to ace
  this.ace = ace.edit(goog.dom.getElementByClass('ace-editor', this.element));
};
// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.AceEditorBase, silex.view.dialog.DialogBase);


/**
 * instance of ace editor
 */
silex.view.dialog.AceEditorBase.prototype.ace = null;


/**
 * flag to prevent looping with event
 */
silex.view.dialog.AceEditorBase.prototype.iAmSettingValue = false;


/**
 * init the menu and UIs
 */
silex.view.dialog.AceEditorBase.prototype.initUI = function() {
  goog.base(this, 'initUI');
  this.iAmSettingValue = false;
  //this.ace.setTheme("ace/theme/monokai");
  //this.ace.getSession().setMode('ace/mode/css');
  this.ace.getSession().on('change', goog.bind(function(e) {
    if (this.iAmSettingValue === false) {
      var value = this.ace.getValue();
      setTimeout(goog.bind(function() {
        this.contentChanged();
      }, this), 100);
    }
  }, this));
};


/**
 * Open the editor
 */
silex.view.dialog.AceEditorBase.prototype.openEditor = function(initialValue) {
  // call super
  goog.base(this, 'openEditor');
  // set value
  this.iAmSettingValue = true;
  this.ace.setValue(initialValue);
  this.ace.focus();
  this.iAmSettingValue = false;
  // force ace redraw
  this.ace.resize();
};


/**
 * the content has changed, notify the controler
 */
silex.view.dialog.AceEditorBase.prototype.contentChanged = function() {
  throw ('to be overridden in sub classes');
};
