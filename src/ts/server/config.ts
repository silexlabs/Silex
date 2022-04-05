/**
 * @fileoverview this is where the default config is defined
 * The values can be overriden with env vars or before passing the config to Silex
 * @see {@link https://github.com/lexoyo/silex-for-hosting-company|example of customization with the config object}
 * @see {@link https://github.com/silexlabs/Silex/blob/develop/app.json|all the env vars in this definition file for heroku 1 click deploy}
 * @see {@link https://github.com/silexlabs/Silex/wiki/How-to-Host-An-Instance-of-Silex#environment-variables|Silex env vars}
 */

/**
 * default config for Silex server
 */
import { Config } from './types';

const port = process.env.PORT || '6805' // 6805 is the date of sexual revolution started in paris france 8-)
const debug = process.env.SILEX_DEBUG === 'true'

export const config: Config = {
  port,
  debug,
  url: process.env.SERVER_URL || `http://localhost:${port}`,
  apiPath: '/api',
  sessionSecret: process.env.SILEX_SESSION_SECRET || 'replace this session secret in env vars',
  sslOptions: {
    forceHttps: process.env.SILEX_FORCE_HTTPS === 'true',
    trustXFPHeader: process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER === 'true',
    privateKey: process.env.SILEX_SSL_PRIVATE_KEY,
    certificate: process.env.SILEX_SSL_CERTIFICATE,
    sslPort: process.env.SSL_PORT || '443',
  },
  staticOptions: {
    routes: [
      {
        route: '/',
        path: 'public',
      }, {
        route: '/',
        path: 'dist/client',
      }, {
        route: '/libs/templates/silex-templates',
        module: 'silex-templates',
      }, {
        route: '/libs/templates/silex-blank-templates',
        module: 'silex-blank-templates',
      },
      {
        path: 'dist',
        module: 'grapesjs',
      },
      {
        path: 'dist',
        module: 'grapesjs-blocks-basic',
      },
      {
        path: 'dist',
        module: 'grapesjs-plugin-header',
      },
      {
        path: 'dist',
        module: 'grapesjs-plugin-header',
      },
      {
        path: 'node_modules/grapesjs/dist/fonts',
        route: '/fonts',
      },
    ]
    // add project route for source maps
    .concat(debug ? {
      route: '/',
      path: './',
    } : []),
  },
}
