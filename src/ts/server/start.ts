import * as express from 'express'
import { Application } from 'express'

import { Config } from './config'
import { EVENT_STARTUP_START, EVENT_STARTUP_END } from './events'

export async function start(config: Config): Promise<Application> {
  // Plugins
  Promise.all(config.plugins.map(async (plugin: any, idx) => {
    if(typeof plugin === 'string') {
      console.info(`Init plugin #${plugin}`)
      const construct: (config: Config, options: any) => Promise<void> = await import(plugin as string)
      await construct(config, config.pluginsOpts[plugin as string])
    } else {
      console.info(`Init plugin #${idx}`)
      const construct: (config: Config, options: any) => Promise<void> = plugin
      await construct(config, config.pluginsOpts[plugin as string])
    }
  }))

  // Plugins hook to create API routes
  const app = express()
  await config.emit(EVENT_STARTUP_START, { app })

  // Start server
  return new Promise((resolve, reject) => {
    app.listen(config.port, () => {
      config.emit(EVENT_STARTUP_END, { app })
      resolve(app)
    })
  })
}
