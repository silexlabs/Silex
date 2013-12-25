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
 * @param  {Element}  element    DOM element containing the UIs
 * @param  {Element}  menu  reference to the view
 * @param  {Element}  stage  reference to the view
 * @param  {Element}  pageTool  reference to the view
 * @param  {Element}  propertiesTool  reference to the view
 * @param  {Element}  htmlEditor  reference to the view
 * @param  {Element}  textEditor  reference to the view
 * @param  {Element}  fileExplorer  reference to the view
 * @param  {Element}  publishSettings  reference to the view
 */
silex.view.Workspace = function(element,
                                menuElement,
                                stageElement,
                                pageToolElement,
                                propertiesToolElement,
                                htmlEditorElement,
                                textEditorElement,
                                fileExplorerElement,
                                publishSettingsElement) {
  // store references
  this.element = element;
  this.menuElement = menuElement;
  this.stageElement = stageElement;
  this.pageToolElement = pageToolElement;
  this.propertiesToolElement = propertiesToolElement;
  this.htmlEditorElement = htmlEditorElement;
  this.textEditorElement = textEditorElement;
  this.fileExplorerElement = fileExplorerElement;
  this.publishSettingsElement = publishSettingsElement;

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
 * reference to the silex.view.Menu class
 */
silex.view.Workspace.prototype.menuElement;


/**
 * reference to the silex.view.Stage class
 */
silex.view.Workspace.prototype.stageElement;


/**
 * reference to the silex.view.PageTool class
 */
silex.view.Workspace.prototype.pageToolElement;


/**
 * reference to the silex.view.PropertiesTool class
 */
silex.view.Workspace.prototype.propertiesToolElement;


/**
 * reference to the silex.view.HTMLEditor class
 */
silex.view.Workspace.prototype.htmlEditorElement;


/**
 * reference to the silex.view.TextEditor class
 */
silex.view.Workspace.prototype.textEditorElement;


/**
 * reference to the silex.view.FileExplorer class
 */
silex.view.Workspace.prototype.fileExplorerElement;


/**
 * reference to the silex.view.PublishSettings class
 */
silex.view.Workspace.prototype.publishSettingsElement;


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
  var propertiesToolSize = goog.style.getSize(this.propertiesToolElement);
  var menuSize = goog.style.getSize(this.menuElement);

  // stage
  var stageWidth = viewportSize.width -
      pageToolSize.width - propertiesToolSize.width;
  goog.style.setWidth(this.stageElement, stageWidth);

  // menu offset
  var toolsHeight = viewportSize.height - menuSize.height;
  goog.style.setHeight(this.pageToolElement, toolsHeight);
  goog.style.setHeight(this.propertiesToolElement, toolsHeight);
  goog.style.setHeight(this.stageElement, toolsHeight);

  //goog.style.setPosition(this.pageToolElement, null, menuSize.height);

  // htmlEditor
  if (this.htmlEditorElement) {
    var htmlEditorSize = goog.style.getSize(this.htmlEditorElement);
    var posX = (viewportSize.width - htmlEditorSize.width) / 2;
    var posY = (viewportSize.height - htmlEditorSize.height) / 2;
    goog.style.setPosition(this.htmlEditorElement, posX, posY);
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
  // publishSettings
  if (this.publishSettingsElement) {
    var publishSettingsSize = goog.style.getSize(
        this.publishSettingsElement);
    var posX = (viewportSize.width - publishSettingsSize.width) / 2;
    var posY = (viewportSize.height - publishSettingsSize.height) / 2;
    goog.style.setPosition(this.publishSettingsElement, posX, posY);
  }
  // no more loading
  if (goog.dom.classes.has(document.body, 'loading-pending')) {
    goog.dom.classes.remove(document.body, 'loading-pending');
  }
};
