/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import express from 'express'
import { readFileSync } from 'fs'
import { createServer } from 'https'
import forceSSL from 'express-force-ssl'
import { EVENT_STARTUP_START } from '../../events'

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
  config.on(EVENT_STARTUP_START, ({app}) => {
    const router = express.Router()

    // SSL
    // force ssl if the env var SILEX_FORCE_HTTPS is set
    if (options.forceHttps) {
      console.log('> [SslPlugin] Force SSL option is enabled')
      app.set('forceSSLOptions', {
        trustXFPHeader: !!options.trustXFPHeader,
      })
      router.use(forceSSL)
    } else {
      console.log('> [SslPlugin] Force SSL option is disabled, env var SILEX_FORCE_HTTPS not set')
    }

    // SSL certificate
    if (options.privateKey && options.certificate) {
      console.log('> [SslPlugin] SSL certificate is enabled, found certificate:', options.certificate)
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
          console.log('> [SslPlugin] Listening on port ', options.sslPort)
        })
      } catch (e) {
        console.error('> [SslPlugin] Load certificate failed.', e)
      }
    } else {
      console.log('> [SslPlugin] Certificate disabled, env vars SILEX_SSL_CERTIFICATE and SILEX_SSL_PRIVATE_KEY not set')
    }
    app.use(router)
  })
}
