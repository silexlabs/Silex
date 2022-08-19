import * as request from 'request'

import * as assert from 'assert'

import { Config } from '../ServerConfig'
import { VHost } from '../../client/site-store/types'
import { VHostData } from '../types'

//////////////////////////////
// Utils
//////////////////////////////
function setTimeoutPromise(time): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), time))
}

function callServer(path, method, token): Promise<{status: string, html_url: string, message: string, cname: string}> {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      url: `https://api.github.com${path}`,
      method,
      headers: {
        'Accept': 'application/vnd.github.mister-fantastic-preview+json',
        'Authorization': token,
        'User-Agent': 'Unifile',
        'X-OAuth-Scopes': 'delete_repo, repo, user',
      },
      // qs: {},
    }
    request(reqOptions, (err, res, body) => {
      try {
        if (err) {
          console.error('Github pages error', err)
          reject(err)
        } else {
          const result = JSON.parse(body)
          resolve(result)
        }
      } catch (e) {
        console.error('Github pages error (try/catch)', err)
        reject(e)
      }
    })
  })
}

//////////////////////////////
// Exported class
//////////////////////////////

export default function HostingGhPages(unifile, config: Config) {
  this.unifile = unifile
  assert(
    this.unifile.listConnectors().find((connectorName) => connectorName === 'github'),
    'Error: the Github service is required in order to activate the Github Pages hosting provider. You need to enable Github in unifile config, or disable Github Pages hosting provider (env var ENABLE_GITHUB_PAGES)',
  )
}

//////////////////////////////
// Publication "hooks"
//////////////////////////////

HostingGhPages.prototype.getDefaultPageFileName = (context) => 'index.html'

HostingGhPages.prototype.finalizePublication = function({from, to, session}, onStatus) {
  return setTimeoutPromise(2000)
  .then(() => {
    return new Promise((resolve, reject) => {
      try {
        const repo = to.path.split('/')[0]
        const owner = session.github.account.login
        const path = `/repos/${owner}/${repo}/pages`
        resolve(
          callServer(path, 'GET', session.github.token)
          .then((result) => {
            if (result.status) {
              switch (result.status) {
                case 'queued':
                  onStatus('Waiting for Github Pages to start deployment')
                  return this.finalizePublication({from, to, session}, onStatus)
                  break
                case 'building':
                  onStatus('Deploying to Github Pages')
                  return this.finalizePublication({from, to, session}, onStatus)
                  break
                case 'built':
                  onStatus('Done, the site is live on Github Pages')
                  return result.html_url
                  break
                case 'errored':
                  onStatus('Github page build error')
                  throw new Error('Github page build error')
                  break
              }
            } else {
              console.error('Unknown Github pages error', result)
              reject(new Error(result.message || 'Unknown Github Pages error.'))
            }
          }),
        )
      } catch (e) {
        reject(e)
      }
    })
  })
}

//////////////////////////////
// Front end exposed methods
//////////////////////////////

HostingGhPages.prototype.getOptions = function(session) {
  const infos = this.unifile.getInfos(session, 'github')
  return {
    name: 'ghpages',
    displayName: 'Github Pages',
    isLoggedIn: infos.isLoggedIn,
    username: infos.username,
    authorizeUrl: './ce/github/authorize', // add "./" in case we serve silex with a rootPath
    dashboardUrl: 'https://www.github.com',
    pleaseCreateAVhost: 'create an empty repository.',
    vhostsUrl: '/hosting/ghpages/vhost',
    buyDomainUrl: 'https://www.gandi.net',
    skipFolderSelection: true,
    skipVhostSelection: false,
    afterPublishMessage: 'Your website is now live.',
  }
}

HostingGhPages.prototype.getVhosts = async function(session): Promise<VHost> {
  const repos = await (this.unifile.readdir(session, 'github', '/'))
  return repos
  .sort((a, b) => {
    return (new Date(b.modified) as any) - (new Date(a.modified) as any)
  })
  .map((file) => {
    return {
      name: file.name,
      domainUrl: `/hosting/ghpages/vhost/${ file.name }`,
      skipDomainSelection: false,
      publicationPath: {
        // absPath: `/ce/github/get/${ file.name }/gh-pages`,
        name: 'gh-pages',
        folder: file.name,
        path: `${ file.name }/gh-pages`,
        service: 'github',
        url: `https://${ session.github.account.login }.github.io/${ file.name }/`,
      },
    }
  })
}

HostingGhPages.prototype.getVhostData = async (session, vhostName: string): Promise<VHostData> => {
  const owner = session.github.account.login
  const path = `/repos/${owner}/${ vhostName }/pages`
  const result =  await callServer(path, 'GET', session.github.token)
  return {
    domain: result.cname,
    url: result.html_url,
    status: result.status,
  }
}

HostingGhPages.prototype.setVhostData = async function(session, vhostName: string, data: VHostData) {
  // TODO: use https://developer.github.com/v3/repos/pages/#update-information-about-a-pages-site
  if (data && data.domain && data.domain !== '') {
    return this.unifile.writeFile(session, 'github', `/${ vhostName }/gh-pages/CNAME`, data.domain)
    .then(() => setTimeoutPromise(5000))
    .then(() => this.getVhostData(session, vhostName))
  } else {
    // TODO: use https://developer.github.com/v3/repos/pages/#update-information-about-a-pages-site
    return this.unifile.unlink(session, 'github', `/${ vhostName }/gh-pages/CNAME`)
    .catch((err) => {
      if (err.code !== 'ENOENT') {
        console.error('Github pages error', err)
        return Promise.reject(err)
      }
      // there was no CNAME file, not a real error
      return Promise.resolve()
    })
    .then(() => setTimeoutPromise(5000))
    .then(() => this.getVhostData(session, vhostName))
  }
}
