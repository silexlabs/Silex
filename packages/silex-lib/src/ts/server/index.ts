import 'source-map-support/register'
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
if(process.env.SILEX_DEBUG) {
  const livereload = require('livereload')
  const { resolve } = require('path')
  const dist = resolve(__dirname, '../client')
  const server = livereload.createServer()
  server.watch(dist)
}
