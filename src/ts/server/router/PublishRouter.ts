/* tslint:disable:no-string-literal */
import Request from 'request'
import * as express from 'express'
import * as Path from 'path'

import { Config } from '../ServerConfig'
import { Hosting } from '../../client/site-store/types'
import { HostingProvider, VHostData } from '../types'
import HostingGhPages from '../hosting-provider/HostingGhPages'
import HostingUnifile from '../hosting-provider/HostingUnifile'
import PublishJob from '../publication/PublishJob'

import { JSDOM } from 'jsdom'

/* FIXME: this typing throws this error **when silex is installed as a dependency in another project: src/ts/server/router/PublishRouter.ts(16,16): error TS2665: Invalid module name in augmentation. Module 'express-session' resolves to an untyped module at '/home/lexoyo/Documents/silex/stastic-designer/node_modules/express-session/index.js', which cannot be augmented.
=> I changed all `req.session.unifile` to `req.session['unifile']`

import {SessionData} from 'express-session'

declare module 'express-session' {
  export interface SessionData {
    unifile: any
    publicationId: any
  }
}
*/

const hostingProviders: HostingProvider[] = []
const router = express.Router()

export default function PublishRouter(config: Config, unifile) {
  const { port, rootUrl, enableHostingGhPages, enableHostingUnifile, skipHostingSelection } = config.publisherOptions

  if (enableHostingUnifile) {
    const hostingUnifile = new HostingUnifile(unifile, config)
    addHostingProvider(hostingUnifile)
  }

  if (enableHostingGhPages) {
    const hostingGhPages = new HostingGhPages(unifile, config)
    addHostingProvider(hostingGhPages)
  }

  // **
  // publication tasks
  router.post('/tasks/publish', (req: express.Request, res: express.Response) => {
    if (!req.body.provider || !req.body.provider.name) {
      res.status(400).send({
        message: 'Error in the request, hosting provider required',
      })
    } else {
      PublishJob.create(req.body, unifile, req.session, req.cookies, rootUrl, getHostingProvider(req.session['unifile'], req.body.provider.name), config)
      res.end()
    }
  })

  router.get('/tasks/publishState', (req: express.Request, res: express.Response) => {
    const publishJob = PublishJob.get(req.session['publicationId'])
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

  router.get('/hosting/', (req: express.Request, res: express.Response) => {
    const sess = !!req.session && !!req.session['unifile'] ? req.session['unifile'] : {}
    const hosting: Hosting = {
      providers: hostingProviders.map((hostingProvider) => hostingProvider.getOptions(sess)),
      skipHostingSelection,
    }
    res.json(hosting)
  })

  // vhosts
  router.get('/hosting/:hostingProviderName/vhost', (req: express.Request, res: express.Response) => {
    const hostingProvider = getHostingProviderFromReq(req)
    const hostingProviderInfo = hostingProvider.getOptions(req.session['unifile'])
    hostingProvider.getVhosts(req.session['unifile'])
    .then((vhosts) => {
      res.json(vhosts,
        // .slice(0, 10) // max number of vhosts
      )
    })
    .catch((err) => {
      res.status(400).send({
        message: `Error from hosting provider "${ hostingProviderInfo.displayName }": ${ err.message }`,
        err,
      })
    })
  })
  router.get('/hosting/:hostingProviderName/vhost/:name', (req: express.Request, res: express.Response) => {
    const hostingProvider = getHostingProviderFromReq(req)
    hostingProvider.getVhostData(req.session['unifile'], req.params.name)
    .then((result) => {
      res.json(result)
    })
    .catch((err) => {
      res.json({
        domain: '',
        msg: err,
      })
    })
  })
  router.post('/hosting/:hostingProviderName/vhost/:name', (req: express.Request, res: express.Response) => {
    const hostingProvider = getHostingProviderFromReq(req)
    const data: VHostData = {
      domain: req.body.domain,
    }
    hostingProvider.setVhostData(req.session['unifile'], req.params.name, data)
    .then((result) => {
      res.json(result)
    })
    .catch((err) => {
      console.error('Error when trying to attach a domain', req.params.name, data, err)
      res.status(400).send({
        message: `Error when trying to attach a domain to "${ req.params.name }". Error details: ${ err.message }`,
        err,
      })
    })
  })
  router.delete('/hosting/:hostingProviderName/vhost/:name', (req: express.Request, res: express.Response) => {
    const hostingProvider = getHostingProviderFromReq(req)
    hostingProvider.setVhostData(req.session['unifile'], req.params.name, null)
    .then((result) => {
      res.json(result)
    })
    .catch((err) => {
      console.error('Error when trying to delete a domain', req.params.name, err)
      res.status(400).send({
        message: `Error when trying to remove domain from "${ req.params.name }". Error details: ${ err.message }`,
        err,
      })
    })
  })
  // expose addHostingProvider to apps adding hosting providers with silex.publishRouter.addHostingProvider(...))
  ;(router as any).addHostingProvider = (hostingProvider) => addHostingProvider(hostingProvider)
  return router
}

function addHostingProvider(hostingProvider: HostingProvider) {
  console.log('> Adding hosting provider', hostingProvider.getOptions({}).displayName)
  hostingProviders.push(hostingProvider)
}

function getHostingProviderFromReq(req): HostingProvider {
  const hostingProviderName = req.params.hostingProviderName
  const hostingProvider = getHostingProvider(req.session['unifile'], hostingProviderName)
  if (!hostingProvider) { throw new Error(('Could not find the hosting provider ' + hostingProviderName)) }
  return hostingProvider
}

function getHostingProvider(sess, hostingProviderName: string) {
  return hostingProviders.find((hostingProvider) => hostingProvider.getOptions(sess).name === hostingProviderName)
}
