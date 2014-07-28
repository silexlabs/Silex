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
 * @fileoverview This file contains the definitions of the Model, View and Controller structures
 *
 */


goog.provide('silex.types.Controller');
goog.provide('silex.types.Model');
goog.provide('silex.types.View');

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
 * @constructor
 * @struct
 */
silex.types.Model = function() {
};


/**
 * store references
 * @param {silex.model.File} file
 * @param {silex.model.Head} head
 * @param {silex.model.Body} body
 * @param {silex.model.Element} element
 * @param {silex.model.Page} page
 */
silex.types.Model.prototype.init = function(file, head, body, page, element) {
  this.file = file;
  this.head = head;
  this.body = body;
  this.page = page;
  this.element = element;
};



/**
 * @constructor
 * @struct
 */
silex.types.Controller = function() {

};


/**
 * store references
 * @param {silex.model.FileMenuController} fileMenuController
 * @param {silex.model.EditMenuController} editMenuController
 * @param {silex.model.ViewMenuController} viewMenuController
 * @param {silex.model.InsertMenuController} insertMenuController
 * @param {silex.model.ToolMenuController} toolMenuController
 * @param {silex.model.StageController} stageController
 * @param {silex.model.PageToolController} pageToolController
 * @param {silex.model.PropertyToolController} propertyToolController
 * @param {silex.model.SettingsDialogController} settingsDialogController
 * @param {silex.model.HtmlEditorController} htmlEditorController
 * @param {silex.model.CssEditorController} cssEditorController
 * @param {silex.model.JsEditorController} jsEditorController
 * @param {silex.model.TextEditorController} textEditorController
 */
silex.types.Controller.prototype.init = function(
    fileMenuController,
    editMenuController,
    viewMenuController,
    insertMenuController,
    toolMenuController,
    stageController,
    pageToolController,
    propertyToolController,
    settingsDialogController,
    htmlEditorController,
    cssEditorController,
    jsEditorController,
    textEditorController)
    {
  this.fileMenuController = fileMenuController;
  this.editMenuController = editMenuController;
  this.viewMenuController = viewMenuController;
  this.insertMenuController = insertMenuController;
  this.toolMenuController = toolMenuController;
  this.stageController = stageController;
  this.pageToolController = pageToolController;
  this.propertyToolController = propertyToolController;
  this.settingsDialogController = settingsDialogController;
  this.htmlEditorController = htmlEditorController;
  this.cssEditorController = cssEditorController;
  this.jsEditorController = jsEditorController;
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
 * @param {silex.view.Stage} stage
 * @param {silex.view.PageTool} pageTool
 * @param {silex.view.PropertyTool} propertyTool
 * @param {silex.view.HtmlEditor} htmlEditor
 * @param {silex.view.CssEditor} cssEditor
 * @param {silex.view.JsEditor} jsEditor
 * @param {silex.view.TextEditor} textEditor
 * @param {silex.view.FileExplorer} fileExplorer
 * @param {silex.view.SettingsDialog} settingsDialog
 * @param {silex.view.Workspace} workspace
 * @struct
 */
silex.types.View.prototype.init = function(
    menu,
    stage,
    pageTool,
    propertyTool,
    htmlEditor,
    cssEditor,
    jsEditor,
    textEditor,
    fileExplorer,
    settingsDialog,
    workspace) {
  this.menu = menu;
  this.stage = stage;
  this.pageTool = pageTool;
  this.propertyTool = propertyTool;
  this.htmlEditor = htmlEditor;
  this.cssEditor = cssEditor;
  this.jsEditor = jsEditor;
  this.textEditor = textEditor;
  this.fileExplorer = fileExplorer;
  this.settingsDialog = settingsDialog;
  this.workspace = workspace;
};
