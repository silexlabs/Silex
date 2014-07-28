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


goog.provide('silex.view.dialog.SettingsDialog');

goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('silex.view.dialog.DialogBase');



/**
 * the Silex SettingsDialog class
 * @constructor
 * @param  {Element}  element  DOM element to wich I render the UI
 * @param  {silex.types.View} view  view class which holds the other views
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 * load the template and make it a SettingsDialog dialog
 * this is only the UI part, to let user setup publish functionnality
 */
silex.view.dialog.SettingsDialog = function(element, view, controller) {
  // call super
  goog.base(this, element, view, controller);
  // override this.background
  this.background = goog.dom.getElementByClass('settings-background');
  // init the editor
  this.publicationPath = '';
  // publication path browse button
  var btn = goog.dom.getElementByClass('browse-btn', this.element);
  goog.events.listen(btn, goog.events.EventType.CLICK, function() {
    this.controller.settingsDialogController.browsePublishPath();
  }, false, this);
  // publication path input field
  var inputPublicationPath =
      goog.dom.getElementByClass('input-publication-path');
  goog.events.listen(
      inputPublicationPath, goog.ui.Component.EventType.CHANGE,
      function() {
        this.controller.settingsDialogController.change(inputPublicationPath.value);
      }, false, this);
};

// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.SettingsDialog, silex.view.dialog.DialogBase);


/**
 * init the menu and UIs
 */
silex.view.dialog.SettingsDialog.prototype.initUI = function() {
  // call super
  goog.base(this, 'initUI');

  // background
  var background = goog.dom.getElementByClass('settings-background');
  // dialogs background
  goog.events.listen(background, goog.events.EventType.CLICK, function(e) {
    this.closeEditor();
  }, false, this);
};


/**
 * render the template
* @see silex.model.Head
* @param {string}   the publication path
 */
silex.view.dialog.SettingsDialog.prototype.redraw = function(path) {
  var inputPublicationPath = goog.dom.getElementByClass('input-publication-path');
  if (path) {
    inputPublicationPath.value = path;
  }
  else {
    inputPublicationPath.value = '';
  }
};


/**
 * open settings dialog
 * @param {function} cbk   callback to be called when the user closes the dialog
 */
silex.view.dialog.SettingsDialog.prototype.openDialog = function(cbk) {
  this.onClose = cbk;
  this.openEditor();
};


/**
 * Open the editor
 */
silex.view.dialog.SettingsDialog.prototype.openEditor = function() {
  // call super
  goog.base(this, 'openEditor');
};


/**
 * close editor
 * this is private method, do not call it
 */
silex.view.dialog.SettingsDialog.prototype.closeEditor = function() {
  // call super
  goog.base(this, 'closeEditor');
  // notify caller
  if (this.onClose) this.onClose();
};
