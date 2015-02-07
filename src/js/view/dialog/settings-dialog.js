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
 * @fileoverview The settings dialog which handles the file settings
 *
 */


goog.provide('silex.view.dialog.SettingsDialog');

goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('silex.view.dialog.DialogBase');



/**
 * the Silex SettingsDialog class
 * load the template and make it a SettingsDialog dialog
 * this is only the UI part, to let user setup publish functionnality
 * @extends {silex.view.dialog.DialogBase}
 * @constructor
 * @param {!Element} element   container to render the UI
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                               the controller instances
 */
silex.view.dialog.SettingsDialog = function(element, controller) {
  // call super
  goog.base(this, element, controller);
  // set the visibility css class
  this.visibilityClass = 'settings-editor';
  // init the navigation
  this.element.classList.add('general-pane-visible');
  // init the editor
  this.publicationPath = '';
  this.title = '';
  // navigation
  var leftPane = goog.dom.getElementByClass('left-pane');
  goog.events.listen(
      leftPane, goog.events.EventType.CLICK, this.onNavClick, false, this);
  // title input field
  var inputTitle = goog.dom.getElementByClass('input-title');
  goog.events.listen(
      inputTitle, goog.ui.Component.EventType.CHANGE,
      function() {
        this.controller.settingsDialogController.setTitle(inputTitle.value);
      }, false, this);
  // publication path browse button
  var btn = goog.dom.getElementByClass('browse-btn', this.element);
  goog.events.listen(btn, goog.events.EventType.CLICK, function() {
    this.controller.settingsDialogController.browsePublishPath();
  }, false, this);
  // publication path input field
  var inputPublicationPath = goog.dom.getElementByClass('input-publication-path');
  goog.events.listen(
      inputPublicationPath, goog.ui.Component.EventType.CHANGE,
      function() {
        this.controller.settingsDialogController.change(inputPublicationPath.value);
      }, false, this);
};

// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.SettingsDialog, silex.view.dialog.DialogBase);


/**
 * constant for all pane css classes
 */
silex.view.dialog.SettingsDialog.PANE_CSS_CLASSES = [
  'general-pane',
  'publish-pane'
];


/**
 * init the menu and UIs
 */
silex.view.dialog.SettingsDialog.prototype.buildUi = function() {
  // call super
  goog.base(this, 'buildUi');
};


/**
 * click in the navigation
 * adds the desired pane class + '-visible' to this.element
 * @param {Event} e
 */
silex.view.dialog.SettingsDialog.prototype.onNavClick = function(e) {
  // select the target pane and make it visible
  goog.array.forEach(silex.view.dialog.SettingsDialog.PANE_CSS_CLASSES,
    function(paneCssClass) {
      if(e.target.classList.contains(paneCssClass)) {
        this.element.classList.add(paneCssClass + '-visible');
      }
      else {
        this.element.classList.remove(paneCssClass + '-visible');
      }
    }, this);
};


/**
 * set the pubication path to display
 * @see silex.model.Head
 * @param {string} path   the publication path
 */
silex.view.dialog.SettingsDialog.prototype.setPublicationPath = function(path) {
  var inputPublicationPath = goog.dom.getElementByClass('input-publication-path');
  if (path) {
    inputPublicationPath.value = path;
  }
  else {
    inputPublicationPath.value = '';
  }
};


/**
 * set the pubication site title to display
 * @see silex.model.Head
 * @param {string} title   the site title
 */
silex.view.dialog.SettingsDialog.prototype.setTitle = function(title) {
  var inputTitle = goog.dom.getElementByClass('input-title');
  if (title) {
    inputTitle.value = title;
  }
  else {
    inputTitle.value = '';
  }
};


/**
 * open settings dialog
 * @param {?function()=} opt_cbk   callback to be called when the user closes the dialog
 */
silex.view.dialog.SettingsDialog.prototype.openDialog = function(opt_cbk) {
  this.onClose = opt_cbk;
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
