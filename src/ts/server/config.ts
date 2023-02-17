/**
 * @fileoverview This is where the default config is defined. Also use this object as an event emitter to listen to Silex events
 * The values can be overriden with env vars or before passing the config to Silex
 * @see {@link https://github.com/lexoyo/silex-for-hosting-company|example of customization with the config object}
 * @see {@link https://github.com/silexlabs/Silex/blob/develop/app.json|all the env vars in this definition file for heroku 1 click deploy}
 * @see {@link https://github.com/silexlabs/Silex/wiki/How-to-Host-An-Instance-of-Silex#environment-variables|Silex env vars}
 */

/**
 * default config for Silex server
 */
import { EventEmitter } from 'events'

/**
 * Config types definitions
 */
export class Config extends EventEmitter {
  debug: boolean
  port: string
  url: string
  apiPath: string
  plugins: any[]
  pluginsOpts: {
    [key: string]: any
  }
}

import expressPlugin from './plugins/ExpressPlugin'
import sslPlugin from './plugins/SslPlugin'
import staticPlugin from './plugins/StaticPlugin'
import publishPlugin from './plugins/PublishPlugin'
import websitePlugin from './plugins/WebsitePlugin'

export default function(): Config {
  const port = process.env.PORT || '6805' // 6805 is the date of sexual revolution started in paris france 8-)
  const debug = process.env.SILEX_DEBUG === 'true'
  const maxListeners = process.env.SILEX_MAX_LISTENERS ? parseInt(process.env.SILEX_MAX_LISTENERS) : 50

  const config = new Config()
  config.setMaxListeners(maxListeners)
  config.port = port
  config.debug = debug
  config.url = process.env.SERVER_URL || `http://localhost:${port}`
  config.apiPath = '/api'
  config.plugins = [
    expressPlugin,
    sslPlugin,
    staticPlugin,
    publishPlugin,
    websitePlugin,
  ]
  config.pluginsOpts = {}
  return config
}
