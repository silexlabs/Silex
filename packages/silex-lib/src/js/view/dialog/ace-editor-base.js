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
 * @extends {silex.view.dialog.DialogBase}
 * @param {!Element} element   container to render the UI
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                               the controller instances
 */
silex.view.dialog.AceEditorBase = function(element, controller) {
  // call super
  goog.base(this, element, controller);
  // keep a reference to ace
  this.ace = ace.edit(
      /** @type {!Element} */(goog.dom.getElementByClass(
          'ace-editor', this.element)));
};
// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.AceEditorBase, silex.view.dialog.DialogBase);


/**
 * instance of ace editor
 * @type {Ace}
 */
silex.view.dialog.AceEditorBase.prototype.ace = null;


/**
 * flag to prevent looping with event
 */
silex.view.dialog.AceEditorBase.prototype.iAmSettingValue = false;


/**
 * init the menu and UIs
 */
silex.view.dialog.AceEditorBase.prototype.buildUi = function() {
  goog.base(this, 'buildUi');
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
  // dock mode
  var dockBtn = goog.dom.getElementByClass('dock-btn', this.element);
  if (dockBtn) {
    goog.events.listen(dockBtn, goog.events.EventType.CLICK, function() {
      goog.dom.classlist.toggle(document.body, 'dock-editors');
      this.ace.resize();
    }, false, this);
  }
};


/**
 * Open the editor
 */
silex.view.dialog.AceEditorBase.prototype.openEditor = function() {
  // call super
  goog.base(this, 'openEditor');
};


/**
 * Set a value to the editor
 * param {!string} value
 */
silex.view.dialog.AceEditorBase.prototype.setValue = function(value) {
  // set value
  this.iAmSettingValue = true;
  this.ace.setValue(value);
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
