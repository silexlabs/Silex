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
 * the Silex HTMLEditor class, based on ace editor
 * @see     http://ace.c9.io/
 *
 *
 */


goog.require('silex.view.AceEditorBase');
goog.provide('silex.view.HTMLEditor');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');



/**
 * @constructor
 * @extend silex.view.AceEditorBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.HTMLEditor = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);
};

// inherit from silex.view.AceEditorBase
goog.inherits(silex.view.HTMLEditor, silex.view.AceEditorBase);


/**
 * init the menu and UIs
 */
silex.view.HTMLEditor.prototype.initUI = function() {
  // call super
  goog.base(this, 'initUI');
  // set mode
  this.ace.getSession().setMode('ace/mode/html');
};
