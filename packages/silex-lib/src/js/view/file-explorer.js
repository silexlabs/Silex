//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

/**
 * @fileoverview This is the dialog box containing the
 *     Cloud Explorer file picker
 *     this is only the UI part, to let user choose a file in the cloud
 *     @see silex.service.CloudStorage     for the service/network part
 *
 *
 */


goog.require('silex.view.ViewBase');
goog.provide('silex.view.FileExplorer');

goog.require('silex.service.CloudStorage');
goog.require('silex.utils.Url');

goog.require('goog.async.Delay');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');



//////////////////////////////////////////////////////////////////
// FileExplorer class
//////////////////////////////////////////////////////////////////
/**
 * the Silex FileExplorer class
 * @constructor
 * @extend silex.view.ViewBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.FileExplorer = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);
  // hide the at start
  goog.style.setStyle(this.element, 'display', 'none');
  // init the dialog
  new goog.async.Delay(function() {
    this.init();
  }, 1000, this).start();

  // handle escape key
  var shortcutHandler = new goog.ui.KeyboardShortcutHandler(document);
  shortcutHandler.registerShortcut('esc', goog.events.KeyCodes.ESC);
  goog.events.listen(
      shortcutHandler,
      goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
      goog.bind(this.closeEditor, this));

};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.FileExplorer, silex.view.ViewBase);

/**
 * Contant for file picker config
 */
silex.view.FileExplorer.CONTAINER_TYPE = 'modal';


/**
 * Contant for file picker config
 */
silex.view.FileExplorer.SERVICES = ['DROPBOX', 'GOOGLE_DRIVE', 'EVERNOTE', 'FTP'];


/**
 * reference to the filepicker instance
 */
silex.view.FileExplorer.prototype.filePicker;


/**
 * init file explorer
 */
silex.view.FileExplorer.prototype.init = function() {
  // get the global variable of Cloud Explorer
  this.filePicker = silex.service.CloudStorage.getInstance().filePicker;
  // close button
  goog.events.listen(goog.dom.getElementByClass('close-btn', this.element), goog.events.EventType.CLICK, function() {
    this.closeEditor();
  }, false, this);
};


/**
 * pick a file
 * @param opt_mimetypes     optional array of accepted mimetypes, e.g. ['text/html', 'text/plain']
 */
silex.view.FileExplorer.prototype.openDialog = function(cbk, opt_mimetypes, opt_errCbk) {
  var fileExtentions;
  if (opt_mimetypes){
    if (opt_mimetypes['mimetype'].indexOf('image') === 0){
      fileExtentions = ['jpg', 'jpeg', 'gif', 'png'];
    }
    else if (opt_mimetypes['mimetype'].indexOf('text/html') === 0){
      fileExtentions = ['html', 'htm'];
    }
  }

  var errCbk = function(FPError) {
    console.error(FPError);
    if (opt_errCbk) {
      opt_errCbk(FPError);
    }
  };
  var successCbk = function (url) {
    // notify controller
    // workaround: cloud explorer issue https://github.com/silexlabs/cloud-explorer/issues/2
    new goog.async.Delay(function() {
      if (cbk) cbk(url);
    }, 10, this).start();
  };

  // pick it up
  this.filePicker.pick(
      goog.bind(function(blob) {
        // hide dialog
        this.closeEditor();

        // no https, because it creates security issues
        blob.url = blob.url.replace('https://', 'http://');

        // check the the file extention is ok
        if (fileExtentions && silex.utils.Url.checkFileExt(blob.url, fileExtentions) === false){
          var fileName = blob.url.substring(blob.url.lastIndexOf('/') + 1);
          silex.utils.Notification.confirm('The file name ' +
            fileName +
            ' does not looks good to me, are you sure you want to select this file?',
              function (accept) {
            if (accept) {
              successCbk(blob.url);
            }
            else{
              errCbk({message: 'Wrong file type.'})
            }
          });
        }
        else{
          successCbk(blob.url);
        }
      }, this),
      errCbk);
  // show dialog
  this.openEditor();
};


/**
 * save as dialog
 * @param opt_mimetypes     optional array of accepted mimetypes, e.g. ['text/html', 'text/plain']
 */
silex.view.FileExplorer.prototype.saveAsDialog = function(cbk, opt_mimetypes, opt_errCbk) {
  var fileExtentions;
  if (opt_mimetypes){
    if (opt_mimetypes['mimetype'].indexOf('image') === 0){
      fileExtentions = ['jpg', 'jpeg', 'gif', 'png'];
    }
    else if (opt_mimetypes['mimetype'].indexOf('text/html') === 0){
      fileExtentions = ['html', 'htm'];
    }
  }

  var errCbk = function(FPError) {
    console.error(FPError);
    if (opt_errCbk) {
      opt_errCbk(FPError);
    }
  };
  var successCbk = function (blob) {
    // notify controller
    // workaround: cloud explorer issue https://github.com/silexlabs/cloud-explorer/issues/2
    new goog.async.Delay(function() {
      if (cbk) cbk(blob.url);
    }, 10, this).start();
  };

  // export dummy data
  this.filePicker.exportFile('http://google.com/',
      opt_mimetypes,
      goog.bind(function(blob) {

        // hide dialog
        this.closeEditor();

        // no https, because it creates security issues
        blob.url = blob.url.replace('https://', 'http://');

        // check the the file extention is ok
        if (fileExtentions && silex.utils.Url.checkFileExt(blob.url, fileExtentions) === false){
          var fileName = blob.url.substring(blob.url.lastIndexOf('/') + 1);
          silex.utils.Notification.confirm('The file name ' +
            fileName +
            ' does not looks good to me, are you sure you want to select this file?',
              function (accept) {
            if (accept) {
              successCbk(blob);
            }
            else{
              errCbk({message: 'Wrong file type.'})
            }
          });
        }
        else{
          successCbk(blob);
        }
      }, this),
      errCbk);
  // show dialog
  this.openEditor();
};


/**
 * open editor
 * this is private method, do not call it
 */
silex.view.FileExplorer.prototype.openEditor = function() {
  // background
  var background = goog.dom.getElementByClass('dialogs-background');
  // show
  goog.style.setStyle(background, 'display', 'inherit');
  goog.style.setStyle(this.element, 'display', '');
  // close
  goog.events.listen(background, goog.events.EventType.CLICK, this.closeEditor, true, this);
};


/**
 * close editor
 * this is private method, do not call it
 */
silex.view.FileExplorer.prototype.closeEditor = function() {
  // background
  var background = goog.dom.getElementByClass('dialogs-background');
  // hide
  goog.style.setStyle(background, 'display', 'none');
  goog.style.setStyle(this.element, 'display', 'none');
  // close
  goog.events.unlisten(background, goog.events.EventType.CLICK, this.closeEditor, true, this);
};
