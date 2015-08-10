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
 * @fileoverview
 * the Silex context menu
 *
 */


goog.provide('silex.view.ContextMenu');


/**
 * @constructor
 * @param {Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                  the controller instances
 */
silex.view.ContextMenu = function(element, model, controller) {
  // store references
  /**
   * @type {Element}
   */
  this.element = element;
  /**
   * @type {!silex.types.Model}
   */
  this.model = model;
  /**
   * @type {!silex.types.Controller}
   */
  this.controller = controller;
};


/**
 * create the context menu
 * called by the app constructor
 */
silex.view.ContextMenu.prototype.buildUi = function() {
    this.element.querySelector('.save').addEventListener('click', () => {this.controller.fileMenuController.save()});
    this.element.querySelector('.undo').addEventListener('click', () => {this.controller.editMenuController.undo()});
    this.element.querySelector('.redo').addEventListener('click', () => {this.controller.editMenuController.redo()});
    this.element.querySelector('.text').addEventListener('click', () => {this.controller.insertMenuController.addElement(silex.model.Element.TYPE_TEXT)});
    this.element.querySelector('.image').addEventListener('click', () => {this.controller.insertMenuController.browseAndAddImage()});
    this.element.querySelector('.container').addEventListener('click', () => {this.controller.insertMenuController.addElement(silex.model.Element.TYPE_CONTAINER)});
    this.element.querySelector('.html').addEventListener('click', () => {this.controller.insertMenuController.addElement(silex.model.Element.TYPE_HTML)});
    this.element.querySelector('.delete').addEventListener('click', () => {this.controller.editMenuController.removeSelectedElements()});
    this.element.querySelector('.copy').addEventListener('click', () => {this.controller.editMenuController.copySelection()});
    this.element.querySelector('.paste').addEventListener('click', () => {this.controller.editMenuController.pasteSelection()});
    this.element.querySelector('.top').addEventListener('click', () => {this.controller.editMenuController.moveToTop()});
    this.element.querySelector('.up').addEventListener('click', () => {this.controller.editMenuController.moveUp()});
    this.element.querySelector('.down').addEventListener('click', () => {this.controller.editMenuController.moveDown()});
    this.element.querySelector('.bottom').addEventListener('click', () => {this.controller.editMenuController.moveToBottom()});
    this.element.querySelector('.preview').addEventListener('click', () => {this.controller.viewMenuController.preview()});
    this.element.querySelector('.responsize').addEventListener('click', () => {this.controller.viewMenuController.previewResponsize()});
};


/**
 * the selection has changed
 * called by silex.model.Body
 * @param   {?Array.<HTMLElement>=} opt_selectedElements the selected elements
 * @param   {?Array.<string>=} opt_pageNames   the names of the pages
 * @param   {?string=}  opt_currentPageName   the name of the current page
 */
silex.view.ContextMenu.prototype.redraw = function(opt_selectedElements, opt_pageNames, opt_currentPageName) {
  // get the selection if not provided
  if(!opt_selectedElements) this.model.body.getSelection();
  //update menu items according to selection
  if(opt_selectedElements.length === 1 && opt_selectedElements[0].tagName.toLowerCase() === 'body') {
    this.element.querySelector('.delete').classList.add('off');
    this.element.querySelector('.copy').classList.add('off');
    this.element.querySelector('.top').classList.add('off');
    this.element.querySelector('.up').classList.add('off');
    this.element.querySelector('.down').classList.add('off');
    this.element.querySelector('.bottom').classList.add('off');
  }
  else {
    this.element.querySelector('.delete').classList.remove('off');
    this.element.querySelector('.copy').classList.remove('off');
    this.element.querySelector('.top').classList.remove('off');
    this.element.querySelector('.up').classList.remove('off');
    this.element.querySelector('.down').classList.remove('off');
    this.element.querySelector('.bottom').classList.remove('off');
  }
  if(silex.controller.ControllerBase.undoHistory.length > 0) {
    this.element.querySelector('.undo').classList.remove('off');
  }
  else {
    this.element.querySelector('.undo').classList.add('off');
  }
  if(silex.controller.ControllerBase.redoHistory.length > 0) {
    this.element.querySelector('.redo').classList.remove('off');
  }
  else {
    this.element.querySelector('.redo').classList.add('off');
  }
  if(silex.controller.ControllerBase.clipboard && silex.controller.ControllerBase.clipboard.length > 0) {
    this.element.querySelector('.paste').classList.remove('off');
  }
  else {
    this.element.querySelector('.paste').classList.add('off');
  }
};
