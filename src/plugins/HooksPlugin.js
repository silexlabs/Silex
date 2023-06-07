import { Config } from '../config'
import { EVENT_WRITE_END, EVENT_ASSET_WRITE_END } from './WebsitePlugin'
import { EVENT_PUBLISH_END } from './PublishPlugin'
import fetch from 'node-fetch'
import { projectPath, assetsDir } from '../project'

// type HooksOptions = {
//   gitUrl?: string
//   buildUrl?: string
// }

const rootPath = process.env.DATA_FOLDER

module.exports = async function(config, opts = {}) {
  // Options with defaults
  const options = {
    gitUrl: process.env.SILEX_HOOK_GIT,
    buildUrl: process.env.SILEX_HOOK_BUILD,
    ...opts
  }
  config.on(EVENT_WRITE_END, async ({ res, req, projectId, data }) => {
    if(options.gitUrl) {
      await hook(options.gitUrl, {
        path: projectPath(projectId),
        message: 'Change from Silex',
      })
    }
  })
  config.on(EVENT_ASSET_WRITE_END, async ({ res, req, projectId, uploadDir, form, data }) => {
    if(options.gitUrl) {
      await hook(options.gitUrl, {
        path: projectPath(projectId),
        message: 'Change from Silex',
      })
    }
  })
  config.on(EVENT_PUBLISH_END, async ({ projectId, files, req, res }) => {
    if(options.buildUrl) {
      await hook(options.buildUrl)
    }
  })
}

async function hook(url, params = {}) {
  if(url) {
    const urlObj = new URL(url)
    console.log('Calling hook', {url})
    try {
      Object.keys(params)
        .forEach(key => urlObj.searchParams.append(key, params[key]))
      return fetch(urlObj.toString())
    } catch(error) {
      console.log('Hook call failed', {url, error})
      return null
    }
  }
}
