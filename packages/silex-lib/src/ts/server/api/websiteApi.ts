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
import formidable from 'formidable'
import PersistentFile from 'formidable/src/PersistentFile'
import { API_WEBSITE_ASSET_READ, API_WEBSITE_ASSETS_WRITE, API_WEBSITE_READ, API_WEBSITE_WRITE, API_WEBSITE_DELETE, API_WEBSITE_META_READ, API_WEBSITE_META_WRITE, API_WEBSITE_LIST, API_WEBSITE_CREATE, API_PATH, API_WEBSITE_PATH, API_WEBSITE_DUPLICATE, API_WEBSITE_FORK } from '../../constants'
import { createReadStream } from 'fs'
import { ApiError, ApiWebsiteAssetsReadParams, ApiWebsiteAssetsReadQuery, ApiWebsiteAssetsReadResponse, ApiWebsiteAssetsWriteQuery, ApiWebsiteAssetsWriteResponse, ApiWebsiteDeleteQuery, ApiWebsiteReadQuery, ApiWebsiteReadResponse, ApiWebsiteWriteBody, ApiWebsiteWriteQuery, ConnectorId, ConnectorType, WebsiteMeta, WebsiteData, WebsiteId, ApiWebsiteListQuery, ApiWebsiteListResponse, ApiWebsiteMetaReadQuery, ApiWebsiteMetaReadResponse, ApiWebsiteMetaWriteQuery, ApiWebsiteMetaWriteBody, WebsiteMetaFileContent, ApiWebsiteMetaWriteResponse, ApiWebsiteWriteResponse, ApiWebsiteCreateQuery, ApiWebsiteCreateBody, ApiWebsiteDuplicateQuery, ApiWebsiteForkQuery, ApiWebsiteForkBody, ApiWebsiteForkResponse } from '../../types'
import { ConnectorFile, ConnectorFileContent, ConnectorSession, StorageConnector, getConnector } from '../connectors/connectors'
import { Readable } from 'stream'
import { requiredParam } from '../utils/validation'
import { basename, join } from 'path'
import { ServerConfig } from '../config'
import { ServerEvent, WebsiteStoreEndEventType, WebsiteStoreStartEventType, WebsiteAssetStoreStartEventType, WebsiteAssetStoreEndEventType } from '../events'

/**
 * @fileoverview Website plugin for Silex
 * This plugin provides the website API to Silex server
 */

export default function (config: ServerConfig, opts = {}): Router {
  // Options with defaults
  const options = {
    // Default constants
    assetsPath: '/assets',
    // Options
    ...opts
  }

  // Create a new router
  const router = Router()

  // Load website data
  router.get(API_WEBSITE_READ, async (req, res, next) => {
    const query = req.query as ApiWebsiteReadQuery
    const { websiteId, connectorId } = query
    const session = req['session'] as ConnectorSession
    if(!websiteId) {
      // List websites
      next()
      return
    }
    try {
      // Get website data
      const websiteData: WebsiteData | Readable = await readWebsite(
        session,
        websiteId,
        connectorId,
      )
      if (websiteData instanceof Readable) {
        websiteData.pipe(res.type('application/json'))
      } else {
        res.json(websiteData as ApiWebsiteReadResponse)
      }
    } catch (e) {
      if (e.httpStatusCode) {
        res.status(e.httpStatusCode).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // List websites
  router.get(API_WEBSITE_LIST, async (req, res) => {
    const query: ApiWebsiteListQuery = req.query
    const { connectorId } = query
    const session = req['session'] as ConnectorSession
    try {
      // List websites
      const websites = await listWebsites(req['session'], query.connectorId as string | undefined)
      res.json(websites as ApiWebsiteListResponse)
    } catch (e) {
      console.error('Error getting website data', e)
      if (e.httpStatusCode) {
        res.status(e.httpStatusCode).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Save website data
  router.post(API_WEBSITE_WRITE, async (req, res) => {
    try {
      // Check input
      const query: ApiWebsiteWriteQuery = req.query as any
      const body: ApiWebsiteWriteBody = req.body
      const websiteId= requiredParam<WebsiteId>(query.websiteId, 'Website id')
      const websiteData = requiredParam<WebsiteData>(body, 'Website data') as WebsiteData
      const connectorId = query.connectorId // Optional
      // Hook to modify the website data before saving
      config.emit(ServerEvent.WEBSITE_STORE_START, { websiteId, websiteData, connectorId } as WebsiteStoreStartEventType)
      // Save website data
      await writeWebsite(
        req['session'],
        websiteId,
        websiteData,
        connectorId,
      )
      config.emit(ServerEvent.WEBSITE_STORE_END, null as WebsiteStoreEndEventType)
      res.status(200).json({ message: 'Website saved' } as ApiWebsiteWriteResponse)
    } catch (e) {
      console.error('Error saving website data', e)
      config.emit(ServerEvent.WEBSITE_STORE_END, e as WebsiteStoreEndEventType)
      if (e.httpStatusCode) {
        res.status(e.httpStatusCode).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Create website or update website meta
  router.put(API_WEBSITE_CREATE, async (req, res) => {
    try {
      // Check input
      const session = req['session'] as ConnectorSession
      const query: ApiWebsiteCreateQuery = req.query as any
      const body: ApiWebsiteCreateBody = req.body
      const websiteMeta = requiredParam<WebsiteMetaFileContent>(body, 'Website meta') as WebsiteMeta
      const connectorId = query.connectorId
      const connector = await getConnector<StorageConnector>(config, session, ConnectorType.STORAGE, connectorId)
      if(!connector) {
        throw new ApiError(`Connector ${connectorId} not found`, 500)
      }
      // Create website
      await connector.createWebsite(
        session,
        websiteMeta,
      )
      res.json({ message: 'Website meta saved' } as ApiWebsiteMetaWriteResponse)
    } catch (e) {
      console.error('Error saving website meta', e)
      if (e.httpStatusCode) {
        res.status(e.httpStatusCode).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Update website meta
  router.post(API_WEBSITE_META_WRITE, async (req, res) => {
    try {
      // Check input
      const session = req['session'] as ConnectorSession
      const query: ApiWebsiteMetaWriteQuery = req.query as any
      const body: ApiWebsiteMetaWriteBody = req.body
      const websiteId= requiredParam<WebsiteId>(query.websiteId, 'Website id')
      const websiteMeta = requiredParam<WebsiteMetaFileContent>(body, 'Website meta') as WebsiteMeta
      const connectorId = query.connectorId
      const connector = await getConnector<StorageConnector>(config, session, ConnectorType.STORAGE, connectorId)
      if(!connector) {
        throw new ApiError(`Connector ${connectorId} not found`, 500)
      }
      // Update website meta
      await connector.setWebsiteMeta(
        session,
        websiteId,
        websiteMeta,
      )
      res.json({ message: 'Website meta saved' } as ApiWebsiteMetaWriteResponse)
    } catch (e) {
      console.error('Error saving website meta', e)
      if (e.httpStatusCode) {
        res.status(e.httpStatusCode).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Get website meta
  router.get(API_WEBSITE_META_READ, async (req, res) => {
    try {
      const session = req['session'] as ConnectorSession
      const query: ApiWebsiteMetaReadQuery = req.query as any
      const websiteId= requiredParam<WebsiteId>(query.websiteId, 'Website id')
      const connectorId = query.connectorId
      const connector = await getConnector<StorageConnector>(config, session, ConnectorType.STORAGE, connectorId)
      if(!connector) {
        throw new ApiError(`Connector ${connectorId} not found`, 500)
      }
      const websiteMeta: WebsiteMeta = await connector.getWebsiteMeta(session, websiteId)
      res.json(websiteMeta as ApiWebsiteMetaReadResponse)
    } catch (e) {
      console.error('Error getting website meta', e)
      if (e.httpStatusCode) {
        res.status(e.httpStatusCode).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Delete website
  router.delete(API_WEBSITE_DELETE, async (req, res) => {
    try {
      const query: ApiWebsiteDeleteQuery = req.query as any
      const websiteId= requiredParam<WebsiteId>(query.websiteId, 'Website id')
      await deleteWebsite(req['session'], websiteId, query.connectorId)
      res.status(200).json({ message: 'Website deleted' } as ApiError)
    } catch (e) {
      console.error('Error deleting website data', e)
      if (e.httpStatusCode) {
        res.status(e.httpStatusCode).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Duplicate website
  router.post(API_WEBSITE_DUPLICATE, async (req, res) => {
    try {
      const query: ApiWebsiteDuplicateQuery = req.query as any
      const websiteId= requiredParam<WebsiteId>(query.websiteId, 'New website id')
      await duplicateWebsite(req['session'], websiteId, query.connectorId)
      res.status(200).json({ message: 'Website duplicated' } as ApiError)
    } catch (e) {
      console.error('Error duplicating website data', e)
      if (e.httpStatusCode) {
        res.status(e.httpStatusCode).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Fork an external/public GitLab project
  router.post(API_WEBSITE_FORK, async (req, res) => {
    try {
      const query: ApiWebsiteForkQuery = req.query as any
      const body: ApiWebsiteForkBody = req.body
      const gitlabUrl = requiredParam<string>(body.gitlabUrl, 'GitLab project path ("username/repo")')
      const websiteId = await forkWebsite(req['session'], gitlabUrl, query.connectorId)
      res.status(200).json({ websiteId, message: 'Website forked successfully' } as ApiWebsiteForkResponse)
    } catch (e) {
      console.error('Error forking website', e)
      if (e.httpStatusCode) {
        res.status(e.httpStatusCode).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Load assets
  router.get(API_WEBSITE_ASSET_READ + '/:path', async (req, res) => {
    {
      try {
        const query: ApiWebsiteAssetsReadQuery = req.query as any
        const params: ApiWebsiteAssetsReadParams = req.params as any
        const websiteId= requiredParam<WebsiteId>(query.websiteId, 'Website id')
        const path = requiredParam<string>(params.path, 'path')
        const asset: ConnectorFileContent = await readAsset(req['session'], websiteId, path, query.connectorId)
        // Set content type
        res.contentType(basename(path))
        // Send the file
        if (asset instanceof Readable) {
          // Stream
          asset.pipe(res)
        } else {
          // Buffer or string
          res.send(asset as ApiWebsiteAssetsReadResponse)
        }
      } catch (e) {
        console.error('Error getting asset', e)
        if (e.httpStatusCode) {
          res.status(e.httpStatusCode).json({ message: e.message } as ApiError)
        } else {
          res.status(500).json({ message: e.message } as ApiError)
        }
      }
    }
  })

  // Upload assets
  router.post(API_WEBSITE_ASSETS_WRITE, async (req, res) => {
    try {
      // Check input
      const query: ApiWebsiteAssetsWriteQuery = req.query as any
      const websiteId = requiredParam<WebsiteId>(query.websiteId as WebsiteId, 'Website id')

      // Get the file data from the request
      const form = formidable({
        multiples: true,
        keepExtensions: true,
      })
      const connectorId = query.connectorId // Optional

      // Retrive the files
      const files: ConnectorFile[] = await new Promise<ConnectorFile[]>((resolve, reject) => {
        form.parse(req, async (err, fields, _files) => {
          if (err) {
            console.error('Error parsing upload data', err)
            reject(new ApiError('Error parsing upload data: ' + err.message, 400))
          } else {
            const files = ([].concat(_files['files[]'] as PersistentFile) as PersistentFile[])
              .map(file => file.toJSON())
              .map(file => ({
                path: `/${file.originalFilename}`,
                content: createReadStream(file.filepath),
              }))
            resolve(files)
          }
        })
      })

      // Hook to modify the files
      config.emit(ServerEvent.WEBSITE_ASSET_STORE_START, { files, websiteId, connectorId } as WebsiteAssetStoreStartEventType)

      // Write the files
      const result = await writeAssets(req['session'], websiteId, files, connectorId)

      // Base URL of silex serve
      const baseUrl = new URL(config.url).pathname.replace(/\/$/, '')

      // Return the file URLs to insert in the website
      // As expected by grapesjs (https://grapesjs.com/docs/modules/Assets.html#uploading-assets)
      const data = result.map(path =>
        join(
        // We should return path without this line, as it is saved, not as it is displayed
        // But this url is sent straight to grapesjs, so we need to return the url as it is displayed
          baseUrl, API_PATH, API_WEBSITE_PATH, API_WEBSITE_ASSET_READ,
          path,
        )
        + `?websiteId=${websiteId}&connectorId=${connectorId ? connectorId : ''}` // As expected by wesite API (readAsset)
      )

      // Return the file URLs
      res.json({
        data,
      } as ApiWebsiteAssetsWriteResponse)

      // Hook for plugins
      config.emit(ServerEvent.WEBSITE_ASSET_STORE_END, null as WebsiteAssetStoreEndEventType)
    } catch (e) {
      console.error('Error uploading assets', e)
      if (e.httpStatusCode) {
        res.status(e.httpStatusCode).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
      // Hook for plugins
      config.emit(ServerEvent.WEBSITE_ASSET_STORE_END, e as WebsiteAssetStoreEndEventType)
    }
  })

  /**
   * Get the desired connector
   * Can be the default connector or a specific one
   */
  async function getStorageConnector(session: any, connectorId?: string): Promise<StorageConnector> {
    const storageConnector = await getConnector(config, session, ConnectorType.STORAGE, connectorId) //  ?? config.getStorageConnectors()[0]

    if (!storageConnector) {
      throw new ApiError('No storage connector found', 404)
    }

    if (!await storageConnector.isLoggedIn(session)) {
      throw new ApiError('Not logged in', 401)
    }

    return storageConnector as StorageConnector
  }

  /**
   * Read the website data
   */
  async function readWebsite(session: any, websiteId: string, connectorId?: string): Promise<WebsiteData | Readable> {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // Return website data
    return storageConnector.readWebsite(session, websiteId)
  }

  /**
   * List existing websites
   */
  async function listWebsites(session: any, connectorId?: string): Promise<WebsiteMeta[]> {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // List websites
    return storageConnector.listWebsites(session)
  }

  /**
   * Write the website data to the connector
   */
  async function writeWebsite(session: any, websiteId: WebsiteId, websiteData: WebsiteData, connectorId?: ConnectorId): Promise<void> {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // Write the website data
    await storageConnector.updateWebsite(session, websiteId, websiteData)
  }

  /**
   * Delete a website
   */
  async function deleteWebsite(session: any, websiteId: string, connectorId?: string): Promise<void> {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // Delete the website
    return storageConnector.deleteWebsite(session, websiteId)
  }

  /**
   * Duplicate a website
   */
  async function duplicateWebsite(session: any, websiteId: string, connectorId?: string): Promise<void> {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // Duplicate the website
    return storageConnector.duplicateWebsite(session, websiteId)
  }

  /**
   * Fork an external/public GitLab project
   * Only accepts a GitLab project path in the "username/repo" format.
   * This is specific to GitLab connector - it allows forking public projects from any user/organization
   */
  async function forkWebsite(session: any, gitlabUrl: string, connectorId?: string): Promise<string> {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // Check if the connector supports forking (only GitLab does)
    if (typeof (storageConnector as any).forkWebsite !== 'function') {
      throw new ApiError('This storage connector does not support forking external projects', 400)
    }

    // Fork the website
    return (storageConnector as any).forkWebsite(session, gitlabUrl)
  }

  /**
   * Read an asset
   */
  async function readAsset(session: any, websiteId: string, fileName: string, connectorId?: string): Promise<ConnectorFileContent> {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // Read the asset from the connector
    return storageConnector.readAsset(session, websiteId, `/${fileName}`)
  }

  /**
   * Write an asset to the connector
   * @returns File names on the storage connector, always starting with a slash
   */
  async function writeAssets(session: any, websiteId: string, files: ConnectorFile[], connectorId?: string): Promise<string[]> {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // Clean up the path
    const cleanPathFiles = files.map(file => ({
      ...file,
      path: file.path.replace('/assets/', '/'), // Remove the assets folder added by GrapesJS
    }))

    // Write the asset to the connector
    const result = await storageConnector.writeAssets(
      session,
      websiteId,
      cleanPathFiles,
    )

    // Return the files URLs with the website id
    return files
      // Use the original path or the one returned by the connector
      .map(({ path }, idx) => result && result[idx] ? result[idx] : path)
      // Make it an absolute path with the website id and the connector id as query params
      //.map((path) => toAssetUrl(path, config.url, websiteId, connectorId))
  }

  return router
}
