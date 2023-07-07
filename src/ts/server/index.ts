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

import * as silexApp from './express'
import api from './api/api'
import { createConfig } from './config'

//export * from './express'
//export * from './config'
//export * from './connectors'
//export * from '../events'
//export * from '../constants'
//export * from '../page'

// Main app
export default async function main() {
  // Get the default config object
  const config = createConfig()

  // start silex
  const app = silexApp.create(config)

  // Serve the client config file
  await config.addRoutes(app)

  // Load the config files
  await config.loadConfigFiles()

  // APIs
  app.use('/api', api(config))

  // Start the server
  await silexApp.start(app)

  // All good, server is ready
  console.info(`
I'm ready, listening to port ${config.port}
  `)
  if (config.debug) {
    startLiverReload()
  }
}

// livereload
async function startLiverReload() {
  // Load modules only when needed (they may not even be installed)
  const { createServer } = await import('livereload')
  const { resolve } = await import('path')
  const dist = resolve(__dirname, '../client')
  const server = createServer({
    delay: 0,
  }, () => {
    console.info(`\n> Debug mode\n> Live reload server is running.\n> Watching ${dist}`)
  })
  server.watch(dist)
}

if (require.main === module) {
  main()
}
