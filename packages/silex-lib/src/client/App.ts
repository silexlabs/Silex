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
 * a view holds a reference to the controllers so that it can order changes on
 * the models a controller holds a reference to the models so that it can change
 * them a model holds a reference to the views so that it can update them
 *
 */

import { detect } from 'detect-browser';
import { Config } from './ClientConfig';
import { ContextMenuController } from './controller/ContextMenuController';
import { CssEditorController } from './controller/CssEditorController';
import { EditMenuController } from './controller/EditMenuController';
import { FileMenuController } from './controller/FileMenuController';
import { HtmlEditorController } from './controller/HtmlEditorController';
import { InsertMenuController } from './controller/InsertMenuController';
import { JsEditorController } from './controller/JsEditorController';
import { PageToolController } from './controller/PageToolController';
import { PropertyToolController } from './controller/PropertyToolController';
import { SettingsDialogController } from './controller/SettingsDialogController';
import { StageController } from './controller/StageController';
import { TextEditorController } from './controller/TextEditorController';
import { ToolMenuController } from './controller/ToolMenuController';
import { ViewMenuController } from './controller/ViewMenuController';
import { Body } from './model/Body';
import { Component } from './model/Component';
import { SilexElement } from './model/Element';
import { File } from './model/File';
import { Head } from './model/Head';
import { Property } from './model/Property';
import { Controller, Model, View } from './types';
import { SilexNotification } from './utils/Notification';
import { Url } from './utils/Url';
import { BreadCrumbs } from './components/BreadCrumbs';
import { ContextMenu } from './components/ContextMenu';
import { CssEditor } from './components/dialog/CssEditor';
import { Dashboard } from './components/dialog/Dashboard';
import { FileExplorer } from './components/dialog/FileExplorer';
import { HtmlEditor } from './components/dialog/HtmlEditor';
import { JsEditor } from './components/dialog/JsEditor';
import { SettingsDialog } from './components/dialog/SettingsDialog';
import { Menu } from './components/Menu';
import { PageTool } from './components/PageTool';
import { PropertyTool } from './components/PropertyTool';
import { Splitter } from './components/Splitter';
import { StageWrapper } from './components/StageWrapper';
import { TextFormatBar } from './components/TextFormatBar';
import { getUiElements } from './components/UiElements';
import { Workspace } from './components/Workspace';

/**
 * Defines the entry point of Silex client application
 *
 */
export class App {
  /**
   * store the model instances
   * the model instances are passed to the controllers and the views
   */
  model: Model;

  /**
   * store the view instances
   * the view instaces have access to the models and controllers
   */
  view: View;

  /**
   * store the controller instances
   * controller instances have access to the views and the models
   */
  controller: Controller;

  /**
   * Entry point of Silex client application
   * create all views and models and controllers
   *
   */
  constructor(debug= false) {
    // the debug flag comes from index.jade or debug.jade
    Config.debug.debugMode = debug;
    if (Config.debug.debugMode) {
      console.warn('Silex starting in debug mode.');
    }

    // empty objects, to pass references to each other and later populate them
    const emptyModel: Model = {
      file: null,
      head: null,
      body: null,
      element: null,
      component: null,
      property: null,
    };
    const emptyController: Controller = {
      fileMenuController: null,
      editMenuController: null,
      viewMenuController: null,
      insertMenuController: null,
      toolMenuController: null,
      contextMenuController: null,
      stageController: null,
      pageToolController: null,
      propertyToolController: null,
      settingsDialogController: null,
      htmlEditorController: null,
      cssEditorController: null,
      jsEditorController: null,
      textEditorController: null,
    };
    const emptyView: View = {
      menu: null,
      contextMenu: null,
      breadCrumbs: null,
      pageTool: null,
      propertyTool: null,
      textFormatBar: null,
      htmlEditor: null,
      cssEditor: null,
      jsEditor: null,
      fileExplorer: null,
      settingsDialog: null,
      dashboard: null,
      propSplitter: null,
      workspace: null,
      stageWrapper: null,
    };

    // create all the components of Silex app
    this.model = this.initModel(emptyView, emptyController, emptyModel);
    this.controller = this.initController(emptyView, emptyController, emptyModel);
    this.view = this.initView(emptyView, emptyController, emptyModel);

    // init views now that controllers and model are instanciated
    this.view.workspace.buildUi();
    this.view.menu.buildUi();
    this.view.contextMenu.buildUi();
    this.view.breadCrumbs.buildUi();
    this.view.pageTool.buildUi();
    this.view.dashboard.buildUi();
    this.view.propertyTool.buildUi();

    // warning when not ff or chrome
    const browser = detect();
    const isFirefox = browser && browser.name === 'firefox';
    const isChrome = browser && browser.name === 'chrome';

    if (!isFirefox && !isChrome) {
      SilexNotification.alert('Warning',
          `
            Your browser is not supported yet.
            <br><br>
            Considere using <a href="https://www.mozilla.org/firefox/" target="_blank">Firefox</a>
             or <a href="https://www.google.com/chrome/" target="_blank">chrome</a>.
             <br><br>
             <small>Note: I believe you use ${ browser ? browser.name : 'Unknown' }</small>
             `,
          () => {});
    }

    // the build type
    if (!Config.debug.debugMode) {
      // warning small screen size
      // height must be enough to view the settings pannel
      // width is just arbitrary
      const winSizeWidth = document.documentElement.clientWidth;
      const winSizeHeight = document.documentElement.clientHeight;
      const minWinSizeWidth = 950;
      const minWinSizeHeight = 630;
      if (winSizeHeight < minWinSizeHeight || winSizeWidth < minWinSizeWidth) {
        SilexNotification.alert('Warning',
            `Your window is very small (${winSizeWidth}x${
                winSizeHeight}) and Silex may not display correctly.<br><br>Considere maximizing the window or use a bigger screen to use Silex at its best. A window size of ${
                minWinSizeWidth}x${
                minWinSizeHeight} is considered to be a acceptable.`,
            () => {});
      }
    }

    // draw the workspace once
    this.view.workspace.redraw(this.view);

    // application start, open a file
    if (Config.singleSiteMode) {
      // hide menu items
      document.body.classList.add('single-site-mode');
      // open the website from url
      const params = Url.getUrlParams();
      if (params.path && params.service) {
        this.controller.fileMenuController.openRecent({
          path: params.path,
          service: params.service,
          absPath: `/ce/${params.service}/get${params.path}`,
          url: `${Url.getRootUrl()}/ce/${params.service}/get${params.path}`,
        }, () => {
          console.log('opened');
          this.initDone();
        });
      } else {
        SilexNotification.alert('Open a file', `
           Could not open the file ${params.path}.<br /><br />
           You need to specify which website I am supposed to open with the variables "path" and "service" in the URL. Please <a href="https://github.com/silexlabs/Silex/wiki/Single-site-mode" target="_blank">check this document</a> or <a href="https://github.com/silexlabs/Silex/issues" target="_blank">get in touch in Silex forums"</a>
        `,
        () => {});
        this.initDone();
      }
    } else {
      this.controller.fileMenuController.newFile(
        () => {
          this.initDone();
        },
        () => {
          this.initDone();
        },
      );
    }
  }

  initDone() {
    this.view.workspace.loadingDone();
    if (Config.debug.debugMode && Config.debug.debugScript) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = Config.debug.debugScript;
      document.body.appendChild(script);
    }

    // prevent accidental unload
    if (!Config.debug.debugMode || Config.debug.preventQuit) {
      this.view.workspace.startWatchingUnload();
    }
  }

  /**
   * creation of the view instances
   */
  initView(emptyView, emptyController, emptyModel) {
    const uiElements = getUiElements();

    // Stage
    const stageWrapper = new StageWrapper(uiElements.stage, emptyModel, emptyController);

    // Menu
    const menu = new Menu(uiElements.menu, emptyModel, emptyController);

    // context menu
    const contextMenu = new ContextMenu(uiElements.contextMenu, emptyModel, emptyController);

    // bread crumbs
    const breadCrumbs = new BreadCrumbs(uiElements.breadCrumbs, emptyModel, emptyController);

    // PageTool
    const pageTool = new PageTool(uiElements.pageTool, emptyModel, emptyController);

    // HtmlEditor
    const htmlEditor = new HtmlEditor(uiElements.htmlEditor, emptyModel, emptyController);

    // CssEditor
    const cssEditor = new CssEditor(uiElements.cssEditor, emptyModel, emptyController);

    // JsEditor
    const jsEditor = new JsEditor(uiElements.jsEditor, emptyModel, emptyController);

    // SettingsDialog
    const settingsDialog = new SettingsDialog(uiElements.settingsDialog, emptyModel, emptyController);

    // Dashboard
    const dashboard = new Dashboard(uiElements.dashboard, emptyModel, emptyController);

    // FileExplorer
    const fileExplorer = new FileExplorer(uiElements.fileExplorer, emptyModel, emptyController);

    // PropertyTool
    const propertyTool = new PropertyTool(uiElements.propertyTool, emptyModel, emptyController);

    // TextFormatBar
    const textFormatBar = new TextFormatBar(uiElements.textFormatBar, emptyModel, emptyController);

    // workspace
    const workspace = new Workspace(uiElements.workspace, emptyModel, emptyController);

    // add splitters
    const propSplitter = new Splitter(uiElements.verticalSplitter, emptyModel, emptyController, () => workspace.resizeProperties());
    propSplitter.addLeft(uiElements.contextMenu);
    propSplitter.addLeft(uiElements.breadCrumbs);
    propSplitter.addLeft(uiElements.stage.parentElement);
    propSplitter.addRight(uiElements.propertyTool);

    // init the view class which references all the views
    emptyView.menu = menu;
    emptyView.contextMenu = contextMenu;
    emptyView.breadCrumbs = breadCrumbs;
    emptyView.pageTool = pageTool;
    emptyView.propertyTool = propertyTool;
    emptyView.textFormatBar = textFormatBar;
    emptyView.htmlEditor = htmlEditor;
    emptyView.cssEditor = cssEditor;
    emptyView.jsEditor = jsEditor;
    emptyView.fileExplorer = fileExplorer;
    emptyView.settingsDialog = settingsDialog;
    emptyView.dashboard = dashboard;
    emptyView.propSplitter = propSplitter;
    emptyView.workspace = workspace;
    emptyView.stageWrapper = stageWrapper;
    emptyView.uiElements = uiElements;

    return emptyView;
  }

  /**
   * creation of the model classes
   * create the models to be passed to the controllers and the views
   */
  initModel(emptyView, emptyController, emptyModel) {
    // init the model class which references all the views
    emptyModel.file = new File(emptyModel, emptyView);
    emptyModel.head = new Head(emptyModel, emptyView);
    emptyModel.body = new Body(emptyModel, emptyView);
    emptyModel.element = new SilexElement(emptyModel, emptyView);
    emptyModel.component = new Component(emptyModel, emptyView);
    emptyModel.property = new Property(emptyModel, emptyView);

    return emptyModel;
  }

  /**
   * init the controller class with references to the views and the models
   */
  initController(emptyView, emptyController, emptyModel) {
    emptyController.fileMenuController = new FileMenuController(emptyModel, emptyView);
    emptyController.editMenuController = new EditMenuController(emptyModel, emptyView);
    emptyController.viewMenuController = new ViewMenuController(emptyModel, emptyView);
    emptyController.insertMenuController = new InsertMenuController(emptyModel, emptyView);
    emptyController.toolMenuController = new ToolMenuController(emptyModel, emptyView);
    emptyController.contextMenuController = new ContextMenuController(emptyModel, emptyView);
    emptyController.stageController = new StageController(emptyModel, emptyView);
    emptyController.pageToolController = new PageToolController(emptyModel, emptyView);
    emptyController.propertyToolController = new PropertyToolController(emptyModel, emptyView);
    emptyController.settingsDialogController = new SettingsDialogController(emptyModel, emptyView);
    emptyController.htmlEditorController = new HtmlEditorController(emptyModel, emptyView);
    emptyController.cssEditorController = new CssEditorController(emptyModel, emptyView);
    emptyController.jsEditorController = new JsEditorController(emptyModel, emptyView);
    emptyController.textEditorController = new TextEditorController(emptyModel, emptyView);

    return emptyController;
  }
}

// tslint:disable:no-string-literal
window['silex'] = window['silex'] || {};
window['silex']['init'] = () => {
  window['silex']['config'] = Config;
};
window['silex']['start'] = () => {
  window['silex']['app'] = new App();
};
