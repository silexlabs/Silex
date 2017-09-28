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
 * @fileoverview This is the dialog box containing the
 *     Cloud Explorer file picker
 *     this is only the UI part, to let user choose a file in the cloud
 *     @see silex.service.CloudStorage     for the service/network part
 *
 */


goog.provide('silex.view.dialog.FileExplorer');
goog.require('silex.service.CloudStorage');
goog.require('silex.utils.Url');



/**
 * the Silex FileExplorer class
 * @class {silex.view.dialog.FileExplorer}
 */
class FileExplorer {
  static get IMAGE_EXTENSIONS() { return ['.jpg', '.jpeg', '.png', '.gif']; }
  static get HTML_EXTENSIONS() { return ['.html', '.htm']; }

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
     * reference to the filepicker instance
     * @type {CloudExplorer}
     */
    this.ce = null;


    // cloud explorer instance
    silex.service.CloudStorage.getInstance().ready(() => {
      this.ce = silex.service.CloudStorage.getInstance().ce;
    });

    // make this a dialog
    this.modalDialog = new ModalDialog({
      element: element,
      onOpen: args => {},
      onClose: () => {},
    });

  }

  /**
   * call CE API
   * @private
   * @param {Promise} promise
   * @param {function(FileInfo)} cbk
   * @param {?function(Object)=} opt_errCbk
   * @param {?function()=} opt_cancelCbk
   */
  handlePromise(promise, cbk, opt_errCbk, opt_cancelCbk) {

    this.open();

    // give focus to the iframe
    document.querySelector('#silex-file-explorer').contentWindow.focus();

    promise.then((fileInfo) => {
      if(fileInfo != null) {
        cbk(fileInfo);
      }
      else {
        // user canceled in CE
        if(opt_cancelCbk != null) {
          opt_cancelCbk();
        }
      }
      this.close();
    }).catch(e => {
      console.error('Error thrown by CE', e.stack);
      // this.close();
      if(opt_errCbk != null) opt_errCbk(/** @type {Object} */ (e));
    });
  }


  /**
   * pick file
   * @param {function(FileInfo)} cbk
   * @param {?Array.<string>=} opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   * @param {?function(Object)=} opt_errCbk
   * @param {?function()=} opt_cancelCbk
   */
  openFile(cbk, opt_extensions, opt_errCbk, opt_cancelCbk) {
    this.handlePromise(this.ce.openFile(opt_extensions), cbk, opt_errCbk, opt_cancelCbk);
  }


  /**
   * pick multiple files
   * @param {function(FileInfo)} cbk
   * @param {?Array.<string>=} opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   * @param {?function(Object)=} opt_errCbk
   * @param {?function()=} opt_cancelCbk
   */
  openFiles(cbk, opt_extensions, opt_errCbk, opt_cancelCbk) {
    this.handlePromise(this.ce.openFiles(opt_extensions), cbk, opt_errCbk, opt_cancelCbk);
  }


  /**
   * pick a folder
   * @param {function(FileInfo)} cbk
   * @param {?function(Object)=} opt_errCbk
   * @param {?function()=} opt_cancelCbk
   */
  openFolder(cbk, opt_errCbk, opt_cancelCbk) {
    this.handlePromise(this.ce.openFolder(), cbk, opt_errCbk, opt_cancelCbk);
  }


  /**
   * choose a name for the file
   * @param {function(FileInfo)} cbk
   * @param {string} defaultName
   * @param {?Array.<string>=} opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   * @param {?function(Object)=} opt_errCbk
   * @param {?function()=} opt_cancelCbk
   */
  saveAs(cbk, defaultName, opt_extensions, opt_errCbk, opt_cancelCbk) {
    this.handlePromise(this.ce.saveAs(defaultName, opt_extensions), cbk, opt_errCbk, opt_cancelCbk);
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
}

