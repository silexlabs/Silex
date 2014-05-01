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
  var pageToolSize = goog.style.getSize(this.view.pageTool.element);
  var propertyToolSize = goog.style.getSize(this.view.propertyTool.element);
  var menuSize = goog.style.getSize(this.view.menu.element);

  // stage
  var stageWidth = viewportSize.width -
      pageToolSize.width - propertyToolSize.width - 25; // why 25?! It works but hum... //
  goog.style.setWidth(this.view.stage.element, stageWidth);

  // menu offset
  var toolsHeight = viewportSize.height - menuSize.height - 20; // why?! It works but hum... //
  goog.style.setHeight(this.view.pageTool.element, toolsHeight);
  goog.style.setHeight(this.view.propertyTool.element, toolsHeight);
  goog.style.setHeight(this.view.stage.element, toolsHeight);

  //goog.style.setPosition(this.view.pageTool.element, null, menuSize.height);

  // htmlEditor
  if (this.view.htmlEditor.element) {
    var htmlEditorSize = goog.style.getSize(this.view.htmlEditor.element);
    var posX = (viewportSize.width - htmlEditorSize.width) / 2;
    var posY = (viewportSize.height - htmlEditorSize.height) / 2;
    goog.style.setPosition(this.view.htmlEditor.element, posX, posY);
  }
  // cssEditor
  if (this.view.cssEditor.element) {
    var cssEditorSize = goog.style.getSize(this.view.cssEditor.element);
    var posX = (viewportSize.width - cssEditorSize.width) / 2;
    var posY = (viewportSize.height - cssEditorSize.height) / 2;
    goog.style.setPosition(this.view.cssEditor.element, posX, posY);
  }
  // jsEditor
  if (this.view.jsEditor.element) {
    var jsEditorSize = goog.style.getSize(this.view.jsEditor.element);
    var posX = (viewportSize.width - jsEditorSize.width) / 2;
    var posY = (viewportSize.height - jsEditorSize.height) / 2;
    goog.style.setPosition(this.view.jsEditor.element, posX, posY);
  }
  // texteditor
  if (this.view.textEditor.element) {
    var textEditorSize = goog.style.getSize(this.view.textEditor.element);
    var posX = (viewportSize.width - textEditorSize.width) / 2;
    var posY = (viewportSize.height - textEditorSize.height) / 2;
    goog.style.setPosition(this.view.textEditor.element, posX, posY);
  }
  // fileExplorer
  if (this.view.fileExplorer.element) {
    var fileExplorerSize = goog.style.getSize(this.view.fileExplorer.element);
    var posX = (viewportSize.width - fileExplorerSize.width) / 2;
    var posY = (viewportSize.height - fileExplorerSize.height) / 2;
    goog.style.setPosition(this.view.fileExplorer.element, posX, posY);
  }
  // settingsDialog
  if (this.view.settingsDialog.element) {
    var settingsDialogSize = goog.style.getSize(
        this.view.settingsDialog.element);
    var posX = (viewportSize.width - settingsDialogSize.width) / 2;
    var posY = (viewportSize.height - settingsDialogSize.height) / 2;
    goog.style.setPosition(this.view.settingsDialog.element, posX, posY);
  }
  // no more loading
  if (goog.dom.classes.has(document.body, 'loading-pending')) {
    goog.dom.classes.remove(document.body, 'loading-pending');
  }
};
