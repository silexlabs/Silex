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
 *     and defines the entry point of Silex, the silex.App class
 * @see silex.model.Page
 *
 */


'use strict';

goog.provide('silex.App');

goog.provide('silex.Model');
goog.provide('silex.View');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');

// model
goog.require('silex.Config');
goog.require('silex.model.File');

// controller
goog.require('silex.controller.Controller');

// display
goog.require('silex.view.Menu');
goog.require('silex.view.Stage');
goog.require('silex.view.Workspace');

// tool boxes
goog.require('silex.view.PageTool');
goog.require('silex.view.PropertiesTool');

// editors
goog.require('silex.view.HTMLEditor');
goog.require('silex.view.TextEditor');

// dialogs
goog.require('silex.view.FileExplorer');
goog.require('silex.view.SettingsDialog');


/**
 * @constructor
 * @struct
 * @param {silex.model.File} file
 * @param {silex.model.Head} head
 * @param {silex.model.Body} body
 * @param {silex.model.Element} element
 */
silex.Model = function(file, head, body, element) {
  this.file = file;
  this.head = head;
  this.body = body;
  this.element = element;
}

/**
 * @constructor
 * @struct
 * @param {silex.model.MainController} mainController
 * @param {silex.model.MenuController} menuController
 * @param {silex.model.StageController} stageController
 * @param {silex.model.PageToolController} pageToolController
 * @param {silex.model.PropertiesToolController} propertiesToolController
 * @param {silex.model.SettingsDialogController} settingsDialogController
 * @param {silex.model.HtmlEditorController} htmlEditorController
 * @param {silex.model.TextEditorController} textEditorController
 */
silex.Controller = function(
  mainController
  menuController,
  stageController,
  pageToolController,
  propertiesToolController,
  settingsDialogController,
  htmlEditorController,
  textEditorController)
{
  this.mainController = mainController;
  this.menuController = menuController;
  this.stageController = stageController;
  this.pageToolController = pageToolController;
  this.propertiesToolController = propertiesToolController;
  this.settingsDialogController = settingsDialogController;
  this.htmlEditorController = htmlEditorController;
  this.textEditorController = textEditorController;
}

/**
 * @constructor
 * @param {silex.view.Workspace} workspace
 * @param {silex.view.Menu} menu
 * @param {silex.view.Stage} stage
 * @param {silex.view.PageTool} pageTool
 * @param {silex.view.PropertiesTool} propertiesTool
 * @param {silex.view.HtmlEditor} htmlEditor
 * @param {silex.view.TextEditor} textEditor
 * @param {silex.view.FileExplorer} fileExplorer
 * @param {silex.view.SettingsDialog} settingsDialog
 * @struct
 */
silex.View = function(
  workspace,
  menu,
  stage,
  pageTool,
  propertiesTool,
  htmlEditor,
  textEditor,
  fileExplorer,
  settingsDialog) {
  this.workspace = workspace;
  this.menu = menu;
  this.stage = stage;
  this.pageTool = pageTool;
  this.propertiesTool = propertiesTool;
  this.htmlEditor = htmlEditor;
  this.textEditor = textEditor;
  this.fileExplorer = fileExplorer;
  this.settingsDialog = settingsDialog;
}

/**
 * @constructor
 * Entry point of Silex client application
 * create all views and models and controllers
 */
silex.App = function() {

  // redirect /silex to /silex/
  if(window.location.href.slice(-5) === 'silex'){
    window.location.href += '/';
  }
  // remove hash added by cloud explorer
  window.location.hash = '';


  // create Menu
  var menuElement = goog.dom.getElementByClass('silex-menu');
  /* @type {silex.view.Menu} */
  var menu = new silex.view.Menu(menuElement);

  // create Stage
  var stageElement = goog.dom.getElementByClass('silex-stage');
  /* @type {silex.view.Stage} */
  var stage = new silex.view.Stage(stageElement);

  // create PageTool
  var pageToolElement = goog.dom.getElementByClass('silex-pagetool');
  /* @type {silex.view.PageTool} */
  var pageTool = new silex.view.PageTool(pageToolElement);

  // create HTMLEditor
  var htmlEditorElement = goog.dom.getElementByClass('silex-htmleditor');
  /* @type {silex.view.HTMLEditor} */
  var htmlEditor = new silex.view.HTMLEditor(htmlEditorElement);

  // create TextEditor
  var textEditorElement = goog.dom.getElementByClass('silex-texteditor');
  /* @type {silex.view.TextEditor} */
  var textEditor = new silex.view.TextEditor(textEditorElement);

  // create FileExplorer
  var fileExplorerElement = goog.dom.getElementByClass('silex-fileexplorer');
  /* @type {silex.view.FileExplorer} */
  var fileExplorer = new silex.view.FileExplorer(fileExplorerElement);

  // create SettingsDialog
  var settingsDialogElement = goog.dom.getElementByClass('silex-settings-dialog');
  /* @type {silex.view.SettingsDialog} */
  var settingsDialog = new silex.view.SettingsDialog(settingsDialogElement);

  // create PropertiesTool
  var propertiesToolElement = goog.dom.getElementByClass('silex-propertiestool');
  /* @type {silex.view.PropertiesTool} */
  var propertiesTool = new silex.view.PropertiesTool(propertiesToolElement);

  // create the workspace which resizes all components in the page
  var workspaceElement = goog.dom.getElementByClass('silex-workspace');
  /* @type {silex.view.Workspace} */
  var workspace = new silex.view.Workspace(
    workspaceElement
    , menuElement
    , stageElement
    , pageToolElement
    , propertiesToolElement
    , htmlEditorElement
    , textEditorElement
    , fileExplorerElement
    , settingsDialogElement);

  /* @type {silex.Model} */
  var model = new silex.Model(
    silex.model.File.getInstance()
    , silex.model.Head.getInstance()
    , silex.model.Body.getInstance()
    , silex.model.Element.getInstance()
  );

  /* @type {silex.View} */
  var view = new silex.View(
    workspace
    , menu
    , stage
    , pageTool
    , propertiesTool
    , htmlEditor
    , textEditor
    , fileExplorer
    , settingsDialog
  );

  // create the controller to listen to the view events and update the model
  /* @type {silex.controller.MainController} */
  var mainController = new silex.controller.MainController(model, view);

  /* @type {silex.Controller} */
  var controller = new silex.Controller(
    mainController
    , new silex.controller.MenuController(model, view, mainController);
    , new silex.controller.StageController(model, view, mainController);
    , new silex.controller.PageToolController(model, view, mainController);
    , new silex.controller.PropertiesToolController(model, view, mainController);
    , new silex.controller.SettingsDialogController(model, view, mainController);
    , new silex.controller.HtmlEditorController(model, view, mainController);
    , new silex.controller.TextEditorController(model, view, mainController);
  );

  // now create an empty file to let the user start using Silex
  view.file.newFile(function() {
    if(silex.Config.debug.debugMode && silex.Config.debug.doAfterReady) {
      silex.Config.debug.doAfterReady(this);
    }
  });
};

// Ensures the symbol will be visible after compiler renaming.
goog.exportSymbol('silex.App', silex.App);
