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
 * @fileoverview This file contains the definitions of the Model, View and
 * Controller structures
 *
 */
import { ContextMenuController } from './controller/context-menu-controller';
import { CssEditorController } from './controller/css-editor-controller';
import { EditMenuController } from './controller/edit-menu-controller';
import { FileMenuController } from './controller/file-menu-controller';
import { HtmlEditorController } from './controller/html-editor-controller';
import { InsertMenuController } from './controller/insert-menu-controller';
import { JsEditorController } from './controller/js-editor-controller';
import { PageToolController } from './controller/page-tool-controller';
import { PropertyToolController } from './controller/property-tool-controller';
import { SettingsDialogController } from './controller/settings-dialog-controller';
import { StageController } from './controller/stage-controller';
import { TextEditorController } from './controller/text-editor-controller';
import { ToolMenuController } from './controller/tool-menu-controller';
import { ViewMenuController } from './controller/view-menu-controller';
import { Body } from './model/body';
import { Component } from './model/Component';
import { ComponentData } from './model/Data';
import { SilexElement } from './model/element';
import { File } from './model/file';
import { Head } from './model/head';
import { Page } from './model/page';
import { Property } from './model/property';
import { BreadCrumbs } from './view/bread-crumbs';
import { ContextMenu } from './view/context-menu';
import { CssEditor } from './view/dialog/css-editor';
import { Dashboard } from './view/dialog/Dashboard';
import { FileExplorer } from './view/dialog/file-explorer';
import { HtmlEditor } from './view/dialog/html-editor';
import { JsEditor } from './view/dialog/js-editor';
import { SettingsDialog } from './view/dialog/settings-dialog';
import { Menu } from './view/menu';
import { PageTool } from './view/page-tool';
import { PropertyTool } from './view/property-tool';
import { Splitter } from './view/splitter';
import { TextFormatBar } from './view/TextFormatBar';
import { Workspace } from './view/workspace';
import { StageWrapper } from './view/StageWrapper';

/**
 * warning: if you change that type, also change the default value in LinkDialog
 */
export interface LinkData {
  href?: string,
  target?: string,
  title?: string,
  rel?: string,
  type?: string,
  download?: string
};
export enum StickyPoint {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom'
}
// MID_V: 'midV',
// MID_H: 'midH',
export interface StickyLine {
  id: string,
  vertical: boolean,
  position: number,
  stickyPoint: StickyPoint,
  metaData: any
};
export interface Font {
  family: string,
  href: string
};
export interface FileInfo {
  url: string,
  path: string,
  folder: string,
  service: string,
  size: number,
  modified: string,
  name: string,
  isDir: boolean,
  mime: string,
  absPath: string,
}
export interface Hosting {
  providers: Provider[],
  skipHostingSelection: boolean
};
export interface Provider {
  name: string,
  displayName: string,
  isLoggedIn: boolean,
  authorizeUrl: string,
  dashboardUrl: string,
  pleaseCreateAVhost: string,
  vhostsUrl: string,
  buyDomainUrl: string,
  skipVhostSelection: boolean,
  skipFolderSelection: boolean,
  afterPublishMessage: string
};
export interface VHost {
  name: string,
  domainUrl: string,
  skipDomainSelection: boolean,
  publicationPath: FileInfo
};
export interface PublicationOptions {
  file: FileInfo,
  publicationPath: FileInfo,
  provider: Provider
};
export interface UndoItem {
  page: string,
  html: string,
  scrollX: number,
  scrollY: number
};
export interface ClipboardItem {
  element: HTMLElement;
  style: Object;
  mobileStyle: Object;
  componentData: ComponentData;
  children: Array<ClipboardItem>
}

/**
 * @struct
 */
export interface Model {
  file: File;
  head: Head;
  body: Body;
  page: Page;
  element: SilexElement;
  component: Component;
  property: Property;
}

/**
 * @struct
 */
export interface Controller {
  fileMenuController: FileMenuController;
  editMenuController: EditMenuController;
  viewMenuController: ViewMenuController;
  insertMenuController: InsertMenuController;
  toolMenuController: ToolMenuController;
  contextMenuController: ContextMenuController;
  stageController: StageController;
  pageToolController: PageToolController;
  propertyToolController: PropertyToolController;
  settingsDialogController: SettingsDialogController;
  htmlEditorController: HtmlEditorController;
  cssEditorController: CssEditorController;
  jsEditorController: JsEditorController;
  textEditorController: TextEditorController;
}

/**
 * @struct
 */
export interface View {
  menu: Menu;
  contextMenu: ContextMenu;
  breadCrumbs: BreadCrumbs;
  pageTool: PageTool;
  propertyTool: PropertyTool;
  textFormatBar: TextFormatBar;
  htmlEditor: HtmlEditor;
  cssEditor: CssEditor;
  jsEditor: JsEditor;
  fileExplorer: FileExplorer;
  settingsDialog: SettingsDialog;
  dashboard: Dashboard;
  propSplitter: Splitter;
  workspace: Workspace;
  stageWrapper: StageWrapper;
};
