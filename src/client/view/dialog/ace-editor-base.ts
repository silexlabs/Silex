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
import {Model} from '../../types';
import {Controller} from '../../types';
import {ModalDialog} from '../ModalDialog';

/**
 * @class {silex.view.dialog.AceEditorBase}
 *
 */
export class AceEditorBase {
  /**
   * instance of ace editor
   */
  ace: AceAjax.Editor;

  /**
   * flag to prevent looping with event
   */
  iAmSettingValue: any = false;

  // make this a dialog
  modalDialog: any;

  static isDocked: boolean;

  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(protected element: HTMLElement, protected model: Model, protected controller: Controller) {
    // init the menu and UIs
    this.ace = ace.edit(element.querySelector('.ace-editor') as HTMLElement);
    this.ace.setTheme('ace/theme/idle_fingers');
    this.ace.setOptions({
      'enableBasicAutocompletion': true,
      'enableSnippets': true,
      'enableLiveAutocompletion': true
    });

    // this.ace.setTheme("ace/theme/monokai");
    // this.ace.getSession().setMode('ace/mode/css');
    // for some reason, this.ace.getSession().on is undefined,
    //    closure renames it despite the fact that that it is declared in the
    //    externs.js file
    this.ace.getSession()['on']('change', (event) => {
      if (this.iAmSettingValue === false && this.modalDialog.isOpen) {
        setTimeout(() => {
          this.contentChanged();
        }, 100);
      }
    });

    // dock mode
    let dockBtn = element.querySelector('.dock-btn');
    if (dockBtn) {
      dockBtn.addEventListener('click', () => {
        AceEditorBase.isDocked = !AceEditorBase.isDocked;
        this.controller.toolMenuController.dockPanel(AceEditorBase.isDocked);
        this.ace.resize();
      }, false);
    }
    this.modalDialog = new ModalDialog({
      name: 'Ace editor',
      element: element,
      onOpen: (args) => {
        this.ace.focus();
      },
      onClose: () => {}
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
    throw 'to be overridden in sub classes';
  }
}
