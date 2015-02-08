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
  // description input field
  var inputDescription = goog.dom.getElementByClass('input-description');
  goog.events.listen(
      inputDescription, goog.ui.Component.EventType.CHANGE,
      function() {
        this.controller.settingsDialogController.setDescription(inputDescription.value);
      }, false, this);
  // favicon path browse button
  var faviconPathBtn = goog.dom.getElementByClass('browse-favicon-path', this.element);
  goog.events.listen(faviconPathBtn, goog.events.EventType.CLICK, function() {
    this.controller.settingsDialogController.browseFaviconPath();
  }, false, this);
  // favicon path input field
  var inputFaviconPath = goog.dom.getElementByClass('input-favicon-path');
  goog.events.listen(
      inputFaviconPath, goog.ui.Component.EventType.CHANGE,
      function() {
        this.controller.settingsDialogController.setFaviconPath(inputFaviconPath.value);
      }, false, this);
  // publication path browse button
  var publicationPathBtn = goog.dom.getElementByClass('browse-publication-path', this.element);
  goog.events.listen(publicationPathBtn, goog.events.EventType.CLICK, function() {
    this.controller.settingsDialogController.browsePublishPath();
  }, false, this);
  // publication path input field
  var inputPublicationPath = goog.dom.getElementByClass('input-publication-path');
  goog.events.listen(
      inputPublicationPath, goog.ui.Component.EventType.CHANGE,
      function() {
        this.controller.settingsDialogController.setPublicationPath(inputPublicationPath.value);
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
 * set the value to the input element
 * @see silex.model.Head
 * @param {string} cssClass   the input css class
 * @param {?string=} opt_value
 */
silex.view.dialog.SettingsDialog.prototype.setInputValue = function(cssClass, opt_value) {
  var input = goog.dom.getElementByClass(cssClass);
  if (opt_value) {
    input.value = opt_value;
  }
  else {
    input.value = '';
  }
};


/**
 * set the pubication path to display
 * @see silex.model.Head
 * @param {?string=} opt_path   the publication path
 */
silex.view.dialog.SettingsDialog.prototype.setPublicationPath = function(opt_path) {
  this.setInputValue('input-publication-path', opt_path);
}


/**
 * set the favicon path to display
 * @see silex.model.Head
 * @param {?string=} opt_path
 */
silex.view.dialog.SettingsDialog.prototype.setFaviconPath = function(opt_path) {
  this.setInputValue('input-favicon-path', opt_path);
}


/**
 * set the site title to display
 * @see silex.model.Head
 * @param {?string=} opt_title   the site title
 */
silex.view.dialog.SettingsDialog.prototype.setTitle = function(opt_title) {
  this.setInputValue('input-title', opt_title);
};


/**
 * set the site description tag
 * @see silex.model.Head
 * @param {?string=} opt_description   the site description
 */
silex.view.dialog.SettingsDialog.prototype.setDescription = function(opt_description) {
  this.setInputValue('input-description', opt_description);
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
