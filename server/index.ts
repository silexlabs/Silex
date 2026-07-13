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

import * as silexApp from './express.js'
import api from './api/api.js'
import { ServerConfig } from './config.js'
import dotenv from 'dotenv'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { DEV_MESSAGE } from '~/common/constants.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Expose API to calling app as function silex()
export * from './expose.js'

// Main app
export default async function silex() {
  // Log Silex version
  console.info(DEV_MESSAGE)
  console.info(`Node version: ${process.version}`)
  console.info(`CWD: ${process.cwd()}`)

  // Load env vars from .env file if any
  const curDirEnv = dotenv.config()
  if (curDirEnv.error) {
    if((curDirEnv.error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.info('> No .env file found in current directory')
    } else {
      throw curDirEnv.error
    }
  } else {
    console.info('> Env vars loaded from .env file')
  }

  // Load default env vars
  // This will not override existing env vars
  const DEFAULT_ENV_FILE = join(__dirname, '../../../.env.default')
  const rootDirEnv = dotenv.config({ path: DEFAULT_ENV_FILE })
  if (rootDirEnv.error) {
    if((rootDirEnv.error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`\n\nFailed to load default env vars. File not found ${DEFAULT_ENV_FILE}\n\n`)
    } else {
      throw new Error(`\n\nFailed to load default env vars. Error in ${DEFAULT_ENV_FILE}: ${ rootDirEnv.error.message }\n\n`)
    }
  }
  console.info('> Default env vars loaded')

  // Get the default config object
  const config = new ServerConfig()

  // start silex
  const app = silexApp.create(config)

  // Serve the client config file
  await config.addRoutes(app)

  // Load the config files
  await config.loadConfigFiles()

  // Init the connectors in case no plugin adds them
  await config.initDefaultConnectors()

  // APIs
  app.use('/api', api(config))

  // Start the server
  await silexApp.start(app)

  // All good, server is ready
  console.info(`\nSilex is ready, open http://localhost:${config.port} in your browser\n`)
  if (config.debug) {
    startLiverReload()
  }
}

// livereload
async function startLiverReload() {
  // Load modules only when needed (they may not even be installed)
  const { createServer } = await import('livereload')
  const { resolve } = await import('path')
  const dist = resolve(__dirname, '../../client')
  const server = createServer({
    delay: 0,
  }, () => {
    console.info(`\n> Debug mode\n> Live reload server is running.\n> Watching ${dist}`)
  })
  server.watch(dist)
}

// Run the server only when this file is the entry point (ESM has no require.main).
// Handles both `node dist/server/server/` (argv[1] = dir) and `node .../index.js`.
const entry = process.argv[1] ? resolve(process.argv[1]) : ''
const thisFile = fileURLToPath(import.meta.url)
if (entry && (thisFile === entry || thisFile === resolve(entry, 'index.js'))) {
  silex()
}
