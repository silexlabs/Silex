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
import { join, resolve } from 'path'
import { CLIENT_CONFIG_FILE_NAME } from '../constants'
import { Application, Request, Response, Router } from 'express'
import { readFile } from 'fs/promises'
import { HostingConnector, StorageConnector, toConnectorEnum } from './connectors/connectors'
import { FsStorage } from './connectors/FsStorage'
import { Connector } from './connectors/connectors'
import { ConnectorType } from '../types'
import { FsHosting } from './connectors/FsHosting'

/**
 * Config types definitions
 */
export class ServerConfig extends Config {
  public expressOptions = {
    jsonLimit: process.env.SILEX_EXPRESS_JSON_LIMIT,
    textLimit: process.env.SILEX_EXPRESS_TEXT_LIMIT,
    urlencodedLimit: process.env.SILEX_EXPRESS_URLENCODED_LIMIT,
    sessionName: process.env.SILEX_SESSION_NAME,
    sessionSecret: process.env.SILEX_SESSION_SECRET,
    cors: process.env.SILEX_CORS_URL,
  }
  public port = process.env.SILEX_PORT
  public debug = process.env.SILEX_DEBUG === 'true'
  public url = process.env.SILEX_URL?.replace(/\/$/, '') ?? `${process.env.SILEX_PROTOCOL}://${process.env.SILEX_HOST}:${process.env.SILEX_PORT}`
  public userConfigPath: Plugin | undefined = process.env.SILEX_SERVER_CONFIG
  public configFilePath: Plugin = resolve(__dirname, '../../../.silex.js')

  // All connectors or just the storage or hosting connectors
  getConnectors(type: ConnectorType | string | null = null): Connector[] {
    // All connectors including storage and hosting connectors
    if (!type) {
      // Concat storage and hosting connectors
      const allConnectors: Connector[] = (this.getStorageConnectors() as Connector[]).concat(this.getHostingConnectors())

      // Remove duplicates (if a connector is both a storage and a hosting connector)
      return [...new Set(allConnectors)]
    }

    // Convert to enum in case it is a string
    const connectorType = toConnectorEnum(type.toString())

    // Only one type of connector
    switch(connectorType) {
    case ConnectorType.HOSTING: return this.getHostingConnectors()
    case ConnectorType.STORAGE: return this.getStorageConnectors()
    default: throw new Error(`Unknown connector type ${type}`)
    }
  }

  // Storage connectors to store the website data and assets
  private storageConnectors: StorageConnector[] = []
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
  private hostingConnectors: HostingConnector[] = []
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
      console.info(`> Serving client side config ${path} at ${CLIENT_CONFIG_FILE_NAME}`)
      try {
        // Load the client config file
        let clientConfig = (await readFile(path as string)).toString()
        // Serve the config file
        app.get(`/${CLIENT_CONFIG_FILE_NAME}`, async (req: Request, res: Response) => {
          // Reload each time in debug mode
          if (this.debug) {
            console.info('[Debug mode] Reloading config file', path)
            clientConfig = (await readFile(path)).toString()
          }
          // Send the config file
          res
            .contentType('application/javascript')
            .send(clientConfig)
        })
      } catch (e) {
        console.error(`Error loading client config file ${path}`, e)
        throw new Error(`Error loading client config file ${path}: ${e.message}`)
      }
    }
  }

  /**
   * Load config files
   * This is the main config file and the user config file
   */
  async loadConfigFiles() {
    // Load the user config file
    await this.loadUserConfig()
    // Load the main config file
    await this.loadSilexConfig()
  }

  /**
   * Load user config file
   * This is the config file passed as env var CONFIG
   */
  async loadUserConfig() {
    if (this.userConfigPath) {
      console.info('> Loading user config', this.userConfigPath)
      try {
        // Initiate the process with the config file which is just another plugin
        await this.addPlugin(this.userConfigPath, {})
      } catch (e) {
        throw new Error(`\nUser config file ${this.userConfigPath} error:\n\n\t${e.message}\n\n`)
      }
    }
  }

  /**
   * Load .silex.js in the root folder
   * This is the main config file
   */
  async loadSilexConfig() {
    console.info('> Loading config', this.configFilePath)
    try {
      // Initiate the process with the config file which is just another plugin
      await this.addPlugin(this.configFilePath, {})
    } catch(e) {
      // Check if the error is about the config file not found and not another module not found in the config file
      if(e.code === 'MODULE_NOT_FOUND' && (!e.requireStack || !e.requireStack.find(path => path === this.configFilePath))) {
        console.info('> /!\\ Config file not found', this.configFilePath)
      } else {
        throw new Error(`Error in config file ${this.configFilePath}: ${e.message}`)
      }
    }
  }

  async initDefaultConnectors() {
    // Add default storage connectors
    if (!this.storageConnectors.length) {
      this.addStorageConnector(new FsStorage(null, {
        path: process.env.SILEX_FS_ROOT || join(process.cwd(), '/silex/storage'),
      }))
    }
    // Add default hosting connectors
    if (!this.hostingConnectors.length) {
      this.addHostingConnector(new FsHosting(null, {
        path: process.env.SILEX_FS_HOSTING_ROOT || join(process.cwd(), '/silex/hosting'),
      }))
    }
  }
}
