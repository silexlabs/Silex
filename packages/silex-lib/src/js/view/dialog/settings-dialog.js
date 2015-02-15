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
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                               the controller instances
 */
silex.view.dialog.SettingsDialog = function(element, model, controller) {
  // call super
  goog.base(this, element, model, controller);
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

  // input text fields
  this.bindTextField('.general-pane .input-title', (v) => this.controller.settingsDialogController.setTitle(v));
  this.bindTextField('.social-pane .input-title', (v) => this.controller.settingsDialogController.setTitleSocial(v));
  this.bindTextField('.general-pane .input-description', (v) => this.controller.settingsDialogController.setDescription(v));
  this.bindTextField('.social-pane .input-description', (v) => this.controller.settingsDialogController.setDescriptionSocial(v));
  this.bindTextField('.social-pane .input-twitter', (v) => this.controller.settingsDialogController.setTwitterSocial(v));
  this.bindTextField('.general-pane .input-favicon-path', (v) => this.controller.settingsDialogController.setFaviconPath(v));
  this.bindTextField('.social-pane .input-image-path', (v) => this.controller.settingsDialogController.setThumbnailSocialPath(v));
  this.bindTextField('.publish-pane .input-publication-path', (v) => this.controller.settingsDialogController.setPublicationPath(v));

  // image path browse button
  this.bindBrowseButton('.general-pane .browse-favicon-path', () => this.controller.settingsDialogController.browseFaviconPath())
  this.bindBrowseButton('.social-pane .browse-image-path', () => this.controller.settingsDialogController.browseThumbnailSocialPath())
  this.bindBrowseButton('.publish-pane .browse-publication-path', () => this.controller.settingsDialogController.browsePublishPath())
};

// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.SettingsDialog, silex.view.dialog.DialogBase);


/**
 * constant for all pane css classes
 */
silex.view.dialog.SettingsDialog.PANE_CSS_CLASSES = [
  'general-pane',
  'social-pane',
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
 * binds an input element with a callback
 * @param {string} cssSelector
 * @param {function(string)} cbk
 */
silex.view.dialog.SettingsDialog.prototype.bindTextField = function(cssSelector, cbk) {
  // title input field
  var input = this.element.querySelector(cssSelector);
  if(!input) {
    throw new Error('Settings panel error: could not find the element to bind.');
  }
  goog.events.listen(
      input, goog.ui.Component.EventType.CHANGE,
      function() {
        cbk(input.value);
      }, false, this);
};


/**
 * binds a button element with a callback
 * @param {string} cssSelector
 * @param {function()} cbk
 */
silex.view.dialog.SettingsDialog.prototype.bindBrowseButton = function(cssSelector, cbk) {
  // title input field
  var btn = this.element.querySelector(cssSelector);
  if(!btn) {
    throw new Error('Settings panel error: could not find the element to bind.');
  }
  goog.events.listen(btn, goog.events.EventType.CLICK, function() {
    cbk();
  }, false, this);
};


/**
 * set the value to the input element
 * @see silex.model.Head
 * @param {string} cssSelector
 * @param {?string=} opt_value
 */
silex.view.dialog.SettingsDialog.prototype.setInputValue = function(cssSelector, opt_value) {
  var input = this.element.querySelector(cssSelector);
  if (opt_value) {
    input.value = opt_value;
  }
  else {
    input.value = '';
  }
};


/**
 * set the favicon path to display
 * @see silex.model.Head
 * @param {?string=} opt_path
 */
silex.view.dialog.SettingsDialog.prototype.setFaviconPath = function(opt_path) {
  this.setInputValue('.general-pane .input-favicon-path', opt_path);
}


/**
 * set the social image path to display
 * @see silex.model.Head
 * @param {?string=} opt_path
 */
silex.view.dialog.SettingsDialog.prototype.setThumbnailSocialPath = function(opt_path) {
  this.setInputValue('.social-pane .input-image-path', opt_path);
}


/**
 * set the pubication path to display
 * @see silex.model.Head
 * @param {?string=} opt_path   the publication path
 */
silex.view.dialog.SettingsDialog.prototype.setPublicationPath = function(opt_path) {
  this.setInputValue('.publish-pane .input-publication-path', opt_path);
}


/**
 * set the site title to display
 * @see silex.model.Head
 * @param {?string=} opt_title   the site title
 */
silex.view.dialog.SettingsDialog.prototype.setTitle = function(opt_title) {
  this.setInputValue('.general-pane .input-title', opt_title);
};


/**
 * set the site description tag
 * @see silex.model.Head
 * @param {?string=} opt_description   the site description
 */
silex.view.dialog.SettingsDialog.prototype.setDescription = function(opt_description) {
  this.setInputValue('.general-pane .input-description', opt_description);
};


/**
 * set the site title to display
 * @see silex.model.Head
 * @param {?string=} opt_title   the site title
 */
silex.view.dialog.SettingsDialog.prototype.setTitleSocial = function(opt_title) {
  this.setInputValue('.social-pane .input-title', opt_title);
};


/**
 * set the site description tag
 * @see silex.model.Head
 * @param {?string=} opt_description   the site description
 */
silex.view.dialog.SettingsDialog.prototype.setDescriptionSocial = function(opt_description) {
  this.setInputValue('.social-pane .input-description', opt_description);
};


/**
 * set the owner twitter account
 * @see silex.model.Head
 * @param {?string=} opt_twitter
 */
silex.view.dialog.SettingsDialog.prototype.setTwitterSocial = function(opt_twitter) {
  this.setInputValue('.social-pane .input-twitter', opt_twitter);
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
