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

import express, { Application } from 'express'
import bodyParser from 'body-parser'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import session from 'cookie-session'
import cors from 'cors'

import { ServerConfig } from './config'
import { EVENT_STARTUP_START, EVENT_STARTUP_END } from '../events'

export function create(config: ServerConfig): Application {
  // Express app
  const app = express()
  app.set('config', config)

  // CORS
  const options = config.expressOptions
  if (options.cors) {
    console.log('> CORS are ENABLED:', options.cors)
    app.use(cors({
      origin: options.cors,
    }))
  }
  // compress gzip when possible
  app.use(compression() as any)

  // cookie & session
  app.use(bodyParser.json({ limit: options.jsonLimit }))
  app.use(bodyParser.text({ limit: options.textLimit }))
  console.log('> Session name:', options.sessionName)
  app.use(cookieParser() as any)
  app.use(session({
    name: options.sessionName,
    secret: options.sessionSecret,
  }) as any)
  return app
}

export async function start(app: Application): Promise<Application> {
  const config = app.get('config') as ServerConfig

  // Plugins hook to create API routes
  config.emit(EVENT_STARTUP_START, { app })

  // Start server
  return new Promise((resolve, reject) => {
    app.listen(config.port, () => {
      config.emit(EVENT_STARTUP_END, { app })
      resolve(app)
    })
  })
}
