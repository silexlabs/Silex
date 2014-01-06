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
 * @fileoverview This file contains the definitions several useful structures
 *
 */


goog.provide('silex.types.Model');
goog.provide('silex.types.View');
goog.provide('silex.types.Controller');

goog.require('silex.controller.MenuController');
goog.require('silex.controller.StageController');
goog.require('silex.controller.PageToolController');
goog.require('silex.controller.PropertyToolController');
goog.require('silex.controller.SettingsDialogController');
goog.require('silex.controller.HtmlEditorController');
goog.require('silex.controller.CssEditorController');
goog.require('silex.controller.JsEditorController');
goog.require('silex.controller.TextEditorController');

/**
 * @constructor
 * @struct
 * @param {silex.model.File} file
 * @param {silex.model.Head} head
 * @param {silex.model.Body} body
 * @param {silex.model.Element} element
 */
silex.types.Model = function(file, head, body, element) {
  this.file = file;
  this.head = head;
  this.body = body;
  this.element = element;
}

/**
 * @constructor
 * @struct
 * @param {silex.model.MenuController} menuController
 * @param {silex.model.StageController} stageController
 * @param {silex.model.PageToolController} pageToolController
 * @param {silex.model.PropertyToolController} propertyToolController
 * @param {silex.model.SettingsDialogController} settingsDialogController
 * @param {silex.model.HtmlEditorController} htmlEditorController
 * @param {silex.model.CssEditorController} cssEditorController
 * @param {silex.model.JsEditorController} jsEditorController
 * @param {silex.model.TextEditorController} textEditorController
 */
silex.types.Controller = function(
  menuController,
  stageController,
  pageToolController,
  propertyToolController,
  settingsDialogController,
  htmlEditorController,
  cssEditorController,
  jsEditorController,
  textEditorController)
{
  this.menuController = menuController;
  this.stageController = stageController;
  this.pageToolController = pageToolController;
  this.propertyToolController = propertyToolController;
  this.settingsDialogController = settingsDialogController;
  this.htmlEditorController = htmlEditorController;
  this.cssEditorController = cssEditorController;
  this.jsEditorController = jsEditorController;
  this.textEditorController = textEditorController;
}

/**
 * @constructor
 * @param {silex.view.Workspace} workspace
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
 * @struct
 */
silex.types.View = function(
  workspace,
  menu,
  stage,
  pageTool,
  propertyTool,
  htmlEditor,
  cssEditor,
  jsEditor,
  textEditor,
  fileExplorer,
  settingsDialog) {
  this.workspace = workspace;
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
}

