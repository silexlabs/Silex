"use strict";
/**
 * @fileoverview
 *   This class is in charge of the "modal" behavior of the dialogs in Silex
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalDialog = exports.resetFocus = void 0;
/**
 * input element to get the focus
 * used to blur the UI inputs
 */
let focusInput;
/**
 * remove the focus from all text fields
 */
function resetFocus() {
    if (!focusInput) {
        focusInput = document.createElement('input');
        // hide the focus input and attach it to the DOM
        focusInput.style.left = '-1000px';
        focusInput.style.position = 'absolute';
        document.body.appendChild(focusInput);
    }
    // setTimeout because we might need to wait for a click to finish bubbling
    // e.g. when edit text, the UI layer is hidden, click on the stage => focus on the stage iframe
    setTimeout(() => {
        focusInput.focus();
        focusInput.blur();
        document.getSelection().removeAllRanges();
    }, 0);
}
exports.resetFocus = resetFocus;
/**
 * implement a "modal" behavior to hide and show dialogs
 * there is a static method to open dialogs by name
 * @class {silex.view.ModalDialog}
 */
class ModalDialog {
    constructor(options) {
        // set the flag
        this.isOpen = false;
        // check and store options
        if (options.name) {
            this.name = options.name;
            ModalDialog.dialogs.set(this.name, this);
        }
        if (options.element) {
            this.element = options.element;
        }
        else {
            throw new Error('Modal dialog options missing a "element" field');
        }
        if (options.onOpen) {
            this.onOpen = options.onOpen;
        }
        else {
            throw new Error('Modal dialog options missing a "onOpen" field');
        }
        if (options.onClose) {
            this.onClose = options.onClose;
        }
        else {
            throw new Error('Modal dialog options missing a "onClose" field');
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
        document.addEventListener('keydown', (e) => {
            if (this.isOpen && e.key === 'Escape') {
                this.close();
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }
    /**
     * open a dialog by name
     */
    static open(name, args = null) {
        if (ModalDialog.dialogs.has(name)) {
            ModalDialog.dialogs.get(name).open(args);
        }
        else {
            console.error('could not open dialog', name, ModalDialog.dialogs);
        }
    }
    /**
     * close a dialog by name
     */
    static close() {
        if (ModalDialog.currentDialog) {
            ModalDialog.currentDialog.close();
        }
        else {
            console.error('could not close dialog, there is no dialog opened');
        }
    }
    /**
     * open the dialog
     * @param args optional args to pass to the dialog
     */
    open(args) {
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
        }
        else {
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
            resetFocus();
            // finally hide the dialog - this has to be last, otherwise things like
            // blur inputs will fail since this makes the dialog display: none;
            this.element.classList.add(ModalDialog.HIDE_DIALOG_CLASS_NAME);
        }
        else {
            console.warn('dialog is already closed', this.name ? this.name : '');
        }
    }
}
exports.ModalDialog = ModalDialog;
ModalDialog.dialogs = new Map();
ModalDialog.HIDE_DIALOG_CLASS_NAME = 'silex-hide-dialog';
ModalDialog.MODAL_DIALOG_CLASS_NAME = 'silex-modal-dialog';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kYWxEaWFsb2cuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvY2xpZW50L2NvbXBvbmVudHMvTW9kYWxEaWFsb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBOzs7R0FHRzs7O0FBRUg7OztHQUdHO0FBQ0gsSUFBSSxVQUF1QixDQUFBO0FBRTNCOztHQUVHO0FBQ0gsU0FBZ0IsVUFBVTtJQUN4QixJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ2YsVUFBVSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFNUMsZ0RBQWdEO1FBQ2hELFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQTtRQUNqQyxVQUFVLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUE7UUFDdEMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUE7S0FDdEM7SUFDRCwwRUFBMEU7SUFDMUUsK0ZBQStGO0lBQy9GLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDbEIsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFBO1FBQ2pCLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBQTtJQUMzQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDUCxDQUFDO0FBaEJELGdDQWdCQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFhLFdBQVc7SUFvQ3RCLFlBQVksT0FLWDtRQVJELGVBQWU7UUFDZixXQUFNLEdBQUcsS0FBSyxDQUFBO1FBUVosMEJBQTBCO1FBQzFCLElBQUksT0FBTyxDQUFDLElBQUksRUFBRTtZQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUE7WUFDeEIsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENB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