/**
 * @preserve
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
 * @fileoverview This file defines the entry point of Silex
 *
 * a view holds a reference to the controllers so that it can order changes on the models
 * a controller holds a reference to the models so that it can change them
 * a model holds a reference to the views so that it can update them
 *
 */

goog.provide('silex.App');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.style');
goog.require('silex.Config');
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
goog.require('silex.controller.ContextMenuController');
goog.require('silex.model.Property');
goog.require('silex.model.Element');
goog.require('silex.model.Body');
goog.require('silex.model.Head');
goog.require('silex.model.File');
goog.require('silex.model.Page');
goog.require('silex.service.Tracker');
goog.require('silex.types.Controller');
goog.require('silex.types.Model');
goog.require('silex.types.View');
goog.require('silex.utils.Dom');
goog.require('silex.utils.DomCleaner');
goog.require('silex.utils.Polyfills');
goog.require('silex.utils.BackwardCompat');
goog.require('silex.view.Menu');
goog.require('silex.view.ContextMenu');
goog.require('silex.view.Splitter');
goog.require('silex.view.PageTool');
goog.require('silex.view.PropertyTool');
goog.require('silex.view.Stage');
goog.require('silex.view.Workspace');
goog.require('silex.view.dialog.CssEditor');
goog.require('silex.view.dialog.FileExplorer');
goog.require('silex.view.dialog.HtmlEditor');
goog.require('silex.view.dialog.JsEditor');
goog.require('silex.view.dialog.SettingsDialog');
goog.require('silex.view.dialog.TextEditor');



/**
 * Entry point of Silex client application
 * create all views and models and controllers
 * @param {Boolean} isDebugMode
 * @param {?function()=} opt_silexDoAfterReady
 * @constructor
 *
 */
silex.App = function(isDebugMode, opt_silexDoAfterReady) {

  // **
  // general initializations
  // **
  // debug mode
  if(isDebugMode !== null) {
    silex.Config.debug.debugMode = isDebugMode;
  }
  // tracker / qos
  silex.service.Tracker.getInstance().trackAction('app-events', 'start', null, 2);

  // polyfills
  silex.utils.Polyfills.init();

  // remove hash added by cloud explorer
  window.location.hash = '';

  // warning when IE
  if (navigator.appName === 'Microsoft Internet Explorer' || (navigator.appName === 'Netscape' && navigator.userAgent.indexOf('Trident') >= 0)) {
    silex.utils.Notification.alert('Your browser is not supported yet.<br>Considere using chrome or firefox instead of Internet Explorer.',
        goog.bind(function() {}, this));
  }
  // **
  // creation of the main MVC structures
  // **
  // create the models to be passed to the controllers and the views
  this.model = new silex.types.Model();
  // create the view class which references all the views
  this.view = new silex.types.View();
  // create the controllers, and give them access to the views and the models
  this.controller = new silex.types.Controller();

  // **
  // creation of the view instances
  // **
  // create Stage
  var stageElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-stage'));
  /** @type {silex.view.Stage} */
  var stage = new silex.view.Stage(stageElement, this.model, this.controller);

  // create Menu
  var menuElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-menu'));
  /** @type {silex.view.Menu} */
  var menu = new silex.view.Menu(menuElement, this.model, this.controller);

  // create context menu
  var contextMenuElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-context-menu'));
  /** @type {silex.view.ContextMenu} */
  var contextMenu = new silex.view.ContextMenu(contextMenuElement, this.model, this.controller);

  // create PageTool
  var pageToolElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-page-tool'));
  /** @type {silex.view.PageTool} */
  var pageTool = new silex.view.PageTool(pageToolElement, this.model, this.controller);

  // create HtmlEditor
  var htmlEditorElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-html-editor'));
  /** @type {silex.view.dialog.HtmlEditor} */
  var htmlEditor = new silex.view.dialog.HtmlEditor(htmlEditorElement, this.model, this.controller);

  // create CssEditor
  var cssEditorElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-css-editor'));
  /** @type {silex.view.dialog.CssEditor} */
  var cssEditor = new silex.view.dialog.CssEditor(cssEditorElement, this.model, this.controller);

  // create JsEditor
  var jsEditorElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-js-editor'));
  /** @type {silex.view.dialog.JsEditor} */
  var jsEditor = new silex.view.dialog.JsEditor(jsEditorElement, this.model, this.controller);

  // create TextEditor
  var textEditorElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-text-editor'));
  /** @type {silex.view.dialog.TextEditor} */
  var textEditor = new silex.view.dialog.TextEditor(textEditorElement, this.model, this.controller);

  // create SettingsDialog
  var settingsDialogElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-settings-dialog'));
  /** @type {silex.view.dialog.SettingsDialog} */
  var settingsDialog = new silex.view.dialog.SettingsDialog(settingsDialogElement, this.model, this.controller);

  // create SettingsDialog
  var fileExplorerElement = /** @type {!Element} */ (document.getElementById('silex-file-explorer'));
  /** @type {silex.view.dialog.FileExplorer} */
  var fileExplorer = new silex.view.dialog.FileExplorer(fileExplorerElement, this.model, this.controller);

  // create PropertyTool
  var propertyToolElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-property-tool'));
  /** @type {silex.view.PropertyTool} */
  var propertyTool = new silex.view.PropertyTool(propertyToolElement, this.model, this.controller);

  // create PropertyTool
  var workspaceElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-workspace'));
  /** @type {silex.view.Workspace} */
  var workspace = new silex.view.Workspace(workspaceElement, this.model, this.controller);

  // add splitters
  var propSplitterElement = /** @type {!Element} */ (goog.dom.getElementByClass('vertical-splitter'));
  /** @type {silex.view.Splitter} */
  var propSplitter = new silex.view.Splitter(propSplitterElement, this.model, this.controller, () => workspace.resizeProperties());
  propSplitter.addLeft(contextMenuElement);
  propSplitter.addLeft(stageElement);
  propSplitter.addRight(propertyToolElement);

  // init the view class which references all the views
  this.view.init(
      menu,
      contextMenu,
      stage,
      pageTool,
      propertyTool,
      htmlEditor,
      cssEditor,
      jsEditor,
      textEditor,
      fileExplorer,
      settingsDialog,
      propSplitter,
      workspace
  );
  // **
  // creation of the model classes
  // **
  // create the models to be passed to the controllers and the views
  // init the model class which references all the views
  this.model.init(
      new silex.model.File(this.model, this.view),
      new silex.model.Head(this.model, this.view),
      new silex.model.Body(this.model, this.view),
      new silex.model.Page(this.model, this.view),
      new silex.model.Element(this.model, this.view),
      new silex.model.Property(this.model, this.view)
  );

  // **
  // creation of the controller classes
  // **
  // init the controller class with references to the views and the models
  this.controller.init(
      new silex.controller.FileMenuController(this.model, this.view),
      new silex.controller.EditMenuController(this.model, this.view),
      new silex.controller.ViewMenuController(this.model, this.view),
      new silex.controller.InsertMenuController(this.model, this.view),
      new silex.controller.ToolMenuController(this.model, this.view),
      new silex.controller.ContextMenuController(this.model, this.view),
      new silex.controller.StageController(this.model, this.view),
      new silex.controller.PageToolController(this.model, this.view),
      new silex.controller.PropertyToolController(this.model, this.view),
      new silex.controller.SettingsDialogController(this.model, this.view),
      new silex.controller.HtmlEditorController(this.model, this.view),
      new silex.controller.CssEditorController(this.model, this.view),
      new silex.controller.JsEditorController(this.model, this.view),
      new silex.controller.TextEditorController(this.model, this.view)
  );

  // init views now that controllers and model are instanciated
  workspace.buildUi();
  stage.buildUi();
  menu.buildUi();
  contextMenu.buildUi();
  pageTool.buildUi();
  htmlEditor.buildUi();
  cssEditor.buildUi();
  jsEditor.buildUi();
  textEditor.buildUi();
  settingsDialog.buildUi();
  propertyTool.buildUi();

  // draw the workspace once
  workspace.invalidate(this.view);

  // **
  // application start, open a new empty file
  this.controller.fileMenuController.newFile();
  if (isDebugMode && opt_silexDoAfterReady != null) {
    console.log('xxxxx', opt_silexDoAfterReady);
    opt_silexDoAfterReady(this.model, this.view, this.controller);
  }
  // prevent accidental unload
  if (!silex.Config.debug.debugMode || silex.Config.debug.preventQuit) {
    workspace.startWatchingUnload();
  }
};


/**
 * store the main structures to ease debugging in browser console
 * @type {silex.types.Model}
 */
silex.App.prototype.model = null;


/**
 * store the main structures to ease debugging in browser console
 * @type {silex.types.View}
 */
silex.App.prototype.view = null;


/**
 * store the main structures to ease debugging in browser console
 * @type {silex.types.Controller}
 */
silex.App.prototype.controller = null;


// Ensures the symbol will be visible after compiler renaming.
goog.exportSymbol('silex.App', silex.App);
//goog.exportSymbol('goog.style', goog.style);
