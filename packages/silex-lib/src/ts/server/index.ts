import 'source-map-support/register'
import { config } from './config'
import { start } from './start'

start(config).then((app) => {
  console.info(`
I'm ready, listening to port ${config.port}
${config.url}
  `)
})
