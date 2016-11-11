
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
 *   This class is in charge of the "modal" behavior of the dialogs in Silex
 */


goog.provide('silex.view.ModalDialog');


const HIDE_DIALOG_CLASS_NAME = 'silex-hide-dialog';
const MODAL_DIALOG_CLASS_NAME = 'silex-modal-dialog';
const HIDE_DIALOGS_BACKGROUND = 'silex-hide-dialog-background';

/**
 * implement a "modal" behavior to hide and show dialogs
 * there is a static method to open dialogs by name
 * @type {silex.view.ModalDialog}
 */
silex.view.ModalDialog = class {

  /**
   * @constructor
   * @param  {{name:(string|undefined), element:Element, onOpen:!function(?Object=), onClose:!function()}} options
   */
  constructor(options) {
    // check and store options
    if(options.name) {
      this.name = options.name;
      silex.view.ModalDialog.dialogs[this.name] = this;
    }
    if(options.element) this.element = options.element;
    else throw 'Modal dialog options missing a "element" field';
    if(options.onOpen) this.onOpen = options.onOpen;
    else throw 'Modal dialog options missing a "onOpen" field';
    if(options.onClose) this.onClose = options.onClose;
    else throw 'Modal dialog options missing a "onClose" field';
    // init the static fields
    silex.view.ModalDialog.dialogs = silex.view.ModalDialog.dialogs || {};
    // init css classes
    this.element.classList.add(MODAL_DIALOG_CLASS_NAME);
    if(!silex.view.ModalDialog.currentDialog) {
      document.body.classList.add(HIDE_DIALOGS_BACKGROUND);
    }
    // set the flag
    this.isOpen = false;
    // set the css classes
    this.element.classList.add(HIDE_DIALOG_CLASS_NAME);
    // close button
    const closeBtn = this.element.querySelector('.close-btn');
    if(closeBtn) closeBtn.onclick = e => this.close();
  }


  /**
   * open a dialog by name
   * @param  {string} name
   * @param  {?Object=} args
   */
  static open(name, args = null) {
    if(silex.view.ModalDialog.dialogs && silex.view.ModalDialog.dialogs[name]) {
      silex.view.ModalDialog.dialogs[name].open(args);
    }
    else {
      console.error('could not open dialog', name, silex.view.ModalDialog.dialogs);
    }
  }


  /**
   * close a dialog by name
   */
  static close() {
    if(silex.view.ModalDialog.currentDialog) {
      silex.view.ModalDialog.currentDialog.close();
    }
    else {
      console.error('could not close dialog, there is no dialog opened');
    }
  }


  /**
   * open the dialog
   * @param  {?Object=} args optional args to pass to the dialog
   */
  open(args) {
    if(!this.isOpen) {
      // set the flag
      this.isOpen = true;
      // handle the current dialog
      if(silex.view.ModalDialog.currentDialog) {
        silex.view.ModalDialog.currentDialog.close();
      }
      silex.view.ModalDialog.currentDialog = this;
      // css classes to show the dialog and the background
      this.element.classList.remove(HIDE_DIALOG_CLASS_NAME);
      document.body.classList.remove(HIDE_DIALOGS_BACKGROUND);
      // call the callback
      this.onOpen(args);
    }
    else {
      console.warn('this dialog is already opened', this.name ? this.name : '');
    }
  }
  /**
   * close the dialog
   */
  close() {
    if(this.isOpen) {
      this.isOpen = false;
      silex.view.ModalDialog.currentDialog = null;
      this.element.classList.add(HIDE_DIALOG_CLASS_NAME);
      document.body.classList.add(HIDE_DIALOGS_BACKGROUND);
      this.onClose();
    }
    else {
      console.warn('dialog is already closed', this.name ? this.name : '');
    }
  }
}
