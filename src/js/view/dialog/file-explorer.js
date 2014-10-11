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

goog.require('goog.async.Delay');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('silex.service.CloudStorage');
goog.require('silex.utils.Url');



//////////////////////////////////////////////////////////////////
// FileExplorer class
//////////////////////////////////////////////////////////////////
/**
 * the Silex FileExplorer class
 * @constructor
 * @param {!Element} element   container to render the UI
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                               the controller instances
 */
silex.view.dialog.FileExplorer = function(element, controller) {
  // get the global variable of Cloud Explorer
  this.filePicker = silex.service.CloudStorage.getInstance().filePicker;
  // store the constructor params
  this.controller = controller;
};


/**
 * reference to the filepicker instance
 */
silex.view.dialog.FileExplorer.prototype.filePicker;


/**
 * pick a file
 * @param {function(string)} cbk
 * @param {?Object.<Array>=} opt_mimetypes optional array of accepted mimetypes,
 *                           e.g. {'mimetypes': ['text/html', 'text/plain']}
 * @param {?function(Object)=} opt_errCbk
 */
silex.view.dialog.FileExplorer.prototype.openDialog =
    function(cbk, opt_mimetypes, opt_errCbk) {

	var errCbk = function(FPError) {
    console.error(FPError);
    if (opt_errCbk) {
      opt_errCbk(FPError);
    }
  };
  var successCbk = function(url) {
    // notify controller
    if (cbk) cbk(url);
  };

  // pick it up
  this.filePicker.pick(
      opt_mimetypes,
      goog.bind(function(blob) {
        // give back focus to Silex
        // this.view.stage.resetFocus();
        // no https, because it creates security issues
        blob.url = blob.url.replace('https://', 'http://');
        successCbk(blob.url);
      }, this),
      errCbk);
};


/**
 * save as dialog
 * @param {function(string)} cbk
 * @param {?Object.<Array>=} opt_mimetypes optional array of accepted mimetypes,
 *                           e.g. {'mimetypes': ['text/html', 'text/plain']}
 * @param {?function(Object)=} opt_errCbk
 */
silex.view.dialog.FileExplorer.prototype.saveAsDialog = function(cbk, opt_mimetypes, opt_errCbk) {
  var errCbk = function(FPError) {
    console.error(FPError);
    if (opt_errCbk) {
      opt_errCbk(FPError);
    }
  };
  var successCbk = function(blob) {
    // notify controller
    if (cbk) cbk(blob.url);
  };
  // export dummy data
  this.filePicker.exportFile('http://google.com/',
      opt_mimetypes,
      goog.bind(function(blob) {
        // give back focus to Silex
        // this.view.stage.resetFocus();
        // no https, because it creates security issues
        blob.url = blob.url.replace('https://', 'http://');
        successCbk(blob);
      }, this),
      errCbk);
};
