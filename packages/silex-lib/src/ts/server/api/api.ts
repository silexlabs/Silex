import { Router } from 'express'
import { ServerConfig } from '../config'
import { noCache } from '../../plugins/Cache'

import connectorApi from './connectorApi'
import websiteApi from './websiteApi'
import publicationApi from './publicationApi'
import { API_CONNECTOR_PATH, API_PUBLICATION_PATH, API_WEBSITE_PATH } from '../../constants'

export default function(config: ServerConfig): Router {
  const router = Router()
  router.use(noCache)

  router.use(API_CONNECTOR_PATH, connectorApi(config))
  router.use(API_WEBSITE_PATH, websiteApi(config))
  router.use(API_PUBLICATION_PATH, publicationApi(config))

  return router
}
