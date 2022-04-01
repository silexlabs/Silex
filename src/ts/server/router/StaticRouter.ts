import * as express from 'express'
import * as nodeModules from 'node_modules-path'
import * as Path from 'path'
import * as serveStatic from 'serve-static'
import { StaticOptions } from '../config'

const rootPath = Path.join(__dirname, '../../..')

export default function(staticOptions: StaticOptions) {
  const router = express.Router()
  staticOptions.routes
  .forEach(folder => {
    // either the module root folder or silex root folder
    const rootFolder = folder.module ? `${nodeModules(folder.module)}/${folder.module}` : rootPath
    const path = Path.join(rootFolder, folder.path)
    router.use(folder.route, serveStatic(path))
  })
  return router
}
