import * as express from 'express'
import { Config } from '../config'
import { Directus } from '@directus/sdk'
import { EVENT_STARTUP_START } from '../events'

export default async function(config: Config, opts: any = {}) {
  config.on(EVENT_STARTUP_START, ({app}) => {
    const router = express.Router()
    router.post('/publish', async function(req: express.Request, res: express.Response, next) {
      try {
        const token = req.body.token
        const directus = new Directus(opts.directusUrl)
        directus.storage.auth_token = token
        const me = await directus.users.me.read()
        next()
      } catch(err) {
        console.error('Publish failed', err.message)
        res.status(403).json({ message: err.message })
      }
    })
    app.use(router)
  })
}
