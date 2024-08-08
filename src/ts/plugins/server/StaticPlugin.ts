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
import serveStatic from 'serve-static'
import { withCache } from './Cache'
import { ServerEvent } from '../../server/events'

type StaticOptions = {
  routes: {
    path: string
    route: string
  }[]
}

export default async function(config, options: StaticOptions = { routes: [] }) {
  if(!options.routes) throw new Error('The config for static module has no `routes` attribute')
  console.info(`> [StaticPlugin] Serving ${options.routes.length} static files`)

  config.on(ServerEvent.STARTUP_START, ({app}) => {
    const router = express.Router()
    options.routes
      .forEach(folder => {
        if (!folder.route) throw new Error('The config for static module has no `route` attribute')
        if (!folder.path) throw new Error('The config for static module has no `path` attribute')
        console.info(`> [StaticPlugin] Serving static files from ${folder.path} on ${folder.route}`)
        router.use(folder.route, serveStatic(folder.path))
      })
    app.use(withCache,  router)
  })
}
