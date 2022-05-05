import * as cheerio from 'cheerio'
import * as express from 'express'
import * as formidable from 'formidable'

import * as Path from 'path'
import * as _fs from 'fs'

const fs = _fs.promises

import { WebsiteSettings, defaultSettings, defaultSite, Settings, Asset, Page, Style, WebsiteData, WEBSITE_CONTEXT_RUNTIME_CLASS_NAME, WEBSITE_CONTEXT_EDITOR_CLASS_NAME } from '../../types'

// import BackwardCompat from '../utils/BackwardCompat'

export default function WebsiteRouter() {
  // const backwardCompat = new BackwardCompat(rootUrl)
  const router = express.Router()

  // website specials
  router.get('/website', readWebsite)
  router.post('/website', writeWebsite)
  router.get(/\/assets\/(.*)/, readAsset)
  router.post('/assets', writeAsset)

  // router.get(/\/website\/libs\/templates\/(.*)/, readTemplate)

  // **
  // list templates
  // router.use('/get/:folder', getTemplatesList)

  return router
}

async function readWebsite(req, res): Promise<void> {
  try {
    const path = Path.resolve(req.query.projectId, '.silex.data.json')
    const data = await fs.readFile(path)
    res
    .type('application/json')
    .send(data)
  } catch (err) {
    if(err.code === 'ENOENT') {
      res.json(defaultSite)
    } else {
      console.error('Read file error', err)
      res.status(400).json({ message: 'Read file error', error: JSON.stringify(err)})
    }
  }
}

async function getSettings(projectId): Promise<Settings> {
  const path = Path.resolve(projectId, '.silex.json')
  try {
    const settingsBuffer = await fs.readFile(path)
    return {
      ...defaultSettings,
      ...JSON.parse(settingsBuffer.toString()),
    }
  } catch(err) {
    if(err.code === 'ENOENT') {
      return defaultSettings
    } else {
      throw err
    }
  }
}

async function writeWebsite(req, res) {
  const projectId = req.query.projectId
  const data = {
    assets: JSON.parse(req.body.assets) as Asset[],
    pages: JSON.parse(req.body.pages) as Page[],
    styles: JSON.parse(req.body.styles) as Style[],
    settings: req.body.settings as WebsiteSettings,
    name: req.body.name,
  } as WebsiteData
  try {
    const dataFile = Path.resolve(projectId, '.silex.data.json')
    await fs.writeFile(dataFile, JSON.stringify(data))
  } catch (err) {
    console.error('Error writing data file', err)
    res.status(400).json({ message: 'Error writing data file', error: JSON.stringify(err)})
    return
  }

  const settings = await getSettings(projectId) as Settings
  const htmlFolder = Path.resolve(projectId, settings.html.path)
  const cssFolder = Path.resolve(projectId, settings.css.path)
  try {
    await fs.mkdir(htmlFolder, { recursive: true,})
    await fs.mkdir(cssFolder, { recursive: true,})
  } catch (err) {
    console.error('Error: could not create folder ', cssFolder, err)
    res.status(400).json({ message: 'Error: could not create folder', error: JSON.stringify(err)})
    return
  }
  data.pages
  .forEach(async page => {
    // page settings override site settings
    function getSetting(name) {
      if(page.settings && page.settings[name]) return page.settings[name]
        return data.settings[name]
    }
    // update HTML with data from the settings
    const pageName = page.type === 'main' ? 'index' : page.name
    let html
    try {
      // add the settings to the HTML
      const $ = cheerio.load(page.frames[0].html)
      $('head').append(`<link rel="stylesheet" href="${settings.prefix}${settings.css.path}/${pageName}.css" />`)
      $('head').append(getSetting('head'))
      if(!$('head > title').length) $('head').append('<title/>')
      $('head > title').html(getSetting('title'))
      if(!$('head > link[rel="icon"]').length) $('head').append('<link rel="icon" />')
      $('link[rel="icon"]').attr('href', getSetting('favicon'))
      // all metas
      ;['description', 'og:title', 'og:description', 'og:image'].forEach(prop => {
        const sel = `meta[property="${prop}"]`
        if(!$(sel).length) $('head').append(`<meta property="${prop}" />`)
        $(sel).attr('content', getSetting(prop))
      })
      $('html').attr('lang', getSetting('lang'))
      // render the HTML as string
      html = $.html()
    } catch (err) {
      console.error('Error manipulating DOM', page, err)
      res.status(400).json({ message: 'Error manipulating DOM', error: JSON.stringify(err)})
      return
    }
    try {
      await fs.writeFile(Path.resolve(htmlFolder, pageName + '.html'), html)
      await fs.writeFile(Path.resolve(cssFolder, pageName + '.css'), page.frames[0].css)
    } catch (err) {
      console.error('Error writing file', page, err)
      res.status(400).json({ message: 'Error writing file', error: JSON.stringify(err)})
      return
    }
  })

  res.json({
    message: 'OK',
  })


  // const { data, html }: { data: WebsiteData, html: string} = JSON.parse(req.body)
  // console.log({data, html})
  // const [unpreparedData, dom] = unprepareWebsite(new JSDOM(html), data)
  // const str = dom.serialize()
  // // const fullHtml = DomTools.insertUserHeadTag(str, unpreparedData.site.headUser)
  // dom.window.close()

  // if(path.endsWith('.zip')) {
  //   try {
  //     const zip = new Zip()
  //     zip.addFile('editable.html', Buffer.from(str))
  //     zip.addFile('editable.html.json', Buffer.from(JSON.stringify(unpreparedData)))
  //     await fs.writeFile(path, zip.toBuffer())
  //     res.send('Ok')
  //   } catch (err) {
  //     console.error('Zip file error:', err)
  //     res.status(400).json({ message: 'Zip file error', error: JSON.stringify(err)})
  //   }
  // } else {
  //   try {
  //     await fs.writeFile(path, str)
  //     await fs.writeFile(path + '.json', unpreparedData)
  //     res.send('Ok')
  //   } catch (err) {
  //     console.error('Read file error', err)
  //     res.status(400).json({ message: 'Read file error', error: JSON.stringify(err)})
  //   }
  // }
}

// /**
//  * prepare website for edit mode
//  * TODO: clone the dom, do not alter the initial one
//  */
// function prepareWebsite(dom: JSDOM, data: WebsiteData): [WebsiteData, JSDOM] {
//   dom.window.document.body.classList.remove(WEBSITE_CONTEXT_RUNTIME_CLASS_NAME)
//   dom.window.document.body.classList.add(WEBSITE_CONTEXT_EDITOR_CLASS_NAME)
//   return [data, dom]
// }
// /**
//  * prepare website for being saved
//  * TODO: clone the dom, do not alter the initial one
//  */
// export function unprepareWebsite(dom: JSDOM, data: WebsiteData): [WebsiteData, JSDOM] {
//   dom.window.document.body.classList.add(WEBSITE_CONTEXT_RUNTIME_CLASS_NAME)
//   dom.window.document.body.classList.remove(WEBSITE_CONTEXT_EDITOR_CLASS_NAME)
//   return [data, dom]
// }

async function readAsset(req, res) {
  const projectId = req.query.projectId
  const settings = await getSettings(projectId)
  const uploadDir = Path.resolve(projectId, settings.assets.path)
  const fileName = req.params[0]
  res.sendFile(Path.resolve(uploadDir, fileName))
}

async function writeAsset(req, res) {
  const projectId = req.query.projectId
  const settings = await getSettings(projectId)
  const uploadDir = Path.resolve(projectId, settings.assets.path)
  await fs.mkdir(uploadDir, { recursive: true,})
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
      .json({ message: 'Error parsing upload data', error: JSON.stringify(err)})
      return
    }
    const data = [].concat(files['files[]']) // may be an array or 1 element
    .map(file => {
      const { originalFilename, filepath } = file
      return `${settings.prefix}${settings.assets.path}/${originalFilename}?projectId=${projectId}`
    })
    res.json({ data })
  })
}
