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
 * @fileoverview Constants and types shared between front and back
 *
 */

// whole data model

export interface DataModel {
  site: SiteData,
  elements: ElementData[],
  pages: PageData[],
}

// Element data
export type ElementId = string

export enum ElementType {
  CONTAINER = 'container-element',
  SECTION = 'section-element',
  IMAGE = 'image-element',
  TEXT = 'text-element',
  HTML = 'html-element',
  COMPONENT = 'component-element',
}

export enum LinkType {
  PAGE = 'LinkTypePage',
  URL= 'LinkTypeExternal',
  // TODO: ANCHOR, EMAIL...
}

export interface Link {
  type: LinkType,
  value: string,
}

interface Rect<T> {
  top: T,
  left: T,
  right: T,
  bottom: T,
}

export interface ElementData {
  pageNames: string[],
  classList: string[],
  type: ElementType,
  link?: Link,
  id: ElementId,
  children: ElementId[],
  selected: boolean,
  enableDrag: boolean,
  enableDrop: boolean,
  enableResize: Rect<boolean>,
  useMinHeight: boolean,
  isSectionContent: boolean,
  title: string,
  alt: string,
  visibility: {
    mobile: boolean,
    desktop: boolean,
  },
  style: {
    mobile: CssRule,
    desktop: CssRule,
  },
  data: {
    component: ComponentData,
  },
  innerHtml: string,
}

// page data

export interface PageData {
  id: string,
  displayName: string,
  link: Link,
  isOpen: boolean,
  canDelete: boolean,
  canProperties: boolean,
  canMove: boolean,
  canRename: boolean,
}

// site data

export interface DataSource {
  href: string;
  root: string;
  data?: object;
  structure?: object;
}

export interface DataSources { [key: string]: DataSource; }

export interface Font {
  family: string;
  href: string;
}

export interface SiteData {
  headTag: string,
  headStyle: string,
  headScript: string,
  title: string,
  description: string,
  enableMobile: boolean,
  publicationPath: FileInfo,
  websiteUrl: string,
  faviconPath: string,
  thumbnailSocialPath: string,
  descriptionSocial: string,
  titleSocial: string,
  lang: string,
  width: number,
  hostingProvider: string,
  twitterSocial: string,
  dataSources: DataSources,
  fonts: Font[],
  style: StyleDataObject,
}

export interface UiData {
  mobileEditor: boolean,
  loading: boolean,
}

// FIXME: choose between path and folder + name, remove absPath
export interface FileInfo {
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

// Styles

export type StyleName = string;

export interface CssRule {
  [key: string]: CssPropertyValue;
}

export interface StyleDataObject {
  [key: string]: StyleData;
}

export interface StyleData {
  className: StyleName;
  displayName: string;
  templateName: TemplateName;
  styles: {[key: string]: VisibilityData};
}

export interface VisibilityData {
  [key: string]: PseudoClassData;
}

export interface PseudoClassData {
  [key: string]: CssRule|TemplateName|StyleName;
}

export type Visibility = string;

export type PseudoClass = string;

export type TagName = string;

export type CssPropertyName = string;

export type CssPropertyValue = string;

export type TemplateName = string;

// Components

export interface ComponentData {
  name: string;
  displayName?: string;
  templateName: TemplateName;
  data: any;
}
