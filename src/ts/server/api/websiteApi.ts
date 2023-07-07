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
import { API_WEBSITE_ASSETS_READ, API_WEBSITE_ASSETS_WRITE, API_WEBSITE_READ, API_WEBSITE_WRITE, API_WEBSITE_DELETE, WEBSITE_DATA_FILE, API_WEBSITE_META_READ, API_WEBSITE_META_WRITE, API_WEBSITE_LIST } from '../../constants'
import { createReadStream } from 'fs'
import { ApiError, ApiWebsiteAssetsReadParams, ApiWebsiteAssetsReadQuery, ApiWebsiteAssetsReadResponse, ApiWebsiteAssetsWriteQuery, ApiWebsiteAssetsWriteResponse, ApiWebsiteDeleteQuery, ApiWebsiteReadQuery, ApiWebsiteReadResponse, ApiWebsiteWriteBody, ApiWebsiteWriteQuery, ConnectorId, ConnectorType, WebsiteMeta, WebsiteData, WebsiteId, ApiWebsiteListQuery, ApiWebsiteListResponse, ApiWebsiteMetaReadQuery, ApiWebsiteMetaReadResponse, ApiWebsiteMetaWriteQuery, ApiWebsiteMetaWriteBody, WebsiteMetaFileContent, ApiWebsiteMetaWriteResponse, ApiWebsiteWriteResponse } from '../../types'
import { ConnectorFile, ConnectorSession, StorageConnector, getConnector } from '../connectors/connectors'
import { Readable } from 'stream'
import { requiredParam } from '../utils/validation'
import { basename } from 'path'
import { ServerConfig } from '../config'

/**
 * @fileoverview Website plugin for Silex
 * This plugin provides the website API to Silex server
 */

/**
 * Error thrown by the website API
 * @param message error message
 * @param code http status code
 */
export class WebsiteError extends Error {
  constructor(message: string, public code: number) {
    super(message)
  }
}

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
    console.log('read website')
    const query = req.query as ApiWebsiteReadQuery
    const { id, connectorId } = query
    const session = req['session'] as ConnectorSession
    if(!id) {
      // List websites
      next()
      return
    }
    try {
      // Get website data
      const websiteData: WebsiteData | Readable = await readWebsite(
        session,
        id,
        connectorId,
      )
      if (websiteData instanceof Readable) {
        websiteData.pipe(res.type('application/json'))
      } else {
        res.json(websiteData as ApiWebsiteReadResponse)
      }
    } catch (e) {
      console.error('Error getting website data', e)
      if (e instanceof WebsiteError) {
        res.status(e.code).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // List websites
  router.get(API_WEBSITE_LIST, async (req, res) => {
    console.log('list websites')
    const query: ApiWebsiteListQuery = req.query
    const { connectorId } = query
    const session = req['session'] as ConnectorSession
    try {
      // List websites
      const websites = await listWebsites(req['session'], query.connectorId as string | undefined)
      res.json(websites as ApiWebsiteListResponse)
    } catch (e) {
      console.error('Error getting website data', e)
      if (e instanceof WebsiteError) {
        res.status(e.code).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Save website data
  router.post(API_WEBSITE_WRITE, async (req, res) => {
    try {
      const query: ApiWebsiteWriteQuery = req.query as any
      const body: ApiWebsiteWriteBody = req.body
      const id = requiredParam<WebsiteId>(query.id, 'Website id')
      const websiteData = requiredParam<WebsiteData>(body, 'Website data') as WebsiteData
      await writeWebsite(
        req['session'],
        id,
        websiteData,
        query.connectorId,
      )
      res.status(200).json({ message: 'Website saved' } as ApiWebsiteWriteResponse)
    } catch (e) {
      console.error('Error saving website data', e)
      if (e instanceof WebsiteError) {
        res.status(e.code).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Create website or update website meta
  router.post(API_WEBSITE_META_WRITE, async (req, res) => {
    try {
      const session = req['session'] as ConnectorSession
      const query: ApiWebsiteMetaWriteQuery = req.query as any
      const body: ApiWebsiteMetaWriteBody = req.body
      const id = requiredParam<WebsiteId>(query.id, 'Website id')
      const websiteMeta = requiredParam<WebsiteMetaFileContent>(body, 'Website meta') as WebsiteMeta
      const connectorId = query.connectorId
      const connector = await getConnector<StorageConnector>(config, session, ConnectorType.STORAGE, connectorId)
      if(!connector) {
        throw new WebsiteError(`Connector ${connectorId} not found`, 500)
      }
      await connector.setWebsiteMeta(
        session,
        id,
        websiteMeta,
      )
      res.json({ message: 'Website meta saved' } as ApiWebsiteMetaWriteResponse)
    } catch (e) {
      console.error('Error saving website meta', e)
      if (e instanceof WebsiteError) {
        res.status(e.code).json({ message: e.message } as ApiError)
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
      const id = requiredParam<WebsiteId>(query.id, 'Website id')
      const connectorId = query.connectorId
      const connector = await getConnector<StorageConnector>(config, session, ConnectorType.STORAGE, connectorId)
      if(!connector) {
        throw new WebsiteError(`Connector ${connectorId} not found`, 500)
      }
      const websiteMeta: WebsiteMeta = await connector.getWebsiteMeta(session, id)
      res.json(websiteMeta as ApiWebsiteMetaReadResponse)
    } catch (e) {
      console.error('Error getting website meta', e)
      if (e instanceof WebsiteError) {
        res.status(e.code).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Delete website
  router.delete(API_WEBSITE_DELETE, async (req, res) => {
    try {
      const query: ApiWebsiteDeleteQuery = req.query as any
      const id = requiredParam<WebsiteId>(query.id, 'Website id')
      await deleteWebsite(req['session'], id, query.connectorId)
      res.status(200).json({ message: 'Website deleted' } as ApiError)
    } catch (e) {
      console.error('Error deleting website data', e)
      if (e instanceof WebsiteError) {
        res.status(e.code).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  // Load assets
  router.get(API_WEBSITE_ASSETS_READ, async (req, res) => {
    {
      try {
        const query: ApiWebsiteAssetsReadQuery = req.query as any
        const params: ApiWebsiteAssetsReadParams = req.params as any
        const id = requiredParam<WebsiteId>(query.id, 'Website id')
        const path = requiredParam<string>(params.path, 'path')
        const asset: ConnectorFile = await readAsset(req['session'], id, path, query.connectorId)
        // Set content type
        res.contentType(basename(asset.path))
        // Send the file
        if (asset.content instanceof Readable) {
          // Stream
          asset.content.pipe(res)
        } else {
          // Buffer or string
          res.send(asset.content as ApiWebsiteAssetsReadResponse)
        }
      } catch (e) {
        console.error('Error getting asset', e)
        if (e instanceof WebsiteError) {
          res.status(e.code).json({ message: e.message } as ApiError)
        } else {
          res.status(500).json({ message: e.message } as ApiError)
        }
      }
    }
  })

  // Upload assets
  router.post(API_WEBSITE_ASSETS_WRITE, async (req, res) => {
    try {
      const query: ApiWebsiteAssetsWriteQuery = req.query as any
      const id = requiredParam<WebsiteId>(query.id as WebsiteId, 'Website id')

      // Get the file data from the request
      const form = formidable({
        filename: (name, ext, part, _form) => `${name}${ext}`,
        multiples: true,
        keepExtensions: true,
      })
      const files: ConnectorFile[] = await new Promise<ConnectorFile[]>((resolve, reject) => {
        form.parse(req, async (err, fields, _files) => {
          if (err) {
            console.error('Error parsing upload data', err)
            reject(new WebsiteError('Error parsing upload data: ' + err.message, 400))
          } else {
            const files = ([].concat(_files['files[]']) as PersistentFile[])
              .map(file => file.toJSON())
              .map(file => ({
                path: `${options.assetsPath}/${file.originalFilename}`,
                content: createReadStream(file.filepath),
              }))
            resolve(files)
          }
        })
      })

      // Write the files
      console.log('Uploading assets', files)
      const data = await writeAssets(req['session'], id, files, query.connectorId)
      console.log('Uploaded assets', data)

      // Return the file URLs to insert in the website
      res.json({
        data, // As expected by grapesjs (https://grapesjs.com/docs/modules/Assets.html#uploading-assets)
      } as ApiWebsiteAssetsWriteResponse)

    } catch (e) {
      console.error('Error uploading assets', e)
      if (e instanceof WebsiteError) {
        res.status(e.code).json({ message: e.message } as ApiError)
      } else {
        res.status(500).json({ message: e.message } as ApiError)
      }
    }
  })

  /**
   * Get the desired connector
   * Can be the default connector or a specific one
   */
  async function getStorageConnector(session: any, connectorId?: string): Promise<StorageConnector> {
    const storageConnector = await getConnector(config, session, ConnectorType.STORAGE, connectorId) //  ?? config.getStorageConnectors()[0]

    if (!storageConnector) {
      throw new WebsiteError('No storage connector found', 404)
    }

    if (!await storageConnector.isLoggedIn(session)) {
      throw new WebsiteError('Not logged in', 401)
    }

    return storageConnector as StorageConnector
  }

  /**
   * Website a website data or list all websites
   */
  async function readWebsite(session: any, id: string, connectorId?: string): Promise<WebsiteData | Readable> {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // List websites or get a website
    // Get a website data
    const file = await storageConnector.readWebsiteFile(session, id, WEBSITE_DATA_FILE)
    if (typeof file.content === 'string') return JSON.parse(file.content)
    else if (file.content instanceof Buffer) return JSON.parse(file.content.toString())
    else if (file.content instanceof Readable) return file.content
    throw new WebsiteError('Invalid website data', 500)
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
  async function writeWebsite(session: any, id: WebsiteId, websiteData: WebsiteData, connectorId?: ConnectorId): Promise<void> {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // Init the storage for this website (create the folder if it does not exist)
    // FIXME: put this after login
    // await storageConnector.init(session, id)

    // Write the website data
    await storageConnector.writeWebsiteFiles(session, id, [{
      path: WEBSITE_DATA_FILE,
      content: JSON.stringify(websiteData),
    }])
  }

  /**
   * Delete a website
   */
  async function deleteWebsite(session: any, id: string, connectorId?: string) {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // Delete the website
    return await storageConnector.deleteWebsiteDir(session, id, '/')
  }

  /**
   * Read an asset
   */
  async function readAsset(session: any, id: string, fileName: string, connectorId?: string): Promise<ConnectorFile> {
    //const { session } = req
    //const id = req.query.id
    //const fileName = req.params[0]
    //const uploadDir = await assetsDir(id)
    //res.sendFile(`${uploadDir}/${fileName}`)

    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // Read the asset from the connector
    return await storageConnector.readWebsiteFile(session, id, `/${options.assetsPath}/${fileName}`)
  }

  /**
   * Write an asset to the connector
   */
  async function writeAssets(session: any, id: string, files: ConnectorFile[], connectorId?: string): Promise<string[]> {
    // Get the desired connector
    const storageConnector = await getStorageConnector(session, connectorId)

    // Write the asset to the connector
    await storageConnector.writeWebsiteFiles(
      session,
      id,
      files
    )

    // Return the files URLs with the website id
    return files.map(({ path }) => `${path}?id=${id}`)
  }
  return router
}
