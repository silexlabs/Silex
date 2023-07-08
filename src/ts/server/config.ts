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
import { HostingConnector, StorageConnector, toConnectorEnum } from './connectors/connectors'
import { FsConnector } from './connectors/FsConnector'
import { Connector } from './connectors/connectors'
import { ConnectorType } from '../types'

/**
 * Config types definitions
 */
export class ServerConfig extends Config {
  public expressOptions = {
    jsonLimit: process.env.SILEX_EXPRESS_JSON_LIMIT || '1mb',
    textLimit: process.env.SILEX_EXPRESS_TEXT_LIMIT || '10mb',
    sessionName: process.env.SILEX_SESSION_NAME || 'silex-session',
    sessionSecret: process.env.SILEX_SESSION_SECRET || 'replace this session secret in env vars',
    cors: process.env.SILEX_CORS_URL,
  }
  public defaultFsConnectorOptions = {
    rootPath: process.env.FS_ROOT,
  }
  constructor(
    public url: string,
    public debug: boolean,
    public port: string,
    public apiPath: string,
  ) {
    super()
  }

  // All connectors or just the storage or hosting connectors
  getConnectors<T extends Connector>(type: ConnectorType | string | null = null): T[] {
    // All connectors including storage and hosting connectors
    if (!type) {
      // Concat storage and hosting connectors
      const allConnectors: Connector[] = (this.getStorageConnectors() as Connector[]).concat(this.getHostingConnectors() as Connector[])

      // Remove duplicates (if a connector is both a storage and a hosting connector)
      return Array.from(new Set(allConnectors)) as unknown as T[]
    }

    // Convert to enum in case it is a string
    const connectorType = toConnectorEnum(type.toString())

    // Only one type of connector
    switch(connectorType) {
      case ConnectorType.HOSTING: return this.getHostingConnectors() as unknown as T[]
      case ConnectorType.STORAGE: return this.getStorageConnectors() as unknown as T[]
      default: throw new Error(`Unknown connector type ${type}`)
    }
  }

  // Storage connectors to store the website data and assets
  private storageConnectors: StorageConnector[] = [new FsConnector(null, {
    ...this.defaultFsConnectorOptions,
    type: ConnectorType.STORAGE,
  })]
  addStorageConnector(storage: StorageConnector | StorageConnector[]) {
    this.setStorageConnectors(this.storageConnectors.concat(storage))
  }
  setStorageConnectors(storageConnectors: StorageConnector[]) {
    this.storageConnectors =storageConnectors
  }
  getStorageConnectors(): StorageConnector[] {
    return this.storageConnectors
  }

  // Hosting connectors to publish the website online
  private hostingConnectors: HostingConnector[] = [new FsConnector(null, {
    ...this.defaultFsConnectorOptions,
    type: ConnectorType.HOSTING,
  })]
  addHostingConnector(hosting: HostingConnector | HostingConnector[]) {
    this.setHostingConnectors(this.hostingConnectors.concat(hosting))
  }
  setHostingConnectors(hostings: HostingConnector[]) {
    this.hostingConnectors = hostings
  }
  getHostingConnectors(): HostingConnector[] { return this.hostingConnectors }

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
