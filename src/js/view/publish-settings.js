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


goog.provide('silex.view.PublishSettings');



/**
 * the Silex PublishSettings class
 * @constructor
 * @param  {Element}  element  DOM element to wich I render the UI
 * @param  {function} cbk   callback which I'll call when the elements
 * load the template and make it a PublishSettings dialog
 * this is only the UI part, to let user setup publish functionnality
 */
silex.view.PublishSettings = function(element, cbk) {
  this.element = element;
  this.publicationPath = '';
  goog.style.setStyle(this.element, 'display', 'none');

  silex.Helper.loadTemplateFile('templates/publishsettings.html',
      element,
      function() {
        // close button
        var btn = goog.dom.getElementByClass('close-btn', this.element);
        goog.events.listen(btn, goog.events.EventType.CLICK, function() {
          this.closeEditor();
        }, false, this);
        var btn = goog.dom.getElementByClass('browse-btn', this.element);
        goog.events.listen(btn, goog.events.EventType.CLICK, function() {
          this.onStatus({
            type: 'browsePublishPath'
          });
        }, false, this);
        var inputPublicationPath =
            goog.dom.getElementByClass('input-publication-path');
        goog.events.listen(
          inputPublicationPath, goog.ui.Component.EventType.CHANGE, function() {
          this.onStatus({
                type: 'change',
                data: inputPublicationPath.value
              });
          }, false, this);
    // continue loading
    if (cbk) cbk();
  }, this);
};


/**
 * element of the dom to which the component is rendered
 */
silex.view.PublishSettings.prototype.element;


/**
 * callback set by the controller
 * called to notify the controller that the file browser should be opened to
 * select the publish path
 */
silex.view.PublishSettings.prototype.onStatus;


/**
 * set publication path
 */
silex.view.PublishSettings.prototype.setPublicationPath = function(path) {
  this.publicationPath = path;
  this.redraw();
};


/**
 * render the template
 */
silex.view.PublishSettings.prototype.redraw = function() {
  var inputPublicationPath =
      goog.dom.getElementByClass('input-publication-path');
  inputPublicationPath.value = this.publicationPath;
};


/**
 * open settings
 * @param opt_mimetypes   optional array of accepted mimetypes,
 *     e.g. ['text/html', 'text/plain']
 */
silex.view.PublishSettings.prototype.openDialog = function(cbk) {
  // show dialog
  this.openEditor(cbk);
  this.redraw();
};


/**
 * open editor
 * this is private method, do not call it
 */
silex.view.PublishSettings.prototype.openEditor = function(cbk) {
  this.onClose = cbk;
  // background
  var background = goog.dom.getElementByClass('settings-background');
  // show
  goog.style.setStyle(background, 'display', 'inherit');
  goog.style.setStyle(this.element, 'display', '');
  // close
  goog.events.listen(background,
    goog.events.EventType.CLICK,
    this.closeEditor,
    true,
    this);
};


/**
 * close editor
 * this is private method, do not call it
 */
silex.view.PublishSettings.prototype.closeEditor = function() {
  if (this.onClose) this.onClose();
  // background
  var background = goog.dom.getElementByClass('settings-background');
  // hide
  goog.style.setStyle(background, 'display', 'none');
  goog.style.setStyle(this.element, 'display', 'none');
  // close
  goog.events.unlisten(background,
    goog.events.EventType.CLICK,
    this.closeEditor,
    true,
    this);
}
