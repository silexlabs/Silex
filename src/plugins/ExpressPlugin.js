const bodyParser = require('body-parser')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const session = require('cookie-session')
const cors = require('cors')

module.exports = async function(config, opts = {}) {
  // Options with defaults
  const options = {
    jsonLimit: process.env.SILEX_EXPRESS_JSON_LIMIT || '1mb',
    textLimit: process.env.SILEX_EXPRESS_TEXT_LIMIT || '10mb',
    sessionName: process.env.SILEX_SESSION_NAME || 'silex-session',
    sessionSecret: process.env.SILEX_SESSION_SECRET || 'replace this session secret in env vars',
    cors: process.env.SILEX_CORS_URL,
    ...opts,
  }

  config.on('silex:startup:start', ({app}) => {
    // CORS
    if (options.cors) {
      console.log('> CORS are ENABLED:', options.cors)
      app.use(cors({
        origin: options.cors,
      }))
    }
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

