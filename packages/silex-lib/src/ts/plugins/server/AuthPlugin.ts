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

// import express from 'express'
// import { Directus } from '@directus/sdk'

export default async function(config, opts = {}) {
//  config.on('silex:startup:start', ({app}) => {
//    const router = express.Router()
//    router.post(['/publish', '/website', '/assets'], async function(req, res, next) {
//      try {
//        const token = req.body.token || opts.directusToken
//        const directus = new Directus(opts.directusUrl)
//        directus.storage.auth_token = token
//        const me = await directus.users.me.read()
//        next()
//      } catch(err) {
//        console.error('Publish failed in auth module. Did you provide a directus token?', err.message)
//        res.status(403).json({ message: err.message })
//      }
//    })
//    app.use(router)
//  })
}
