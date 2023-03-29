import * as express from 'express'
import * as Path from 'path'

import { File } from '../../types'
import { publish } from '../project'
import { EVENT_STARTUP_START } from '../events'
import { Config } from '../config'
import { noCache } from '../express'

const router = express.Router()

declare module 'express-session' {
  export interface SessionData {
    publicationId: string
  }
}

type PublishOptions = {
  statusUrl?: string
}

export const EVENT_PUBLISH_START = 'EVENT_STARTUP_START'
export const EVENT_PUBLISH_END = 'EVENT_PUBLISH_END'

export default async function(config: Config, opts: PublishOptions = {}) {
  // Options with defaults
  const options = {
    statusUrl: process.env.SILEX_PUBLICATION_STATUS_URL,
    ...opts,
  }
  config.on(EVENT_STARTUP_START, ({app}) => {
    // Start publication
    router.post('/publish', async function(req: express.Request, res: express.Response) {
      const { pages, files, projectId } = req.body.data
      if (!pages || !projectId) {
        console.error('Error in the request, pages and projectId parmas required', {projectId})
        res.status(400).send({
          message: 'Error in the request, pages and projectId parmas required',
        })
      } else {
        await config.emit(EVENT_PUBLISH_START, { projectId, files, req})
        let url
        try {
          url = await publish(projectId, files, req.body.data)
        } catch (err) {
          console.error('Error publishing the website', err)
          res.status(500).json({ message: `Error publishing the website. ${err.message}`})
          return
        }
        const mutable = { projectId, files, req, res, url, statusUrl: options.statusUrl }
        await config.emit(EVENT_PUBLISH_END, mutable)
        res.json({
          url: mutable.url,
          statusUrl: mutable.statusUrl,
        })
      }
    })

    app.use(noCache,  router)
  })
}

