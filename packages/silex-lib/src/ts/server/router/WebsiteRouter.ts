import { Router } from 'express'
import { join } from 'path'
import * as formidable from 'formidable'

import { projectPath, assetPath, assetsDir, initProjects, initProject, writeProjectData, readProjectData } from '../project'

import { WebsiteSettings, Asset, Page, File, Style, WebsiteData } from '../../types'

// import BackwardCompat from '../utils/BackwardCompat'

export default function WebsiteRouter() {
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

  // Return a router to the caller
  return router
}

async function readWebsite(req, res): Promise<void> {
  try {
    const data = await readProjectData(req.body.projectId)
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
  try {
    await writeProjectData(projectId, data)
  } catch (err) {
    console.error('Error writing data file', err)
    res.status(500).json({ message: 'Error writing data file: ' + err.message, code: err.code})
    return
  }

  res.json({
    message: 'OK',
  })


}

async function readAsset(req, res) {
  const projectId = req.query.projectId
  const fileName = req.params[0]
  res.sendFile(await assetPath(projectId, fileName))
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

  form.parse(req, (err, fields, files) => {
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
    res.json({ data })
  })
}
