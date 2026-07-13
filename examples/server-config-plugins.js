import { dirname } from 'path'
import { fileURLToPath } from 'url'
import StaticPlugin from '@silexlabs/silex/dist/plugins/server/plugins/server/StaticPlugin.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default (config, opts) => {
  config.addPlugin(StaticPlugin, {
    routes: [
      {
        route: '/plugins/',
        path: __dirname + '/../dist/plugins/client',
      }, {
        route: '/plugins/js/lit-html/',
        path: 'node_modules/lit-html/',
      },
    ],
  })
}
