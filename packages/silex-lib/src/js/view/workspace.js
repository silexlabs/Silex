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
 * @param  {silex.types.Controller} controller  controller class which holds the other controllers
 */
silex.view.Workspace = function(element, controller) {
  // store references
  this.element = element;
  this.controller = controller;

  //store the element which will hold the body of the opened file
  this.iframeElement = /** @type {?HTMLIFrameElement} */ (goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));

  // store the window viewport for later use
  this.viewport = new goog.dom.ViewportSizeMonitor();
};


/**
 * store the window viewport
 * @type {?goog.dom.ViewportSizeMonitor}
 */
silex.view.Workspace.prototype.viewport = null;


/**
 * store state for the invalidation mechanism
 * @type {?boolean}
 */
silex.view.Workspace.prototype.isDirty = false;


/**
 * element which holds the opened website
 * @type {?HTMLIFrameElement}
 */
silex.view.Workspace.prototype.iframeElement = null;


/**
 * @return {?Window} the window element
 */
silex.view.Workspace.prototype.getWindow = function() {
  return goog.dom.getFrameContentWindow(this.iframeElement);
};


/**
 * listen for the resize event and call invalidate
 * @param {!silex.types.View} view
 */
silex.view.Workspace.prototype.startWatchingResize = function(view) {
  // handle window resize event
  goog.events.listen(this.viewport, goog.events.EventType.RESIZE,
      function() {
        this.invalidate(view);
      }, false, this);
  this.invalidate(view);
};


/**
 * listen for the unload event and war the user
 */
silex.view.Workspace.prototype.startWatchingUnload = function() {
  // handle the "prevent leave page" mechanism
  // TODO: move this to workspace? and prevent quit only when dirty?
  window.onbeforeunload = function() {
    return 'Are you sure you want to leave Silex?';
  };
};


/**
 * set as dirty
 * invalidation mechanism
 * @param {!silex.types.View} view
 */
silex.view.Workspace.prototype.invalidate = function(view) {
  if (this.isDirty === false) {
    this.isDirty = true;
    this.redraw(view);
  }
};


/**
 * redraw the workspace, positions and sizes of the tool boxes
 * invalidation mechanism
 * @param {!silex.types.View} view
 */
silex.view.Workspace.prototype.redraw = function(view) {
  if (this.isDirty === false) {
    console.warn('Do not call redraw directly, use invalidate() instead');
  }
  setTimeout(goog.bind(function() {
    this.doRedraw(view);
  }, this), 400);
};


/**
 * actually doas the positionning of the elements
 * invalidation mechanism
 * @param {!silex.types.View} view
 */
silex.view.Workspace.prototype.doRedraw = function(view) {
  this.isDirty = false;

  var viewportSize = this.viewport.getSize();

  // htmlEditor
  this.center(view.htmlEditor, viewportSize);
  // cssEditor
  this.center(view.cssEditor, viewportSize);
  // jsEditor
  this.center(view.jsEditor, viewportSize);
  // texteditor
  this.center(view.textEditor, viewportSize);
  // fileExplorer
  this.center(view.fileExplorer, viewportSize);
  // settingsDialog
  this.center(view.settingsDialog, viewportSize);
  // no more loading
  goog.dom.classlist.remove(document.body, 'loading-pending');
};


/**
 * center an editor in the viewport
 * @param {!silex.view.dialog.DialogBase|silex.view.dialog.FileExplorer} editor whith an element property to center
 * @param {goog.math.Size} viewportSize viewport size
 */
silex.view.Workspace.prototype.center = function(editor, viewportSize) {
  if (editor.element) {
    var editorSize = goog.style.getSize(editor.element);
    var posX = (viewportSize.width - editorSize.width) / 2;
    var posY = (viewportSize.height - editorSize.height) / 2;
    goog.style.setPosition(editor.element, posX, posY);
  }
};
