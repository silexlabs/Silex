import * as express from 'express'
import * as Path from 'path'

import { File } from '../../types'
import { publish } from '../project'

const router = express.Router()

declare module 'express-session' {
  export interface SessionData {
    publicationId: string
  }
}

export default function PublishRouter(config) {
  // Start publication
  router.post('/publish', async function(req: express.Request, res: express.Response) {
    const { pages, files, projectId } = req.body
    if (!pages || !projectId) {
      res.status(400).send({
        message: 'Error in the request, pages and projectId parmas required',
      })
    } else {
      try {
        await publish(projectId, files, req.body)
      } catch (err) {
        console.error('Error publishing the website', err);
        res.status(500).json({ message: `Error publishing the website. ${err.message}`});
        return;
      }
      //req.session.publicationId = createJob(req.body.files, config)
      res.json({})
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

  return router
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
