import { Config } from '../config'
import { EVENT_WRITE_END, EVENT_ASSET_WRITE_END } from './WebsitePlugin'
import { EVENT_PUBLISH_END } from './PublishPlugin'
import fetch from 'node-fetch'
import { projectPath, assetsDir } from '../project'

type HooksOptions = {
  gitUrl?: string
  buildUrl?: string
}
const rootPath = process.env.DATA_FOLDER

export default async function(config: Config, opts: HooksOptions = {}) {
  // Options with defaults
  const options: HooksOptions = {
    gitUrl: process.env.SILEX_HOOK_GIT,
    buildUrl: process.env.SILEX_HOOK_BUILD,
    ...opts
  }
  console.log('Hooks', options)
  config.on(EVENT_WRITE_END, async ({ res, req, projectId, data }) => {
    console.log(EVENT_WRITE_END, {projectId})
    if(options.gitUrl) {
      await hook(options.gitUrl, {
        path: projectPath(projectId),
        message: 'Change from Silex',
      })
    }
    if(options.buildUrl) {
      await hook(options.buildUrl)
    }
  })
  config.on(EVENT_ASSET_WRITE_END, async ({ res, req, projectId, uploadDir, form, data }) => {
    console.log(EVENT_ASSET_WRITE_END)
    if(options.gitUrl) {
      await hook(options.gitUrl, {
        path: projectPath(projectId),
        message: 'Change from Silex',
      })
    }
  })
  config.on(EVENT_PUBLISH_END, async ({ projectId, files, req, res }) => {
    console.log(EVENT_PUBLISH_END)
    if(options.buildUrl) {
      await hook(options.buildUrl)
    }
  })
}

async function hook(url, params = {}) {
  console.log('Calling hook', url, params)
  if(url) {
    const urlObj = new URL(url)
    Object.keys(params)
      .forEach(key => urlObj.searchParams.append(key, params[key]))
    const response = await fetch(urlObj.toString())
    console.log('Called hook', urlObj.toString(), response.status, response.statusText, response.ok)
    return response
  }
}

