
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
goog.require('silex.model.Body');
goog.require('silex.model.Element');
goog.require('silex.model.Component');
goog.require('silex.model.File');
goog.require('silex.model.Head');
goog.require('silex.model.Page');
goog.require('silex.model.Property');
goog.require('silex.service.Tracker');
goog.require('silex.types.Controller');
goog.require('silex.types.Model');
goog.require('silex.types.View');
goog.require('silex.utils.BackwardCompat');
goog.require('silex.utils.Dom');
goog.require('silex.utils.DomCleaner');
goog.require('silex.utils.InvalidationManager');
goog.require('silex.utils.Polyfills');
goog.require('silex.utils.Style');
goog.require('silex.view.ContextMenu');
goog.require('silex.view.BreadCrumbs');
goog.require('silex.view.Menu');
goog.require('silex.view.PageTool');
goog.require('silex.view.PropertyTool');
goog.require('silex.view.Splitter');
goog.require('silex.view.Stage');
goog.require('silex.view.Workspace');
goog.require('silex.view.dialog.CssEditor');
goog.require('silex.view.dialog.FileExplorer');
goog.require('silex.view.dialog.HtmlEditor');
goog.require('silex.view.dialog.JsEditor');
goog.require('silex.view.dialog.SettingsDialog');
goog.require('silex.view.dialog.NewWebsiteDialog');
goog.require('silex.view.dialog.TextEditor');

goog.require('silex.view.ModalDialog');

/**
 * Defines the entry point of Silex client application
 *
 */
class App {


  /**
   * Entry point of Silex client application
   * create all views and models and controllers
   * @constructor
   *
   */
  constructor() {

    // **
    // general initializations

    // polyfills
    silex.utils.Polyfills.init();

    /**
     * store the model instances
     * the model instances are passed to the controllers and the views
     * @type {!silex.types.Model}
     */
    this.model = new silex.types.Model();


    /**
     * store the view instances
     * the view instaces have access to the models and controllers
     * @type {!silex.types.View}
     */
    this.view = new silex.types.View();


    /**
     * store the controller instances
     * controller instances have access to the views and the models
     * @type {!silex.types.Controller}
     */
    this.controller = new silex.types.Controller();


    // create all the components of Silex app
    this.initView();
    this.initModel();
    this.initController();

    // init views now that controllers and model are instanciated
    this.view.workspace.buildUi();
    this.view.stage.buildUi();
    this.view.menu.buildUi();
    this.view.contextMenu.buildUi();
    this.view.breadCrumbs.buildUi();
    this.view.pageTool.buildUi();
    this.view.htmlEditor.buildUi();
    this.view.cssEditor.buildUi();
    this.view.jsEditor.buildUi();
    this.view.textEditor.buildUi();
    this.view.settingsDialog.buildUi();
    this.view.newWebsiteDialog.buildUi();
    this.view.propertyTool.buildUi();


    // warning when IE
    if (navigator.appName === 'Microsoft Internet Explorer' || (navigator.appName === 'Netscape' && navigator.userAgent.indexOf('Trident') >= 0)) {
      silex.utils.Notification.alert('Your browser is not supported yet.<br>Considere using chrome or firefox instead of Internet Explorer.',
          goog.bind(function() {}, this));
    }

    // draw the workspace once
    this.view.workspace.redraw(this.view);

    // application start, open a new empty file
    this.controller.fileMenuController.newFile(
      () => {
        this.view.workspace.loadingDone();
        this.initDebug();
      },
      () => {
        this.view.workspace.loadingDone();
        this.initDebug();
      }
    );
  }

  initDebug() {
    if (goog.DEBUG) {
      window['model'] = this.model;
      window['view'] = this.view;
      window['controller'] = this.controller;
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '/js/debug.js';
      document.body.appendChild(script);
    }

    // prevent accidental unload
    if (!goog.DEBUG || silex.Config.debug.preventQuit) {
      this.view.workspace.startWatchingUnload();
    }
  }


  /**
   * creation of the view instances
   */
  initView() {
    // Stage
    var stageElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-stage'));
    /** @type {silex.view.Stage} */
    var stage = new silex.view.Stage(stageElement, this.model, this.controller);

    // Menu
    var menuElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-menu'));
    /** @type {silex.view.Menu} */
    var menu = new silex.view.Menu(menuElement, this.model, this.controller);

    // context menu
    var contextMenuElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-context-menu'));
    /** @type {silex.view.ContextMenu} */
    var contextMenu = new silex.view.ContextMenu(contextMenuElement, this.model, this.controller);

    // bread crumbs
    var breadCrumbsElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-bread-crumbs'));
    /** @type {silex.view.BreadCrumbs} */
    var breadCrumbs = new silex.view.BreadCrumbs(breadCrumbsElement, this.model, this.controller);

    // PageTool
    var pageToolElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-page-tool'));
    /** @type {silex.view.PageTool} */
    var pageTool = new silex.view.PageTool(pageToolElement, this.model, this.controller);

    // HtmlEditor
    var htmlEditorElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-html-editor'));
    /** @type {silex.view.dialog.HtmlEditor} */
    var htmlEditor = new silex.view.dialog.HtmlEditor(htmlEditorElement, this.model, this.controller);

    // CssEditor
    var cssEditorElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-css-editor'));
    /** @type {silex.view.dialog.CssEditor} */
    var cssEditor = new silex.view.dialog.CssEditor(cssEditorElement, this.model, this.controller);

    // JsEditor
    var jsEditorElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-js-editor'));
    /** @type {silex.view.dialog.JsEditor} */
    var jsEditor = new silex.view.dialog.JsEditor(jsEditorElement, this.model, this.controller);

    // TextEditor
    var textEditorElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-text-editor'));
    /** @type {silex.view.dialog.TextEditor} */
    var textEditor = new silex.view.dialog.TextEditor(textEditorElement, this.model, this.controller);

    // SettingsDialog
    var settingsDialogElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-settings-dialog'));
    /** @type {silex.view.dialog.SettingsDialog} */
    var settingsDialog = new silex.view.dialog.SettingsDialog(settingsDialogElement, this.model, this.controller);

    // NewWebsiteDialog
    var newWebsiteDialogElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-newwebsite-dialog'));
    /** @type {silex.view.dialog.NewWebsiteDialog} */
    var newWebsiteDialog = new silex.view.dialog.NewWebsiteDialog(newWebsiteDialogElement, this.model, this.controller);

    // FileExplorer
    var fileExplorerElement = /** @type {!Element} */ (document.getElementById('silex-file-explorer'));
    /** @type {silex.view.dialog.FileExplorer} */
    var fileExplorer = new silex.view.dialog.FileExplorer(fileExplorerElement, this.model, this.controller);

    // PropertyTool
    var propertyToolElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-property-tool'));
    /** @type {silex.view.PropertyTool} */
    var propertyTool = new silex.view.PropertyTool(propertyToolElement, this.model, this.controller);

    // PropertyTool
    var workspaceElement = /** @type {!Element} */ (goog.dom.getElementByClass('silex-workspace'));
    /** @type {silex.view.Workspace} */
    var workspace = new silex.view.Workspace(workspaceElement, this.model, this.controller);

    // add splitters
    var propSplitterElement = /** @type {!Element} */ (goog.dom.getElementByClass('vertical-splitter'));
    /** @type {silex.view.Splitter} */
    var propSplitter = new silex.view.Splitter(propSplitterElement, this.model, this.controller, () => workspace.resizeProperties());
    propSplitter.addLeft(contextMenuElement);
    propSplitter.addLeft(breadCrumbsElement);
    propSplitter.addLeft(stageElement);
    propSplitter.addRight(propertyToolElement);

    // init the view class which references all the views
    this.view.init(
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
        workspace
    );
  }


  /**
   * creation of the model classes
   * create the models to be passed to the controllers and the views
   */
  initModel() {
    // init the model class which references all the views
    this.model.init(
        new silex.model.File(this.model, this.view),
        new silex.model.Head(this.model, this.view),
        new silex.model.Body(this.model, this.view),
        new silex.model.Page(this.model, this.view),
        new silex.model.Element(this.model, this.view),
        new silex.model.Component(this.model, this.view),
        new silex.model.Property(this.model, this.view)
    );
  }


  /**
   * init the controller class with references to the views and the models
   */
  initController() {
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
  }
};


// Ensures the symbol will be visible after compiler renaming
// which is required since index.html creates a silex.App instance
goog.exportSymbol('silex.App', App);

// Also keep  goog.style unchanged since it is patched at runtime
// This fixes this issue: https://codereview.appspot.com/6115045/patch/1/2
// @see dist/client/js/closure-patches.js
goog.exportSymbol('goog.style', goog.style);

