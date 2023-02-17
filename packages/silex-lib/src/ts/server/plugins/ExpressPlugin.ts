import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as cookieParser from 'cookie-parser'
import * as session from 'cookie-session'

import { EVENT_STARTUP_START } from '../events'
import { Config } from '../config'

type ExpressOptions = {
  jsonLimit?: string
  textLimit?: string
  sessionName?: string
  sessionSecret?: string
}

export default async function(config: Config, opts: ExpressOptions = {}) {
  // Options with defaults
  const options = {
    jsonLimit: process.env.SILEX_EXPRESS_JSON_LIMIT || '1mb',
    textLimit: process.env.SILEX_EXPRESS_TEXT_LIMIT || '10mb',
    sessionName: process.env.SILEX_SESSION_NAME || 'silex-session',
    sessionSecret: process.env.SILEX_SESSION_SECRET || 'replace this session secret in env vars',
    ...opts,
  }

  config.on(EVENT_STARTUP_START, ({app}) => {
    // compress gzip when possible
    app.use(compression())

    // cookie & session
    app.use(bodyParser.json({limit: options.jsonLimit}))
    app.use(bodyParser.text({limit: options.textLimit}))
    app.use(cookieParser())
    app.use(session({
      name: options.sessionName,
      secret: options.sessionSecret,
    }))
  })
}

