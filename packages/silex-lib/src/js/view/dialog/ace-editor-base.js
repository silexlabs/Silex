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
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                               the controller instances
 */
silex.view.dialog.AceEditorBase = function(element, model, controller) {
  // call super
  goog.base(this, element, model, controller);
  // keep a reference to ace
  this.ace = ace.edit(
      /** @type {!Element} */(goog.dom.getElementByClass(
          'ace-editor', this.element)));
  this.ace.setTheme('ace/theme/idle_fingers');
  this.ace.setOptions({
        'enableBasicAutocompletion': true,
        'enableSnippets': true,
        'enableLiveAutocompletion': true
  });
};
// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.AceEditorBase, silex.view.dialog.DialogBase);


/**
 * instance of ace editor
 * @type {?Ace}
 */
silex.view.dialog.AceEditorBase.prototype.ace = null;


/**
 * flag to prevent looping with event
 */
silex.view.dialog.AceEditorBase.prototype.iAmSettingValue = false;


/**
 * currently opened editor
 * @type {?silex.view.dialog.AceEditorBase}
 */
silex.view.dialog.AceEditorBase.currentEditor = null;


/**
 * flag set to true when editors are docked
 * @type {?boolean}
 */
silex.view.dialog.AceEditorBase.isDocked = null;


/**
 * init the menu and UIs
 */
silex.view.dialog.AceEditorBase.prototype.buildUi = function() {
  goog.base(this, 'buildUi');
  this.iAmSettingValue = false;
  //this.ace.setTheme("ace/theme/monokai");
  //this.ace.getSession().setMode('ace/mode/css');
  // for some reason, this.ace.getSession().on is undefined,
  //    closure renames it despite the fact that that it is declared in the externs.js file
  this.ace.getSession()['on']('change', goog.bind(function(event) {
    if (this.iAmSettingValue === false && this.isOpened) {
      setTimeout(goog.bind(function() {
        this.contentChanged();
      }, this), 100);
    }
  }, this));
  // dock mode
  var dockBtn = goog.dom.getElementByClass('dock-btn', this.element);
  if (dockBtn) {
    goog.events.listen(dockBtn, goog.events.EventType.CLICK, function() {
      silex.view.dialog.AceEditorBase.isDocked = !silex.view.dialog.AceEditorBase.isDocked;
      this.controller.toolMenuController.dockPanel(silex.view.dialog.AceEditorBase.isDocked);
      this.ace.resize();
    }, false, this);
  }
};


/**
 * Open the editor
 */
silex.view.dialog.AceEditorBase.prototype.openEditor = function() {
  // close the previous editor
  if (silex.view.dialog.AceEditorBase.currentEditor) {
    silex.view.dialog.AceEditorBase.currentEditor.closeEditor();
  }
  silex.view.dialog.AceEditorBase.currentEditor = this;

  // call super
  goog.base(this, 'openEditor');
};


/**
 * Close the editor
 */
silex.view.dialog.AceEditorBase.prototype.closeEditor = function() {
  // remove the reference
  silex.view.dialog.AceEditorBase.currentEditor = null;
  // call super
  goog.base(this, 'closeEditor');
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
