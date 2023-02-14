/**
 * @fileoverview define types for Silex client and server
 */

export const WEBSITE_CONTEXT_RUNTIME_CLASS_NAME = 'silex-runtime'
export const WEBSITE_CONTEXT_EDITOR_CLASS_NAME = 'silex-editor'

// Note: paths begin and end **without** slash
export const defaultSettings: Settings = {
  assets: { path: 'assets' },
  html: { path: '' },
  css: { path: 'css' },
  prefix: '', // for images src: src="${settings.prefix}${settings.assets.path}/image.jpg"
}

export const defaultSite: WebsiteData = {
  pages: [],
  assets: [],
  styles: [],
  name: 'New website',
  settings: {
    description: '',
    title: '',
    head: '',
    lang: 'en',
    favicon: 'https://editor.silex.me/assets/favicon.png',
    'og:title': '',
    'og:description': '',
    'og:image': '',
  },
  fonts: [
    { name: 'Arial', value: 'Arial, Helvetica, sans-serif', variants: [] },
    { name: 'Times New Roman', value: '"Times New Roman", Times, serif', variants: [] },
  ],
  symbols: [],
}

export interface WebsiteSettings {
  description: string,
  title: string,
  lang: string,
  head: string,
  favicon: string,
  'og:title': string,
  'og:description': string,
  'og:image': string,
}

export interface WebsiteData {
  pages: Page[],
  assets: Asset[],
  styles: Style[],
  name: string,
  settings: WebsiteSettings,
  fonts: Font[],
  symbols: symbol[],
}

export interface Font {
  name: string,
  value: string,
  variants: string[],
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

export interface File {
  html: string,
  css: string,
}

export interface Page {
  name?: string,
  id: string,
  type?: string,
  frames: Frame[],
  settings?: WebsiteSettings,
}

export interface Frame {
  component: { type: string, stylable: string[] },
  components: Component[],
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

