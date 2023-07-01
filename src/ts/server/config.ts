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
import { Application, Request, Response, Router } from 'express'
import { readFile } from 'fs/promises'
import { EVENT_STARTUP_START } from '../events'
import { BackendType, HostingProvider, StorageProvider, toBackendEnum } from './backends'
import { FsBackend } from './backends/FsBackend'
import { Backend } from './backends'

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

  // All backends or just the storage or hosting providers
  getBackends<T extends Backend>(type: BackendType | string | null = null): T[] {
    // All backends including storage and hosting providers
    if (!type) {
      // Concat storage and hosting providers
      const allBackends: Backend[] = (this.getStorageProviders() as Backend[]).concat(this.getHostingProviders() as Backend[])

      // Remove duplicates (if a backend is both a storage and a hosting provider)
      return Array.from(new Set(allBackends)) as unknown as T[]
    }

    // Convert to enum in case it is a string
    const backendType = toBackendEnum(type.toString())

    // Only one type of backend
    switch(backendType) {
    case BackendType.HOSTING: return this.getHostingProviders() as unknown as T[]
    case BackendType.STORAGE: return this.getStorageProviders() as unknown as T[]
    default: throw new Error(`Unknown backend type ${type}`)
    }
  }

  // Storage providers to store the website data and assets
  private storageProviders: StorageProvider[] = [defaultBackend]
  addStorageProvider(storage: StorageProvider | StorageProvider[]) {
    this.setStorageProviders(this.storageProviders.concat(storage))
  }
  setStorageProviders(storageProviders: StorageProvider[]) {
    this.storageProviders =storageProviders
  }
  getStorageProviders(): StorageProvider[] {
    return this.storageProviders
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

  /**
   * Add routes to serve the client config file
   */
  async addRoutes(app: Application) {
    const path = process.env.SILEX_CLIENT_CONFIG
    if (path) {
      console.log(`> Serving client side config ${path} at ${CLIENT_CONFIG_FILE_NAME}`)
      // Load the client config file
      let clientConfig = (await readFile(path as string)).toString()
      // Serve the config file
      app.get(`/${CLIENT_CONFIG_FILE_NAME}`, async (req: Request, res: Response) => {
        // Reload each time in debug mode
        if (this.debug) {
          console.log('[Debug mode] Reloading config file', path)
          clientConfig = (await readFile(path)).toString()
        }
        // Send the config file
        res.json(clientConfig)
      })
    }
  }

  /**
   * Load config files
   * This is the main config file and the user config file
   */
  async loadConfigFiles() {
    // Load the user config file
    await loadUserConfig(this)
    // Load the main config file
    await loadSilexConfig(this)
  }
}

// Get config async function
export function createConfig(): ServerConfig {
  const port = process.env.PORT || '6805' // 6805 is the date of sexual revolution started in paris france 8-)
  const debug = process.env.SILEX_DEBUG === 'true'

  const url = process.env.SERVER_URL || `http://localhost:${port}`
  return new ServerConfig(url, debug, port, '/api')
}

/**
 * Load user config file
 * This is the config file passed as env var CONFIG
 */ 
export async function loadUserConfig(config: ServerConfig) {
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
}

/**
 * Load .silex.js in the root folder
 * This is the main config file
 */
export async function loadSilexConfig(config: ServerConfig) {
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
}
