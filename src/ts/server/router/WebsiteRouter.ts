import { load } from 'cheerio'
import { URLRewriter, URLTranslator } from 'cssurl'

import { Router } from 'express'
import formidable from 'formidable'

import { join }from 'path'
import { homedir } from 'os'
import { readFile, writeFile, mkdir } from 'node:fs/promises';

import { getPageSlug } from '../../utils'

import { WebsiteSettings, defaultSettings, defaultSite, Settings, Asset, Page, File, Style, WebsiteData, WEBSITE_CONTEXT_RUNTIME_CLASS_NAME, WEBSITE_CONTEXT_EDITOR_CLASS_NAME } from '../../types'

// import BackwardCompat from '../utils/BackwardCompat'
const FS_ROOT = join(homedir(), '.silex')

export default function WebsiteRouter() {
  // const backwardCompat = new BackwardCompat(rootUrl)
  const router = Router()

  // website specials
  router.get('/website', readWebsite)
  router.post('/website', writeWebsite)
  router.get(/\/assets\/(.*)/, readAsset)
  router.post('/assets', writeAsset)

  // Create encessary folders, assyncronously
  mkdirIfExists(FS_ROOT)

  // Return a router to the caller
  return router
}

async function mkdirIfExists(path, options = null) {
  try {
    return await mkdir(path, options)
  } catch(err) {
    if(err.code === 'EEXIST') {
      return;
    } else {
      throw err
    }
  }
}

// Project paths
const PROJECT_FILE_NAME = '/.silex.data.json'
export function projectPath(projectId) {
  return join(FS_ROOT, projectId)
}

async function readWebsite(req, res): Promise<void> {
  try {
    const data = await readFile(projectPath(req.query.projectId) + PROJECT_FILE_NAME)
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

// Settings come from an optional file at the website root
// FIXME: settings should come from data file and be modified by apps
const SETTINGS_FILE_NAME = '/.silex.json'
async function getSettings(projectId): Promise<Settings> {
  try {
    const settingsBuffer = await readFile(projectPath(projectId) + SETTINGS_FILE_NAME)
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
  const [data, err] = fromBody(req.body)
  if(err) {
    res.status(400).json({ message: 'Error writing data file, could not parse the provided body: ' + err.message, code: err.code})
    return
  }
  try {
    await writeFile(projectPath(projectId) + PROJECT_FILE_NAME, JSON.stringify(data))
  } catch (err) {
    console.error('Error writing data file', err)
    res.status(500).json({ message: 'Error writing data file: ' + err.message, code: err.code})
    return
  }

  const settings = await getSettings(projectId) as Settings
  const projectFolder = projectPath(projectId)
  const htmlFolder = join(projectFolder, settings.html.path)
  const cssFolder = join(projectFolder, settings.css.path)
  try {
    // FIXME: recursive will auto create projects
    await mkdirIfExists(htmlFolder, { recursive: true,})
    await mkdirIfExists(cssFolder, { recursive: true,})
  } catch (err) {
    console.error('Error: could not create folder ', cssFolder, err)
    res.status(400).json({ message: 'Error: could not create folder: ' + err.message, code: err.code})
    return
  }
  data.pages
  .forEach(async (page, idx) => {
    // page settings override site settings
    function getSetting(name) {
      if(page.settings && page.settings[name]) return page.settings[name]
        return data.settings[name]
    }
    // update HTML with data from the settings
    const pageName = page.type === 'main' ? 'index' : page.name
    // Process the page HTML to include all settings
    let html
    try {
      const $ = load(data.files[idx].html)
      $('head').append(`<link rel="stylesheet" href="${settings.prefix}${settings.css.path}/${getPageSlug(pageName)}.css" />`)
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
      console.error('Error processing HTML', page, err)
      res.status(400).json({ message: 'Error processing HTML: ' + err.message, code: err.code})
      return
    }
    // Process the page CSS to have correct relative URLs
    let css = data.files[idx].css
    try {
      if(cssFolder != projectFolder) {
        const rewriter = new URLRewriter(function(url) {
          const translator = new URLTranslator();
          return translator.translate(url, projectFolder, cssFolder);
        })
        css = rewriter.rewrite(css);
      }
    } catch (err) {
      console.error('Error processing CSS', page, err)
      res.status(400).json({ message: 'Error processing CSS: ' + err.message, code: err.code})
      return
    }
    try {
      await writeFile(join(htmlFolder, getPageSlug(pageName) + '.html'), html)
      await writeFile(join(cssFolder, getPageSlug(pageName) + '.css'), css)
    } catch (err) {
      console.error('Error writing file', page, err)
      res.status(400).json({ message: 'Error writing file: ' + err.message, code: err.code})
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
  //     await writeFile(path, zip.toBuffer())
  //     res.send('Ok')
  //   } catch (err) {
  //     console.error('Zip file error:', err)
  //     res.status(400).json({ message: 'Zip file error: ' + err.message, code: err.code})
  //   }
  // } else {
  //   try {
  //     await writeFile(path, str)
  //     await writeFile(path + '.json', unpreparedData)
  //     res.send('Ok')
  //   } catch (err) {
  //     console.error('Read file error', err)
  //     res.status(400).json({ message: 'Read file error: ' + err.message, code: err.code})
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
  const uploadDir = join(projectPath(projectId), settings.assets.path)
  const fileName = req.params[0]
  res.sendFile(join(uploadDir, fileName))
}

async function writeAsset(req, res) {
  const projectId = req.query.projectId
  const settings = await getSettings(projectId)
  const uploadDir = join(projectPath(projectId), settings.assets.path)
  await mkdirIfExists(uploadDir, { recursive: true,})
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
      return `${settings.prefix}${settings.assets.path}/${originalFilename}?projectId=${projectId}`
    })
    res.json({ data })
  })
}
