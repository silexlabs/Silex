

/**
 * @fileoverview
 *   This class is in charge of the "modal" behavior of the dialogs in Silex
 */

/**
 * input element to get the focus
 * used to blur the UI inputs
 */
let focusInput: HTMLElement

/**
 * remove the focus from all text fields
 */
export function resetFocus() {
  if (!focusInput) {
    focusInput = document.createElement('input')

    // hide the focus input and attach it to the DOM
    focusInput.style.left = '-1000px'
    focusInput.style.position = 'absolute'
    document.body.appendChild(focusInput)
  }
  // setTimeout because we might need to wait for a click to finish bubbling
  // e.g. when edit text, the UI layer is hidden, click on the stage => focus on the stage iframe
  setTimeout(() => {
    focusInput.focus()
    focusInput.blur()
    document.getSelection().removeAllRanges()
  }, 0)
}

/**
 * implement a "modal" behavior to hide and show dialogs
 * there is a static method to open dialogs by name
 * @class {silex.view.ModalDialog}
 */
export class ModalDialog {

  static dialogs: Map<string, ModalDialog> = new Map()
  static currentDialog: ModalDialog
  static HIDE_DIALOG_CLASS_NAME = 'silex-hide-dialog'
  static MODAL_DIALOG_CLASS_NAME = 'silex-modal-dialog'

  /**
   * open a dialog by name
   */
  static open(name: string, args: any = null) {
    if (ModalDialog.dialogs.has(name)) {
      ModalDialog.dialogs.get(name).open(args)
    } else {
      console.error('could not open dialog', name, ModalDialog.dialogs)
    }
  }

  /**
   * close a dialog by name
   */
  static close() {
    if (ModalDialog.currentDialog) {
      ModalDialog.currentDialog.close()
    } else {
      console.error('could not close dialog, there is no dialog opened')
    }
  }
  name: string
  element: HTMLElement
  onOpen: (p1?: any) => any
  onClose: () => any

  // set the flag
  isOpen = false

  constructor(options: {
    name: string,
    element: HTMLElement,
    onOpen: (p1?: any) => any,
    onClose: () => any,
  }) {
    // check and store options
    if (options.name) {
      this.name = options.name
      ModalDialog.dialogs.set(this.name, this)
    }
    if (options.element) {
      this.element = options.element
    } else {
      throw new Error('Modal dialog options missing a "element" field')
    }
    if (options.onOpen) {
      this.onOpen = options.onOpen
    } else {
      throw new Error('Modal dialog options missing a "onOpen" field')
    }
    if (options.onClose) {
      this.onClose = options.onClose
    } else {
      throw new Error('Modal dialog options missing a "onClose" field')
    }

    // set the css classes
    this.element.classList.add(ModalDialog.MODAL_DIALOG_CLASS_NAME)
    this.element.classList.add(ModalDialog.HIDE_DIALOG_CLASS_NAME)

    // close button
    const closeBtn = this.element.querySelector('.close-btn') as HTMLElement
    if (closeBtn) {
      closeBtn.onclick = (e) => this.close()
    }

    // handle escape key
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.close()
        e.preventDefault()
        e.stopPropagation()
      }
    })
  }

  /**
   * open the dialog
   * @param args optional args to pass to the dialog
   */
  open(args?: any) {
    if (!this.isOpen) {
      // set the flag
      this.isOpen = true

      // handle the current dialog
      if (ModalDialog.currentDialog) {
        ModalDialog.currentDialog.close()
      }
      ModalDialog.currentDialog = this

      // css classes to show the dialog and the background
      this.element.classList.remove(ModalDialog.HIDE_DIALOG_CLASS_NAME)

      // call the callback
      this.onOpen(args)
    } else {
      console.warn('this dialog is already opened', this.name ? this.name : '')
    }
  }

  /**
   * close the dialog
   */
  close() {
    if (this.isOpen) {
      // reset the flags
      this.isOpen = false
      ModalDialog.currentDialog = null

      // notify the dialog itself
      this.onClose()

      // give focus to the stage, this will trigger a change event on the input
      // elements which have focus
      resetFocus()

      // finally hide the dialog - this has to be last, otherwise things like
      // blur inputs will fail since this makes the dialog display: none;
      this.element.classList.add(ModalDialog.HIDE_DIALOG_CLASS_NAME)
    } else {
      console.warn('dialog is already closed', this.name ? this.name : '')
    }
  }
}
