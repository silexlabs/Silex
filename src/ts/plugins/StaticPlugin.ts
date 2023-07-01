import express from 'express'
import nodeModules from 'node_modules-path'
import serveStatic from 'serve-static'
import { withCache } from './Cache'
import { join } from 'path'

type StaticOptions = {
  routes: {
    path: string
    route: string
  }[]
}

export default async function(config, opts = {}) {
  // Options with defaults
  const options: StaticOptions = {
    routes: [
      {
        route: '/',
        path: 'public',
      }, {
        route: '/css/',
        path: nodeModules('@fortawesome/fontawesome-free') + '/@fortawesome/fontawesome-free/css/',
      }, {
        route: '/webfonts/',
        path: nodeModules('@fortawesome/fontawesome-free') + '/@fortawesome/fontawesome-free/webfonts/',
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

  config.on('silex:startup:start', ({app}) => {
    const router = express.Router()
    options.routes
      .forEach(folder => {
        if (!folder.route) throw new Error('The config for static module has no `route` attribute')
        if (!folder.path) throw new Error('The config for static module has no `path` attribute')
        router.use(folder.route, serveStatic(folder.path))
      })
    app.use(withCache,  router)
  })
}
