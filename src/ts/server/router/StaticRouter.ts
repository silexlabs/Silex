import * as express from 'express'
import * as nodeModules from 'node_modules-path'
import * as serveStatic from 'serve-static'

import * as Path from 'path'

import { Config } from '../types';

const rootPath = Path.join(__dirname, '../../..')

export default function(config: Config) {
  const router = express.Router()
  config.staticOptions.routes
  .forEach(folder => {
    // either the module root folder or silex root folder
    const rootFolder = folder.module ? `${nodeModules(folder.module)}/${folder.module}` : rootPath
    const path = Path.join(rootFolder, folder.path || '')
    const route = folder.module && !folder.route ? `/libs/${ folder.module }` : folder.route
    if (!route) throw new Error(`The config for static module requires either \`route\` or \`module\``)
    router.use(route, serveStatic(path))
  })
  return router
}
