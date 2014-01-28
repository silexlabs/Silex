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


goog.require('silex.view.ViewBase');
goog.provide('silex.view.Workspace');

goog.require('goog.dom.ViewportSizeMonitor');



/**
 * @constructor
 * @param  {Element}  element    DOM element containing the UIs
 * @param  {Element}  menu  reference to the view
 * @param  {Element}  stage  reference to the view
 * @param  {Element}  pageTool  reference to the view
 * @param  {Element}  propertyTool  reference to the view
 * @param  {Element}  htmlEditor  reference to the view
 * @param  {Element}  cssEditor  reference to the view
 * @param  {Element}  textEditor  reference to the view
 * @param  {Element}  fileExplorer  reference to the view
 * @param  {Element}  settingsDialog  reference to the view
 */
silex.view.Workspace = function(element,
                                menuElement,
                                stageElement,
                                pageToolElement,
                                propertyToolElement,
                                htmlEditorElement,
                                cssEditorElement,
                                jsEditorElement,
                                textEditorElement,
                                fileExplorerElement,
                                settingsDialogElement) {
  // store references
  this.element = element;
  this.menuElement = menuElement;
  this.stageElement = stageElement;
  this.pageToolElement = pageToolElement;
  this.propertyToolElement = propertyToolElement;
  this.htmlEditorElement = htmlEditorElement;
  this.cssEditorElement = cssEditorElement;
  this.jsEditorElement = jsEditorElement;
  this.textEditorElement = textEditorElement;
  this.fileExplorerElement = fileExplorerElement;
  this.settingsDialogElement = settingsDialogElement;

  // handle resize
  this.viewport = new goog.dom.ViewportSizeMonitor();
  goog.events.listen(this.viewport, goog.events.EventType.RESIZE,
      function(e) {
        this.invalidate();
      }, false, this);
  this.isDirty = false;
  this.invalidate();
};


/**
 * closure goog.dom.ViewportSizeMonitor object
 */
silex.view.Workspace.prototype.viewport;


/**
 * reference to the element used to display the silex.view.Menu class
 * @type element
 */
silex.view.Workspace.prototype.menuElement;


/**
 * reference to the element used to display the silex.view.Stage class
 * @type element
 */
silex.view.Workspace.prototype.stageElement;


/**
 * reference to the element used to display the silex.view.PageTool class
 * @type element
 */
silex.view.Workspace.prototype.pageToolElement;


/**
 * reference to the element used to display the silex.view.PropertyTool class
 * @type element
 */
silex.view.Workspace.prototype.propertyToolElement;


/**
 * reference to the element used to display the silex.view.HTMLEditor class
 * @type element
 */
silex.view.Workspace.prototype.htmlEditorElement;


/**
 * reference to the element used to display the silex.view.CssEditor class
 * @type element
 */
silex.view.Workspace.prototype.cssEditorElement;


/**
 * reference to the element used to display the silex.view.jsEditor class
 * @type element
 */
silex.view.Workspace.prototype.jsEditorElement;


/**
 * reference to the element used to display the silex.view.TextEditor class
 * @type element
 */
silex.view.Workspace.prototype.textEditorElement;


/**
 * reference to the element used to display the silex.view.FileExplorer class
 * @type element
 */
silex.view.Workspace.prototype.fileExplorerElement;


/**
 * reference to the element used to display the silex.view.settingsDialog class
 * @type element
 */
silex.view.Workspace.prototype.settingsDialogElement;


/**
 * element of the dom to which the component is rendered
 */
silex.view.Workspace.prototype.element;


/**
 * invalidation mechanism
 */
silex.view.Workspace.prototype.isDirty;


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
  var pageToolSize = goog.style.getSize(this.pageToolElement);
  var propertyToolSize = goog.style.getSize(this.propertyToolElement);
  var menuSize = goog.style.getSize(this.menuElement);

  // stage
  var stageWidth = viewportSize.width -
      pageToolSize.width - propertyToolSize.width;
  goog.style.setWidth(this.stageElement, stageWidth);

  // menu offset
  var toolsHeight = viewportSize.height - menuSize.height;
  goog.style.setHeight(this.pageToolElement, toolsHeight);
  goog.style.setHeight(this.propertyToolElement, toolsHeight);
  goog.style.setHeight(this.stageElement, toolsHeight);

  //goog.style.setPosition(this.pageToolElement, null, menuSize.height);

  // htmlEditor
  if (this.htmlEditorElement) {
    var htmlEditorSize = goog.style.getSize(this.htmlEditorElement);
    var posX = (viewportSize.width - htmlEditorSize.width) / 2;
    var posY = (viewportSize.height - htmlEditorSize.height) / 2;
    goog.style.setPosition(this.htmlEditorElement, posX, posY);
  }
  // cssEditor
  if (this.cssEditorElement) {
    var cssEditorSize = goog.style.getSize(this.cssEditorElement);
    var posX = (viewportSize.width - cssEditorSize.width) / 2;
    var posY = (viewportSize.height - cssEditorSize.height) / 2;
    goog.style.setPosition(this.cssEditorElement, posX, posY);
  }
  // jsEditor
  if (this.jsEditorElement) {
    var jsEditorSize = goog.style.getSize(this.jsEditorElement);
    var posX = (viewportSize.width - jsEditorSize.width) / 2;
    var posY = (viewportSize.height - jsEditorSize.height) / 2;
    goog.style.setPosition(this.jsEditorElement, posX, posY);
  }
  // texteditor
  if (this.textEditorElement) {
    var textEditorSize = goog.style.getSize(this.textEditorElement);
    var posX = (viewportSize.width - textEditorSize.width) / 2;
    var posY = (viewportSize.height - textEditorSize.height) / 2;
    goog.style.setPosition(this.textEditorElement, posX, posY);
  }
  // fileExplorer
  if (this.fileExplorerElement) {
    var fileExplorerSize = goog.style.getSize(this.fileExplorerElement);
    var posX = (viewportSize.width - fileExplorerSize.width) / 2;
    var posY = (viewportSize.height - fileExplorerSize.height) / 2;
    goog.style.setPosition(this.fileExplorerElement, posX, posY);
  }
  // settingsDialog
  if (this.settingsDialogElement) {
    var settingsDialogSize = goog.style.getSize(
        this.settingsDialogElement);
    var posX = (viewportSize.width - settingsDialogSize.width) / 2;
    var posY = (viewportSize.height - settingsDialogSize.height) / 2;
    goog.style.setPosition(this.settingsDialogElement, posX, posY);
  }
  // no more loading
  if (goog.dom.classes.has(document.body, 'loading-pending')) {
    goog.dom.classes.remove(document.body, 'loading-pending');
  }
};
