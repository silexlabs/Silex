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

goog.provide('silex.boot');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');

goog.require('silex.Controller');
goog.require('silex.Helper');
goog.require('silex.model.Component');
goog.require('silex.model.File');
goog.require('silex.model.Page');
goog.require('silex.model.Selection');
goog.require('silex.service.CloudStorage');
goog.require('silex.service.SilexTasks');
goog.require('silex.service.Tracker');
goog.require('silex.view.FileExplorer');
goog.require('silex.view.HTMLEditor');
goog.require('silex.view.Menu');
goog.require('silex.view.PageTool');
goog.require('silex.view.PropertiesTool');
goog.require('silex.view.PublishSettings');
goog.require('silex.view.Stage');
goog.require('silex.view.TextEditor');
goog.require('silex.view.Workspace');
goog.require('silex.view.propertiesTool.BgPane');
goog.require('silex.view.propertiesTool.BorderPane');
goog.require('silex.view.propertiesTool.GeneralStylePane');
goog.require('silex.view.propertiesTool.PagePane');
goog.require('silex.view.propertiesTool.PropertyPane');

/**
 * Entry point of Silex client application
 * create all views and wait for them to be fully loaded
 * instanciate the model classes and pass the wiews instances to them
 * instanciate the controller class and pass the wiews and model instances to it
 */
silex.boot = function() {
  // create all views and attach them to the dom
  // it is a sequence, because views loads templates one after another
  var menuElement = goog.dom.getElementByClass('silex-menu');
  var menu = new silex.view.Menu(menuElement,
  function() {
    // Menu created
    var stageElement = goog.dom.getElementByClass('silex-stage');
    var stage = new silex.view.Stage(stageElement,
    function() {
      // Stage created
      var pageToolElement = goog.dom.getElementByClass('silex-pagetool');
      var pageTool = new silex.view.PageTool(pageToolElement,
        function() {
          // PageTool created
          var propertiesToolElement = goog.dom.getElementByClass('silex-propertiestool');
          var propertiesTool = new silex.view.PropertiesTool(propertiesToolElement,
          function() {
            // PropertiesTool created
            var htmlEditorElement = goog.dom.getElementByClass('silex-htmleditor');
            var htmlEditor = new silex.view.HTMLEditor(htmlEditorElement,
            function() {
              // HTMLEditor created
              var textEditorElement = goog.dom.getElementByClass('silex-texteditor');
              var textEditor = new silex.view.TextEditor(textEditorElement,
              function() {
                // TextEditor created
                var fileExplorerElement = goog.dom.getElementByClass('silex-fileexplorer');
                var fileExplorer = new silex.view.FileExplorer(fileExplorerElement,
                function() {
                  // FileExplorer created
                  var publishSettingsElement = goog.dom.getElementByClass('silex-publishsettings');
                  var publishSettings = new silex.view.PublishSettings(publishSettingsElement,
                  function() {
                    // PublishSettings created
                    // create the workspace which place all components in the page
                    var workspaceElement = goog.dom.getElementByClass('silex-workspace');
                    var workspace = new silex.view.Workspace(
                    workspaceElement,
                    menu,
                    stage,
                    pageTool,
                    propertiesTool,
                    htmlEditor,
                    textEditor,
                    fileExplorer,
                    publishSettings);
                    // Workspace created

                    // create the main model element, the file
                    // which creates pages and elements when a file will be loaded later
                    // the model updates the views
                    var file = new silex.model.File(
                    workspace,
                    menu,
                    stage,
                    pageTool,
                    propertiesTool,
                    htmlEditor,
                    textEditor,
                    fileExplorer,
                    publishSettings);
                    // File created

                    var selection = new silex.model.Selection(
                    workspace,
                    menu,
                    stage,
                    pageTool,
                    propertiesTool,
                    htmlEditor,
                    textEditor,
                    fileExplorer,
                    publishSettings);
                    // Selection created

                    // the controller listens to the view components
                    // and updates the model
                    var controller = new silex.Controller(
                    workspace,
                    menu,
                    stage,
                    pageTool,
                    propertiesTool,
                    htmlEditor,
                    textEditor,
                    fileExplorer,
                    publishSettings,
                    file,
                    selection);
                    // Controller created

                    // now create an empty file to let the user start using Silex
                    file.newFile(function() {
                      if(silex.model.Config.debug.debugMode && silex.model.Config.debug.doAfterReady) {
                        silex.model.Config.debug.doAfterReady(
                          controller,
                          workspace,
                          menu,
                          stage,
                          pageTool,
                          propertiesTool,
                          htmlEditor,
                          textEditor,
                          fileExplorer,
                          publishSettings,
                          file,
                          selection);
                      }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

// Ensures the symbol will be visible after compiler renaming.
goog.exportSymbol('silex.boot', silex.boot);
