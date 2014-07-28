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
 * @fileoverview The Silex workspace class is in charge of positionning
 *   the main UI elements.
 * It refreshes the view when the window size changes, and also when
 *   it is set as dirty. There is an invalidation mechanism to prevent
 *   redraw many times in the same key frame
 *
 */


goog.provide('silex.view.Workspace');

goog.require('goog.dom.ViewportSizeMonitor');



/**
 * @constructor
 * @param {Element} element   container to render the UI
 * @param  {silex.types.View} view  view class which holds the other views
 * @param  {silex.types.Controller} controller  controller class which holds the other controllers
 */
silex.view.Workspace = function(element, view, controller) {
  // store references
  this.element = element;
  this.controller = controller;
  this.view = view;

  // retrieve the element which will hold the body of the opened file
  this.iframeElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);

  // handle resize
  this.viewport = new goog.dom.ViewportSizeMonitor();
  goog.events.listen(this.viewport, goog.events.EventType.RESIZE,
      function(e) {
        this.invalidate();
      }, false, this);
  this.invalidate();
};


/**
 * closure goog.dom.ViewportSizeMonitor object
 */
silex.view.Workspace.prototype.viewport = null;


/**
 * invalidation mechanism
 */
silex.view.Workspace.prototype.isDirty = false;


/**
 * element which holds the opened website
 */
silex.view.Workspace.prototype.iframeElement = null;


/**
 * @return  {Element}   body element
 */
silex.view.Workspace.prototype.getWindow = function() {
  return goog.dom.getFrameContentWindow(this.iframeElement);
};


/**
 * set as dirty
 * invalidation mechanism
 */
silex.view.Workspace.prototype.invalidate = function() {
  if (this.isDirty === false) {
    this.isDirty = true;
    this.redraw();
  }
};


/**
 * redraw the workspace, positions and sizes of the tool boxes
 * invalidation mechanism
 */
silex.view.Workspace.prototype.redraw = function() {
  if (this.isDirty === false) {
    console.warn('Do not call redraw directly, use invalidate() instead');
  }
  var that = this;
  setTimeout(function() {
    that.doRedraw();
  }, 400);
};


/**
 * actually doas the positionning of the elements
 * invalidation mechanism
 */
silex.view.Workspace.prototype.doRedraw = function() {
  this.isDirty = false;

  var viewportSize = this.viewport.getSize();

  // htmlEditor
  this.center(this.view.htmlEditor, viewportSize);
  // cssEditor
  this.center(this.view.cssEditor, viewportSize);
  // jsEditor
  this.center(this.view.jsEditor, viewportSize);
  // texteditor
  this.center(this.view.textEditor, viewportSize);
  // fileExplorer
  this.center(this.view.fileExplorer, viewportSize);
  // settingsDialog
  this.center(this.view.settingsDialog, viewportSize);
  // no more loading
  if (goog.dom.classes.has(document.body, 'loading-pending')) {
    goog.dom.classes.remove(document.body, 'loading-pending');
  }
};


/**
 * center an editor in the viewport
 * @param {silex.view.dialog.DialogBase} editor whith an element property to center
 * @param {Object<width, height>}        the viewport size
 */
silex.view.Workspace.prototype.center = function(editor, viewportSize) {
  if (editor.element){
    var editorSize = goog.style.getSize(editor.element);
    var posX = (viewportSize.width - editorSize.width) / 2;
    var posY = (viewportSize.height - editorSize.height) / 2;
    goog.style.setPosition(editor.element, posX, posY);
  }
};
