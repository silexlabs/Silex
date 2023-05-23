import getConfig from './config'
import start  from './start'

// Main app
async function main() {
  const config = await getConfig()

  // start silex
  const app = await start(config)

  console.info(`
I'm ready, listening to port ${config.port}
${config.url}
  `)
  if (config.debug) {
    startLiverReload()
  }
}
main()

// livereload
import { createServer } from 'livereload'
import { resolve } from 'path'
function startLiverReload() {
  const dist = resolve(__dirname, '../client')
  const server = createServer({
    delay: 0,
  }, () => {
    console.info(`\nDebug mode\nLive reload server is running.\nWatching ${dist}`)
  })
  server.watch(dist)
}
