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
goog.require('silex.view.dialog.DialogBase');



/**
 * the Silex FileExplorer class
 * @constructor
 * @extends {silex.view.dialog.DialogBase}
 * @param {!Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                               the controller instances
 */
silex.view.dialog.FileExplorer = function(element, model, controller) {
  // call super
  goog.base(this, element, model, controller);
  // cloud explorer instance
  silex.service.CloudStorage.getInstance().ready(() => {
    this.ce = silex.service.CloudStorage.getInstance().ce;
  });
  // set the visibility css class
  this.visibilityClass = 'file-editor';
  this.buildUi();
};


// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.FileExplorer, silex.view.dialog.DialogBase);


/**
 * reference to the filepicker instance
 * @type {CloudExplorer}
 */
silex.view.dialog.FileExplorer.prototype.ce = null;


silex.view.dialog.FileExplorer.IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];
silex.view.dialog.FileExplorer.HTML_EXTENSIONS = ['.html', '.htm'];


/**
 * call CE API
 * @private
 * @param {Promise} promise
 * @param {function(FileInfo)} cbk
 * @param {?function(Object)=} opt_errCbk
 * @param {?function()=} opt_cancelCbk
 */
silex.view.dialog.FileExplorer.prototype.handlePromise =
    function(promise, cbk, opt_errCbk, opt_cancelCbk) {

  this.openEditor();

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
    this.closeEditor();
  }).catch(e => {
    console.error('Error thrown by CE', e.stack);
    //this.closeEditor();
    if(opt_errCbk != null) opt_errCbk(/** @type {Object} */ (e));
  });
};


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
silex.view.dialog.FileExplorer.prototype.openFile =
    function(cbk, opt_extensions, opt_errCbk, opt_cancelCbk) {
  this.handlePromise(this.ce.openFile(opt_extensions), cbk, opt_errCbk, opt_cancelCbk);
};


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
silex.view.dialog.FileExplorer.prototype.openFiles =
    function(cbk, opt_extensions, opt_errCbk, opt_cancelCbk) {
  this.handlePromise(this.ce.openFiles(opt_extensions), cbk, opt_errCbk, opt_cancelCbk);
};


/**
 * pick a folder
 * @param {function(FileInfo)} cbk
 * @param {?function(Object)=} opt_errCbk
 * @param {?function()=} opt_cancelCbk
 */
silex.view.dialog.FileExplorer.prototype.openFolder =
    function(cbk, opt_errCbk, opt_cancelCbk) {
  this.handlePromise(this.ce.openFolder(), cbk, opt_errCbk, opt_cancelCbk);
};


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
silex.view.dialog.FileExplorer.prototype.saveAs =
    function(cbk, defaultName, opt_extensions, opt_errCbk, opt_cancelCbk) {
  this.handlePromise(this.ce.saveAs(defaultName, opt_extensions), cbk, opt_errCbk, opt_cancelCbk);
};

