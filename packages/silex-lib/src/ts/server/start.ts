import * as express from 'express'
import { Application } from 'express'

import { Config } from './config'
import { EVENT_STARTUP_START, EVENT_STARTUP_END } from './events'

export async function start(config: Config): Promise<Application> {
  // Plugins
  Promise.all(config.plugins.map(async (plugin, idx) => {
    if(typeof plugin === 'string') {
      console.info(`Init plugin #${plugin}`)
      const construct: (Config) => Promise<void> = await import(plugin as string)
      await construct(config)
    } else {
      console.info(`Init plugin #${idx}`)
      const construct: (Config) => Promise<void> = plugin
      await plugin(config)
    }
  }))

  // Plugins hook to create API routes
  const app = express()
  config.emit(EVENT_STARTUP_START, { app })

  // Start server
  return new Promise((resolve, reject) => {
    app.listen(config.port, () => {
      config.emit(EVENT_STARTUP_END, { app })
      resolve(app)
    })
  })
}
