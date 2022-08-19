// node modules
import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as cookieParser from 'cookie-parser'
import * as express from 'express'
import * as session from 'cookie-session'

import { Config } from './ServerConfig'
import CloudExplorerRouter from './router/CloudExplorerRouter'
import PublishRouter from './router/PublishRouter'
import SslRouter from './router/SslRouter'
import StaticRouter from './router/StaticRouter'
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

export default function SilexServer(config: Config) {
  if (config.serverOptions.debug) {
    require('source-map-support').install()
  }

  this.config = config

  this.app = express()

  // compress gzip when possible
  this.app.use(compression())

  // cookie & session
  this.app.use(bodyParser.json({limit: '1mb'}))
  this.app.use(bodyParser.text({limit: '10mb'}))
  this.app.use(cookieParser())
  this.app.use(session({
    name: 'silex-session',
    secret: this.config.serverOptions.sessionSecret,
  }))

  // create the routes for unifile/CloudExplorer
  // and for Silex tasks
  this.staticRouter = StaticRouter(this.config.staticOptions)
  this.ceRouter = CloudExplorerRouter(this.config.ceOptions)
  this.websiteRouter = WebsiteRouter(this.config.serverOptions, this.ceRouter.unifile)
  this.publishRouter = PublishRouter(this.config, this.ceRouter.unifile)
  this.sslRouter = SslRouter(this.config.sslOptions, this.app)
  this.unifile = this.ceRouter.unifile // for access by third party
}

SilexServer.prototype.start = function(cbk) {
  // use routers
  this.app.use(this.config.serverOptions.cePath, this.ceRouter) // CE handles cache headers
  this.app.use(this.config.serverOptions.rootPath, withCache, this.staticRouter)
  this.app.use(this.config.serverOptions.rootPath, noCache, this.websiteRouter)
  this.app.use(this.config.serverOptions.rootPath, noCache, this.publishRouter)
  this.app.use(this.config.serverOptions.rootPath, this.sslRouter)

  // server 'loop'
  this.app.listen(this.config.serverOptions.port, () => {
    console.info(`\nI'm ready, serving Silex on ${this.config.serverOptions.rootUrl}\n`)
    if (cbk) { cbk() }
  })
}
