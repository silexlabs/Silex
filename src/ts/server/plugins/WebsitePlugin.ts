import { Router } from 'express'
import { join } from 'path'
import * as formidable from 'formidable'

import { projectPath, assetsDir, initProjects, initProject, writeProjectData, readProjectData } from '../project'
import { noCache } from '../express'
import { Config } from '../config'
import { EVENT_STARTUP_START } from '../events'
import { WebsiteSettings, Asset, Page, File, Style, WebsiteData } from '../../types'

// import BackwardCompat from '../utils/BackwardCompat'

type WebsiteOptions = {
}

export const EVENT_READ_START = 'EVENT_READ_START'
export const EVENT_READ_END = 'EVENT_READ_END'
export const EVENT_WRITE_START = 'EVENT_WRITE_START'
export const EVENT_WRITE_END = 'EVENT_WRITE_END'
export const EVENT_ASSET_READ_START = 'EVENT_ASSET_READ_START'
export const EVENT_ASSET_READ_END = 'EVENT_ASSET_READ_END'
export const EVENT_ASSET_WRITE_START = 'EVENT_ASSET_WRITE_START'
export const EVENT_ASSET_WRITE_END = 'EVENT_ASSET_WRITE_END'

export default async function(config: Config, opts: WebsiteOptions = {}) {
  // Options with defaults
  const options: WebsiteOptions = {
    ...opts
  }
  config.on(EVENT_STARTUP_START, ({app}) => {
    // const backwardCompat = new BackwardCompat(rootUrl)
    const router = Router()

    // website specials
    router.get('/website', readWebsite)
    router.post('/website', writeWebsite)
    router.get(/\/assets\/(.*)/, readAsset)
    router.post('/assets', writeAsset)

    // Create encessary folders, assyncronously
    initProjects()
    .catch(err => {
      console.error('Error: could not create folder ', err)
    })
    app.use(noCache,  router)
  })

  async function readWebsite(req, res): Promise<void> {
    const projectId = req.body.projectId
    config.emit(EVENT_READ_START, { req, projectId })
    try {
      const data = await readProjectData(projectId)
      config.emit(EVENT_READ_END, { req, res, data, projectId })
      res
      .type('application/json')
      .send(data)
    } catch (err) {
      if(err.code === 'ENOENT') {
        res.json({})
      } else {
        console.error('Read file error', err)
        res.status(400).json({ message: 'Read file error: ' + err.message, code: err.code})
      }
    }
  }

  function fromBody(body) {
    try {
      return [{
        assets: body.assets as Asset[],
        pages: body.pages as Page[],
        files: body.files as File[],
        styles: body.styles as Style[],
        settings: body.settings as WebsiteSettings,
        name: body.name,
        fonts: body.fonts,
        symbols: body.symbols,
      }, null]
    } catch(err) {
      console.error('Could not parse body data', body, err)
      return [null, err]
    }
  }

  async function writeWebsite(req, res) {
    const projectId = req.query.projectId
    initProject(projectId)

    const [data, err] = fromBody(req.body)
    if(err) {
      res.status(400).json({ message: 'Error writing data file, could not parse the provided body: ' + err.message, code: err.code})
      return
    }
    config.emit(EVENT_WRITE_START, { req, projectId, data })
    try {
      await writeProjectData(projectId, data)
    } catch (err) {
      console.error('Error writing data file', err)
      res.status(500).json({ message: 'Error writing data file: ' + err.message, code: err.code})
      return
    }

    config.emit(EVENT_WRITE_END, { res, req, projectId, data })

    res.json({
      message: 'OK',
    })
  }

  async function readAsset(req, res) {
    const projectId = req.query.projectId
    const fileName = req.params[0]
    const uploadDir = await assetsDir(projectId)
    config.emit(EVENT_ASSET_READ_START, { req, projectId, fileName, uploadDir })
    res.sendFile(`${uploadDir}/${fileName}`)
    config.emit(EVENT_ASSET_READ_END, { req, projectId, fileName, uploadDir })
  }

  async function writeAsset(req, res) {
    const projectId = req.query.projectId
    const uploadDir = await assetsDir(projectId)

    initProject(projectId)

    const form = formidable({
      uploadDir,
      filename: (name, ext, part, _form) => `${name}${ext}`,
        multiples: true,
      keepExtensions: true,
    })

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing upload data', err)
        res
        .status(400)
        .json({ message: 'Error parsing upload data: ' + err.message, code: err.code})
        return
      }
      const data = [].concat(files['files[]']) // may be an array or 1 element
      .map(file => {
        const { originalFilename, filepath } = file
        return `${uploadDir}/${originalFilename}`
      })
      config.emit(EVENT_ASSET_WRITE_START, { req, projectId, uploadDir, form, data })
      res.json({ data })
      config.emit(EVENT_ASSET_WRITE_END, { res, req, projectId, uploadDir, form, data })
    })
  }
}
