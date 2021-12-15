

/**
 * @fileoverview
 * the Silex base class for code editors, based on monaco editor
 * @see https://microsoft.github.io/monaco-editor/
 *
 *
 */

// tslint:disable
import { getPropertySplitter } from '../PropSplitter';

declare namespace monaco {
  class Selection { constructor(a: number, b: number, c: number, d: number); }
}
declare namespace monaco.editor {
    type ICodeEditor = any;
    function create(el: Element, options: any);

}
// tslint:enable

import { ModalDialog } from '../ModalDialog'
import { getUiElements } from '../../ui-store/UiElements'
import { Notification } from '../Notification'

/**
 * @class {silex.view.dialog.CodeEditorBase}
 *
 */
export class CodeEditorBase {

  static isDocked: boolean
  // make this a dialog
  modalDialog: ModalDialog

  /**
   * if true, do not propagate onChange event
   */
  private lockOnChange = false

  /**
   * instance of monaco editor
   */
  private editor: monaco.editor.ICodeEditor

  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(protected element: HTMLElement, language: string) {
    // check third party script
    // tslint:disable
    const monaco = window['monaco']
    // tslint:enable
    if (monaco) {
      // init the menu and UIs
      this.editor = monaco.editor.create(element.querySelector('.ace-editor'), {
        value: '',
        language,
        theme: 'vs-dark',
      })
      this.editor.onDidChangeModelContent((e) => {
        if (!this.lockOnChange) {
          this.contentChanged()
        }
      })

      // dock mode
      const dockBtn = element.querySelector('.dock-btn')
      if (dockBtn) {
        dockBtn.addEventListener('click', () => {
          CodeEditorBase.isDocked = !CodeEditorBase.isDocked
          this.dockPanel(CodeEditorBase.isDocked)
          this.setOptions()
          // force ace redraw for editor size
          this.editor.render()
          this.editor.layout()
          // give the editor the focus
          this.editor.focus()
        }, false)
      }
      this.modalDialog = new ModalDialog({
        name: `${language} Editor`,
        element,
        onOpen: (args) => {
          this.setOptions()
          // force ace redraw for editor size
          this.editor.render()
          this.editor.layout()
          // give the editor the focus
          this.editor.focus()
        },
        onClose: () => {},
      })
    } else {
      Notification.alert('Error', 'The monaco editor did not load. This is required by Silex, please try reloading the page or build Silex again.', () => {})
    }
  }

  /**
   * dock panels
   * @param dock or undock
   */
  dockPanel(dock: boolean) {
    const { cssEditor, jsEditor, htmlEditor } = getUiElements()
    const propSplitter = getPropertySplitter()
    if (dock) {
      document.body.classList.add('dock-editors')
      propSplitter.addRight(cssEditor)
      propSplitter.addRight(jsEditor)
      propSplitter.addRight(htmlEditor)
    } else {
      document.body.classList.remove('dock-editors')
      propSplitter.remove(cssEditor)
      propSplitter.remove(jsEditor)
      propSplitter.remove(htmlEditor)
    }
  }

  /**
   * set editor's options
   */
  setOptions() {
    this.editor.updateOptions({
      lineNumbers: CodeEditorBase.isDocked ? 'off' : 'on',
      minimap: {
        enabled: !CodeEditorBase.isDocked,
      },
    })
  }

  /**
   * Open the editor
   */
  open() {
    this.modalDialog.open()
  }

  /**
   * Close the editor
   */
  close() {
    this.modalDialog.close()
  }

  /**
   * editor read only property
   */
  setReadOnly(readOnly: boolean) {
    this.editor.updateOptions({ readOnly })
  }

  /**
   * current value of the editor
   */
  getValue(): string {
    return this.editor.getValue()
  }

  /**
   * Set a value to the editor
   * param {!string} value
   */
  setValue(value) {
    this.setReadOnly(false)

    // set value
    if (value !== this.getValue()) {
      this.lockOnChange = true
      this.editor.setValue(value)
      this.lockOnChange = false
    }

    // // force ace redraw
    // this.editor.layout();
  }

  /**
   * Set a value to the editor
   * param {!string} value
   */
  setError(value) {
    this.setReadOnly(true)

    this.lockOnChange = true
    this.editor.setValue(value)
    this.lockOnChange = false
  }

  /**
   * the content has changed, notify the controler
   */
  contentChanged() {
    throw new Error('to be overridden in sub classes')
  }
}
