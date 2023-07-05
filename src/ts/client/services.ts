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

import { API_BACKEND_LIST, API_BACKEND_LOGIN_STATUS, API_BACKEND_LOGOUT, API_PUBLICATION_PUBLISH, API_PUBLICATION_STATUS, API_WEBSITE_ASSETS_READ, API_WEBSITE_ASSETS_WRITE, API_WEBSITE_DELETE, API_WEBSITE_LIST, API_WEBSITE_READ, API_WEBSITE_WRITE } from '../constants'
import { ApiPublicationPublishRequestBody, ApiPublicationPublishRequestQuery, ApiPublicationPublishResponse, ApiPublicationStatusRequestQuery, ApiPublicationStatusResponse, BackendId, JobData, JobId, PublicationJobData, WebsiteId, ApiBackendListResponse, ApiBackendListRequestQuery, BackendData, BackendType, ApiWebsiteReadRequestQuery, ApiWebsiteReadResponse, WebsiteData, ApiWebsiteWriteRequestQuery, ApiWebsiteWriteRequestBody, ApiWebsiteWriteResponse, ApiWebsiteDeleteRequestQuery, ApiWebsiteAssetsReadRequestQuery, ApiWebsiteAssetsReadResponse, ApiWebsiteAssetsWriteRequestQuery, ApiWebsiteAssetsWriteRequestBody, ApiWebsiteAssetsWriteResponse, ClientSideFile, PublicationData, ApiBackendLoginStatusRequestQuery, ApiBackendLoginStatusResponse, BackendUser, WebsiteMeta, ApiBackendLogoutRequestQuery } from '../types'

export enum ApiRoute {
  PUBLICATION_PUBLISH = API_PUBLICATION_PUBLISH,
  PUBLICATION_STATUS = API_PUBLICATION_STATUS,
  BACKEND_LOGOUT = API_BACKEND_LOGOUT,
  BACKEND_LIST = API_BACKEND_LIST,
  BACKEND_LOGIN_STATUS = API_BACKEND_LOGIN_STATUS,
  WEBSITE_READ = API_WEBSITE_READ,
  WEBSITE_WRITE = API_WEBSITE_WRITE,
  WEBSITE_DELETE = API_WEBSITE_DELETE,
  WEBSITE_LIST = API_WEBSITE_LIST,
  WEBSITE_ASSETS_READ = API_WEBSITE_ASSETS_READ,
  WEBSITE_ASSETS_WRITE = API_WEBSITE_ASSETS_WRITE,
}

export interface LoginStatus {
  backend: BackendData,
  user: BackendUser,
  websiteMeta?: WebsiteMeta,
}

export class ApiError extends Error {
  constructor(message: string, public readonly code: number) {
    super(message)
    console.error({ message, code })
  }
}

const ROOT_URL = window.location.origin

export async function loginStatus(backendId: BackendId, type: BackendType, id?: WebsiteId): Promise<LoginStatus> {
  return api<ApiBackendLoginStatusRequestQuery, null, ApiBackendLoginStatusResponse>(ApiRoute.BACKEND_LOGIN_STATUS, 'GET', {
    backendId,
    type,
    id,
  })
}

export async function logout(backendId: BackendId, type: BackendType): Promise<void> {
  return api<ApiBackendLogoutRequestQuery, null, null>(ApiRoute.BACKEND_LOGOUT, 'POST', { backendId, type })
}

export async function publish(websiteId: WebsiteId, data: PublicationData): Promise<[url: string, job: PublicationJobData]> {
  const { url, job } = await api<ApiPublicationPublishRequestQuery, ApiPublicationPublishRequestBody, ApiPublicationPublishResponse>(
    ApiRoute.PUBLICATION_PUBLISH,
    'POST',
    { id: websiteId },
    data
  )
  return [url, job]
}

export async function publicationStatus(jobId: JobId): Promise<PublicationJobData> {
  return api<ApiPublicationStatusRequestQuery, null, ApiPublicationStatusResponse>(
    ApiRoute.PUBLICATION_STATUS,
    'GET',
    { jobId },
  )
}

export async function backendList(type: BackendType): Promise<BackendData[]> {
  const list = await api<ApiBackendListRequestQuery, null, ApiBackendListResponse>(ApiRoute.BACKEND_LIST, 'GET', { type })
  return list as BackendData[]
}


export async function websiteList(backendId: BackendId): Promise<WebsiteMeta[]> {
  return api<ApiWebsiteReadRequestQuery, null, ApiWebsiteReadResponse>(ApiRoute.WEBSITE_LIST, 'GET', { backendId }) as Promise<WebsiteMeta[]>
}

export async function websiteLoad(id: WebsiteId, backendId: BackendId): Promise<WebsiteData> {
  return api<ApiWebsiteReadRequestQuery, null, ApiWebsiteReadResponse>(ApiRoute.WEBSITE_READ, 'GET', { id, backendId }) as Promise<WebsiteData>
}

export async function websiteSave(id: WebsiteId, backendId: BackendId, data: WebsiteData): Promise<void> {
  const { message } = await api<ApiWebsiteWriteRequestQuery, ApiWebsiteWriteRequestBody, ApiWebsiteWriteResponse>(ApiRoute.WEBSITE_WRITE, 'POST', { id, backendId }, data)
}

export async function websiteDelete(id: WebsiteId, backendId: BackendId): Promise<void> {
  await api<ApiWebsiteDeleteRequestQuery, null, null>(ApiRoute.WEBSITE_DELETE, 'DELETE', { id, backendId })
}

export async function websiteAssetsLoad(path: string, id: WebsiteId, backendId: BackendId): Promise<string> {
  return api<ApiWebsiteAssetsReadRequestQuery, null, ApiWebsiteAssetsReadResponse>(`${ApiRoute.WEBSITE_ASSETS_READ}/${path}`, 'GET', { id, backendId })
}

export async function websiteAssetsSave(id: WebsiteId, backendId: BackendId, files: ClientSideFile[]): Promise<string[]> {
  const { data } = await api<ApiWebsiteAssetsWriteRequestQuery, ApiWebsiteAssetsWriteRequestBody, ApiWebsiteAssetsWriteResponse>(ApiRoute.WEBSITE_ASSETS_WRITE, 'POST', { id, backendId }, files)
  return data
}

export async function api<ReqQuery, ReqBody, ResBody>(route: ApiRoute | string, method: string, query?: ReqQuery, payload?: ReqBody): Promise<ResBody> {
  const url = `${ROOT_URL}/${route.toString()}?${new URLSearchParams(Object.entries(query)).toString()}`
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload && JSON.stringify(payload), // assuming that the payload needs to be stringified
    credentials: 'include', // sends the cookies with the request
  })

  if (!response.ok) {
    const json = await response.json()
    console.error('There was a problem calling the API', response, json)
    throw new ApiError(json.message, response.status)
  }

  return response.json()
}
