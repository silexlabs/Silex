import * as express from 'express'
import * as Path from 'path'

const router = express.Router()

declare module 'express-session' {
  export interface SessionData {
    unifile: any
    publicationId: any
  }
}

export default function PublishRouter(config) {
  //// Start publication
  //router.post('/publish', (req: express.Request, res: express.Response) => {
  //  if (!req.body.page || !req.body.projectId) {
  //    res.status(400).send({
  //      message: 'Error in the request, hosting provider required',
  //    })
  //  } else {
  //    createPublishJob(req.body, unifile, req.session, req.cookies, rootUrl, getHostingProvider(req.session.unifile, req.body.provider.name), config)
  //    res.end()
  //  }
  //})
  //// Get status of publication
  //router.get('/publish', (req: express.Request, res: express.Response) => {
  //  const publishJob = getPublishJob(req.session.publicationId)
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

