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
import { ComponentData } from './model/Data';
import { SilexElement } from './model/Element';
import { File } from './model/File';
import { Head } from './model/Head';
import { Page } from './model/Page';
import { Property } from './model/Property';
import { BreadCrumbs } from './view/BreadCrumbs';
import { ContextMenu } from './view/ContextMenu';
import { CssEditor } from './view/dialog/CssEditor';
import { Dashboard } from './view/dialog/Dashboard';
import { FileExplorer } from './view/dialog/FileExplorer';
import { HtmlEditor } from './view/dialog/HtmlEditor';
import { JsEditor } from './view/dialog/JsEditor';
import { SettingsDialog } from './view/dialog/SettingsDialog';
import { Menu } from './view/Menu';
import { PageTool } from './view/PageTool';
import { PropertyTool } from './view/PropertyTool';
import { Splitter } from './view/Splitter';
import { StageWrapper } from './view/StageWrapper';
import { TextFormatBar } from './view/TextFormatBar';
import { Workspace } from './view/Workspace';

/**
 * warning: if you change that type, also change the default value in LinkDialog
 */
export interface LinkData {
  href?: string;
  target?: string;
  title?: string;
  rel?: string;
  type?: string;
  download?: string;
}
export enum StickyPoint {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom',
}
// MID_V: 'midV',
// MID_H: 'midH',
export interface StickyLine {
  id: string;
  vertical: boolean;
  position: number;
  stickyPoint: StickyPoint;
  metaData: any;
}
export interface DataSource {
  href: string;
  data?: object;
}
export interface DataSources { [key: string]: DataSource; }
export interface Font {
  family: string;
  href: string;
}
export interface FileInfo {
  url: string;
  path: string;
  folder: string;
  service: string;
  size: number;
  modified: string;
  name: string;
  isDir: boolean;
  mime: string;
  absPath: string;
}
export interface Hosting {
  providers: Provider[];
  skipHostingSelection: boolean;
}
export interface Provider {
  name: string;
  displayName: string;
  isLoggedIn: boolean;
  authorizeUrl: string;
  dashboardUrl: string;
  pleaseCreateAVhost: string;
  vhostsUrl: string;
  buyDomainUrl: string;
  skipVhostSelection: boolean;
  skipFolderSelection: boolean;
  afterPublishMessage: string;
}
export interface VHost {
  name: string;
  domainUrl: string;
  skipDomainSelection: boolean;
  publicationPath: FileInfo;
  url: string;
}
export interface PublicationOptions {
  file: FileInfo;
  publicationPath: FileInfo;
  provider: Provider;
}
export interface UndoItem {
  page: string;
  html: string;
  scrollX: number;
  scrollY: number;
}
export interface ClipboardItem {
  parent: HTMLElement;
  element: HTMLElement;
  style: any;
  mobileStyle: any;
  componentData: ComponentData;
  children: ClipboardItem[];
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
}
