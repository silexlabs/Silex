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

type PublishOptions = object

export const EVENT_PUBLISH_START = 'EVENT_STARTUP_START'
export const EVENT_PUBLISH_END = 'EVENT_PUBLISH_END'

export default async function(config: Config, opts: PublishOptions = {}) {
  // Options with defaults
  const options = {
    ...opts,
  }
  config.on(EVENT_STARTUP_START, ({app}) => {
    // Start publication
    router.post('/publish', async function(req: express.Request, res: express.Response) {
      const { pages, files, projectId } = req.body
      if (!pages || !projectId) {
        res.status(400).send({
          message: 'Error in the request, pages and projectId parmas required',
        })
      } else {
        config.emit(EVENT_PUBLISH_START, { projectId, files, req})
        try {
          await publish(projectId, files, req.body)
        } catch (err) {
          console.error('Error publishing the website', err)
          res.status(500).json({ message: `Error publishing the website. ${err.message}`})
          return
        }
        //req.session.publicationId = createJob(req.body.files, config)
        res.json({})

        config.emit(EVENT_PUBLISH_END, { projectId, files, req, res })
      }
    })
    //// Get status of publication
    //router.get('/publish', (req: express.Request, res: express.Response) => {
    //  const publishJob = getJob(req.session.publicationId)
    //  if (publishJob) {
    //    if (publishJob.error) { res.status(500) }
    //    res.send({
    //      message: publishJob.getStatus(),
    //      stop: publishJob.isStopped(),
    //    })
    //  } else {
    //    res.status(404).send({
    //      message: 'No pending publication.',
    //      stop: true,
    //    })
    //  }
    //})

    app.use(noCache,  router)
  })
}

//let nextJobId = 0
//const jobs = new Map()
//function getJob(id) {
//  return jobs.get(id)
//}
//function createJob(files: File[], config) {
//  const id = `${nextJobId++}-${Math.round(Math.random() * 10000)}`
//
//  return id
//}
