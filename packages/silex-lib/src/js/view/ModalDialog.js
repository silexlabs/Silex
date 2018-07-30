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

/**
 * implement a "modal" behavior to hide and show dialogs
 * there is a static method to open dialogs by name
 * @class {silex.view.ModalDialog}
 */
class ModalDialog {
  /**
   * open a dialog by name
   * @param  {string} name
   * @param  {?Object=} args
   */
   static open(name, args = null) {
    if(ModalDialog.dialogs && ModalDialog.dialogs[name]) {
      ModalDialog.dialogs[name].open(args);
    }
    else {
      console.error('could not open dialog', name, ModalDialog.dialogs);
    }
  };


  /**
   * close a dialog by name
   */
   static close() {
    if(ModalDialog.currentDialog) {
      ModalDialog.currentDialog.close();
    }
    else {
      console.error('could not close dialog, there is no dialog opened');
    }
  }


  /**
   * @param  {{name:(string|undefined), element:Element, onOpen:!function(?Object=), onClose:!function()}} options
   */
  constructor(options) {
    // check and store options
    if(options.name) {
      this.name = options.name;
      ModalDialog.dialogs[this.name] = this;
    }
    if(options.element) this.element = options.element;
    else throw 'Modal dialog options missing a "element" field';
    if(options.onOpen) this.onOpen = options.onOpen;
    else throw 'Modal dialog options missing a "onOpen" field';
    if(options.onClose) this.onClose = options.onClose;
    else throw 'Modal dialog options missing a "onClose" field';
    // init the static fields
    ModalDialog.dialogs = ModalDialog.dialogs || {};
    // set the flag
    this.isOpen = false;
    // set the css classes
    this.element.classList.add(MODAL_DIALOG_CLASS_NAME);
    this.element.classList.add(HIDE_DIALOG_CLASS_NAME);
    // close button
    const closeBtn = this.element.querySelector('.close-btn');
    if(closeBtn) closeBtn.onclick = e => this.close();
    // handle escape key
    let keyHandler = new goog.events.KeyHandler(document);
    goog.events.listen(keyHandler, 'key',
      (e) => {
        if(this.isOpen && e.keyCode === goog.events.KeyCodes.ESC) {
          this.close();
          e.preventDefault();
          e.stopPropagation();
        }
      });
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
      if(ModalDialog.currentDialog) {
        ModalDialog.currentDialog.close();
      }
      ModalDialog.currentDialog = this;
      // css classes to show the dialog and the background
      this.element.classList.remove(HIDE_DIALOG_CLASS_NAME);
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
      // reset the flags
      this.isOpen = false;
      ModalDialog.currentDialog = null;
      // notify the dialog itself
      this.onClose();
      // give focus to the stage, this will trigger a change event on the input elements which have focus
      silex.model.Body.resetFocus();
      // finally hide the dialog - this has to be last, otherwise things like blur inputs will fail since this makes the dialog display: none;
      this.element.classList.add(HIDE_DIALOG_CLASS_NAME);
    }
    else {
      console.warn('dialog is already closed', this.name ? this.name : '');
    }
  }
}
