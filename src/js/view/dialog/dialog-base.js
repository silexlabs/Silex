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
 * base class for all dialogs
 * @see     http://ace.c9.io/
 *
 *
 */

goog.provide('silex.view.dialog.DialogBase');


goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');



/**
 * @constructor
 *
 * @param {!Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                               the controller instances
 */
silex.view.dialog.DialogBase = function(element, model, controller) {
  /**
   * @type {!Element} container to render the UI
   */
  this.element = element;
  /**
   * @type {!silex.types.Model}
   */
  this.model = model;
  /**
   * @type {!silex.types.Controller}
   */
  this.controller = controller;
  /**
   * @type {!Element} store the background
   */
  this.background = /** @type {!Element} */ (goog.dom.getElementByClass('dialogs-background'));
  /**
   * @type {!boolean} flag to remember if the dialog is opened
   */
  this.isOpened = false;
};


/**
 * class which is added to the document body when the dialog is visible
 * @type {string}
 */
silex.view.dialog.DialogBase.prototype.visibilityClass = 'visibilityClass-should-be-set-in-subclasse';


/**
 * currently opened dialog
 * @type {?silex.view.dialog.DialogBase}
 */
silex.view.dialog.DialogBase.currentDialog = null;

/**
 * init the menu and UIs
 * called by the app constructor
 */
silex.view.dialog.DialogBase.prototype.buildUi = function() {
  // handle escape key
  let keyHandler = new goog.events.KeyHandler(document);
  goog.events.listen(keyHandler, 'key',
    (e) => {
      if(this.isOpened && e.keyCode === goog.events.KeyCodes.ESC) {
        this.closeEditor();
        e.preventDefault();
        e.stopPropagation();
      }
    });
  // close button
  goog.events.listen(goog.dom.getElementByClass('close-btn', this.element), goog.events.EventType.CLICK, function() {
    this.closeEditor();
  }, false, this);
  // dialogs background
  goog.events.listen(this.background, goog.events.EventType.CLICK, function(event) {
    this.closeEditor();
  }, false, this);
};


/**
 * Open the editor
 */
silex.view.dialog.DialogBase.prototype.openEditor = function() {
  if (this.isOpened === false) {
    // close the previously opened dialog
    if (silex.view.dialog.DialogBase.currentDialog !== null) {
      silex.view.dialog.DialogBase.currentDialog.closeEditor();
    }
    silex.view.dialog.DialogBase.currentDialog = this;
    // show
    goog.dom.classlist.add(document.body, this.visibilityClass + '-opened');
    // flag to remember if the dialog is opened
    this.isOpened = true;
  }
};


/**
 * close text editor
 */
silex.view.dialog.DialogBase.prototype.closeEditor = function() {
  if (this.isOpened === true) {
    // reset the current dialog
    silex.view.dialog.DialogBase.currentDialog = null;
    // flag to remember if the dialog is opened
    this.isOpened = false;
    // hide dialog and background
    goog.dom.classlist.remove(document.body, this.visibilityClass + '-opened');
    // focus the stage
    // FIXME: find a better way to automize that than going through the controller's view
    this.controller.fileMenuController.view.stage.resetFocus();
  }
};
