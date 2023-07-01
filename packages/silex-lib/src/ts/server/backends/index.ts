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

import { Application, Response, Router } from 'express'
import { Readable } from 'stream'
import { ServerConfig } from '../config'
import { EVENT_STARTUP_START } from '../../events'
import { JobStatus, JobData, BackendData, BackendId, WebsiteId } from '../../types'
import { BACKEND_LIST_PATH, BACKEND_LOGIN_CALLBACK_PATH, BACKEND_LOGOUT_PATH } from '../../constants'
import { requiredParam } from '../utils/validation'

/**
 * @fileoverview define types for Silex backends
 * Bakends can provide storage for website data and assets, and/or hosting to publish the website online
 */

/**
 * Files are stored in backend as a File object
 */
export interface File {
  path: string,
  content: string | Readable,
}

/**
 * Callback to update the publication status
 */
export type StatusCallback = ({message, status}: {message: string, status: JobStatus}) => Promise<void>

export enum BackendType {
  STORAGE = 'STORAGE',
  HOSTING = 'HOSTING',
}

/**
 * Backends are the base interface for Storage and Hosting providers
 */
export interface Backend {
  id: BackendId
  displayName: string
  icon: string
  init(session: any, id: WebsiteId): Promise<void>
  getAdminUrl(session: any, id: WebsiteId): Promise<string>
  getAuthorizeURL(session: any): Promise<string>
  isLoggedIn(session: any): Promise<boolean>
  login(session: any, userData: any): Promise<void>
  logout(session: any): Promise<void>
  addAuthRoutes(router: Router): Promise<void>
  disableLogout?: boolean
}

/**
 * Storage are used to store the website data and assets
 * And possibly rename files and directories, and get the URL of a file
 * 
 */
export interface StorageProvider extends Backend {
  listWebsites(session: any): Promise<WebsiteId[]>
  readFile(session: any, id: WebsiteId, path: string): Promise<File>
  writeFiles(session: any, id: WebsiteId, files: File[], status?: StatusCallback): Promise<void>
  deleteFiles(session: any, id: WebsiteId, paths: string[]): Promise<void>
  listDir(session: any, id: WebsiteId, path: string): Promise<string[]>
  createDir(session: any, id: WebsiteId, path: string): Promise<void>
  deleteDir(session: any, id: WebsiteId, path: string): Promise<void>
  getFileUrl(session: any, id: WebsiteId, path: string): Promise<string>
}

/**
 * Hosting providers are used to publish the website
 */
export interface HostingProvider extends Backend {
  publish(session: any, id: WebsiteId, backendData: BackendData, files: File[]): Promise<JobData>
  getWebsiteUrl(session: any, id: WebsiteId): Promise<string>
}

export function toBackendEnum(type: string): BackendType {
  return BackendType[type.toUpperCase() as keyof typeof BackendType]
}

/**
 * Get a backend by id or by type
 */
export async function getBackend<T extends Backend>(config: ServerConfig, session: any, type?: BackendType, backendId?: BackendId): Promise<T | undefined> {
  const backends = config.getBackends<T>(type)
  // Find the backend by id
  if (backendId) return backends.find(s => s.id === backendId)
  // Find the first logged in backend
  for (const backend of backends) {
    if (await backend.isLoggedIn(session)) {
      return backend
    }
  }
  // Defaults to the first backend
  return backends[0]
}

/**
 * Convert a backend to a BackendData object to be sent to the frontend
 */
export async function toBackendData(session: any, backend: Backend): Promise<BackendData> {
  return {
    backendId: backend.id,
    displayName: backend.displayName,
    icon: backend.icon,
    disableLogout: !!backend.disableLogout,
    url: await backend.getAuthorizeURL(session),
    isLoggedIn: await backend.isLoggedIn(session),
  }
}

/**
 * Add routes to the express app
 */
export function addRoutes(app: Application) {
  // Create the router
  const router = Router()
  app.use(router)

  // List backends route
  router.get(`/${BACKEND_LIST_PATH}`, routeListBackends)

  // Logout route
  router.post(`/${BACKEND_LOGOUT_PATH}`, routeLogout)

  // Login success route
  // Post a message to the opener window with the data from the backend in the query string
  router.get(`/${BACKEND_LOGIN_CALLBACK_PATH}`, routeLoginSuccess)
}

/**
 * Express route to list the backends
 */
export async function routeListBackends(req, res) {
  try {
    const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
    const type = req.query.type as BackendType | null
    const backends = config.getBackends<Backend>(type)
    console.log('List backends', type, backends)
    try {
      const list = await Promise.all(backends.map(async backend => toBackendData(req['session'], backend)))
      res.json(list)
    } catch (error) {
      console.error('Error while listing backends', error)
      res.status(error?.code ?? 500).json({
        error: true,
        message: 'Error while listing backends: ' + error.message,
      })
    }
  } catch (error) {
    console.error('Error in the list backends request', error)
    res.status(error?.code ?? 400).json({
      error: true,
      message: 'Error in the list backends request: ' + error.message,
    })
  }
}

/**
 * Utility function to send an HTML page to the browser
 * This page will send a postMessage to the parent window and close itself
 */
function sendHtml(res: Response, message: string, backendData?: BackendData, error?: Error, defaultErrorCode?: number) {
  error && console.error('Error while logging in', error)
  // Data for postMessage
  const data = {
    type: 'login', // For postMessage
    error: error ? true : false,
    message,
    backendData,
  }
  // HTTP status code
  const status = error ? error['code'] ?? defaultErrorCode ?? 500 : 200
  // Send the HTML
  res.status(status).send(`
        <html>
          <head>
            <script>
              window.opener.postMessage(${JSON.stringify(data)}, '*')
              window.close()
            </script>
          </head>
          <body>
            <p>${message}</p>
            <p>Close this window</p>
          </body>
        </html>
      `)
}

/**
 * Express route to serve as redirect after a successful login
 * The returned HTML will postMessage data and close the popup window
 */
export async function routeLoginSuccess(req, res) {
  try {
    const backendId = requiredParam(req.query.backendId, 'Backend id')
    const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
    const backend = await getBackend<Backend>(config, req['session'], undefined, backendId)
    if (!backend) throw new Error('Backend not found ' + backendId)
    try {
      sendHtml(res, 'Logged in', {
        backendId: backend.id,
        displayName: backend.displayName,
        icon: backend.icon,
        disableLogout: !!backend.disableLogout,
        url: await backend.getAuthorizeURL(req['session']),
        isLoggedIn: true,
      } as BackendData)
    } catch (error) {
      sendHtml(res, 'Error while logging in', undefined, error, 500)
    }
  } catch (error) {
    sendHtml(res, 'Error in the request ' + error.message, undefined, error, 400)
  }
}

/**
 * Express route to logout from a backend
 */
export async function routeLogout(req, res) {
  try {
    // Get the backend
    const backendId = requiredParam(req.query.backendId, 'Backend id')
    const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
    const backend = await getBackend<Backend>(config, req['session'], undefined, backendId)
    if (!backend) throw new Error('Backend not found ' + backendId)
    try {
      // Logout
      await backend.logout(req['session'])
      // Return success
      res.json({
        error: false,
        message: 'OK',
      })
    } catch (error) {
      console.error('Error while logging out', error)
      res.status(error?.code ?? 500).json({
        error: true,
        message: 'Error while logging out: ' + error.message,
      })
      return
    }
  } catch (error) {
    console.error('Error in the logout request', error)
    res.status(error?.code ?? 400).json({
      error: true,
      message: 'Error in the logout request: ' + error.message,
    })
    return
  }
}
