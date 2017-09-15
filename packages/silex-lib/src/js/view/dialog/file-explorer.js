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
 * FIXME: should handle the 2 ways of specifying mimetype? https://github.com/silexlabs/cloud-explorer/issues/43
 */


goog.provide('silex.view.dialog.FileExplorer');
goog.require('silex.service.CloudStorage');
goog.require('silex.utils.Url');



/**
 * the Silex FileExplorer class
 * @class {silex.view.dialog.FileExplorer}
 */
class FileExplorer {
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
   * @param {function(string)|function()} ceMethod
   * @param {function(FileInfo)} cbk
   * @param {?string=} opt_paramStr
   * @param {?Object.<Array>=} opt_mimetypes optional array of accepted mimetypes,
   *                           e.g. {'mimetypes': ['text/html', 'text/plain']}
   * @param {?function(Object)=} opt_errCbk
   * @param {?function()=} opt_cancelCbk
   */
  callCE(ceMethod, cbk, opt_paramStr, opt_mimetypes, opt_errCbk, opt_cancelCbk) {

    this.open();

    // give focus to the iframe
    document.querySelector('#silex-file-explorer').contentWindow.focus();

    ceMethod.call(this.ce, opt_paramStr)
    .then((fileInfo) => {
      if(fileInfo != null) {
        // no https, because it creates security issues
        // fileInfo.url = fileInfo.url.replace('https://', '//');
        cbk(fileInfo);
      }
      else {
        console.log('user canceled in CE');
        if(opt_cancelCbk != null) {
          opt_cancelCbk();
        }
      }
      this.close();
    }).catch(e => {
      console.error('Error thrown by CE', e.stack);
      this.close();
      if(opt_errCbk != null) opt_errCbk(e);
    });
  }


  /**
   * pick file
   * @param {function(FileInfo)} cbk
   * @param {?Object.<Array>=} opt_mimetypes optional array of accepted mimetypes,
   *                           e.g. {'mimetypes': ['text/html', 'text/plain']}
   * @param {?function(Object)=} opt_errCbk
   * @param {?function()=} opt_cancelCbk
   */
  openFile(cbk, opt_mimetypes, opt_errCbk, opt_cancelCbk) {
    this.callCE(this.ce.openFile, cbk, null, opt_mimetypes, opt_errCbk, opt_cancelCbk);
  }


  /**
   * pick multiple files
   * @param {function(FileInfo)} cbk
   * @param {?Object.<Array>=} opt_mimetypes optional array of accepted mimetypes,
   *                           e.g. {'mimetypes': ['text/html', 'text/plain']}
   * @param {?function(Object)=} opt_errCbk
   * @param {?function()=} opt_cancelCbk
   */
  openFiles(cbk, opt_mimetypes, opt_errCbk, opt_cancelCbk) {
    this.callCE(this.ce.openFiles, cbk, null, opt_mimetypes, opt_errCbk, opt_cancelCbk);
  }


  /**
   * pick a folder
   * @param {function(FileInfo)} cbk
   * @param {?Object.<Array>=} opt_mimetypes optional array of accepted mimetypes,
   *                           e.g. {'mimetypes': ['text/html', 'text/plain']}
   * @param {?function(Object)=} opt_errCbk
   * @param {?function()=} opt_cancelCbk
   */
  openFolder(cbk, opt_mimetypes, opt_errCbk, opt_cancelCbk) {
    this.callCE(this.ce.openFolder, cbk, null, opt_mimetypes, opt_errCbk, opt_cancelCbk);
  }


  /**
   * choose a name for the file
   * @param {function(FileInfo)} cbk
   * @param {string} defaultName
   * @param {?Object.<Array>=} opt_mimetypes optional array of accepted mimetypes,
   *                           e.g. {'mimetypes': ['text/html', 'text/plain']}
   * @param {?function(Object)=} opt_errCbk
   * @param {?function()=} opt_cancelCbk
   */
  saveAs(cbk, defaultName, opt_mimetypes, opt_errCbk, opt_cancelCbk) {
    this.callCE(this.ce.saveAs, cbk, defaultName, opt_mimetypes, opt_errCbk, opt_cancelCbk);
  }


  /**
   * save as dialog
   * @param {function(string)} cbk
   * @param {?Object.<Array>=} opt_mimetypes optional array of accepted mimetypes,
   *                           e.g. {'mimetypes': ['text/html', 'text/plain']}
   * @param {?function(Object)=} opt_errCbk
   */
  // saveAsDialogunctioncbk, opt_mimetypes, opt_errCbk) {
  //   this.open();
  //
  //   var errCbk = function(FPError) {
  //     console.error(FPError);
  //     if (opt_errCbk) {
  //       opt_errCbk(FPError);
  //     }
  //     this.close();
  //   }.bind(this);
  //   var successCbk = function(fileInfo) {
  //     // notify controller
  //     if (cbk) {
  //       cbk(fileInfo.url);
  //     }
  //     this.close();
  //   }.bind(this);
  //   // export dummy data
  //   this.ce.saveAs('http://google.com/',
  //       opt_mimetypes,
  //       goog.bind(function(fileInfo) {
  //         // give back focus to Silex
  //         // this.view.stage.resetFocus();
  //         // no https, because it creates security issues
  //         fileInfo.url = fileInfo.url.replace('https://', '//');
  //         successCbk(fileInfo);
  //       }, this),
  //       errCbk);
  // }


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

