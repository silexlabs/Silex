#!/usr/bin/env node


'use strict'

import 'source-map-support/register'
import { Config } from './ServerConfig'
import SilexServer from './SilexServer'

const config = new Config()
// here you can change config,
// e.g. use config.publishRouterOptions.enableHostingGhPages
const silex = new SilexServer(config)
// here you can change routers,
// e.g. add unifile services `silex.unifile.use(unifileConnector)`
// and use `silex.app.get(...)` to add callbacks
// silex.publishRouter.addHostingProvider(...)
// @see https://github.com/silexlabs/Silex/wiki/Silex-Developer-Guide#add-unifile-services-eg-for-hosting-companies

silex.start(() => {
  // server started
})
