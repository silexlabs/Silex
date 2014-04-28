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
 * @fileoverview The settings dialog which handles the file settings
 *
 */


goog.provide('silex.view.dialog.SettingsDialog');

goog.require('silex.view.dialog.DialogBase');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');



/**
 * the Silex SettingsDialog class
 * @constructor
 * @param  {Element}  element  DOM element to wich I render the UI
 * @param  {silex.types.View} view  view class which holds the other views
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 * load the template and make it a SettingsDialog dialog
 * this is only the UI part, to let user setup publish functionnality
 */
silex.view.dialog.SettingsDialog = function(element, view, controller) {
  // call super
  goog.base(this, element, view, controller);

  // init the editor
  this.publicationPath = '';
  // hide the at start
  goog.style.setStyle(this.element, 'display', 'none');
  // publication path browse button
  var btn = goog.dom.getElementByClass('browse-btn', this.element);
  goog.events.listen(btn, goog.events.EventType.CLICK, function() {
    this.onStatus('browsePublishPath');
  }, false, this);
  // publication path input field
  var inputPublicationPath =
      goog.dom.getElementByClass('input-publication-path');
  goog.events.listen(
      inputPublicationPath, goog.ui.Component.EventType.CHANGE,
      function() {
        this.onStatus('change', inputPublicationPath.value);
      }, false, this);
};

// inherit from silex.view.dialog.DialogBase
goog.inherits(silex.view.dialog.SettingsDialog, silex.view.dialog.DialogBase);


/**
 * get/set the publication path
 * @see silex.model.File
 * @return {string}   the publication path
 */
silex.view.dialog.SettingsDialog.prototype.getPublicationPath = function() {
  var metaNode = goog.dom.findNode(this.headElement, function (node) {
    return node && node.tagName === 'meta' && node.getAttribute('name') === 'publicationPath';
  });
  if (metaNode){
    return metaNode.getAttribute('content');
  }
  else{
    return null;
  }
};


/**
 * render the template
 */
silex.view.dialog.SettingsDialog.prototype.redraw = function() {
  var inputPublicationPath = goog.dom.getElementByClass('input-publication-path');
  inputPublicationPath.value = this.getPublicationPath();
};


/**
 * open settings dialog
 * @param {function} cbk   callback to be called when the user closes the dialog
 */
silex.view.dialog.SettingsDialog.prototype.openDialog = function(cbk) {
  this.onClose = cbk;
  this.redraw();
};


/**
 * close editor
 * this is private method, do not call it
 */
silex.view.dialog.SettingsDialog.prototype.closeEditor  = function() {
  goog.base(this, 'closeEditor');
  if (this.onClose) this.onClose();
};
