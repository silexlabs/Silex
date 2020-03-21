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
 * FIXME: remove old MVC types, split to packages: element, page, site, ui
 *
 */
import { BreadCrumbs } from './ui/BreadCrumbs';
import { ContextMenu } from './ui/ContextMenu';
import { CssEditor } from './ui/dialog/CssEditor';
import { Dashboard } from './ui/dialog/Dashboard';
import { FileExplorer } from './ui/dialog/FileExplorer';
import { HtmlEditor } from './ui/dialog/HtmlEditor';
import { JsEditor } from './ui/dialog/JsEditor';
import { SettingsDialog } from './ui/dialog/SettingsDialog';
import { Menu } from './ui/Menu';
import { PageTool } from './ui/PageTool';
import { PropertyTool } from './ui/PropertyTool';
import { Splitter } from './ui/Splitter';
import { StageWrapper } from './ui/StageWrapper';
import { TextFormatBar } from './ui/TextFormatBar';
import { Workspace } from './ui/Workspace';
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
import { Provider, DataModel } from '../types';
import { FileInfo } from './third-party/types';
import { PageData } from './page/types';

// FIXME: this file should not exist

/**
 * direction in the dom
 */
export class DomDirection {
  static UP = 'UP';
  static DOWN = 'DOWN';
  static TOP = 'TOP';
  static BOTTOM = 'BOTTOM';
}

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
export interface PublicationOptions {
  file: FileInfo;
  publicationPath: FileInfo;
  provider: Provider;
}
export interface UndoItem {
  data: DataModel;
  page: PageData;
  html: string;
  scrollX: number;
  scrollY: number;
}

/**
 * @struct
 */
export interface Model {
  file: File;
  head: Head;
  body: Body;
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
