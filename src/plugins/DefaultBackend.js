const { readFile, writeFile, mkdir, copyFile } = require('node:fs/promises')
const { join, dirname, basename } = require('path')
const { homedir } = require('os')

//const { URLRewriter, URLTranslator } = require('cssurl')

async function mkdirIfNotExists(path, options = null) {
  try {
    return await mkdir(path, options)
  } catch (err) {
    if (err.code === 'EEXIST') {
      return
    } else {
      throw err
    }
  }
}

// Paths
const FS_ROOT = process.env.FS_ROOT || join(homedir(), '.silex')
const ASSETS_PATH = 'assets'
const ASSETS_URL = 'assets'
const HTML_PATH = ''
const CSS_PATH = ''
const DATA_FILE_NAME = '/.silex.data.json'
const PUBLICATION_PATH = 'publication'

function path(id = 'default') {
  return join(FS_ROOT, id)
}

exports.assetsDir = async function (id) {
  return join(path(id), ASSETS_PATH)
}

exports.assetUrl = async function (id, fileName) {
  return `${ASSETS_URL}/${fileName}`
}

// Init files for projects and each project
exports.init = async function (id) {
  await mkdirIfNotExists(FS_ROOT)
  const folder = path(id)
  const uploadDir = join(folder, ASSETS_PATH)
  await mkdirIfNotExists(uploadDir, { recursive: true, })
}

// Read project data
exports.readData = async function (id) {
  return readFile(path(id) + DATA_FILE_NAME)
}
// Write project data
exports.writeData = async function (id, data) {
  return writeFile(path(id) + DATA_FILE_NAME, JSON.stringify(data))
}
function required(prop, name) {
  if (!prop) throw new Error(`Error missing required param ${name}`)
}
exports.publish = async function (id, files, data) {
  const { assets, settings, publication } = data
  required(assets, 'assets')
  required(files, 'files')
  required(id, 'id')
  const folder = path(id)
  const publicationDir = join(folder, publication?.path || PUBLICATION_PATH)

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
        await mkdirIfNotExists(dirname(htmlPath), { recursive: true, })
        await mkdirIfNotExists(dirname(cssPath), { recursive: true, })
        // Write
        await writeFile(htmlPath, file.html)
        await writeFile(cssPath, file.css)
      } catch (err) {
        throw new Error(`Publication error: could not write files ${file.cssPath} and ${file.htmlPath}. ${err.message}`)
      }
    }))
  // Assets
  const assetsFolder = join(publicationDir, publication?.assets?.path || ASSETS_PATH)
  await mkdirIfNotExists(assetsFolder, { recursive: true, })

  assets.forEach(async asset => {
    required(asset.src, 'asset\'s "src" attribute')
    const src = join(folder, asset.src)
    const dst = join(assetsFolder, basename(asset.src))
    try {
      await copyFile(src, dst)
    } catch (err) {
      throw new Error(`Publication error: could not copy asset file ${src} to ${dst}. ${err.message}`)
    }
  })
  return publication?.url
}
