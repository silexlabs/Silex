/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

import { CrudState } from '../store/crud-store'
import { CssRule } from '../site-store/types'

/**
 * Elements
 * @see components.element
 */
export type ElementId = string

export enum ElementType {
  CONTAINER = 'container-element',
  SECTION = 'section-element',
  IMAGE = 'image-element',
  TEXT = 'text-element',
  HTML = 'html-element',
}

export interface Size {width: number, height: number}
export interface Point {top: number, left: number}
export interface ElementRect {
  width: string, height: string, left: string, top: string,
}
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
// move elements in the dom
export enum DomDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
}
export type StyleObject = {
  mobile: CssRule,
  desktop: CssRule,
}

// Type with all the properties but the symbol used to compare them in the store
// Use fromElementData to make it an ElementState
export interface ElementData {
  pageNames: string[],
  classList: string[],
  type: ElementType,
  link?: Link,
  id: ElementId,
  children: ElementId[],
  selected: boolean,
  enableEdit: boolean,
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
  style: StyleObject,
  data: {
    component: ComponentData,
  },
  innerHtml: string,
}

// Type as stored in the store
export interface ElementState extends CrudState {
  pageNames: string[],
  classList: string[],
  type: ElementType,
  link?: Link,
  id: ElementId,
  children: ElementId[],
  selected: boolean,
  enableEdit: boolean,
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
  style: StyleObject,
  data: {
    component: ComponentData,
  },
  innerHtml: string,
}

/**
 * Links
 * @see LinkDialog
 */
export interface LinkData {
  href?: string
  target?: string
  title?: string
  rel?: string
  type?: string
  download?: string
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

/**
 * Components
 * @see client.element.component
 */
export interface ComponentData {
  name: string
  displayName?: string
  templateName: string
  data: any
}

export interface ProdotypeDependency {
  [key: string]: string,
}

export interface ProdotypeDependencyTagAttr {
  [key: string]: string,
}
