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
 * @fileoverview The settings dialog which handles the file settings
 *
 */


goog.require('silex.view.ViewBase');
goog.provide('silex.view.SettingsDialog');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');



/**
 * the Silex SettingsDialog class
 * @constructor
 * @param  {Element}  element  DOM element to wich I render the UI
 * @param  {function} cbk   callback which I'll call when the elements
 * load the template and make it a SettingsDialog dialog
 * this is only the UI part, to let user setup publish functionnality
 */
silex.view.SettingsDialog = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);

  // init the editor
  this.publicationPath = '';
  // hide the at start
  goog.style.setStyle(this.element, 'display', 'none');
  // handle escape key
  var shortcutHandler = new goog.ui.KeyboardShortcutHandler(document);
  shortcutHandler.registerShortcut('esc', goog.events.KeyCodes.ESC);
  goog.events.listen(
      shortcutHandler,
      goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
      goog.bind(this.closeEditor, this));
  // close button
  var btn = goog.dom.getElementByClass('close-btn', this.element);
  goog.events.listen(btn, goog.events.EventType.CLICK, function() {
    this.closeEditor();
  }, false, this);
  // publication path browse button
  var btn = goog.dom.getElementByClass('browse-btn', this.element);
  goog.events.listen(btn, goog.events.EventType.CLICK, function() {
    this.onStatus('browsePublishPath');
  }, false, this);
  // publication path input field
  var inputPublicationPath =
      goog.dom.getElementByClass('input-publication-path');
  goog.events.listen(
      inputPublicationPath, goog.ui.Component.EventType.CHANGE,
      function() {
        this.onStatus('change', inputPublicationPath.value);
      }, false, this);
};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.SettingsDialog, silex.view.ViewBase);


/**
 * get/set the publication path
 * @see silex.model.File
 * @return {string}   the publication path
 */
silex.view.SettingsDialog.prototype.getPublicationPath = function() {
  var that = this;
  var path = null;
  $('meta[name="publicationPath"]', this.headElement).each(
      function() {
        path = this.getAttribute('content');
      });
  return path;
};


/**
 * render the template
 */
silex.view.SettingsDialog.prototype.redraw = function() {
  var inputPublicationPath = goog.dom.getElementByClass('input-publication-path');
  inputPublicationPath.value = this.getPublicationPath();
};


/**
 * open settings dialog
 * @param {function} cbk   callback to be called when the user closes the dialog
 */
silex.view.SettingsDialog.prototype.openDialog = function(cbk) {
  this.onClose = cbk;
  // background
  var background = goog.dom.getElementByClass('settings-background');
  // show
  goog.style.setStyle(background, 'display', 'inherit');
  goog.style.setStyle(this.element, 'display', '');
  // close
  goog.events.listen(background,
      goog.events.EventType.CLICK,
      this.closeEditor,
      true,
      this);
  this.redraw();
};


/**
 * close editor
 * this is private method, do not call it
 */
silex.view.SettingsDialog.prototype.closeEditor = function() {
  if (this.onClose) this.onClose();
  // background
  var background = goog.dom.getElementByClass('settings-background');
  // hide
  goog.style.setStyle(background, 'display', 'none');
  goog.style.setStyle(this.element, 'display', 'none');
  // close
  goog.events.unlisten(background,
      goog.events.EventType.CLICK,
      this.closeEditor,
      true,
      this);
};
