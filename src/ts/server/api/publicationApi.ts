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
import { noCache } from '../../plugins/server/Cache'
import { minify } from 'html-minifier'
import { API_PUBLICATION_PUBLISH, API_PUBLICATION_STATUS } from '../../constants'
import { getJob } from '../jobs'
import { ApiPublicationPublishBody, ApiPublicationPublishQuery, ApiPublicationPublishResponse, ApiPublicationStatusQuery, ApiPublicationStatusResponse, ApiError, JobId, PublicationSettings, PublicationData as PublicationData, ConnectorType, ConnectorId, WebsiteId} from '../../types'
import { ConnectorFile, HostingConnector, StorageConnector, getConnector } from '../connectors/connectors'
import { ServerConfig } from '../config'
import { requiredParam } from '../utils/validation'
import { join } from 'path'

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

export default function (config: ServerConfig, opts = {}): Router {
  const options = {
    // Defaults
    statusUrl: process.env.SILEX_PUBLICATION_STATUS_URL,
    connector: 'src/plugins/DefaultConnector.js',
    // Options
    ...opts,
  }

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
      } as ApiError)
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
      const { files, publication, assets } = body as PublicationData
      if(!files || !publication || !assets) {
        throw new PublicationError('Missing data from request: files, publication or assets', 400)
      }

      // Get hosting connector and make sure the user is logged in
      const hostingConnector = await getHostingConnector(session, config, hostingId)

      // Get storage connector which holds the assets
      const storage = await getStorageConnector(session, config, storageId)

      // Optim HTML
      const optim = files
      //const optim = files.map(file => ({
      //  ...file,
      //  html: minify(file.html, {
      //    continueOnParseError: true,
      //    collapseInlineTagWhitespace: true,
      //    collapseWhitespace: true,
      //    minifyCSS: true,
      //    minifyJS: true,
      //    removeScriptTypeAttributes: true,
      //    removeStyleLinkTypeAttributes: true,
      //  }).trim(),
      //}))
      // Publication
      const assetsFiles: ConnectorFile[] = await Promise.all(assets.map(async asset => ({
        path: asset.path ? join(...asset.path.split('/')) : '', // resolve relative path
        content: await storage.readAsset(session, websiteId, asset.src),
      })))
      const filesList: ConnectorFile[] = optim.flatMap<ConnectorFile>(file => ([{
        path: file.htmlPath,
        content: file.html,
      }, {
        path: file.cssPath,
        content: file.css,
      }])).concat(assetsFiles)
      try {
        res.json({
          url: await hostingConnector.getUrl(session, websiteId),
          job: await hostingConnector.publish(session, websiteId, filesList),
        } as ApiPublicationPublishResponse)
      } catch (err) {
        console.error('Error publishing the website', err)
        res.status(500).json({
          message: `Error publishing the website. ${err.message}`
        } as ApiError)
        return
      }
    } catch (err) {
      console.error('Error publishing the website', err)
      res
        .status(err.code ?? 500)
        .json({
          message: `Error publishing the website. ${err.message}`
        } as ApiError)
      return
    }
  })

  return router
}
