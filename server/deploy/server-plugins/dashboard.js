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

/**
 * @fileoverview SaaS multi-site dashboard plugin (monorepo glue).
 * Serves the pre-built dashboard SPA (the `silex-dashboard` submodule `_site`) at "/",
 * detects the browser language, and redirects "/" to the localized dashboard unless an
 * editor `?id` is present (in which case it falls through to the editor served by
 * StaticPlugin). Re-implemented against the monorepo dist so the silex-dashboard
 * submodule stays pure content (no stale `@silexlabs/silex/dist/...` requires).
 */
const fs = require('node:fs/promises')
const { join } = require('node:path')
const express = require('express')
const serveStatic = require('serve-static')
const locale = require('locale')
const { withCache } = require('../../../dist/server/server/plugins/Cache')
const { ServerEvent } = require('../../../dist/server/server/events')

const DASHBOARD_ROOT = join(__dirname, '../../../silex-dashboard')

module.exports = async function(config, options) {
  console.log('> Silex dashboard plugin starting', { options })

  const opts = {
    defaultLanguage: 'en',
    rootPath: join(DASHBOARD_ROOT, '_site'),
    ...options,
  }

  // List of languages from silex-dashboard/collections/languages/*.json
  const languages = []
  const langDir = join(DASHBOARD_ROOT, 'collections/languages')
  for (const file of await fs.readdir(langDir)) {
    languages.push(JSON.parse(await fs.readFile(join(langDir, file))))
  }

  // Serve the dashboard and let the editor through when a website ?id is present
  config.on(ServerEvent.STARTUP_START, ({ app }) => {
    const router = express.Router()
    app.use(router)

    // Use cache
    router.use(withCache)

    // Localization: populate req.locale
    router.use(locale(languages.map(l => l.code), opts.defaultLanguage))

    // Serve the dashboard SPA
    router.use('/', serveStatic(opts.rootPath))

    // Redirect "/" to the localized dashboard unless the editor is requested (?id=...)
    const editorRouter = express.Router()
    editorRouter.use('/', (req, res, next) => {
      if (req.path === '/' && !req.query.id) res.redirect(`/${req.locale}/`)
      else next()
    })
    app.use(editorRouter)
  })
}
