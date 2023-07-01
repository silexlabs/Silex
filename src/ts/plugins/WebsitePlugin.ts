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
import formidable, { File as FormidableFile } from 'formidable'
import { noCache } from './Cache'
import { WEBSITE_PATH, WEBSITE_ASSETS_REGEX, WEBSITE_ASSETS_PATH } from '../constants'
import { createReadStream } from 'fs'
import { WebsiteData } from '../types'
import { BackendType, File, StorageProvider, getBackend } from '../server/backends'
import { Readable } from 'stream'
import { requiredParam } from '../server/utils/validation'

/**
 * @fileoverview Website plugin for Silex
 * This plugin provides the website API to Silex server
 */

const WEBSITE_DATA_PATH = '/website.json'

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

export default async function(config, opts = {}) {
  // Options with defaults
  const options = {
    // Default constants
    assetsPath: '/assets',
    // Options
    ...opts
  }

  config.on('silex:startup:start', ({app}) => {
    // Create a new router
    const router = Router()
    app.use(noCache,  router)

    // website specials
    router.get(`/${WEBSITE_PATH}`, async (req, res) => {
      const id = req.query.id as string | undefined
      try {
        if(id) {
          // Get website data
          const websiteData: WebsiteData | Readable = await readWebsite(
            req['session'],
            requiredParam(id, 'Website id'),
            req.query.backendId as string | undefined,
          )
          if (websiteData instanceof Readable) {
            websiteData.pipe(res.type('application/json'))
          } else {
            res.json(websiteData)
          }
        } else {
          // List websites
          const websites = await listWebsites(req['session'], req.query.backendId as string | undefined)
          res.json(websites)
        }
      } catch(e) {
        console.error('Error getting website data', e)
        if(e instanceof WebsiteError) {
          res.status(e.code).json({ message: e.message })
        } else {
          res.status(500).json({ message: e.message })
        }
      }
    })
    router.post(`/${WEBSITE_PATH}`, async (req, res) => {
      try {
        const id = requiredParam(req.query.id as string, 'Website id')
        const websiteData = requiredParam<WebsiteData>(req.body, 'Website data') as WebsiteData
        const result = await writeWebsite(
          req['session'],
          id,
          websiteData,
          req.query.backendId as string | undefined,
        )
        res.status(200).json({ message: 'Website saved', result })
      } catch(e) {
        console.error('Error saving website data', e)
        if(e instanceof WebsiteError) {
          res.status(e.code).json({ message: e.message })
        } else {
          res.status(500).json({ message: e.message })
        }
      }
    })

    // Delete website
    router.delete(`/${WEBSITE_PATH}`, async (req, res) => {
      try {
        const id = requiredParam(req.query.id as string, 'Website id')
        await deleteWebsite(req['session'], id, req.query.backendId as string | undefined)
        res.status(200).json({ message: 'Website deleted' })
      } catch(e) {
        console.error('Error deleting website data', e)
        if(e instanceof WebsiteError) {
          res.status(e.code).json({ message: e.message })
        } else {
          res.status(500).json({ message: e.message })
        }
      }
    })
    
    // Assets
    router.get(WEBSITE_ASSETS_REGEX, async (req, res) => {{
      try {
        const id = requiredParam(req.query.id as string, 'Website id')
        const path = requiredParam(req.params.path as string, 'Asset path')
        const asset = await readAsset(req['session'], id, path, req.query.backendId as string | undefined)
        if(asset instanceof Readable) {
          asset.pipe(res)
        } else {
          res.json(asset)
        }
      } catch(e) {
        console.error('Error getting asset', e)
        if(e instanceof WebsiteError) {
          res.status(e.code).json({ message: e.message })
        } else {
          res.status(500).json({ message: e.message })
        }
      }
    }})

    // Upload assets
    router.post(`/${WEBSITE_ASSETS_PATH}`, async (req, res) => {
      try {
        const id = requiredParam(req.query.id as string, 'Website id')

        // Get the file data from the request
        const form = formidable({
          filename: (name, ext, part, _form) => `${name}${ext}`,
          multiples: true,
          keepExtensions: true,
        })
        const files: File[] = await new Promise<File[]>((resolve, reject) => {
          form.parse(req, async (err, fields, _files) => {
            if (err) {
              console.error('Error parsing upload data', err)
              reject(new WebsiteError('Error parsing upload data: ' + err.message, 400))
            } else {
              const files = [].concat(_files['files[]'])
                .map((file: FormidableFile) => ({
                  path: `/${options.assetsPath}/${file.originalFilename}`,
                  content: createReadStream(file.filepath),
                })) 
              resolve(files)
            }
          })
        })

        // Write the files
        const filesUrl = writeAssets(req['session'], id, files, req.query.backendId as string | undefined)

        // Return the file URLs to insert in the website
        res.json(filesUrl)

      } catch(e) {
        console.error('Error uploading assets', e)
        if(e instanceof WebsiteError) {
          res.status(e.code).json({ message: e.message })
        } else {
          res.status(500).json({ message: e.message })
        }
      }
    })
  })

  /**
   * Get the desired backend
   * Can be the default backend or a specific one
   */
  async function getStorageProvider(session: any, backendId?: string): Promise<StorageProvider> {
    const storageProvider = await getBackend(config, session, BackendType.STORAGE, backendId) //  ?? config.getStorageProviders()[0]

    if(!storageProvider) {
      throw new WebsiteError('No storage provider found', 404)
    }

    if(!await storageProvider.isLoggedIn(session)) {
      throw new WebsiteError('Not logged in', 401)
    }

    return storageProvider as StorageProvider
  }

  /**
   * Website a website data or list all websites
   */
  async function readWebsite(session: any, id: string, backendId?: string): Promise<WebsiteData | Readable> {
    // Get the desired backend
    const storageProvider = await getStorageProvider(session, backendId)

    // List websites or get a website
    // Get a website data
    const file = await storageProvider.readFile(session, id, WEBSITE_DATA_PATH)
    if(typeof file.content === 'string') return JSON.parse(file.content)
    else return file.content
  }

  /**
   * List existing websites
   */
  async function listWebsites(session: any, backendId?: string): Promise<string[]> {
    // Get the desired backend
    const storageProvider = await getStorageProvider(session, backendId)

    // List websites
    return await storageProvider.listWebsites(session)
  }

  /**
   * Write the website data to the backend
   */
  async function writeWebsite(session: any, id: string, websiteData: WebsiteData, backendId?: string) {
    // Get the desired backend
    const storageProvider = await getStorageProvider(session, backendId)

    // Init the storage for this website (create the folder if it does not exist)
    await storageProvider.init(session, id)

    // Write the website data
    await storageProvider.writeFiles(session, id, [{
      path: WEBSITE_DATA_PATH,
      content: JSON.stringify(websiteData),
    }])
  }

  /**
   * Delete a website
   */
  async function deleteWebsite(session: any, id: string, backendId?: string) {
    // Get the desired backend
    const storageProvider = await getStorageProvider(session, backendId)

    // Delete the website
    return await storageProvider.deleteDir(session, id, '/')
  }

  /**
   * Read an asset
   */
  async function readAsset(session: any, id: string, fileName: string, backendId?: string): Promise<File> {
    //const { session } = req
    //const id = req.query.id
    //const fileName = req.params[0]
    //const uploadDir = await assetsDir(id)
    //res.sendFile(`${uploadDir}/${fileName}`)

    // Get the desired backend
    const storageProvider = await getStorageProvider(session, backendId)

    // Read the asset from the backend
    return await storageProvider.readFile(session, id, `/${options.assetsPath}/${fileName}`)
  }

  /**
   * Write an asset to the backend
   */
  async function writeAssets(session: any, id: string, files: File[], backendId?: string): Promise<string[]> {
    // Get the desired backend
    const storageProvider = await getStorageProvider(session, backendId)

    // Write the asset to the backend
    await storageProvider.writeFiles(
      session,
      id,
      files
    )
    return files.map(({ path }) => `assets/${path}?id=${id}`)
  }
}
