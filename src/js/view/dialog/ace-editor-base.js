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
 * the Silex base class for code editors, based on ace editor
 * @see     http://ace.c9.io/
 *
 *
 */

goog.provide('silex.view.dialog.AceEditorBase');
goog.require('silex.view.ModalDialog');


/**
 * flag set to true when editors are docked
 * @type {?boolean}
 */
silex.view.dialog.AceEditorBase.isDocked = null;


/**
  * @class {silex.view.dialog.AceEditorBase}
 */
class AceEditorBase {
  /**
   * @param {!Element} element   container to render the UI
   * @param  {!silex.types.Model} model  model class which holds
   *                                  the model instances - views use it for read operation only
   * @param  {!silex.types.Controller} controller  structure which holds
   *                                               the controller instances
   */
  constructor(element, model, controller) {
    // store the params
    this.element = element;
    this.model = model;
    this.controller = controller;

    /**
     * instance of ace editor
     * @type {?Ace}
     */
    this.ace = null;


    /**
     * flag to prevent looping with event
     */
    this.iAmSettingValue = false;

     // init the menu and UIs
    this.ace = ace.edit(
        /** @type {!Element} */(goog.dom.getElementByClass(
            'ace-editor', element)));
    this.ace.setTheme('ace/theme/idle_fingers');
    this.ace.setOptions({
          'enableBasicAutocompletion': true,
          'enableSnippets': true,
          'enableLiveAutocompletion': true
    });

    //this.ace.setTheme("ace/theme/monokai");
    //this.ace.getSession().setMode('ace/mode/css');
    // for some reason, this.ace.getSession().on is undefined,
    //    closure renames it despite the fact that that it is declared in the externs.js file
    this.ace.getSession()['on']('change', goog.bind(function(event) {
      if (this.iAmSettingValue === false && this.modalDialog.isOpen) {
        setTimeout(goog.bind(function() {
          this.contentChanged();
        }, this), 100);
      }
    }, this));

    // dock mode
    var dockBtn = goog.dom.getElementByClass('dock-btn', element);
    if (dockBtn) {
      goog.events.listen(dockBtn, goog.events.EventType.CLICK, function() {
        silex.view.dialog.AceEditorBase.isDocked = !silex.view.dialog.AceEditorBase.isDocked;
        this.controller.toolMenuController.dockPanel(silex.view.dialog.AceEditorBase.isDocked);
        this.ace.resize();
      }, false, this);
    }

    // make this a dialog
    this.modalDialog = new ModalDialog({
      element: element,
      onOpen: args => {
        this.ace.focus();
      },
      onClose: () => {
      },
    });
  }


  /**
   * Open the editor
   */
  open() {
    this.modalDialog.open();
  }


  /**
   * Close the editor
   */
  close() {
    this.modalDialog.close();
  }


  /**
   * Set a value to the editor
   * param {!string} value
   */
  setValue(value) {
    // set value
    this.iAmSettingValue = true;
    this.ace.setValue(value);
    this.ace.focus();
    this.iAmSettingValue = false;
    // force ace redraw
    this.ace.resize();
  }


  /**
   * the content has changed, notify the controler
   */
  contentChanged() {
    throw ('to be overridden in sub classes');
  }
}

