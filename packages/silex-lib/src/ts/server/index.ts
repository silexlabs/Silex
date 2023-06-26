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
