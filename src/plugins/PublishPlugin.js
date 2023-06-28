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

const express = require('express')

const { noCache } = require('./Cache')
const { minify } = require('html-minifier')

const defaultPublication = {
  path: 'publication',
  url: '',
  autoHomePage: true,
  assets: { path: 'assets', url: '/assets' },
  html: { path: '' },
  css: { path: 'css', url: '/css' },
}

module.exports = async function(config, opts = {}) {
  const options = {
    // Defaults
    statusUrl: process.env.SILEX_PUBLICATION_STATUS_URL,
    backend: 'src/plugins/DefaultBackend.js',
    // Options
    ...opts,
  }

  config.on('silex:startup:start', ({app}) => {
    const router = express.Router()

    // List hosting providers
    router.get('/api/hosting', async function (req, res) {
      const hostingProviders = config.getHostingProviders()
      const list = await Promise.all(hostingProviders.map(async (hostingProvider) => ({
        name: hostingProvider.name,
        icon: hostingProvider.icon,
        disableLogout: !!hostingProvider.disableLogout,
        url: await hostingProvider.getAuthorizeURL(req.session),
        isLoggedIn: await hostingProvider.isLoggedIn(req.session),
      })))
      res.json(list)
    })

    // Logout route
    // Suppress the session data for the hosting provider
    router.post('/api/hosting/logout', async function (req, res) {
      console.log('logout', req.query.name)
      const hostingProviders = config.getHostingProviders()
      const hostingProvider = hostingProviders.find(h => h.name === req.query.name)
      if (!hostingProvider) {
        console.error('Error in the request, hosting provider not found:', req.query.name)
        res.status(400).json({
          error: true,
          message: 'Error in the request, hosting provider not found: ' + req.query.name,
        })
        return
      }
      await hostingProvider.logout(req.session)
      res.json({
        error: false,
        message: 'OK',
      })
    })
    // Login success route
    // Post a message to the opener window with the data from the hosting provider in the query string
    router.get('/api/hosting/login/success', async function (req, res) {
      const hostingProviders = config.getHostingProviders()
      const hostingProvider = hostingProviders.find(h => h.name === req.query.name)
      if (!hostingProvider) {
        console.error('Error in the request, hosting provider not found:', req.query.name)
        const data = {
          error: true,
          message: 'Error in the request, hosting provider not found: ' + req.query.name,
          isLoggedIn: false,
          id: req.query.id,
          type: 'login',
        }
        res.status(400).send(`
          <html>
            <head>
              <script>
                window.opener.postMessage(${JSON.stringify(data)}, '*')
                window.close()  
              </script>
            </head>
            <body>
              <p>Error in the request, hosting provider not found: ${req.query.name}</p>
              <p>Close this window</p>
            </body>
          </html>
        `)
        return
      }
      const data = {
        name: hostingProvider.name,
        icon: hostingProvider.icon,
        disableLogout: !!hostingProvider.disableLogout,
        url: await hostingProvider.getAuthorizeURL(req.session),
        isLoggedIn: true,
        id: req.query.id,
        type: 'login',
      }
      res.send(`
        <html>
          <head>
            <script>
              window.opener.postMessage(${JSON.stringify(data)}, '*')
              window.close()  
            </script>
          </head>
          <body>
            <p>Close this window</p>
          </body>
        </html>
      `)
    })

    // Publish website
    router.post('/api/publish', async function (req, res) {
      const session = req.session
      // Check params
      const { files, id, publication } = req.body.data
      const publicationSettings = {
        ...defaultPublication,
        ...publication,
      }
      if (!files || !id) {
        console.error('Error in the request, params are required:', { id, files })
        res.status(400).send({
          message: 'Error in the request, params required: id, files',
        })
        return
      }
      const hostingProviders = config.getHostingProviders()
      const hostingProvider = publicationSettings.hosting ? hostingProviders.find(h => h.name === publicationSettings.hosting) : hostingProviders[0]
      if (!hostingProvider) {
        console.error('Error in the request, hosting provider not found:', publicationSettings.hosting)
        res.status(400).send({
          message: 'Error in the request, hosting provider not found: ' + publicationSettings.hosting,
        })
        return
      }
      if (!hostingProvider.isLoggedIn(session)) {
        console.error('User not logged in')
        res.status(401).send({
          message: `You must be logged in with ${hostingProvider.name} to publish`,
          authorizeUrl: hostingProvider.getAuthorizeURL(req.session),
        })
        return
      }
      // Optim HTML
      files.forEach(file => {
        file.html = minify(file.html, {
          continueOnParseError: true,
          collapseInlineTagWhitespace: true,
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
        }).trim()
      })
      // Publication
      const filesList = files.flatMap(file => ([{
        path: file.htmlPath,
        content: file.html,
      }, {
        path: file.cssPath,
        content: file.css,
      }]))
      try {
        console.log('Publishing the website', id, filesList, session)
        await hostingProvider.writeFiles(session, id, filesList)
      } catch (err) {
        console.error('Error publishing the website', err)
        res.status(500).json({ message: `Error publishing the website. ${err.message}` })
        return
      }
      res.json({
        url: await hostingProvider.getFileUrl(session, id, '/index.html'),
        statusUrl: await hostingProvider.getPublicationStatusUrl(session, id),
      })
    })

    app.use(noCache,  router)
  })
}
