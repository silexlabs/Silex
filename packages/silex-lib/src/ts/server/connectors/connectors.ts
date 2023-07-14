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

import { Readable } from 'stream'
import { ServerConfig } from '../config'
import { JobStatus, JobData, ConnectorData, ConnectorId, WebsiteId, ConnectorType, ConnectorUser, WebsiteMeta, WebsiteMetaFileContent, WebsiteData, ConnectorOptions } from '../../types'

/**
 * @fileoverview define types for Silex connectors
 * Bakends can provide storage for website data and assets, and/or hosting to publish the website online
 */

/**
 * Connector data stored in the website meta file
 */
export type ConnectorFileContent = string | Buffer | Readable

/**
 * Files are stored in connector as a File object
 * @see types/ClientSideFile
 * @see contentToString()
 */
export interface ConnectorFile {
  path: string,
  content: ConnectorFileContent,
}

/**
 * Callback to update the publication status
 */
export type StatusCallback = ({message, status}: {message: string, status: JobStatus}) => Promise<void>

export type ConnectorSession = object
/**
 * Connectors are the base interface for Storage and Hosting connectors
 */
export interface Connector<Session extends ConnectorSession = ConnectorSession> {
  connectorId: ConnectorId
  connectorType: ConnectorType
  displayName: string
  icon: string
  disableLogout?: boolean
  // Get the URL to start the authentication process with OAuth (not used for basic auth)
  getOAuthUrl(session: Session): Promise<string | null>
  // Get the form to display to the user to authenticate (not used for OAuth)
  getLoginForm(session: Session, redirectTo: string): Promise<string | null>
  // Get the form to display to the user to set the connector settings for a given website
  getSettingsForm(session: Session, redirectTo: string): Promise<string | null>
  // Auth and user management
  isLoggedIn(session: Session): Promise<boolean>
  setToken(session: Session, token: object): Promise<void>
  logout(session: Session): Promise<void>
  getUser(session: Session): Promise<ConnectorUser>
  // Handle website meta file
  getWebsiteMeta(session: Session, websiteId: WebsiteId): Promise<WebsiteMeta>
  setWebsiteMeta(session: Session, websiteId: WebsiteId, data: WebsiteMetaFileContent): Promise<void>
  // Get the connector options from login form
  // They are stored in the website meta file for hosting connectors
  // And in the user session for storage connectors
  getOptions(formData: object): ConnectorOptions
}

/**
 * Storage are used to store the website data and assets
 * And possibly rename files and directories, and get the URL of a file
 *
 */
export interface StorageConnector<Session extends ConnectorSession = ConnectorSession> extends Connector<Session> {
  // CRUD on websites
  listWebsites(session: Session): Promise<WebsiteMeta[]>
  readWebsite(session: Session, websiteId: WebsiteId): Promise<WebsiteData | Readable>
  createWebsite(session: Session, data: WebsiteMetaFileContent): Promise<WebsiteId>
  updateWebsite(session: Session, websiteId: WebsiteId, data: WebsiteData): Promise<void>
  deleteWebsite(session: Session, websiteId: WebsiteId): Promise<void>
  // CRUD on assets
  writeAssets(session: Session, websiteId: WebsiteId, files: ConnectorFile[], status?: StatusCallback): Promise<void>
  readAsset(session: Session, websiteId: WebsiteId, fileName: string): Promise<ConnectorFileContent>
  deleteAssets(session: Session, websiteId: WebsiteId, fileNames: string[]): Promise<void>
  //getFileUrl(session: Session, websiteId: WebsiteId, path: string): Promise<string>
}

/**
 * Hosting connectors are used to publish the website
 */
export interface HostingConnector<Session extends ConnectorSession = ConnectorSession> extends Connector<Session> {
  publish(session: Session, websiteId: WebsiteId, files: ConnectorFile[]): Promise<JobData>
  getUrl(session: Session, websiteId: WebsiteId): Promise<string>
}

export function toConnectorEnum(type: string): ConnectorType {
  const result = ConnectorType[type.toUpperCase() as keyof typeof ConnectorType]
  if(!result) throw new Error('Unknown connector ' + type)
  return result
}

/**
 * Get a connector by id or by type
 */
export async function getConnector<T extends Connector>(config: ServerConfig, session: any, type: ConnectorType, connectorId?: ConnectorId): Promise<T | undefined> {
  // Get the connectors for this type
  const connectors = config.getConnectors(type) as T[]

  // Find the connector by id
  if (connectorId) return connectors.find(s => s.connectorId === connectorId && s.connectorType === type)
  // Find the first logged in connector
  for (const connector of connectors) {
    if (await connector.isLoggedIn(session)) {
      return connector
    }
  }
  // Defaults to the first connector
  return connectors[0]
}

/**
 * Convert a connector to a ConnectorData object to be sent to the frontend
 */
export async function toConnectorData(session: any, connector: Connector): Promise<ConnectorData> {
  return {
    connectorId: connector.connectorId,
    type: connector.connectorType,
    displayName: connector.displayName,
    icon: connector.icon,
    disableLogout: !!connector.disableLogout,
    isLoggedIn: await connector.isLoggedIn(session),
    oauthUrl: await connector.getOAuthUrl(session),
  }
}

export async function contentToString(content: ConnectorFileContent): Promise<string> {
  // String
  if (typeof content === 'string') return content
  // Buffer
  if (Buffer.isBuffer(content)) return content.toString('utf8')
  // Stream
  return new Promise((resolve, reject) => {
    let result = ''
    content.on('data', (chunk: Buffer) => {
      result += chunk.toString('utf8')
    })
    content.on('error', (err: Error) => {
      reject(err)
    })
    content.on('end', () => {
      resolve(result)
    })
  })
}

export function contentToReadable(content: ConnectorFileContent): Readable {
  // String
  if (typeof content === 'string') return Readable.from([content])
  // Buffer
  if (Buffer.isBuffer(content)) return Readable.from([content])
  // Stream
  if (content instanceof Readable) return content
  // Unknown
  throw new Error('Unknown content type')
}
