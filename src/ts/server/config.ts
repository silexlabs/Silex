/**
 * @fileoverview This is where the default config is defined. Also use this object as an event emitter to listen to Silex events
 * The values can be overriden with env vars or before passing the config to Silex
 */

/**
 * @class default config for Silex server
 */

import { InstanceConfig, Plugin, PluginType } from '../types'
import { EventEmitter } from 'events'
import { resolve } from 'path'

/**
 * Config types definitions
 */
export class Config extends EventEmitter {
  debug: boolean
  port: string
  url: string
  apiPath: string
  _plugins: any[]
  _pluginsData: Plugin[] = []
  async addPlugin(plugin: Plugin) {
    // After plugins loading
    if(this._plugins) this._plugins.push(await initPlugins(this, [].concat(plugin as any)))
    // In any case add the plugin data
    this._pluginsData = this._pluginsData.concat(plugin)
  }
}

async function initPlugins(config: Config, plugins: Plugin[]) {
  return Promise.all(plugins.map(async (plugin: Plugin, idx) => {
    console.info(`Init plugin ${plugin.require}`, plugin.options)
    const construct = await importDefault<(config: Config, options: any) => Promise<void>>(plugin.require)
    return construct(config, plugin.options)
  }))
}

async function importDefault<T>(location: string): Promise<T> {
  const path = location.match(/http:\/\/|https:\/\//i) ? location : resolve(process.cwd(), location)
  const imported = await import(path)
  const result = imported?.default ?? imported
  return result
}

// Get config async function
export default async function(): Promise<Config> {
  const port = process.env.PORT || '6805' // 6805 is the date of sexual revolution started in paris france 8-)
  const debug = process.env.SILEX_DEBUG === 'true'
  const maxListeners = process.env.SILEX_MAX_LISTENERS ? parseInt(process.env.SILEX_MAX_LISTENERS) : 50

  const config = new Config()
  config.setMaxListeners(maxListeners)
  config.port = port
  config.debug = debug
  config.url = process.env.SERVER_URL || `http://localhost:${port}`
  config.apiPath = '/api'

  // Handle optional config file in project root folder
  const configFile = process.env.CONFIG_FILE ?? '.silex.js'
  try {
    console.info('Init config', configFile)
    const configDefault = await importDefault<(config: Config) => Promise<InstanceConfig>>(configFile)
    await configDefault(config)
  } catch(e) {
    if(e.code === 'MODULE_NOT_FOUND') {
      console.info('No config found', configFile)
    } else {
      throw new Error(`Error in config file ${configFile}: ` + e.message)
    }
  }

  // Add default plugins first
  // config._pluginsData = [
  // ].concat(config._pluginsData)

  // Instanciate plugins
  config._plugins = await initPlugins(config, config._pluginsData)

  // Config is ready
  return config
}
