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

import fetch from 'node-fetch'
import { ServerConfig } from '../../server/config'
import { ServerEvent, WebsiteAssetStoreEndEventType } from '../../server/events'

type HooksOptions = {
  gitUrl?: string
  buildUrl?: string
}

// **********
throw new Error('TODO: implement hooks plugin')
// **********

export default async function(config: ServerConfig, opts: HooksOptions = {}) {
  // Options with defaults
  const options = {
    gitUrl: process.env.SILEX_HOOK_GIT,
    buildUrl: process.env.SILEX_HOOK_BUILD,
    websitePath: process.env.DATA_FOLDER,
    assetsPath: process.env.ASSETS_FOLDER,
    ...opts
  }
  config.on(ServerEvent.WEBSITE_STORE_END, async ({ res, req, projectId, data }) => {
    if(options.gitUrl) {
      await hook(options.gitUrl, {
        path: options.websitePath,
        message: 'Change from Silex',
      })
    }
  })
  config.on(ServerEvent.WEBSITE_ASSET_STORE_END, async (e: WebsiteAssetStoreEndEventType) => {
    if(options.gitUrl) {
      await hook(options.gitUrl, {
        path: options.assetsPath,
        message: 'Change from Silex',
      })
    }
  })
  config.on(ServerEvent.PUBLISH_END, async ({ projectId, files, req, res }) => {
    if(options.buildUrl) {
      await hook(options.buildUrl)
    }
  })
}

async function hook(url, params = {}) {
  if(url) {
    const urlObj = new URL(url)
    console.log('Calling hook', {url})
    try {
      Object.keys(params)
        .forEach(key => urlObj.searchParams.append(key, params[key]))
      return fetch(urlObj.toString())
    } catch(error) {
      console.log('Hook call failed', {url, error})
      return null
    }
  }
}
