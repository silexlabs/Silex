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
  // do init stuff
  this.init();
  // init the navigation
  this.element.classList.add(this.paneCssClasses[0] + '-visible');
  // init the editor
  this.publicationPath = '';
  this.title = '';
  // navigation
  var leftPane = goog.dom.getElementByClass('left-pane');
  goog.events.listen(
      leftPane, goog.events.EventType.CLICK, this.onNavClick, false, this);
};


// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.SettingsDialog, silex.view.dialog.DialogBase);


silex.view.dialog.SettingsDialog.prototype.init = function() {
  this.paneCssClasses = silex.view.dialog.SettingsDialog.PANE_CSS_CLASSES;
  // input text fields
  this.bindTextField('.general-pane .input-title', (v) => this.controller.settingsDialogController.setTitle(v));
  this.bindTextField('.general-pane .input-site-width', (v) => this.controller.settingsDialogController.setWebsiteWidth(v));
  this.bindTextField('.social-pane .input-title', (v) => this.controller.settingsDialogController.setTitleSocial(v));
  this.bindTextField('.general-pane .input-description', (v) => this.controller.settingsDialogController.setDescription(v));
  this.bindTextField('.social-pane .input-description', (v) => this.controller.settingsDialogController.setDescriptionSocial(v));
  this.bindTextField('.social-pane .input-twitter', (v) => this.controller.settingsDialogController.setTwitterSocial(v));
  this.bindTextField('.general-pane .input-favicon-path', (v) => this.controller.settingsDialogController.setFaviconPath(v));
  this.bindTextField('.social-pane .input-image-path', (v) => this.controller.settingsDialogController.setThumbnailSocialPath(v));
  this.bindTextField('.publish-pane .input-publication-path', (v) => {
    v = this.getPublicationPath();
    this.controller.settingsDialogController.setPublicationPath(v)
  });
  this.bindTextField('.publish-pane .input-publication-service', (v) => {
    v = this.getPublicationPath();
    this.controller.settingsDialogController.setPublicationPath(v)
  });

  // image path browse button
  this.bindBrowseButton('.general-pane .browse-favicon-path', () => {
    this.controller.settingsDialogController.browseFaviconPath(() => this.openEditor());
  });
  this.bindBrowseButton('.publish-pane .browse-publication-path', () => {
    this.controller.settingsDialogController.browsePublishPath(() => this.openEditor());
  });
};

/**
 * constant for all pane css classes
 */
silex.view.dialog.SettingsDialog.PANE_CSS_CLASSES = [
  'general-pane',
  'social-pane',
  'publish-pane'
];


/**
 * store the mobile checkbox
 * @type {goog.ui.Checkbox}
 */
silex.view.dialog.SettingsDialog.prototype.mobileCheckbox = null;


/**
 * init the menu and UIs
 */
silex.view.dialog.SettingsDialog.prototype.buildUi = function() {
  // call super
  goog.base(this, 'buildUi');

  var checkboxElement = goog.dom.getElementByClass('mobile-check', this.element);
  this.mobileCheckbox = new goog.ui.Checkbox();
  this.mobileCheckbox.render(checkboxElement);
  goog.events.listen(this.mobileCheckbox, goog.ui.Component.EventType.CHANGE,
   function(e) {
     this.controller.settingsDialogController.toggleEnableMobile();
   }, false, this);
};


/**
 * click in the navigation
 * @param {Event} e
 */
silex.view.dialog.SettingsDialog.prototype.onNavClick = function(e) {
  this.openPane(e.target.getAttribute('data-pane'));
};


/**
 * open the given pane
 * adds the desired pane class + '-visible' to this.element
 * @param {string} paneCssClass
 */
silex.view.dialog.SettingsDialog.prototype.openPane = function(paneCssClass) {
  // close all panes
  this.paneCssClasses.forEach(className => this.element.classList.remove(className + '-visible'));
  // open the one we want
  this.element.classList.add(paneCssClass + '-visible');
};


/**
 * binds an input element with a callback
 * @param {string} cssSelector
 * @param {function(string)} cbk
 */
silex.view.dialog.SettingsDialog.prototype.bindTextField = function(cssSelector, cbk) {
  // title input field
  var input = this.element.querySelector(cssSelector);
  if (!input) {
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
  if (!btn) {
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
};


/**
 * set the social image path to display
 * @see silex.model.Head
 * @param {?string=} opt_path
 */
silex.view.dialog.SettingsDialog.prototype.setThumbnailSocialPath = function(opt_path) {
  this.setInputValue('.social-pane .input-image-path', opt_path);
};


/**
 * set the pubication path to display
 * @see silex.model.Head
 * @param {?string=} opt_path   the publication path
 */
silex.view.dialog.SettingsDialog.prototype.setPublicationPath = function(opt_path) {
  // fill the options of the service selector
  const services = silex.service.CloudStorage.getInstance().getServices();
  const select = this.element.querySelector('.publish-pane .input-publication-service');
  select.innerHTML = '';
  for(let idx in services) {
    const service = services[idx];
    const option = document.createElement('option');
    option.value = service;
    option.innerHTML = service;
    select.appendChild(option);
  }

  // set the values
  if(opt_path && opt_path.indexOf('exec/put')) {
    // split: /api/1.0/github/exec/put/Silex/...
    // into: "github" and /Silex/...
    const split = opt_path.split(/.*1\.0\/(.*)\/exec\/put(.*)$/);
    this.setInputValue('.publish-pane .input-publication-service', split[1]);
    this.setInputValue('.publish-pane .input-publication-path', split[2]);
    if(services.length === 0) {
      // add the configured service even if user is not yet connected
      // also happens when the cloud explorer window has not been opened yet
      const option = document.createElement('option');
      option.value = split[1];
      option.innerHTML = split[1];
      select.appendChild(option);
    }
    this.element.classList.remove('publication-path-not-set');
  }
  else {
    this.setInputValue('.publish-pane .input-publication-service', '');
    this.setInputValue('.publish-pane .input-publication-path', '');
    this.element.classList.add('publication-path-not-set');
  }
};


/**
 * get the pubication path from text fields
 * @return {string} the publication path
 */
silex.view.dialog.SettingsDialog.prototype.getPublicationPath = function() {
  const service = this.element.querySelector('.publish-pane .input-publication-service').value;
  const path = this.element.querySelector('.publish-pane .input-publication-path').value;
  if(service && path &&service !== '' && path !== '') {
    return `/api/1.0/${ service }/exec/put${ path }`;
  }
  return '';
};


/**
 * enable/disable mobile version
 * @see silex.model.Head
 * @param {boolean} enabled
 */
silex.view.dialog.SettingsDialog.prototype.setEnableMobile = function(enabled) {
  this.mobileCheckbox.setChecked(enabled);
};


/**
 * set the website width
 * @see silex.model.Head
 * @param {?string=} opt_value
 */
silex.view.dialog.SettingsDialog.prototype.setWebsiteWidth = function(opt_value) {
  this.setInputValue('.general-pane .input-site-width', opt_value);
};


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
 * @param {?string=} opt_paneCssClass   css class of the pane to open
 */
silex.view.dialog.SettingsDialog.prototype.openDialog = function(opt_cbk, opt_paneCssClass) {
  this.onClose = opt_cbk;
  if(opt_paneCssClass) this.openPane(opt_paneCssClass);
  this.openEditor();
};


/**
 * Open the editor
 */
silex.view.dialog.SettingsDialog.prototype.openEditor = function() {
  // call super
  goog.base(this, 'openEditor');
try{
 this.setPublicationPath(this.model.head.getPublicationPath());
} catch(e){}
};


/**
 * close editor
 * this is private method, do not call it
 */
silex.view.dialog.SettingsDialog.prototype.closeEditor = function() {
  // call super
  goog.base(this, 'closeEditor');
  // notify caller
  if (this.onClose) {
    this.onClose();
  }
};
