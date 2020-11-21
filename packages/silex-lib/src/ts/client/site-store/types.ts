/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

import { ProdotypeDependency } from '../element-store/types'
import { FileInfo } from '../io/CloudStorage'

export interface SiteState {
  headUser: string,
  headStyle: string,
  headScript: string,
  title: string,
  description: string,
  enableMobile: boolean,
  isTemplate: boolean,
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
  styles: StyleDataObject,
  file: FileInfo, // file holds the URL, service and unifile/CE info of the site currently opened
  prodotypeDependencies: ProdotypeDependency,
  data: SiteMeta,
}

/**
 * data sources of the data source manager (settings)
 */
export interface DataSource {
  href: string
  root: string
  data?: object
  structure?: object
}

/**
 * Site meta data, used by parent app to customize Silex
 */
interface SiteMeta { [key: string]: any}

export interface DataSources { [key: string]: DataSource }

/**
 * fonts of the font manager (settings)
 */
export interface Font {
  family: string
  href: string
}

// TODO: move these to the server side?
export interface PublicationOptions {
  file: FileInfo
  publicationPath: FileInfo
  provider: Provider
}

export interface Hosting {
  providers: Provider[]
  skipHostingSelection: boolean
}

export interface Provider {
  name: string,
  displayName: string,
  isLoggedIn: boolean,
  authorizeUrl: string,
  dashboardUrl: string,
  pleaseCreateAVhost: string,
  vhostsUrl: string,
  buyDomainUrl: string,
  skipVhostSelection: boolean,
  skipFolderSelection: boolean,
  afterPublishMessage: string,
}

export interface VHost {
  name: string,
  domainUrl: string,
  skipDomainSelection: boolean,
  publicationPath: FileInfo,
  url: string,
}

/**
 * styles of the style manager
 * @see components.StyleEditorPane
 */
export interface StyleDataObject {
  [key: string]: StyleData
}

export type StyleName = string

export interface CssRule {
  [key: string]: CssPropertyValue
}

export interface StyleData {
  className: StyleName
  displayName: string
  templateName: string
  styles: {[key: string]: VisibilityData}
}

export interface VisibilityData {
  [key: string]: PseudoClassData
}

export interface PseudoClassData {
  [key: string]: CssRule|string|StyleName
}

export interface CSSRuleInfo {
  rule: CSSRule
  parent: CSSRule|StyleSheet
  index: number
}

export type Visibility = string

export type PseudoClass = string

export type TagName = string

export type CssPropertyName = string

export type CssPropertyValue = string
