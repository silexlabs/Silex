import * as express from 'express'
import * as nodeModules from 'node_modules-path'
import * as serveStatic from 'serve-static'

import * as Path from 'path'

import { EVENT_STARTUP_START } from '../events'
import { Config } from '../config'
import { withCache } from '../express'

const rootPath = Path.join(__dirname, '../../..')

type StaticOptions = {
  routes?: {
    path?: string
    route?: string
    module?: string
  }[]
}

export default async function(config: Config, opts: StaticOptions = {}) {
  // Options with defaults
  const options = {
    routes: [
      {
        route: '/',
        path: 'public',
      }, {
        route: '/',
        path: 'dist/client',
      },
    ]
    // add project route for source maps
      .concat(config.debug ? [{
        route: '/',
        path: './',
      }] : []),
    ...opts,
  }

  config.on(EVENT_STARTUP_START, ({app}) => {
    const router = express.Router()
    options.routes
      .forEach(folder => {
      // either the module root folder or silex root folder
        const rootFolder = folder.module ? `${nodeModules(folder.module)}/${folder.module}` : rootPath
        const path = Path.join(rootFolder, folder.path || '')
        const route = folder.module && !folder.route ? `/libs/${ folder.module }` : folder.route
        if (!route) throw new Error('The config for static module requires either `route` or `module`')
        router.use(route, serveStatic(path))
      })
    app.use(withCache,  router)
  })
}
