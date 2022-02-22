import Request from 'request'
import * as express from 'express'
import * as Path from 'path'

import { Config } from '../ServerConfig'
import { Hosting } from '../../client/site-store/types'
import { HostingProvider, VHostData } from '../types'
import HostingGhPages from '../hosting-provider/HostingGhPages'
import HostingUnifile from '../hosting-provider/HostingUnifile'
import PublishJob from '../publication/PublishJob'

import * as w3cjs from 'w3cjs'
import { JSDOM } from 'jsdom'

const hostingProviders: HostingProvider[] = []
const router = express.Router()

declare module 'express-session' {
  export interface SessionData {
    unifile: any
    publicationId: any
  }
}

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
      PublishJob.create(req.body, unifile, req.session, req.cookies, rootUrl, getHostingProvider(req.session.unifile, req.body.provider.name), config)
      res.end()
    }
  })

  router.get('/tasks/publishState', (req: express.Request, res: express.Response) => {
    const publishJob = PublishJob.get(req.session.publicationId)
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
    const session = !!req.session && !!req.session.unifile ? req.session.unifile : {}
    const hosting: Hosting = {
      providers: hostingProviders.map((hostingProvider) => hostingProvider.getOptions(session)),
      skipHostingSelection,
    }
    res.json(hosting)
  })

  // vhosts
  router.get('/hosting/:hostingProviderName/vhost', (req: express.Request, res: express.Response) => {
    const hostingProvider = getHostingProviderFromReq(req)
    const hostingProviderInfo = hostingProvider.getOptions(req.session.unifile)
    hostingProvider.getVhosts(req.session.unifile)
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
    hostingProvider.getVhostData(req.session.unifile, req.params.name)
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
    hostingProvider.setVhostData(req.session.unifile, req.params.name, data)
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
    hostingProvider.setVhostData(req.session.unifile, req.params.name, null)
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
  // Checks after publish
  router.get(/\/validate\/(.*)\/get\/(.*)/, async (req: express.Request, res: express.Response) => {
    const connector = req.params[0]
    const path = req.params[1]
    const url = new URL(`${ rootUrl }/ce/${ connector }/get/${ Path.dirname(path) }/`)
    const bufferHTML = await (async function() {
      try {
        return await unifile.readFile(req.session.unifile, connector, path) // keep await here because of the try catch
      } catch (err) {
        console.error('Validation error: could not get the web page ' + path, err)
        res.status(404).send({
          message: `Validation error: could not get the web page ${path}: ${err.message} (${err.code})`,
        })
        return null
      }
    })()
    if(bufferHTML) {
      w3cjs.validate({
        //file: 'demo.html', // file can either be a local file or a remote file
        //file: 'http://html5boilerplate.com/',
        //input: '<html>...</html>',
        input: bufferHTML,
        output: 'html', //'json', // Defaults to 'json', other option includes html
        callback: function (err, result) {
          if(err) {
            console.error('Validation error: could not validate the web page ' + path, err)
            res.status(400).send(`Validation error: could not validate the web page ${path}: ${err.message} (${err.code})`)
          } else {
            // depending on the output type, res will either be a json object or a html string
            const html = result.toString('utf-8')
            const dom = new JSDOM(html, { url: 'https://validator.w3.org/nu/'})
            const doc = dom.window.document
            const base = doc.createElement('base')
            base.setAttribute('href', 'https://validator.w3.org/nu/')
            doc.head.insertBefore(base, doc.head.firstChild)
            res.send(dom.serialize())
          }
        }
      })
    }
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
  const hostingProvider = getHostingProvider(req.session.unifile, hostingProviderName)
  if (!hostingProvider) { throw new Error(('Could not find the hosting provider ' + hostingProviderName)) }
  return hostingProvider
}

function getHostingProvider(session, hostingProviderName: string) {
  return hostingProviders.find((hostingProvider) => hostingProvider.getOptions(session).name === hostingProviderName)
}
