/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @fileoverview define types for Silex client and server
 */

// Publication API
export interface PublicationSettings {
  connector?: ConnectorData, // Set by the postMessage from the login callback page
  options?: ConnectorOptions, // Options for the publication connector saved with the site
}

export interface WebsiteFile {
  html: string,
  css: string,
  htmlPath: string,
  cssPath: string,
}

export class ApiError extends Error {
  constructor(message: string, public readonly httpStatusCode: number) {
    super(message)
    console.info('API error', httpStatusCode, message)
  }
}

// **
// HTTP API types
export type ApiResponseError = { message: string }
export type ApiPublicationPublishBody = WebsiteData // this contains the connectorId
export type ApiPublicationPublishQuery = { websiteId: WebsiteId, hostingId: ConnectorId, storageId: ConnectorId, options: ConnectorOptions}
export type ApiPublicationPublishResponse = { url: string, job: PublicationJobData }
export type ApiPublicationStatusQuery = { jobId: JobId }
export type ApiPublicationStatusResponse = PublicationJobData
export type ApiWebsiteReadQuery = { websiteId: WebsiteId, connectorId?: ConnectorId }
export type ApiWebsiteReadResponse = WebsiteData
export type ApiWebsiteListQuery = { connectorId?: ConnectorId }
export type ApiWebsiteListResponse = WebsiteMeta[]
export type ApiWebsiteWriteQuery = { websiteId: WebsiteId, connectorId?: ConnectorId }
export type ApiWebsiteWriteBody = WebsiteData
export type ApiWebsiteWriteResponse = { message: string }
export type ApiWebsiteCreateQuery = { connectorId?: ConnectorId }
export type ApiWebsiteCreateBody = WebsiteMetaFileContent
export type ApiWebsiteCreateResponse = { message: string }
export type ApiWebsiteDeleteQuery = { websiteId: WebsiteId, connectorId?: ConnectorId }
export type ApiWebsiteDuplicateQuery = { websiteId: WebsiteId, connectorId?: ConnectorId }
export type ApiWebsiteMetaReadQuery = { websiteId: WebsiteId, connectorId?: ConnectorId }
export type ApiWebsiteMetaReadResponse = WebsiteMeta
export type ApiWebsiteMetaWriteQuery = { websiteId: WebsiteId, connectorId?: ConnectorId }
export type ApiWebsiteMetaWriteBody = WebsiteMetaFileContent
export type ApiWebsiteMetaWriteResponse = { message: string }
export type ApiWebsiteAssetsReadQuery = { websiteId: WebsiteId, connectorId?: ConnectorId }
export type ApiWebsiteAssetsReadParams = { path: string }
export type ApiWebsiteAssetsReadResponse = string
export type ApiWebsiteAssetsWriteQuery = { websiteId: WebsiteId, connectorId?: ConnectorId }
export type ApiWebsiteAssetsWriteBody = ClientSideFile[]
export type ApiWebsiteAssetsWriteResponse = { data: string[] }
export type ApiConnectorListQuery = { type: ConnectorType }
export type ApiConnectorListResponse = ConnectorData[]
export type ApiConnectorLoginQuery = { connectorId: ConnectorId, type: ConnectorType }
export type ApiConnectorLoggedInPostMessage = { type: string, error: boolean, message: string, connectorId: ConnectorId, options: ConnectorOptions }
export type ApiConnectorLoginCbkQuery = { connectorId?: ConnectorId, type: ConnectorType, error?: string } // May have any other query params from oauth
export type ApiConnectorLoginCbkBody = object // Body from basic auth, POST only, contains options and token
export type ApiConnectorSettingsQuery = { connectorId?: ConnectorId, type: ConnectorType }
export type ApiConnectorSettingsResponse = string // HTML
export type ApiConnectorSettingsPostQuery = { connectorId?: ConnectorId, type: ConnectorType }
export type ApiConnectorSettingsPostBody = ConnectorUserSettings
export type ApiConnectorSettingsPostResponse = { message: string }
export type ApiConnectorLogoutQuery = { connectorId?: ConnectorId, type: ConnectorType }
export type ApiConnectorUserQuery = { connectorId?: ConnectorId, type: ConnectorType }
export type ApiConnectorUserResponse = ConnectorUser

// **
// Website API
export const defaultWebsiteData: WebsiteData = {
  //pages: [],
  //assets: [],
  //styles: [],
  //settings: {},
  //fonts: [],
  //symbols: [],
  //publication: {},
} as WebsiteData


// **
// Grapesjs types
// From grapesjs, not imported because it breaks the build on the server side
export interface Component {
  type: string,
  content?: string,
  attributes: { [key: string]: string },
  components: Component[],
}

export interface Page {
  id: string,
  name: string,
  slug: string,
  settings: WebsiteSettings, // TODO: why is this here? It is used in the publication manager
  frames: {
    component: Component,
  }[]
}

export interface WebsiteData {
  pages: Page[],
  assets: Asset[],
  styles: Style[],
  //name: string,
  settings: WebsiteSettings,
  fonts: Font[],
  symbols: symbol[],
  publication: PublicationSettings,
}

export interface PublicationData extends WebsiteData {
  files?: ClientSideFile[], // Added by the client for publish
}

export interface WebsiteSettings {
  description?: string,
  title?: string,
  lang?: string,
  head?: string,
  favicon?: string,
  'og:title'?: string,
  'og:description'?: string,
  'og:image'?: string,
}

export interface Font {
  name: string,
  value: string,
  variants: string[],
}

//export interface Frame {
//  component: { type: string, stylable: string[] },
//  components: Component[],
//}
//
//export interface Component {
//  type: string,
//  content?: string,
//  attributes: { [key: string]: string },
//  conponents: Component[],
//}

export enum Unit {
  PX = 'px',
}

export interface Asset {
  type: string,
  src: string,
  unitDim: Unit,
  height: number,
  width: number,
  name: string,
  path?: string, // Set by the publication renderer, this is the path in the hosting storage after publication
}

export interface Style {
  selectors: Selector[],
  style: { [key: string]: string },
}

export type Selector = string | {
  name: string,
  type: number,
}

// **
// Connector API
/**
 * Type for a connector id
 */
export type ConnectorId = string

export type ConnectorOptions = {
  websiteUrl?: string, // For publication UI
  [key: string]: any,
}

export enum ClientSideFileType {
  HTML = 'html',
  ASSET = 'asset',
  CSS = 'css',
  OTHER = 'other',
}

export enum Initiator {
  HTML = 'html',
  CSS = 'css',
}

/**
 * Type for a client side file when the content is not available, used to handle file names and paths and urls
 */
export interface ClientSideFileWithPermalink {
  path: string, // Path in the connector
  permalink?: string, // Defaults to path, this the path where the file is served, it is used to link to the file
  type: ClientSideFileType,
}

/**
 * Type for a client side file when the content is available as a string
 */
export interface ClientSideFileWithContent extends ClientSideFileWithPermalink {
  content: string, // Not buffer because it's sent from the client in JSON
}

/**
 * Type for a client side file when the content is in the connector
 */
export interface ClientSideFileWithSrc extends ClientSideFileWithPermalink {
  src: string, // Where to download the file, a path for the storage connector
}

/**
 * Type for a client side file
 * @see connector/File
 */
export type ClientSideFile = ClientSideFileWithContent | ClientSideFileWithSrc

/**
 * Type for file listing
 */
export interface FileMeta {
  name: string
  isDir: boolean
  size: number
  createdAt: Date
  updatedAt: Date
  metadata?: object
}

/**
 * Enum to express if the connector is a storage or a hosting
 */
export enum ConnectorType {
  STORAGE = 'STORAGE',
  HOSTING = 'HOSTING',
}

/**
 * Type for a website id
 */
export type WebsiteId = string

/**
 * Back end data shared with the front end
 */
export interface ConnectorData {
  connectorId: ConnectorId
  type: ConnectorType
  displayName: string
  icon: string
  disableLogout: boolean
  isLoggedIn: boolean
  oauthUrl: string | null
  color: string
  background: string
}

/**
 * User settings for a connector and for a given website
 */
export type ConnectorUserSettings = {
  [websiteId: string]: object
}

/**
 * Back end data shared with the front end
 */
export interface ConnectorUser {
  name: string
  email?: string
  picture?: string
  storage: ConnectorData
}

export interface WebsiteMetaFileContent {
  name: string
  imageUrl?: string
  connectorUserSettings: ConnectorUserSettings
}

/**
 * Back end data sent to the front end
 * Meta data can be the root path of the websites, or the bucket name, etc.
 */
export interface WebsiteMeta extends WebsiteMetaFileContent {
  websiteId: WebsiteId
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Enum to express if the job is in progress or finished or errored
 */
export enum JobStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

/**
 * Id used to track the progress of a publication
 */
export type JobId = string

/**
 * Data structure which is sent to the client to display the progress of a job
 */
export interface JobData {
  jobId: JobId // The job id
  status: JobStatus // status code
  message: string // status to display
  _timeout?: ReturnType<typeof setTimeout> // Internal use
}

export interface PublicationJobData extends JobData {
  logs: string[][]
  errors: string[][]
  startTime?: number
  endTime?: number
}
