import { JSDOM } from 'jsdom'
import * as CloudExplorer from 'cloud-explorer'
import * as express from 'express'
import * as nodeModules from 'node_modules-path'

import { URL } from 'url'
import * as Path from 'path'
import * as fs from 'fs'

import { Constants } from '../../constants'
import { PersistantData } from '../../client/store/types'
import BackwardCompat from '../utils/BackwardCompat'
import DomTools from '../utils/DomTools'

export default function({ port, rootUrl }: { port: number, rootUrl: string}, unifile) {
  const backwardCompat = new BackwardCompat(rootUrl)
  const router = express.Router()

  // website specials
  router.get(/\/website\/ce\/(.*)\/get\/(.*)/, readWebsite(rootUrl, unifile, backwardCompat))
  router.get(/\/website\/libs\/templates\/(.*)/, readTemplate(rootUrl, unifile, backwardCompat))
  router.put(/\/website\/ce\/(.*)\/put\/(.*)/, writeWebsite(rootUrl, unifile, backwardCompat))

  // **
  // list templates
  router.use('/get/:folder', getTemplatesList)

  return router
}

// function removeSelection(json: any): PersistantData {
//   return {
//     site: json.site,
//     elements: json.elements.map((el) => ({
//       ...el,
//       selected: false, // do not keep selection, this is also done when saving  @see WebsiteRouter
//     })),
//     pages: json.pages.map((p) => ({
//       ...p,
//       opened: false, // do not keep selection, this is also done when saving  @see WebsiteRouter
//     })),
//   }
// }

function isInTemplateFolder(path) {
  if (path.startsWith(Path.join(nodeModules('silex-templates'), 'silex-templates')) ||
    path.startsWith(Path.join(nodeModules('silex-blank-templates'), 'silex-blank-templates'))) {
      return true
  }
  return false
}
/**
 * list all the templates of the given folder
 */
function getTemplatesList(req, res, next) {
  const templateFolder = Path.join(nodeModules(req.params.folder), req.params.folder)
  if (!isInTemplateFolder(templateFolder)) {
      console.error('Error while trying to get the json representation of the folder ', templateFolder)
      res.send({success: false, error: 'Error while trying to get the json representation of the folder ' + req.params.folder + ' - folder does not exist'})
      return
  }
  fs.readdir(templateFolder, (err, result) => {
    if (err) {
      console.error('Error while trying to get the json representation of the folder ', templateFolder, err)
      res.send({success: false, error: 'Error while trying to get the json representation of the folder ' + req.params.folder + ' - ' + err})
    } else {
      const templateList = result.filter((entry) => {
        return fs.statSync(Path.join(templateFolder, entry)).isDirectory()
      })

      res.send(templateList)
    }
  })
}
/**
 * load a website from the cloud storage of the user
 */
function readWebsite(rootUrl, unifile, backwardCompat) {
  return async function (req, res, next): Promise<void> {
    const connector = req.params[0]
    const path = req.params[1]
    const url = new URL(`${ rootUrl }/ce/${ connector }/get/${ Path.dirname(path) }/`)
    try {
      const htmlBuffer = await unifile.readFile(req.session.unifile || {}, connector, path)
      try {
        const jsonBuffer = await unifile.readFile(req.session.unifile || {}, connector, path + '.json')
        return sendWebsiteData(res, rootUrl, backwardCompat, htmlBuffer, jsonBuffer, url, false)
      } catch (err) {
        // old websites
        sendWebsiteData(res, rootUrl, backwardCompat, htmlBuffer, null, url, false)
      }
    } catch (err) {
      console.error('unifile error catched:', err)
      CloudExplorer.handleError(res, err)
    }
  }
}

/**
 * load a website from a template folder on local disk
 */
function readTemplate(rootUrl, unifile, backwardCompat) {
  return function (req, res, next) {
    const path = req.params[0]
    const localPath = Path.resolve(nodeModules('silex-templates'), path)
    const url = new URL(`${ rootUrl }/libs/templates/${ Path.dirname(path) }/`)
    if (isInTemplateFolder(localPath)) {
      fs.readFile(localPath, (err1, htmlBuffer) => {
        if (err1) {
          CloudExplorer.handleError(res, err1)
        } else {
          fs.readFile(localPath + '.json', (err2, jsonBuffer) => {
            if (err2) {
              // old websites
              sendWebsiteData(res, rootUrl, backwardCompat, htmlBuffer, null, url, true)
            } else {
              sendWebsiteData(res, rootUrl, backwardCompat, htmlBuffer, jsonBuffer, url, true)
              // CloudExplorer.handleError(res, err2);
            }
          })
        }
      })
    } else {
      CloudExplorer.handleError(res, {message: 'Not authorized.', code: 'EACCES'})
    }
  }
}

async function sendWebsiteData(res, rootUrl: string, backwardCompat: BackwardCompat, htmlBuffer: Buffer, jsonBuffer: Buffer, url: URL, isTemplate): Promise<void> {
  // remove user head tag to avoid bad markup messing with the website
  const { html } = DomTools.extractUserHeadTag(htmlBuffer.toString('utf-8'))
  const data: PersistantData = jsonBuffer ? JSON.parse(jsonBuffer.toString('utf-8')) : null // may be null for older websites

  // from now on use a parsed DOM
  const dom = new JSDOM(html, { url: url.href })
  if (dom.window.document.body.classList.contains(Constants.WEBSITE_CONTEXT_PUBLISHED_CLASS_NAME)) {
    console.error('Could not open this website for edition as it is a published Silex website')
    res.status(400).send({
      message: 'Could not open this website for edition as it is a published Silex website, <a href="https://github.com/silexlabs/Silex/wiki/FAQ#why-do-i-get-the-error-could-not-open-this-website-for-edition-as-it-is-a-published-silex-website" target="_blank">Read more about this error here</a>.',
    })
  } else {
    try {
      const [wanrningMsg, updatedData] = await backwardCompat.update(dom.window.document, data)
      if (isTemplate) {
        // remove publication path
        delete updatedData.site.publicationPath
      }
      const preparedData = prepareWebsite(dom, rootUrl, updatedData, url)
      res.send({
        message: wanrningMsg,
        html: dom.serialize(),
        data: preparedData,
      })
      dom.window.close()
    } catch (err) {
      console.error('Could not send website data: ', err)
      res.status(400).send({
        message: err.message,
      })
    }
  }
}
/**
 * save a website to the cloud storage of the user
 */
function writeWebsite(rootUrl, unifile, backwardCompat) {
  return function (req, res, next) {
    const connector = req.params[0]
    const path = req.params[1]
    const { data, html }: { data: PersistantData, html: string} = JSON.parse(req.body)
    const url = new URL(`${ rootUrl }/ce/${ connector }/get/${ Path.dirname(path) }/`)
    const [unpreparedData, dom] = unprepareWebsite(new JSDOM(html, { url: url.href }), data, rootUrl, url)
    const str = dom.serialize()
    const fullHtml = DomTools.insertUserHeadTag(str, unpreparedData.site.headUser)
    dom.window.close()

    unifile.batch(req.session.unifile || {}, connector, [{
      name: 'writeFile',
      path: req.params[1],
      content: fullHtml,
    }, {
      name: 'writeFile',
      path: req.params[1] + '.json',
      content: JSON.stringify(unpreparedData),
    }])
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      console.error('unifile error catched:', err)
      CloudExplorer.handleError(res, err)
    })
  }
}
/**
 * prepare website for edit mode
 * make all URLs absolute (so that images are still found when I "save as" my website to another folder)
 * exported for tests
 */
export function prepareWebsite(dom: JSDOM, rootUrl: string, data: PersistantData, baseUrl: URL): PersistantData {
  // URLs
  const transformedData = DomTools.transformPaths(dom.window, data, (path: string, el: HTMLElement, isInHead: boolean) => {
    // page links
    if (path.startsWith(Constants.PAGE_NAME_PREFIX)) return path
    // keep absolute paths because we do not want `/test` to become `http://localhost:6805/test`
    if (Path.isAbsolute(path)) return path
    // make relative URLs absolute
    const url = new URL(path, baseUrl)
    return url.href
  })
  // update context classes
  Array.from(dom.window.document
    .querySelectorAll('.' + Constants.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME))
    .forEach((el: HTMLElement) => el.classList.remove(Constants.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME))
  dom.window.document.body.classList.add(Constants.WEBSITE_CONTEXT_EDITOR_CLASS_NAME)
  deactivateScripts(dom)
  // add /css/editable.css
  const tag = dom.window.document.createElement('link')
  tag.rel = 'stylesheet'
  tag.href = rootUrl + '/css/editable.css'
  tag.classList.add(Constants.SILEX_TEMP_TAGS_CSS_CLASS)
  dom.window.document.head.appendChild(tag)

  return transformedData
}
/**
 * prepare website for being saved
 * * make all URLs relative to current path
 * * remove useless markup and css classes
 * @param rootUrl is the URL of Silex instance, e.g. `https://editor.silex.me/`
 * @param baseUrl is the URL of the folder containing the website HTML page, e.g. `https://editor.silex.me/ce/dropbox/get/tmp/`
 */
export function unprepareWebsite(dom: JSDOM, data: PersistantData, rootUrl: string, baseUrl: URL): [PersistantData, JSDOM] {
  // markup
  dom.window.document.body.classList.add(Constants.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME)
  dom.window.document.body.classList.remove(Constants.WEBSITE_CONTEXT_EDITOR_CLASS_NAME)
  reactivateScripts(dom)
  restoreIFrames(dom)
  cleanupNoscripts(dom)
  // URLs
  const transformedData = DomTools.transformPaths(dom.window, data, (path, el) => {
    const url = new URL(path, baseUrl)
    if (url.href.startsWith(rootUrl)) {
      // path is on the same server
      // e.g an image url like '/ce/dropbox/get/assets/test.png'
      // make it relative
      return Path.relative(baseUrl.pathname, url.pathname)
    }
    return path
  })
  const cleanedUp: PersistantData = {
    ...transformedData,
    pages: transformedData.pages.map((p) => ({
      ...p,
      opened: false, // do not keep selection, this is also done at load time @see utils/data.ts
    })),
    elements: transformedData.elements.map((el) => ({
      ...el,
      selected: false, // do not keep selection, this is also done at load time @see utils/data.ts
    })),
  }
  // remove temp tags
  Array.from(dom.window.document.querySelectorAll(`
    .${Constants.SILEX_TEMP_TAGS_CSS_CLASS},
    #${Constants.SILEX_CURRENT_PAGE_ID},
    .${ Constants.RISZE_HANDLE_CSS_CLASS }`))
  .forEach((el: HTMLElement) => {
    el.remove()
  })
  // remove useless css classes
  Constants.SILEX_TEMP_CLASS_NAMES.forEach((className) => {
    Array.from(dom.window.document.getElementsByClassName(className))
    .forEach((el: HTMLElement) => el.classList.remove(className))
  })
  // cleanup inline styles
  dom.window.document.body.style.minWidth = '' // not needed?
  dom.window.document.body.style.minHeight = '' // not needed?
  dom.window.document.body.style.overflow = '' // set by stage

  return [cleanedUp, dom]
}

function deactivateScripts(dom) {
  Array.from(dom.window.document.getElementsByTagName('script'))
  .forEach((el: HTMLElement) => {
    // do not execute scripts, unless they are silex's static scripts
    // and leave it alone if it has a type different from 'text/javascript'
    if (!el.hasAttribute(Constants.STATIC_ASSET_ATTR)
        && !el.hasAttribute(Constants.PRODOTYPE_DEPENDENCY_ATTR)
        && (!el.hasAttribute('type') || el.getAttribute('type') === 'text/javascript')) {
      el.setAttribute('type', 'text/notjavascript')
    }
  })
}

function restoreIFrames(dom) {
  Array.from(dom.window.document.querySelectorAll('[data-silex-iframe-src]'))
  .forEach((el: HTMLElement) => {
    el.setAttribute('src', el.getAttribute('data-silex-iframe-src'))
    el.removeAttribute('data-silex-iframe-src')
  })
}

function cleanupNoscripts(dom) {
  Array.from(dom.window.document.querySelectorAll('noscript'))
  .forEach((el: HTMLElement) => {
    el.innerHTML = decodeHTMLEntities(el.innerHTML)
  })
}
function decodeHTMLEntities(text) {
  const entities = [['amp', '&'], ['apos', '\''], ['#x27', '\''], ['#x2F', '/'], ['#39', '\''], ['#47', '/'], ['lt', '<'], ['gt', '>'], ['nbsp', ' '], ['quot', '"']]
  entities.forEach((entity) => text = text.replace(new RegExp('&' + entity[0] + ';', 'g'), entity[1]))
  return text
}
function reactivateScripts(dom) {
  Array.from(dom.window.document.querySelectorAll('script[type="text/notjavascript"]'))
  .forEach((el: HTMLElement) => el.setAttribute('type', 'text/javascript'))
}
