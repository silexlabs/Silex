import getConfig from './config'
import start  from './express'

// Main app
async function main() {
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
main()

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
