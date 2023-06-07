const express = require('express')
const nodeModules = require('node_modules-path')
const serveStatic = require('serve-static')
const { withCache } = require('./Cache')

const Path = require('path')

// type StaticOptions = {
//   routes?: {
//     path?: string
//     route?: string
//     module?: string
//   }[]
// }

module.exports = async function(config, opts = {}) {
  // Options with defaults
  const options = {
    rootPath: Path.join(__dirname, '../..'),
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

  config.on('silex:startup:start', ({app}) => {
    const router = express.Router()
    options.routes
      .forEach(folder => {
        // either the module root folder or silex root folder
        const path = Path.join(options.rootPath, folder.path || '')
        if (!folder.route) throw new Error('The config for static module has no `route` attribute: ' + folder)
        router.use(folder.route, serveStatic(path))
      })
    app.use(withCache,  router)
  })
}
