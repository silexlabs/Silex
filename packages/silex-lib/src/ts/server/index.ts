import { config } from './config'
import { start } from './start'

// start silex
start(config).then((app) => {
  console.info(`
I'm ready, listening to port ${config.port}
${config.url}
  `)
})

// livereload
import { createServer } from 'livereload'
import { resolve } from 'path'
if(process.env.SILEX_DEBUG) {
  const dist = resolve(__dirname, '../client')
  const server = createServer({
    delay: 0,
  }, () => {
    console.info(`\nDebug mode\nLive reload server is running.\nWatching ${dist}`)
  })
  server.watch(dist)
}
