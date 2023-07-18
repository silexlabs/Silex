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

import { Router } from 'express'
import { API_PUBLICATION_PUBLISH, API_PUBLICATION_STATUS, API_WEBSITE_ASSETS_READ } from '../../constants'
import { getJob } from '../jobs'
import { ApiPublicationPublishBody, ApiPublicationPublishQuery, ApiPublicationPublishResponse, ApiPublicationStatusQuery, ApiPublicationStatusResponse, JobId, PublicationSettings, PublicationData as PublicationData, ConnectorType, ConnectorId, WebsiteId} from '../../types'
import { ConnectorFile, HostingConnector, StorageConnector, getConnector } from '../connectors/connectors'
import { ServerConfig } from '../config'
import { requiredParam } from '../utils/validation'
import { join } from 'path'
import { PublishEndEventType, PublishStartEventType, ServerEvent } from '../events'

/**
 * @fileoverview Publication plugin for Silex
 * Adds a publication API to Silex server
 */

/**
 * Error thrown by the publication API
 * @param message error message
 * @param code http status code
 */
export class PublicationError extends Error {
  constructor(message: string, public code: number) {
    super(message)
  }
}

const PROJECT_ROOT = require.main ? require.main.path : process.cwd()

/**
 * Get the desired connector
 * Can be the default connector or a specific one
 */
export async function getHostingConnector(session: any, config: ServerConfig, connectorId?: string): Promise<HostingConnector> {
  const hostingConnector = await getConnector(config, session, ConnectorType.HOSTING, connectorId) //  ?? config.getHostingConnectors()[0]

  if (!hostingConnector) {
    throw new PublicationError('No hosting connector found', 500)
  }

  if (!await hostingConnector.isLoggedIn(session)) {
    throw new PublicationError('Not logged in', 401)
  }

  return hostingConnector as HostingConnector
}

export async function getStorageConnector(session: any, config: ServerConfig, connectorId?: string): Promise<StorageConnector> {
  const storageConnector = await getConnector(config, session, ConnectorType.STORAGE, connectorId) //  ?? config.getStorageConnectors()[0]

  if (!storageConnector) {
    throw new PublicationError('No storage connector found', 500)
  }

  if (!await storageConnector.isLoggedIn(session)) {
    throw new PublicationError('Not logged in to the storage connector', 401)
  }

  return storageConnector as StorageConnector
}

export default function (config: ServerConfig): Router {
  // Create a new router
  const router = Router()

  // Get publication status
  router.get(API_PUBLICATION_STATUS, async function (req, res) {
    const query: ApiPublicationStatusQuery = req.query as any
    const jobId: JobId = query.jobId as string
    const job = jobId && getJob(jobId)
    if (!job) {
      console.error(`Error: job not found with id ${jobId}`)
      res.status(404).json({
        message: 'Error: job not found.',
      })
      return
    }
    res.json({
      ...job,
      _timeout: undefined,
    } as ApiPublicationStatusResponse)
  })

  // Publish website
  router.post(API_PUBLICATION_PUBLISH, async function (req, res) {
    try {
      const query: ApiPublicationPublishQuery = req.query as any
      const body: ApiPublicationPublishBody = req.body
      const websiteId = requiredParam<WebsiteId>(query.websiteId as string, 'id in query')
      const storageId = requiredParam<ConnectorId>(query.storageId as string, 'storageId in query')
      const hostingId = requiredParam<ConnectorId>(query.hostingId as string, 'hostingId in query')
      const session = requiredParam(req['session'], 'session on express request')

      // Check params
      const data = body as PublicationData
      const { files, publication, assets } = data
      if(!files || !publication || !assets) {
        throw new PublicationError('Missing data from request: files, publication or assets', 400)
      }

      // Hook for plugins
      config.emit(ServerEvent.PUBLISH_START, data as PublishStartEventType)

      // Get hosting connector and make sure the user is logged in
      const hostingConnector = await getHostingConnector(session, config, hostingId)

      // Get storage connector which holds the assets
      const storage = await getStorageConnector(session, config, storageId)

      // Publication
      const assetsFiles: ConnectorFile[] = await Promise.all(assets.map(async asset => {
        if(!asset.path) throw new PublicationError('Missing path in asset', 400)
        if(!asset.src) throw new PublicationError('Missing src in asset', 400)
        // Remove the / from the asset root if it starts with one
        const prefix = API_WEBSITE_ASSETS_READ.replace(/^\//, '')
        // Get the asset url relative to the asset root
        const src = asset.src.startsWith(prefix) ? asset.src.substring(prefix.length) : asset.src
        return {
          path: asset.path,
          content: await storage.readAsset(session, websiteId, src),
        }
      }))
      const filesList: ConnectorFile[] = files.flatMap<ConnectorFile>(file => ([{
        path: file.htmlPath,
        content: file.html,
      }, {
        path: file.cssPath,
        content: file.css,
      }])).concat(assetsFiles)
      res.json({
        url: await hostingConnector.getUrl(session, websiteId),
        job: await hostingConnector.publish(session, websiteId, filesList),
      } as ApiPublicationPublishResponse)
    } catch (err) {
      console.error('Error publishing the website', err)
      res
        .status(typeof err.code === 'number' ? err.code : 500)
        .json({
          message: `Error publishing the website. ${err.message}`
        })
      // Hook for plugins
      config.emit(ServerEvent.PUBLISH_END, err as PublishEndEventType)
      return
    }
    // Hook for plugins
    config.emit(ServerEvent.PUBLISH_END)
  })

  return router
}
