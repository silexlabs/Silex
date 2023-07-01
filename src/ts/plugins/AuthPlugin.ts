import express from 'express';
import { Directus } from '@directus/sdk';

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
