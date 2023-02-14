// node modules
import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as cookieParser from 'cookie-parser'
import * as express from 'express'
import { Application } from 'express'
import * as session from 'cookie-session'

import SslRouter from './router/SslRouter'
import StaticRouter from './router/StaticRouter'
import PublishRouter from './router/PublishRouter'
import WebsiteRouter from './router/WebsiteRouter'

function noCache(req, res, next) {
  res.header('Cache-Control', 'private,no-cache,no-store,must-revalidate,proxy-revalidate')
  res.header('Expires', '-1')
  res.header('Pragma', 'no-cache')
  next()
}

function withCache(req, res, next) {
  res.header('Cache-Control', 'public,max-age=86400,immutable') // 24h
  next()
}

const isReady = false
export async function start(config): Promise<Application> {
  return new Promise((resolve, reject) => {
    const app = express()

    if(isReady) {
      resolve(app)
    } else {
      if (config.debug) {
        // FIXME: enable sourcemap
      }

      // compress gzip when possible
      app.use(compression())

      // cookie & session
      app.use(bodyParser.json({limit: '1mb'}))
      app.use(bodyParser.text({limit: '10mb'}))
      app.use(cookieParser())
      app.use(session({
        name: 'silex-session',
        secret: config.sessionSecret,
      }))

      // API routes
      app.use(withCache,  StaticRouter(config))
      const websiteRouter = WebsiteRouter()
      const publishRouter = PublishRouter(config)
      app.use(noCache, websiteRouter)
      app.use(noCache, publishRouter)
      app.use(SslRouter(config, app))

      // start server
      app.listen(config.port, () => {
        resolve(app)
      })
    }
  })
}
