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
 * @fileoverview This file contains the definitions of the Model, View and Controller structures
 *
 */


goog.provide('silex.types.Controller');
goog.provide('silex.types.Model');
goog.provide('silex.types.View');

goog.require('silex.controller.ContextMenuController');
goog.require('silex.controller.CssEditorController');
goog.require('silex.controller.EditMenuController');
goog.require('silex.controller.FileMenuController');
goog.require('silex.controller.HtmlEditorController');
goog.require('silex.controller.InsertMenuController');
goog.require('silex.controller.JsEditorController');
goog.require('silex.controller.PageToolController');
goog.require('silex.controller.PropertyToolController');
goog.require('silex.controller.SettingsDialogController');
goog.require('silex.controller.StageController');
goog.require('silex.controller.TextEditorController');
goog.require('silex.controller.ToolMenuController');
goog.require('silex.controller.ViewMenuController');



/**
 * recursive type of copied elements stored in the clipboard
 * @typedef {{element:Element, style, children: Array.<silex.types.ClipboardItem>}}
 */
silex.types.ClipboardItem = {};


/**
 * type used to store the state of the website, for undo/redo
 * @typedef {{page:string, html:string, scrollX:number, scrollY:number}}
 */
silex.types.UndoItem;


/**
 * @struct
 * @constructor
 */
silex.types.Model = function() {

};


/**
 * store references
 * @param {silex.model.File} file
 * @param {silex.model.Head} head
 * @param {silex.model.Body} body
 * @param {silex.model.Page} page
 * @param {silex.model.Element} element
 * @param {silex.model.Component} component
 * @param {silex.model.Property} property
 */
silex.types.Model.prototype.init = function(file, head, body, page, element, component, property) {
  /**
   * @type {silex.model.File}
   */
  this.file = file;
  /**
   * @type {silex.model.Head}
   */
  this.head = head;
  /**
   * @type {silex.model.Body}
   */
  this.body = body;
  /**
   * @type {silex.model.Page}
   */
  this.page = page;
  /**
   * @type {silex.model.Element}
   */
  this.element = element;
  /**
   * @type {silex.model.Component}
   */
  this.component = component;
  /**
   * @type {silex.model.Property}
   */
  this.property = property;
};



/**
 * @constructor
 * @struct
 */
silex.types.Controller = function() {

};


/**
 * store references
 * @param {silex.controller.FileMenuController} fileMenuController
 * @param {silex.controller.EditMenuController} editMenuController
 * @param {silex.controller.ViewMenuController} viewMenuController
 * @param {silex.controller.InsertMenuController} insertMenuController
 * @param {silex.controller.ToolMenuController} toolMenuController
 * @param {silex.controller.ContextMenuController} contextMenuController
 * @param {silex.controller.StageController} stageController
 * @param {silex.controller.PageToolController} pageToolController
 * @param {silex.controller.PropertyToolController} propertyToolController
 * @param {silex.controller.SettingsDialogController} settingsDialogController
 * @param {silex.controller.HtmlEditorController} htmlEditorController
 * @param {silex.controller.CssEditorController} cssEditorController
 * @param {silex.controller.JsEditorController} jsEditorController
 * @param {silex.controller.TextEditorController} textEditorController
 */
silex.types.Controller.prototype.init = function(
    fileMenuController,
    editMenuController,
    viewMenuController,
    insertMenuController,
    toolMenuController,
    contextMenuController,
    stageController,
    pageToolController,
    propertyToolController,
    settingsDialogController,
    htmlEditorController,
    cssEditorController,
    jsEditorController,
    textEditorController)
    {
  /**
   * @type {silex.controller.FileMenuController}
   */
  this.fileMenuController = fileMenuController;
  /**
   * @type {silex.controller.EditMenuController}
   */
  this.editMenuController = editMenuController;
  /**
   * @type {silex.controller.ViewMenuController}
   */
  this.viewMenuController = viewMenuController;
  /**
   * @type {silex.controller.InsertMenuController}
   */
  this.insertMenuController = insertMenuController;
  /**
   * @type {silex.controller.ToolMenuController}
   */
  this.toolMenuController = toolMenuController;
  /**
   * @type {silex.controller.ContextMenuController}
   */
  this.contextMenuController = contextMenuController;
  /**
   * @type {silex.controller.StageController}
   */
  this.stageController = stageController;
  /**
   * @type {silex.controller.PageToolController}
   */
  this.pageToolController = pageToolController;
  /**
   * @type {silex.controller.PropertyToolController}
   */
  this.propertyToolController = propertyToolController;
  /**
   * @type {silex.controller.SettingsDialogController}
   */
  this.settingsDialogController = settingsDialogController;
  /**
   * @type {silex.controller.HtmlEditorController}
   */
  this.htmlEditorController = htmlEditorController;
  /**
   * @type {silex.controller.CssEditorController}
   */
  this.cssEditorController = cssEditorController;
  /**
   * @type {silex.controller.JsEditorController}
   */
  this.jsEditorController = jsEditorController;
  /**
   * @type {silex.controller.TextEditorController}
   */
  this.textEditorController = textEditorController;
};



/**
 * @constructor
 * @struct
 */
silex.types.View = function() {

};


/**
 * store references
 * @param {silex.view.Menu} menu
 * @param {silex.view.ContextMenu} contextMenu
 * @param {silex.view.BreadCrumbs} breadCrumbs
 * @param {silex.view.Stage} stage
 * @param {silex.view.PageTool} pageTool
 * @param {silex.view.PropertyTool} propertyTool
 * @param {silex.view.dialog.HtmlEditor} htmlEditor
 * @param {silex.view.dialog.CssEditor} cssEditor
 * @param {silex.view.dialog.JsEditor} jsEditor
 * @param {silex.view.dialog.TextEditor} textEditor
 * @param {silex.view.dialog.FileExplorer} fileExplorer
 * @param {silex.view.dialog.SettingsDialog} settingsDialog
 * @param {silex.view.dialog.NewWebsiteDialog} newWebsiteDialog
 * @param {silex.view.Splitter} propSplitter
 * @param {silex.view.Workspace} workspace
 */
silex.types.View.prototype.init = function(
    menu,
    contextMenu,
    breadCrumbs,
    stage,
    pageTool,
    propertyTool,
    htmlEditor,
    cssEditor,
    jsEditor,
    textEditor,
    fileExplorer,
    settingsDialog,
    newWebsiteDialog,
    propSplitter,
    workspace) {
  /**
   * @type {silex.view.Menu}
   */
  this.menu = menu;
  /**
   * @type {silex.view.ContextMenu}
   */
  this.contextMenu = contextMenu;
  /**
   * @type {silex.view.BreadCrumbs}
   */
  this.breadCrumbs = breadCrumbs;
  /**
   * @type {silex.view.Stage}
   */
  this.stage = stage;
  /**
   * @type {silex.view.PageTool}
   */
  this.pageTool = pageTool;
  /**
   * @type {silex.view.PropertyTool}
   */
  this.propertyTool = propertyTool;
  /**
   * @type {silex.view.dialog.HtmlEditor}
   */
  this.htmlEditor = htmlEditor;
  /**
   * @type {silex.view.dialog.CssEditor}
   */
  this.cssEditor = cssEditor;
  /**
   * @type {silex.view.dialog.JsEditor}
   */
  this.jsEditor = jsEditor;
  /**
   * @type {silex.view.dialog.TextEditor}
   */
  this.textEditor = textEditor;
  /**
   * @type {silex.view.dialog.FileExplorer}
   */
  this.fileExplorer = fileExplorer;
  /**
   * @type {silex.view.dialog.SettingsDialog}
   */
  this.settingsDialog = settingsDialog;
  /**
   * @type {silex.view.dialog.NewWebsiteDialog}
   */
  this.newWebsiteDialog = newWebsiteDialog;
  /**
   * @type {silex.view.Splitter}
   */
  this.propSplitter = propSplitter;
  /**
   * @type {silex.view.Workspace}
   */
  this.workspace = workspace;
};
