import express from 'express'
import { readFileSync } from 'fs'
import { createServer } from 'https'
import forceSSL from 'express-force-ssl'

// interface SslOptions {
//   forceHttps?: boolean
//   trustXFPHeader?: boolean
//   privateKey?: string
//   certificate?: string
//   sslPort?: string
// }

export default async function(config, opts = {}) {
  // Options with defaults
  const options = {
    forceHttps: process.env.SILEX_FORCE_HTTPS === 'true',
    trustXFPHeader: process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER === 'true',
    privateKey: process.env.SILEX_SSL_PRIVATE_KEY,
    certificate: process.env.SILEX_SSL_CERTIFICATE,
    sslPort: process.env.SSL_PORT || '443',
    ...opts,
  }

  // Add routes on silex startup
  config.on('silex:startup:start', ({app}) => {
    const router = express.Router()

    // SSL
    // force ssl if the env var SILEX_FORCE_HTTPS is set
    if (options.forceHttps) {
      console.log('> Force SSL option is enabled')
      app.set('forceSSLOptions', {
        trustXFPHeader: !!options.trustXFPHeader,
      })
      router.use(forceSSL)
    } else {
      console.log('> Force SSL option is disabled, env var SILEX_FORCE_HTTPS not set')
    }

    // SSL certificate
    if (options.privateKey && options.certificate) {
      console.log('> SSL certificate is enabled, found certificate:', options.certificate)
      try {
        const privateKey = readFileSync(options.privateKey).toString()
        const certificate = readFileSync(options.certificate).toString()

        const sslServerOptions = {
          key: privateKey,
          cert: certificate,
          requestCert: true,
          rejectUnauthorized: false,
        }

        createServer(sslServerOptions, this).listen(options.sslPort, () => {
          console.log('SSL: listening on port ', options.sslPort)
        })
      } catch (e) {
        console.error('SSL: load certificate failed.', e)
      }
    } else {
      console.log('> SSL certificate disabled, env vars SILEX_SSL_CERTIFICATE and SILEX_SSL_PRIVATE_KEY not set')
    }
    app.use(router)
  })
}
