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

/**
 * @fileoverview This is where the default config is defined. Also use this object as an event emitter to listen to Silex events
 * The values can be overriden with env vars or before passing the config to Silex
 */

/**
 * @class default config for Silex server
 */

import { Config, Plugin } from '@silexlabs/silex-plugins'
import { resolve } from 'path'
import { CLIENT_CONFIG_FILE_NAME } from '../constants'
import { Router } from 'express'
import { readFile } from 'fs/promises'
import { EVENT_STARTUP_START } from '../events'
import { AuthProvider, HostingProvider, Storage } from './backends/Backend'
import { FsBackend } from './backends/FsBackend'

const defaultBackend = new FsBackend({})

/**
 * Config types definitions
 */
export class ServerConfig extends Config {
  constructor(
    public url: string,
    public debug: boolean,
    public port: string,
    public apiPath: string,
  ) {
    super()
  }

  // Storage to store the website data and assets
  private storage: Storage = defaultBackend
  setStorage(storage: Storage) {
    this.storage =storage 
  }
  getStorage(): Storage {
    return this.storage
  }

  // Hosting providers to publish the website online
  private hostingProviders: HostingProvider[] = [defaultBackend]
  addHostingProvider(hosting: HostingProvider | HostingProvider[]) {
    this.setHostingProviders(this.hostingProviders.concat(hosting))
  }
  setHostingProviders(hostings: HostingProvider[]) {
    this.hostingProviders = hostings
  }
  getHostingProviders(): HostingProvider[] { return this.hostingProviders }
}

// Get config async function
export default async function(): Promise<ServerConfig> {
  const port = process.env.PORT || '6805' // 6805 is the date of sexual revolution started in paris france 8-)
  const debug = process.env.SILEX_DEBUG === 'true'
  const clientConfigPath = process.env.SILEX_CLIENT_CONFIG

  const url = process.env.SERVER_URL || `http://localhost:${port}`
  const config = new ServerConfig(url, debug, port, '/api')

  // Serve the client side config file
  if (clientConfigPath) {
    config.on(EVENT_STARTUP_START, async ({ app }) => {
      console.log(`> Serving client side config ${clientConfigPath} at ${CLIENT_CONFIG_FILE_NAME}`)
      // Attach the route immediately
      const router = Router()
      app.use(router)
      // Load the config file and serve it
      let clientConfig = (await readFile(clientConfigPath as string)).toString()
      router.get(`/${CLIENT_CONFIG_FILE_NAME}`, async (res, req, next) => {
        // Reload each time in debug mode
        if (config.debug) {
          console.log('[Debug mode] Reloading config file', clientConfigPath)
          clientConfig = (await readFile(clientConfigPath)).toString()
        }
        // Send the config file
        req.header('Content-Type', 'application/javascript').send(clientConfig)
      })
    })
  }

  // Optional config file
  // Load this config file before the main config file so that routes can be overriden
  // Or listen for event silex:startup:end to add routes after the default ones
  if (process.env.CONFIG) {
    const userConfigPath: Plugin = process.env.CONFIG
    console.log('> Loading user config', userConfigPath)
    try {
      // Initiate the process with the config file which is just another plugin
      await config.addPlugin(userConfigPath, {})
    } catch (e) {
      throw new Error(`User config file ${userConfigPath} error: ${e.message}`)
    }
  }

  // Config file in root folder
  const configFilePath: Plugin = resolve(__dirname, '../../.silex.js')
  console.log('> Loading config', configFilePath)
  try {
    // Initiate the process with the config file which is just another plugin
    await config.addPlugin(configFilePath, {})
  } catch(e) {
    if(e.code === 'MODULE_NOT_FOUND') {
      console.info('No config found', configFilePath)
    } else {
      throw new Error(`Error in config file ${configFilePath}: ${e.message}`)
    }
  }

  // Return the config file
  return config
}
