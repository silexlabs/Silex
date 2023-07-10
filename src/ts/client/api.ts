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

import { API_CONNECTOR_LIST, API_CONNECTOR_USER, API_CONNECTOR_LOGOUT, API_CONNECTOR_PATH, API_PATH, API_PUBLICATION_PATH, API_PUBLICATION_PUBLISH, API_PUBLICATION_STATUS, API_WEBSITE_ASSETS_READ, API_WEBSITE_ASSETS_WRITE, API_WEBSITE_DELETE, API_WEBSITE_LIST, API_WEBSITE_PATH, API_WEBSITE_READ, API_WEBSITE_WRITE, API_WEBSITE_META_READ, API_WEBSITE_META_WRITE, API_WEBSITE_CREATE } from '../constants'
import { ApiPublicationPublishBody, ApiPublicationPublishQuery, ApiPublicationPublishResponse, ApiPublicationStatusQuery, ApiPublicationStatusResponse, ConnectorId, JobData, JobId, PublicationJobData, WebsiteId, ApiConnectorListResponse, ApiConnectorListQuery, ConnectorData, ConnectorType, ApiWebsiteReadQuery, ApiWebsiteReadResponse, WebsiteData, ApiWebsiteWriteQuery, ApiWebsiteWriteBody, ApiWebsiteWriteResponse, ApiWebsiteDeleteQuery, ApiWebsiteAssetsReadQuery, ApiWebsiteAssetsReadResponse, ApiWebsiteAssetsWriteQuery, ApiWebsiteAssetsWriteBody, ApiWebsiteAssetsWriteResponse, ClientSideFile, PublicationData, ApiConnectorUserResponse, ConnectorUser, WebsiteMeta, ApiConnectorLogoutQuery, ApiConnectorUserQuery, ApiWebsiteListResponse, ApiWebsiteListQuery, WebsiteMetaFileContent, ApiWebsiteCreateQuery, ApiWebsiteCreateBody, ApiWebsiteCreateResponse, ApiWebsiteMetaWriteQuery, ApiWebsiteMetaWriteBody, ApiWebsiteMetaWriteResponse, ApiWebsiteMetaReadQuery, ApiWebsiteMetaReadResponse } from '../types'

export enum ApiRoute {
  PUBLICATION_PUBLISH = API_PATH + API_PUBLICATION_PATH + API_PUBLICATION_PUBLISH,
  PUBLICATION_STATUS = API_PATH + API_PUBLICATION_PATH + API_PUBLICATION_STATUS,
  CONNECTOR_USER = API_PATH + API_CONNECTOR_PATH + API_CONNECTOR_USER,
  CONNECTOR_LOGOUT = API_PATH + API_CONNECTOR_PATH + API_CONNECTOR_LOGOUT,
  CONNECTOR_LIST = API_PATH + API_CONNECTOR_PATH + API_CONNECTOR_LIST,
  WEBSITE_READ = API_PATH + API_WEBSITE_PATH + API_WEBSITE_READ,
  WEBSITE_WRITE = API_PATH + API_WEBSITE_PATH + API_WEBSITE_WRITE,
  WEBSITE_DELETE = API_PATH + API_WEBSITE_PATH + API_WEBSITE_DELETE,
  WEBSITE_CREATE = API_PATH + API_WEBSITE_PATH + API_WEBSITE_CREATE,
  WEBSITE_LIST = API_PATH + API_WEBSITE_PATH + API_WEBSITE_LIST,
  WEBSITE_ASSETS_READ = API_PATH + API_WEBSITE_PATH + API_WEBSITE_ASSETS_READ,
  WEBSITE_ASSETS_WRITE = API_PATH + API_WEBSITE_PATH + API_WEBSITE_ASSETS_WRITE,
  WEBSITE_META_READ = API_PATH + API_WEBSITE_PATH + API_WEBSITE_META_READ,
  WEBSITE_META_WRITE = API_PATH + API_WEBSITE_PATH + API_WEBSITE_META_WRITE,
}

export class ApiError extends Error {
  constructor(message: string, public readonly code: number) {
    super(message)
    console.error({ message, code })
  }
}

const ROOT_URL = window.location.origin

export async function getUser({type, connectorId}: {type: ConnectorType, connectorId?: ConnectorId}): Promise<ConnectorUser> {
  return api<ApiConnectorUserQuery, null, ApiConnectorUserResponse>(ApiRoute.CONNECTOR_USER, 'GET', {
    type,
    connectorId,
  }) as Promise<ConnectorUser>
}

export async function logout({type, connectorId}: {type: ConnectorType, connectorId?: ConnectorId}): Promise<void> {
  return api<ApiConnectorLogoutQuery, null, null>(ApiRoute.CONNECTOR_LOGOUT, 'POST', { connectorId, type })
}

export async function publish({websiteId, hostingId, storageId, data}: {websiteId: WebsiteId, hostingId: ConnectorId, storageId: ConnectorId, data: PublicationData}): Promise<[url: string, job: PublicationJobData]> {
  const { url, job } = await api<ApiPublicationPublishQuery, ApiPublicationPublishBody, ApiPublicationPublishResponse>(
    ApiRoute.PUBLICATION_PUBLISH,
    'POST',
    { websiteId, hostingId, storageId },
    data
  ) as ApiPublicationPublishResponse
  return [url, job]
}

export async function publicationStatus({jobId}: {jobId: JobId}): Promise<PublicationJobData> {
  return api<ApiPublicationStatusQuery, null, ApiPublicationStatusResponse>(
    ApiRoute.PUBLICATION_STATUS,
    'GET',
    { jobId },
  ) as Promise<PublicationJobData>
}

export async function connectorList({type}: {type: ConnectorType}): Promise<ConnectorData[]> {
  const list = await api<ApiConnectorListQuery, null, ApiConnectorListResponse>(ApiRoute.CONNECTOR_LIST, 'GET', { type })
  return list as ConnectorData[]
}

export async function websiteList({connectorId}: {connectorId?: ConnectorId}): Promise<WebsiteMeta[]> {
  return api<ApiWebsiteListQuery, null, ApiWebsiteListResponse>(ApiRoute.WEBSITE_LIST, 'GET', { connectorId }) as Promise<WebsiteMeta[]>
}

export async function websiteLoad({websiteId, connectorId}: {websiteId: WebsiteId, connectorId?: ConnectorId}): Promise<WebsiteData> {
  return api<ApiWebsiteReadQuery, null, ApiWebsiteReadResponse>(ApiRoute.WEBSITE_READ, 'GET', { websiteId, connectorId: connectorId }) as Promise<WebsiteData>
}

export async function websiteSave({websiteId, data, connectorId}: {websiteId: WebsiteId, data: WebsiteData, connectorId?: ConnectorId}): Promise<void> {
  const { message } = await api<ApiWebsiteWriteQuery, ApiWebsiteWriteBody, ApiWebsiteWriteResponse>(ApiRoute.WEBSITE_WRITE, 'POST', { websiteId, connectorId: connectorId }, data)
}

export async function websiteDelete({websiteId, connectorId}: {websiteId: WebsiteId, connectorId?: ConnectorId}): Promise<void> {
  await api<ApiWebsiteDeleteQuery, null, null>(ApiRoute.WEBSITE_DELETE, 'DELETE', { websiteId, connectorId: connectorId })
}

export async function websiteCreate({websiteId, data, connectorId}: {websiteId: WebsiteId, data: WebsiteMetaFileContent, connectorId?: ConnectorId}): Promise<void> {
  await api<ApiWebsiteCreateQuery, ApiWebsiteCreateBody, ApiWebsiteCreateResponse>(ApiRoute.WEBSITE_CREATE, 'PUT', { connectorId: connectorId }, data)
}

export async function websiteMetaWrite({websiteId, data, connectorId}: {websiteId: WebsiteId, data: WebsiteMetaFileContent, connectorId?: ConnectorId}): Promise<void> {
  await api<ApiWebsiteMetaWriteQuery, ApiWebsiteMetaWriteBody, ApiWebsiteMetaWriteResponse>(ApiRoute.WEBSITE_META_WRITE, 'POST', { websiteId, connectorId: connectorId }, data)
}

export async function websiteMetaRead({websiteId, connectorId}: {websiteId: WebsiteId, connectorId?: ConnectorId}): Promise<void> {
  await api<ApiWebsiteMetaReadQuery, null, ApiWebsiteMetaReadResponse>(ApiRoute.WEBSITE_META_WRITE, 'PUT', { websiteId, connectorId: connectorId })
}

export async function websiteAssetsLoad({path, websiteId, connectorId}: {path: string, websiteId: WebsiteId, connectorId: ConnectorId}): Promise<string> {
  return api<ApiWebsiteAssetsReadQuery, null, ApiWebsiteAssetsReadResponse>(`${ApiRoute.WEBSITE_ASSETS_READ}/${path}`, 'GET', { websiteId, connectorId: connectorId })
}

export async function websiteAssetsSave({websiteId, connectorId, files}: {websiteId: WebsiteId, connectorId: ConnectorId, files: ClientSideFile[]}): Promise<string[]> {
  const { data } = await api<ApiWebsiteAssetsWriteQuery, ApiWebsiteAssetsWriteBody, ApiWebsiteAssetsWriteResponse>(ApiRoute.WEBSITE_ASSETS_WRITE, 'POST', { websiteId, connectorId: connectorId }, files)
  return data
}

export async function api<ReqQuery, ReqBody, ResBody>(route: ApiRoute | string, method: string, query?: ReqQuery, payload?: ReqBody): Promise<ResBody> {
  const url = `${ROOT_URL}/${route.toString()}?${new URLSearchParams(Object.entries(query).filter(([key, value]) => typeof value != 'undefined')).toString()}`
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload && JSON.stringify(payload), // assuming that the payload needs to be stringified
    credentials: 'include', // sends the cookies with the request
  })

  if (!response.ok) {
    console.error('There was a problem calling the API', response)
    const json = await response.json()
    throw new ApiError(json.message, response.status)
  }

  return response.json()
}
