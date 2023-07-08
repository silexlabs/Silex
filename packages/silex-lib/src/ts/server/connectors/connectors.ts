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
import { JobStatus, JobData, ConnectorData, ConnectorId, WebsiteId, ApiConnectorListResponse, ApiConnectorListQuery, ApiError, ApiConnectorLoginQuery, ApiConnectorLoggedInPostMessage, ApiConnectorLogoutQuery, ConnectorType, ConnectorUser, WebsiteMeta, ApiConnectorUserQuery, ApiConnectorUserResponse, FileMeta, WebsiteMetaFileContent } from '../../types'

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
  displayName: string
  icon: string
  disableLogout?: boolean
  type: ConnectorType
  getAdminUrl(session: Session, id: WebsiteId): Promise<string | null>
  getAuthorizeURL(session: Session): Promise<string | null>
  isLoggedIn(session: Session): Promise<boolean>
  //login(session: Session, userData: any): Promise<void>
  logout(session: Session): Promise<void>
  getUserData(session: Session): Promise<ConnectorUser>
}

/**
 * Storage are used to store the website data and assets
 * And possibly rename files and directories, and get the URL of a file
 *
 */
export interface StorageConnector<Session extends ConnectorSession = ConnectorSession> extends Connector<Session> {
  listWebsites(session: Session): Promise<WebsiteMeta[]>
  createWebsite(session: Session, id: WebsiteId, data: WebsiteMetaFileContent): Promise<void>
  deleteFiles(session: Session, id: WebsiteId, paths: string[]): Promise<void>
  readWebsiteFile(session: Session, id: WebsiteId, path: string): Promise<ConnectorFile>
  writeWebsiteFiles(session: Session, id: WebsiteId, files: ConnectorFile[], status?: StatusCallback): Promise<string[]> // Returns the files paths on storage
  listWebsiteDir(session: Session, id: WebsiteId, path: string): Promise<FileMeta[]>
  createWebsiteDir(session: Session, id: WebsiteId, path: string): Promise<void> // Recursively create directory - like mkdir -p
  deleteWebsiteDir(session: Session, id: WebsiteId, path: string): Promise<void>
  getWebsiteMeta(session: Session, id: WebsiteId): Promise<WebsiteMeta>
  setWebsiteMeta(session: Session, id: WebsiteId, data: WebsiteMetaFileContent): Promise<void>
  //getFileUrl(session: Session, id: WebsiteId, path: string): Promise<string>
}

/**
 * Hosting connectors are used to publish the website
 */
export interface HostingConnector<Session extends ConnectorSession = ConnectorSession> extends Connector<Session> {
  publishWebsite(session: Session, id: WebsiteId, files: ConnectorFile[]): Promise<JobData>
  getWebsiteUrl(session: Session, id: WebsiteId): Promise<string>
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
  const connectors = config.getConnectors<T>(type)
  // Find the connector by id
  if (connectorId) return connectors.find(s => s.connectorId === connectorId && s.type === type)
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
    type: connector.type,
    displayName: connector.displayName,
    icon: connector.icon,
    disableLogout: !!connector.disableLogout,
    isLoggedIn: await connector.isLoggedIn(session),
    authUrl: await connector.getAuthorizeURL(session),
  }
}

export async function contentToString(content: ConnectorFileContent): Promise<string> {
  if (typeof content === 'string') return content
  if (Buffer.isBuffer(content)) return content.toString('utf8')
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
