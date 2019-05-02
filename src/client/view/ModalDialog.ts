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

import {Body} from '../model/body';


/**
 * implement a "modal" behavior to hide and show dialogs
 * there is a static method to open dialogs by name
 * @class {silex.view.ModalDialog}
 */
export class ModalDialog {
  name: any;
  element: any;
  onOpen: any;
  onClose: any;

  static dialogs: any = {};
  static currentDialog: ModalDialog;
  static HIDE_DIALOG_CLASS_NAME = 'silex-hide-dialog';
  static MODAL_DIALOG_CLASS_NAME = 'silex-modal-dialog';

  // set the flag
  isOpen: any = false;

  /**
   * open a dialog by name
   */
  static open(name: string, args: Object = null) {
    if (ModalDialog.dialogs && ModalDialog.dialogs[name]) {
      ModalDialog.dialogs[name].open(args);
    } else {
      console.error('could not open dialog', name, ModalDialog.dialogs);
    }
  }

  /**
   * close a dialog by name
   */
  static close() {
    if (ModalDialog.currentDialog) {
      ModalDialog.currentDialog.close();
    } else {
      console.error('could not close dialog, there is no dialog opened');
    }
  }

  constructor(options: {
    name: string,
    element: HTMLElement,
    onOpen: (p1?: any) => any,
    onClose: () => any
  }) {
    // check and store options
    if (options.name) {
      this.name = options.name;
      ModalDialog.dialogs[this.name] = this;
    }
    if (options.element) {
      this.element = options.element;
    } else {
      throw 'Modal dialog options missing a "element" field';
    }
    if (options.onOpen) {
      this.onOpen = options.onOpen;
    } else {
      throw 'Modal dialog options missing a "onOpen" field';
    }
    if (options.onClose) {
      this.onClose = options.onClose;
    } else {
      throw 'Modal dialog options missing a "onClose" field';
    }

    // set the css classes
    this.element.classList.add(ModalDialog.MODAL_DIALOG_CLASS_NAME);
    this.element.classList.add(ModalDialog.HIDE_DIALOG_CLASS_NAME);

    // close button
    const closeBtn = this.element.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.onclick = (e) => this.close();
    }

    // handle escape key
    document.addEventListener('keydown', e => {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  /**
   * open the dialog
   * @param args optional args to pass to the dialog
   */
  open(args?: Object) {
    if (!this.isOpen) {
      // set the flag
      this.isOpen = true;

      // handle the current dialog
      if (ModalDialog.currentDialog) {
        ModalDialog.currentDialog.close();
      }
      ModalDialog.currentDialog = this;

      // css classes to show the dialog and the background
      this.element.classList.remove(ModalDialog.HIDE_DIALOG_CLASS_NAME);

      // call the callback
      this.onOpen(args);
    } else {
      console.warn('this dialog is already opened', this.name ? this.name : '');
    }
  }

  /**
   * close the dialog
   */
  close() {
    if (this.isOpen) {
      // reset the flags
      this.isOpen = false;
      ModalDialog.currentDialog = null;

      // notify the dialog itself
      this.onClose();

      // give focus to the stage, this will trigger a change event on the input
      // elements which have focus
      Body.resetFocus();

      // finally hide the dialog - this has to be last, otherwise things like
      // blur inputs will fail since this makes the dialog display: none;
      this.element.classList.add(ModalDialog.HIDE_DIALOG_CLASS_NAME);
    } else {
      console.warn('dialog is already closed', this.name ? this.name : '');
    }
  }
}
