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

import { CrudState } from '../flux/crud-store'

/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

export type ElementId = string

export enum ElementType {
  CONTAINER = 'container-element',
  SECTION = 'section-element',
  IMAGE = 'image-element',
  TEXT = 'text-element',
  HTML = 'html-element',
  COMPONENT = 'component-element',
}

export interface Size {width: number, height: number}
export interface Point {top: number, left: number}
export interface Rect<T> {
  top: T,
  left: T,
  right: T,
  bottom: T,
}
export interface FullBox<T=number> extends Rect<T> {
  width: T,
  height: T,
}

export interface ElementData extends CrudState {
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

// Links
export enum LinkType {
  PAGE = 'LinkTypePage',
  URL= 'LinkTypeExternal',
  // TODO: ANCHOR, EMAIL...
}

export interface Link {
  type: LinkType,
  value: string,
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
