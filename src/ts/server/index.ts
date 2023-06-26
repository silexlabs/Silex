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

import getConfig from './config'
import start  from './express'

import * as config from './config'
import * as types from '../types'
import * as events from '../events'
import * as constants from '../constants'
import * as page from '../page'

export { config, types, events, constants, page, start, getConfig }

// Main app
export default async function main() {
  // Get the default config object
  const config = await getConfig()

  // Here one can mutate the config object
  // Check the docs, look for the "add silex to your project as an npm dependency"

  // start silex
  const app = await start(config)

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
