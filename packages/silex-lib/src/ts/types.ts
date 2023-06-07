/**
 * @fileoverview define types for Silex client and server
 */

export const WEBSITE_CONTEXT_RUNTIME_CLASS_NAME = 'silex-runtime'
export const WEBSITE_CONTEXT_EDITOR_CLASS_NAME = 'silex-editor'

// Note: paths begin and end **without** slash
export const defaultSettings: PublicationSettings = {
  path: 'publication',
  url: '',
  autoHomePage: true,
  assets: { path: 'assets', url: '/assets' },
  html: { path: '' },
  css: { path: 'css', url: '/css' },
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
  publication: defaultSettings,
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
  publication: PublicationSettings,
}

export interface Font {
  name: string,
  value: string,
  variants: string[],
}
export interface PublicationSettings {
  path?: string, // Folder to publish to
  url?: string, // URL to display where the website is published to
  autoHomePage?: boolean, // Name the first page `index` instead of its name
  assets?: {
    path?: string, // Folder to copy assets to
    url?: string, // URL where assets are accessed
  },
  html?: {
    path?: string, // Folder where to generate the HTML pages
    ext?: string, // File extension for HTML pages
  },
  css?: {
    path?: string, // Folder where to generate the CSS files
    url?: string, // URL of the Folder where the CSS files are accessed
    ext?: string, // File extension for CSS files
  },
}

export interface File {
  html: string,
  css: string,
  htmlPath: string,
  cssPath: string,
}

export interface Page {
  name?: string,
  id: string,
  type?: string,
  frames: Frame[],
  settings?: WebsiteSettings,
  cssExt?: string,
  htmlExt?: string,
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

