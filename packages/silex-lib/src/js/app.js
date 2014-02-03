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

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');

// service qos
goog.require('silex.service.Tracker');

// types
goog.require('silex.types.Model');
goog.require('silex.types.View');
goog.require('silex.types.Controller');

// model
goog.require('silex.Config');
goog.require('silex.model.File');
goog.require('silex.model.Head');
goog.require('silex.model.Body');
goog.require('silex.model.Element');

// controller
goog.require('silex.controller.MenuController');
goog.require('silex.controller.StageController');
goog.require('silex.controller.PageToolController');
goog.require('silex.controller.PropertyToolController');
goog.require('silex.controller.SettingsDialogController');
goog.require('silex.controller.HtmlEditorController');
goog.require('silex.controller.CssEditorController');
goog.require('silex.controller.JsEditorController');
goog.require('silex.controller.TextEditorController');

// display
goog.require('silex.view.Menu');
goog.require('silex.view.Stage');
goog.require('silex.view.Workspace');

// tool boxes
goog.require('silex.view.PageTool');
goog.require('silex.view.PropertyTool');

// editors
goog.require('silex.view.HTMLEditor');
goog.require('silex.view.CssEditor');
goog.require('silex.view.JsEditor');
goog.require('silex.view.TextEditor');

// dialogs
goog.require('silex.view.FileExplorer');
goog.require('silex.view.SettingsDialog');


/**
 * @constructor
 * Entry point of Silex client application
 * create all views and models and controllers
 */
silex.App = function() {

  // tracker / qos
  silex.service.Tracker.getInstance().trackAction('app-events', 'start', null, 2);

  // redirect /silex to /silex/
  if(window.location.href.slice(-5) === 'silex'){
    window.location.href += '/';
  }
  // remove hash added by cloud explorer
  window.location.hash = '';

  // handle the "prevent leave page" mechanism
  if(!silex.Config.debug.debugMode || silex.Config.debug.preventQuit){
    function closeEditorWarning() {
      return 'Are you sure you want to leave me?';
    }
    window.onbeforeunload = closeEditorWarning;
  }

  // retrieve the element which will hold the body of the opened file
  var bodyElement = goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME);

  // init helper static class
  silex.utils.PageablePlugin.setBodyElement(bodyElement);

  // create the element which will hold the head of the opened file
  var headElement = goog.dom.createElement('div');

  // create Menu
  var menuElement = goog.dom.getElementByClass('silex-menu');
  /** @type {silex.view.Menu} */
  var menu = new silex.view.Menu(menuElement, bodyElement, headElement);

  // create Stage
  var stageElement = goog.dom.getElementByClass('silex-stage');
  /** @type {silex.view.Stage} */
  var stage = new silex.view.Stage(stageElement, bodyElement, headElement);

  // create PageTool
  var pageToolElement = goog.dom.getElementByClass('silex-page-tool');
  /** @type {silex.view.PageTool} */
  var pageTool = new silex.view.PageTool(pageToolElement, bodyElement, headElement);

  // create HTMLEditor
  var htmlEditorElement = goog.dom.getElementByClass('silex-html-editor');
  /** @type {silex.view.HTMLEditor} */
  var htmlEditor = new silex.view.HTMLEditor(htmlEditorElement, bodyElement, headElement);

  // create CssEditor
  var cssEditorElement = goog.dom.getElementByClass('silex-css-editor');
  /** @type {silex.view.CssEditor} */
  var cssEditor = new silex.view.CssEditor(cssEditorElement, bodyElement, headElement);

  // create JsEditor
  var jsEditorElement = goog.dom.getElementByClass('silex-js-editor');
  /** @type {silex.view.JsEditor} */
  var jsEditor = new silex.view.JsEditor(jsEditorElement, bodyElement, headElement);

  // create TextEditor
  var textEditorElement = goog.dom.getElementByClass('silex-texteditor');
  /** @type {silex.view.TextEditor} */
  var textEditor = new silex.view.TextEditor(textEditorElement, bodyElement, headElement);

  // create FileExplorer
  var fileExplorerElement = goog.dom.getElementByClass('silex-fileexplorer');
  /** @type {silex.view.FileExplorer} */
  var fileExplorer = new silex.view.FileExplorer(fileExplorerElement, bodyElement, headElement);

  // create SettingsDialog
  var settingsDialogElement = goog.dom.getElementByClass('silex-settings-dialog');
  /** @type {silex.view.SettingsDialog} */
  var settingsDialog = new silex.view.SettingsDialog(settingsDialogElement, bodyElement, headElement);

  // create PropertyTool
  var propertyToolElement = goog.dom.getElementByClass('silex-property-tool');
  /** @type {silex.view.PropertyTool} */
  var propertyTool = new silex.view.PropertyTool(propertyToolElement, bodyElement, headElement);

  // create the workspace which resizes all components in the page
  var workspaceElement = goog.dom.getElementByClass('silex-workspace');
  /** @type {silex.view.Workspace} */
  var workspace = new silex.view.Workspace(
    workspaceElement
    , menuElement
    , stageElement
    , pageToolElement
    , propertyToolElement
    , htmlEditorElement
    , cssEditorElement
    , jsEditorElement
    , textEditorElement
    , fileExplorerElement
    , settingsDialogElement);

  this.model = new silex.types.Model(
    new silex.model.File(bodyElement, headElement)
    , new silex.model.Head(bodyElement, headElement)
    , new silex.model.Body(bodyElement, headElement)
    , new silex.model.Element(bodyElement, headElement)
  );

  this.view = new silex.types.View(
    workspace
    , menu
    , stage
    , pageTool
    , propertyTool
    , htmlEditor
    , cssEditor
    , jsEditor
    , textEditor
    , fileExplorer
    , settingsDialog
  );

  this.controller = new silex.types.Controller(
    new silex.controller.MenuController(this.model, this.view)
    , new silex.controller.StageController(this.model, this.view)
    , new silex.controller.PageToolController(this.model, this.view)
    , new silex.controller.PropertyToolController(this.model, this.view)
    , new silex.controller.SettingsDialogController(this.model, this.view)
    , new silex.controller.HtmlEditorController(this.model, this.view)
    , new silex.controller.CssEditorController(this.model, this.view)
    , new silex.controller.JsEditorController(this.model, this.view)
    , new silex.controller.TextEditorController(this.model, this.view)
  );

  // now create an empty file to let the user start using Silex
  this.controller.menuController.menuCallback('file.new');
  if(silex.Config.debug.debugMode && silex.Config.debug.doAfterReady) {
    silex.Config.debug.doAfterReady(this.model, this.view, this.controller);
    }
};

/**
 * store the main structures to ease debugging in browser console
 * @type {silex.types.Model}
 */
silex.App.prototype.model;

/**
 * store the main structures to ease debugging in browser console
 * @type {silex.types.View}
 */
silex.App.prototype.view;

/**
 * store the main structures to ease debugging in browser console
 * @type {silex.types.Controller}
 */
silex.App.prototype.controller;

// Ensures the symbol will be visible after compiler renaming.
goog.exportSymbol('silex.App', silex.App);
