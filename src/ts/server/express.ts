import express, { Application } from 'express'

import { ServerConfig } from './config'
import { EVENT_STARTUP_START, EVENT_STARTUP_END } from '../events'

export default async function(config: ServerConfig): Promise<Application> {
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
