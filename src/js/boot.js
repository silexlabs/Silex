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

'use strict';

goog.provide('silex.App');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');

// model
goog.require('silex.Config');
goog.require('silex.model.File');

// controller
goog.require('silex.Controller');

// display
goog.require('silex.view.Menu');
goog.require('silex.view.Stage');
goog.require('silex.view.PageTool');
goog.require('silex.view.Workspace');

// editors
goog.require('silex.view.HTMLEditor');
goog.require('silex.view.TextEditor');

// dialogs
goog.require('silex.view.FileExplorer');
goog.require('silex.view.PublishSettings');

/**
 * Entry point of Silex client application
 * create all views and wait for them to be fully loaded
 * instanciate the model classes and pass the wiews instances to them
 * instanciate the controller class and pass the wiews and model instances to it
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
  this.menu = new silex.view.Menu(menuElement);
  // create Stage
  var stageElement = goog.dom.getElementByClass('silex-stage');
  this.stage = new silex.view.Stage(stageElement);
  // create PageTool
  var pageToolElement = goog.dom.getElementByClass('silex-pagetool');
  this.pageTool = new silex.view.PageTool(pageToolElement);
  // create HTMLEditor
  var htmlEditorElement = goog.dom.getElementByClass('silex-htmleditor');
  this.htmlEditor = new silex.view.HTMLEditor(htmlEditorElement);
  // create TextEditor
  var textEditorElement = goog.dom.getElementByClass('silex-texteditor');
  this.textEditor = new silex.view.TextEditor(textEditorElement);
  // create FileExplorer
  var fileExplorerElement = goog.dom.getElementByClass('silex-fileexplorer');
  this.fileExplorer = new silex.view.FileExplorer(fileExplorerElement);
  // create PublishSettings
  var publishSettingsElement = goog.dom.getElementByClass('silex-publishsettings');
  this.publishSettings = new silex.view.PublishSettings(publishSettingsElement);
  // create PropertiesTool
  var propertiesToolElement = goog.dom.getElementByClass('silex-propertiestool');
/*
  this.propertiesTool = new silex.view.PropertiesTool(propertiesToolElement);
*/
  // create the workspace which place all components in the page
  var workspaceElement = goog.dom.getElementByClass('silex-workspace');
  this.workspace = new silex.view.Workspace(
  workspaceElement,
  menuElement,
  stageElement,
  pageToolElement,
  propertiesToolElement,
  htmlEditorElement,
  textEditorElement,
  fileExplorerElement,
  publishSettingsElement);

  // create the main model element, the file
  // which creates pages and elements when a file will be loaded later
  // the model updates the views
  this.file = new silex.model.File();

  // controller listen to the view events
  // and updates the model
  this.controller = new silex.Controller(this);

  // now create an empty file to let the user start using Silex
  file.newFile(function() {
    if(silex.Config.debug.debugMode && silex.Config.debug.doAfterReady) {
      silex.Config.debug.doAfterReady(this);
    }
  });
};

/**
 * reference to the {silex.view.Menu} menu instance
 */
silex.App.prototype.menu;
/**
 * reference to the {silex.view.Stage} stage instance
 */
silex.App.prototype.stage;
/**
 * reference to the {silex.view.PageTool} pageTool instance
 */
silex.App.prototype.pageTool;
/**
 * reference to the {silex.view.HTMLEditor} htmlEditor instance
 */
silex.App.prototype.htmlEditor;
/**
 * reference to the {silex.view.TextEditor} textEditor instance
 */
silex.App.prototype.textEditor;
/**
 * reference to the {silex.view.FileExplorer} fileExplorer instance
 */
silex.App.prototype.fileExplorer;
/**
 * reference to the {silex.view.PublishSettings} publishSettings instance
 */
silex.App.prototype.publishSettings;
/**
 * reference to the {silex.view.PropertiesTool} propertiesTool instance
 */
silex.App.prototype.propertiesTool;
/**
 * reference to the {silex.view.Workspace} workspace instance
 */
silex.App.prototype.workspace;
/**
 * reference to the {silex.model.File} file instance
 */
silex.App.prototype.file;
/**
 * reference to the {silex.Controller} controller instance
 */
silex.App.prototype.controller;


// Ensures the symbol will be visible after compiler renaming.
goog.exportSymbol('silex.boot', silex.boot);
