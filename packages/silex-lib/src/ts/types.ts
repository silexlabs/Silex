/**
 * @fileoverview define types for Silex client and server
 */

export const WEBSITE_CONTEXT_RUNTIME_CLASS_NAME = 'silex-runtime'
export const WEBSITE_CONTEXT_EDITOR_CLASS_NAME = 'silex-editor'

// paths with beginning and eding **without** slash
export const defaultSettings: Settings = {
  assets: { path: 'assets' },
  html: { path: '' },
  css: { path: 'css' },
  prefix: '', // src="${settings.prefix}${settings.assets.path}/image.jpg"
}

export const defaultSite: WebsiteData = {
  pages: [],
  assets: [],
  styles: [],
}

export interface WebsiteData {
  pages: Page[],
  assets: Asset[],
  styles: Style[],
}

export interface Settings {
  assets: {
    path: string,
  },
  html: {
    path: string,
  },
  css: {
    path: string,
  },
  prefix: string,
}

export interface Page {
  name?: string,
  id: string,
  type?: string,
  frames: Frame[],
}

export interface Frame {
  component: { type: string, stylable: string[] },
  components: Component[],
  html: string,
  css: string,
}

export interface Component {
  type: string,
  content?: string,
  attributes: { [key: string]: string },
  conponents: Component[],
}

export enum Unit {
  PX = 'px',
}

export interface Asset     {
  type: string,
  src: string,
  unitDim: Unit,
  height: number,
  width: number,
  name: string,
}

export interface Style {
  selectors: Selector[],
  style: { [key: string]: string },
}

export type Selector = string | {
  name: string,
  type: number,
}

