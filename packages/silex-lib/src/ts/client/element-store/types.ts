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
// move elements position
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
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

/**
 * Links
 * @see LinkDialog
 */
export interface Link {
  href?: string
  linkType: LinkType
  target?: string // only valid for external links
  title?: string // only valid for external links
  rel?: string // only valid for external links
  type?: string // only valid for external links
  download?: string // only valid for external links
}

export enum LinkType {
  PAGE = 'LinkTypePage',
  URL= 'LinkTypeExternal',
  // TODO: ANCHOR, EMAIL...
}

export interface Attr {
  [name: string]: string,
}

// Type with all the properties but the symbol used to compare them in the store
// Use fromElementData to make it an ElementState
export interface ElementData {
  pageNames: string[],
  classList: string[],
  attr: Attr,
  tagName: string,
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
  attr: Attr,
  tagName: string,
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
  [tagName: string]: ProdotypeDependencyTag[],
}

export interface ProdotypeDependencyTag {
  [key: string]: string,
}
