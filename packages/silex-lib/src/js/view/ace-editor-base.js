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


goog.require('silex.view.ViewBase');
goog.provide('silex.view.AceEditorBase');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');



/**
 * @constructor
 * @extend silex.view.ViewBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.AceEditorBase = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);

  // init the editor
  this.initUI();
  // handle escape key
  var shortcutHandler = new goog.ui.KeyboardShortcutHandler(document);
  shortcutHandler.registerShortcut('esc', goog.events.KeyCodes.ESC);
  goog.events.listen(
      shortcutHandler,
      goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
      goog.bind(this.closeEditor, this));
};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.AceEditorBase, silex.view.ViewBase);


/**
 * instance of ace editor
 */
silex.view.AceEditorBase.prototype.ace;


/**
 * flag to prevent looping with event
 */
silex.view.AceEditorBase.prototype.iAmSettingValue;


/**
 * init the menu and UIs
 */
silex.view.AceEditorBase.prototype.initUI = function() {
  this.ace = ace.edit(goog.dom.getElementByClass('ace-editor', this.element));
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
  // close button
  goog.events.listen(goog.dom.getElementByClass('close-btn', this.element), goog.events.EventType.CLICK, function() {
    this.closeEditor();
  }, false, this);
};


/**
 * Open the editor
 */
silex.view.AceEditorBase.prototype.openEditor = function(initialValue) {
  // background
  var background = goog.dom.getElementByClass('dialogs-background');
  // show
  goog.style.setStyle(background, 'display', 'inherit');
  goog.style.setStyle(this.element, 'display', 'inherit');
  // close
  goog.events.listenOnce(background, goog.events.EventType.CLICK, function(e) {
    this.closeEditor();
  }, false, this);
  // set value
  this.iAmSettingValue = true;
  this.ace.setValue(initialValue);
  this.ace.focus();
  this.iAmSettingValue = false;
  // force ace redraw
  this.ace.resize();
};


/**
 * close text editor
 */
silex.view.AceEditorBase.prototype.closeEditor = function() {
  // background
  var background = goog.dom.getElementByClass('dialogs-background');
  // hide
  goog.style.setStyle(background, 'display', 'none');
  goog.style.setStyle(this.element, 'display', 'none');
};


/**
 * retrieve the editor content
 */
silex.view.AceEditorBase.prototype.getData = function() {
  return this.ace.getValue();
};


/**
 * the content has changed, notify the controler
 */
silex.view.AceEditorBase.prototype.contentChanged = function() {
  if (this.onStatus) {
    this.onStatus('changed', this.getData());
  }
};
