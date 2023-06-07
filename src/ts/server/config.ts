/**
 * @fileoverview This is where the default config is defined. Also use this object as an event emitter to listen to Silex events
 * The values can be overriden with env vars or before passing the config to Silex
 */

/**
 * @class default config for Silex server
 */

import { Config, Plugin } from '@silexlabs/silex-plugins'
import { resolve } from 'path'

/**
 * Config types definitions
 */
export class ServerConfig extends Config {
  constructor(
      public url: string,
      public debug: boolean,
      public port: string,
      public apiPath: string
  ) {
    super()
  }
}

// Get config async function
export default async function(): Promise<ServerConfig> {
  const port = process.env.PORT || '6805' // 6805 is the date of sexual revolution started in paris france 8-)
  const debug = process.env.SILEX_DEBUG === 'true'

  const url = process.env.SERVER_URL || `http://localhost:${port}`
  const config = new ServerConfig(url, debug, port, '/api')

  // Config file in root folder
  const configFilePath: Plugin = resolve(__dirname, '../../.silex.js')
  console.log('Loading config', configFilePath)
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
  // Optional config file
  if (process.env.CONFIG) {
    const userConfigPath: Plugin = process.env.CONFIG
    console.log('Loading user config', userConfigPath)
    try {
      // Initiate the process with the config file which is just another plugin
      await config.addPlugin(userConfigPath, {})
    } catch (e) {
      throw new Error(`User config file ${userConfigPath} not found: ${e.message}`)
    }
  }

  // Return the config file
  return config
}
