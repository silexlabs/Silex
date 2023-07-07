import { Router } from 'express'
import { ServerConfig } from '../config'
import { noCache } from '../../plugins/Cache'

import connectorApi from './connectorApi'
import websiteApi from './websiteApi'
import publicationApi from './publicationApi'

export default function(config: ServerConfig): Router {
  const router = Router()
  router.use(noCache)

  router.use('/connector', connectorApi(config))
  router.use('/website', websiteApi(config))
  router.use('/publications', publicationApi(config))

  return router
}
