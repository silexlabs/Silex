import { Router } from 'express'
import { ServerConfig } from '../config.js'
import { noCache } from '~/server/plugins/Cache.js'

import connectorApi from './connectorApi.js'
import websiteApi from './websiteApi.js'
import publicationApi from './publicationApi.js'
import { API_CONNECTOR_PATH, API_PUBLICATION_PATH, API_WEBSITE_PATH } from '~/common/constants.js'

export default function(config: ServerConfig): Router {
  const router = Router()
  router.use(noCache)

  router.use(API_CONNECTOR_PATH, connectorApi(config))
  router.use(API_WEBSITE_PATH, websiteApi(config))
  router.use(API_PUBLICATION_PATH, publicationApi(config))

  return router
}
