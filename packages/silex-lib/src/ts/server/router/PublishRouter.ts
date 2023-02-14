import * as express from 'express'
import * as Path from 'path'

import { File } from '../../types'

const router = express.Router()

declare module 'express-session' {
  export interface SessionData {
    publicationId: string
  }
}

export default function PublishRouter(config) {
  // Start publication
  router.post('/publish', (req: express.Request, res: express.Response) => {
    if (!req.body.page || !req.body.projectId) {
      res.status(400).send({
        message: 'Error in the request, hosting provider required',
      })
    } else {
      req.session.publicationId = createJob(req.body.files, config)
      res.end()
    }
  })
  // Get status of publication
  router.get('/publish', (req: express.Request, res: express.Response) => {
    const publishJob = getJob(req.session.publicationId)
    if (publishJob) {
      if (publishJob.error) { res.status(500) }
      res.send({
        message: publishJob.getStatus(),
        stop: publishJob.isStopped(),
      })
    } else {
      res.status(404).send({
        message: 'No pending publication.',
        stop: true,
      })
    }
  })

  return router
}

let nextJobId = 0
const jobs = new Map()
function getJob(id) {
  return jobs.get(id)
}
function createJob(files: File[], config) {
  return `${nextJobId++}-${Math.round(Math.random() * 10000)}`
}
