import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { join, dirname, basename } from 'path'
import { homedir } from 'os'

import { URLRewriter, URLTranslator } from 'cssurl'

import { getPageSlug } from '../page'
import { WebsiteSettings, defaultSettings, defaultSite, Asset, Page, File, Style, WebsiteData, WEBSITE_CONTEXT_RUNTIME_CLASS_NAME, WEBSITE_CONTEXT_EDITOR_CLASS_NAME } from '../types'

async function mkdirIfExists(path, options = null) {
  try {
    return await mkdir(path, options)
  } catch(err) {
    if(err.code === 'EEXIST') {
      return
    } else {
      throw err
    }
  }
}

// Project paths
const FS_ROOT = process.env.FS_ROOT || join(homedir(), '.silex')
const ASSETS_PATH = 'assets'
const ASSETS_URL = 'assets'
const HTML_PATH = ''
const CSS_PATH = ''
const PROJECT_FILE_NAME = '/.silex.data.json'
const PUBLICATION_PATH = 'publication'
export function projectPath(projectId = 'default'): string {
  return join(FS_ROOT, projectId)
}
export async function assetsDir(projectId) {
  return join(projectPath(projectId), ASSETS_PATH)
}
export async function assetUrl(projectId, fileName) {
  return `${ASSETS_URL}/${fileName}`
}

// Init files for projects and each project
export async function initProjects() {
  await mkdirIfExists(FS_ROOT)
}
export async function initProject(projectId: string) {
  const projectFolder = projectPath(projectId)
  const uploadDir = join(projectFolder, ASSETS_PATH)
  await mkdirIfExists(uploadDir, { recursive: true,})
}

// Read project data
export async function readProjectData(projectId) {
  return readFile(projectPath(projectId) + PROJECT_FILE_NAME)
}
// Write project data
export async function writeProjectData(projectId, data) {
  return writeFile(projectPath(projectId) + PROJECT_FILE_NAME, JSON.stringify(data))
  // Use ziped files?
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
function required(prop, name) {
  if(!prop ) throw new Error(`Error missing required param ${name}`)
}
export async function publish(projectId, files: File[], data: WebsiteData) {
  const { assets, settings, publication } = data
  required(assets, 'assets')
  required(files, 'files')
  required(projectId, 'projectId')
  const projectFolder = projectPath(projectId)
  const publicationDir = join(projectFolder, publication?.path || PUBLICATION_PATH)
  console.log({publicationDir, publication})

  // HTML and CSS
  await Promise.all(files
    .map(async (file) => {
    // // Process the page CSS to have correct relative URLs
    // let css = file.css
    // try {
    //   if(settings?.html?.path != settings?.css?.path) {
    //     const rewriter = new URLRewriter(function(url) {
    //       const translator = new URLTranslator()
    //       return translator.translate(url, settings?.html?.path, settings?.css?.path)
    //     })
    //     css = rewriter.rewrite(css)
    //   }
    // } catch (err) {
    //   console.error('Error processing CSS', err, file)
    //   throw new Error(`Error processing CSS. ${err.message}`)
    // }
      try {
      // Paths
        const htmlPath = join(publicationDir, file.htmlPath)
        const cssPath = join(publicationDir, file.cssPath)
        // Init
        await mkdirIfExists(dirname(htmlPath), { recursive: true,})
        await mkdirIfExists(dirname(cssPath), { recursive: true,})
        // Write
        await writeFile(htmlPath, file.html)
        await writeFile(cssPath, file.css)
      } catch (err) {
        throw new Error(`Publication error: could not write files ${file.cssPath} and ${file.htmlPath}. ${err.message}`)
      }
    }))
  // Assets
  const assetsFolder = join(publicationDir, publication?.assets?.path || ASSETS_PATH)
  await mkdirIfExists(assetsFolder, { recursive: true,})

  assets.forEach(async asset => {
    const src = join(projectFolder, asset.src)
    const dst = join(assetsFolder, basename(asset.src))
    try {
      await copyFile(src, dst)
    } catch (err) {
      throw new Error(`Publication error: could not copy asset file ${src} to ${dst}. ${err.message}`)
    }
  })
  return publication?.url
}
