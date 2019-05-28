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
 * the Silex base class for code editors, based on monaco editor
 * @see https://microsoft.github.io/monaco-editor/
 *
 *
 */

// tslint:disable
declare namespace monaco {
  class Selection { constructor(a: number, b: number, c: number, d: number); }
}
declare namespace monaco.editor {
    type ICodeEditor = any;
    function create(el: Element, options: any);

}
// tslint:enable

import { Controller, Model } from '../../types';
import { ModalDialog } from '../ModalDialog';

/**
 * @class {silex.view.dialog.CodeEditorBase}
 *
 */
export class CodeEditorBase {

  static isDocked: boolean;
  /**
   * instance of monaco editor
   */
  editor: monaco.editor.ICodeEditor;

  // make this a dialog
  modalDialog: any;

  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(protected element: HTMLElement, protected model: Model, protected controller: Controller, language: string) {
    // init the menu and UIs
    this.editor = monaco.editor.create(element.querySelector('.ace-editor'), {
      value: '',
      language,
      theme: 'vs-dark',
    });
    this.editor.onDidChangeModelContent((e) => this.contentChanged());

    // dock mode
    const dockBtn = element.querySelector('.dock-btn');
    if (dockBtn) {
      dockBtn.addEventListener('click', () => {
        CodeEditorBase.isDocked = !CodeEditorBase.isDocked;
        this.controller.toolMenuController.dockPanel(CodeEditorBase.isDocked);
        this.editor.render();
      }, false);
    }
    this.modalDialog = new ModalDialog({
      name: `${language} Editor`,
      element,
      onOpen: (args) => {
        this.editor.focus();
      },
      onClose: () => {},
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
    this.editor.setValue(value);

    // force ace redraw
    this.editor.layout();
  }

  /**
   * the content has changed, notify the controler
   */
  contentChanged() {
    throw new Error('to be overridden in sub classes');
  }
}
