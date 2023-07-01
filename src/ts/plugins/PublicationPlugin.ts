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

import express from 'express'
import { noCache } from './Cache'
import { minify } from 'html-minifier'
import { HOSTING_PUBLISH_PATH, HOSTING_PUBLICATION_STATUS_PATH } from '../constants'
import { getJob } from '../server/jobs'
import { JobId, PublicationSettings, WebsiteData } from '../types'
import { BackendType, HostingProvider, getBackend } from '../server/backends'
import { ServerConfig } from '../server/config'
import { requiredParam } from '../server/utils/validation'

/**
 * @fileoverview Publication plugin for Silex
 * Adds a publication API to Silex server
 */

const defaultPublication: PublicationSettings = {
  url: '',
  autoHomePage: true,
  assets: { path: 'assets', url: '/assets' },
  html: { path: '' },
  css: { path: 'css', url: '/css' },
}

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
 * Get the desired backend
 * Can be the default backend or a specific one
 */
export async function getHostingProvider(session: any, config: ServerConfig, backendId?: string): Promise<HostingProvider> {
  const hostingProvider = await getBackend(config, session, BackendType.HOSTING, backendId) //  ?? config.getHostingProviders()[0]

  if (!hostingProvider) {
    throw new PublicationError('No hosting provider found', 404)
  }

  if (!await hostingProvider.isLoggedIn(session)) {
    throw new PublicationError('Not logged in', 401)
  }

  return hostingProvider as HostingProvider
}

export default async function(config: ServerConfig, opts = {}) {
  const options = {
    // Defaults
    statusUrl: process.env.SILEX_PUBLICATION_STATUS_URL,
    backend: 'src/plugins/DefaultBackend.js',
    // Options
    ...opts,
  }

  config.on('silex:startup:start', ({app}) => {
    const router = express.Router()

    // Get publication status
    router.get(`/${HOSTING_PUBLICATION_STATUS_PATH}`, async function (req, res) {
      const id: JobId = req.query.id as string
      const job = id && getJob(id)
      if (!job) {
        console.error(`Error: job not found with id ${id}`)
        res.status(404).send({
          message: 'Error: job not found.',
        })
        return
      }
      res.send(job)
    })

    // Publish website
    router.post(`/${HOSTING_PUBLISH_PATH}`, async function (req, res) {
      try {
        const id = requiredParam<string>(req.query.id as string, 'id in query')
        const session = requiredParam(req['session'], 'session on express request')
        const config = requiredParam<ServerConfig>(req['config'], 'config on express request')

        // Check params
        const { files, publication } = req.body.data as WebsiteData
        const publicationSettings: PublicationSettings = {
          ...defaultPublication,
          ...publication,
        }
        const backendId = requiredParam(publicationSettings.backend?.backendId, 'backendId in publicationSettings')
        if (!files) throw new PublicationError('Error in the request, files not found', 400)

        // Get hosting provider and make sure the user is logged in
        const hostingProvider = await getHostingProvider(session, config, backendId)
        if (!hostingProvider) throw new PublicationError('Error in the request, hosting provider not found', 400)
        if (!hostingProvider.isLoggedIn(session)) throw new PublicationError(`You must be logged in with ${hostingProvider.displayName} to publish`, 401)
        
        // Optim HTML
        files.map(file => ({
          ...file,
          html: minify(file.html, {
            continueOnParseError: true,
            collapseInlineTagWhitespace: true,
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
          }).trim(),
        }))
        // Publication
        const filesList = files.flatMap(file => ([{
          path: file.htmlPath,
          content: file.html,
        }, {
          path: file.cssPath,
          content: file.css,
        }]))
        try {
          console.log('Publishing the website', filesList, session)
          const job = await hostingProvider.publish(session, id, publicationSettings.backend!, filesList)
          res.json({
            url: await hostingProvider.getWebsiteUrl(session, backendId),
            ...job,
          })
        } catch (err) {
          console.error('Error publishing the website', err)
          res.status(500).json({ message: `Error publishing the website. ${err.message}` })
          return
        }
      } catch (err) {
        console.error('Error publishing the website', err)
        res.status(err.code ?? 500).json({ message: `Error publishing the website. ${err.message}` })
        return
      }
    })

    app.use(noCache,  router)
  })
}
