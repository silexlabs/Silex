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

export type ElementId = string

export enum ElementType {
  CONTAINER = 'container-element',
  SECTION = 'section-element',
  IMAGE = 'image-element',
  TEXT = 'text-element',
  HTML = 'html-element',
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
  parent: ElementId,
  enableDrag: boolean,
  enableDrop: boolean,
  enableResize: Rect<boolean>,
  useMinHeight: boolean,
  title: string,
  alt: string,
  visibility: {
    mobile: boolean,
    desktop: boolean,
  },
  style: {
    mobile: any,
    desktop: any,
  },
  data: {
    component: any,
  },
}

/**
 * structure to store all of a page data
 */
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

/**
 * site data
 */
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
}

export interface UiData {
  mobileEditor: boolean,
  loading: boolean,
  loadingSite: boolean,
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
