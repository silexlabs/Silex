import { dirname } from 'path'
import { JSDOM } from 'jsdom'
import * as request from 'request'
import * as sequential from 'promise-sequential'

import { URL } from 'url'
import * as Path from 'path'
import * as assert from 'assert'
import * as uuid from 'uuid'

import { Action, File, HostingProvider, PublishContext } from '../types'
import { Config } from '../ServerConfig'
import { getSite } from '../router/WebsiteRouter'
import { Constants } from '../../constants'
import { PageData } from '../../client/page-store/types'
import { PersistantData } from '../../client/store/types'
import {
  cleanup,
  domToFileOperations,
  extractAssets,
  splitInFiles,
  splitPages
} from './DomPublisher'
import DomTools from '../utils/DomTools'

// const TMP_FOLDER = '.tmp';

// // create the .tmp folder used by the publication classes
// const exists = fs.existsSync(TMP_FOLDER);
// if(!exists) fs.mkdirSync(TMP_FOLDER);

// shared map of PublishJob instances,
// these are all the publications currently taking place
const publishJobs = new Map()
// regularely check for ended publications
setInterval(() => {
  let nJobs = 0
  let nDeleted = 0
  publishJobs.forEach((publishJob) => {
    if (publishJob.pleaseDeleteMe) {
      publishJobs.delete(publishJob.id)
      nDeleted++
    }
    nJobs++
  })
  if (nDeleted > 0) {
    console.info('Cleaning publish jobs. Deleted', nDeleted, '/', nJobs)
  }
}, 60 * 1000)

export default class PublishJob {
  static get(id) {
    return publishJobs.get(id)
  }
  /**
   * factory to create a publish job
   */
  static create({ publicationPath, file }, unifile, session, cookies, rootUrl: string, hostingProvider: HostingProvider, config: Config): PublishJob {
    const context: PublishContext = {
      from: file,
      to: publicationPath,
      url: rootUrl,
      session: session.unifile,
      cookies,
      hostingProvider,
      config,
    }
    // stop other publications from the same user
    session.publicationId = session.publicationId || uuid.v4()
    const id = session.publicationId
    if (publishJobs.has(id)) {
      publishJobs.get(id).stop()
    }
    try {
      // check input params
      assert.ok(!!publicationPath, 'Missing param "publicationPath"')
      assert.ok(!!file, 'Missing param "file"')
    } catch (e) {
      console.error('Invalid params', e)
      throw new Error('Received invalid params. ' + e.message)
    }
    const publishJob = new PublishJob(id, unifile, context)
    publishJobs.set(id, publishJob)
    publishJob.publish()
    .then(() => {
      if (publishJob.error) {
        console.warn(`Warning: possible error in PublishJob ${publishJob.id} (${publishJob.error})`)
      }
      publishJob.cleanup()
    })
    .catch((err) => {
      console.error(`PublishJob ${publishJob.id} throws an error (${err}).`, err)
      publishJob.error = true
      publishJob.setStatus(err.message)
      publishJob.cleanup()
    })
    return publishJob
  }

  private abort = false
  private success = false
  private error = false
  private filesNotDownloaded = []
  private rootPath: string
  private htmlFolder: string
  private cssFolder: string
  private jsFolder: string
  private assetsFolder: string
  private jsFile: string
  private cssFile: string
  private pleaseDeleteMe: boolean
  private jar: any
  private state: string
  private tree: {scriptTags: HTMLElement[], styleTags: HTMLElement[]}
  private assets: File[]
  private pageActions: Action[]

  constructor(public id: string, private unifile, private context: PublishContext) {
    this.setStatus('Publication starting.')

    // files and folders paths
    this.rootPath = this.context.to.path
    this.htmlFolder = this.rootPath + '/' + this.getHtmlFolder()
    this.cssFolder = this.rootPath + '/' + this.getCssFolder()
    this.jsFolder = this.rootPath + '/' + this.getJsFolder()
    this.assetsFolder = this.rootPath + '/' + this.getAssetsFolder()
    this.jsFile = this.jsFolder + '/script.js'
    this.cssFile = this.cssFolder + '/styles.css'

    console.log('--------------------------')
    console.log('Publish Job', id)
    console.log('Publish to:', this.rootPath, this.htmlFolder, this.cssFolder, this.assetsFolder, this.jsFolder)
    console.log('Silex instance:', context.url)

    this.pleaseDeleteMe = false

    this.jar = request.jar()
    for (const key in this.context.cookies) { this.jar.setCookie(request.cookie(key + '=' + this.context.cookies[key]), context.url) }
  }
  stop() {
    if (this.isStopped() === false) {
      console.warn('stopping publication in progress')
      this.abort = true
      this.setStatus('Publication canceled.')
    }
  }
  isStopped() {
    return this.error || this.abort || this.success
  }
  getStatus() {
    return this.state
  }
  setStatus(status) {
    console.info('Publication status:', status)
    this.state = status
  }
  cleanup() {
    // console.info('PublishJob cleanup, will ask to be deleted in 60s', this.id);
    if (this.pleaseDeleteMe) { console.error('PublishJob was already marked for deletion', this.id) } else {
      setTimeout(() => {
        this.pleaseDeleteMe = true
      }, 60 * 1000)
    }
  }
  getSuccessMessage() {
    // download errors
    const downloadMessage = this.filesNotDownloaded.length > 0 ? `
      Warning: these files could not be downloaded:
      <ul>
        <li>${this.filesNotDownloaded.join('</li><li>')}</li>
      </ul>
    ` : ''
    // final message
    return `<p>Done.</p><p>${downloadMessage}</p>`
  }
  getHtmlFolder() {
    const defaultFolder = ''
    if (this.context.hostingProvider && this.context.hostingProvider.getHtmlFolder) {
      return (this.context.hostingProvider.getHtmlFolder(this.context, defaultFolder)) || defaultFolder
    } else { return defaultFolder }
  }
  getJsFolder() {
    const defaultFolder = 'js'
    if (this.context.hostingProvider && this.context.hostingProvider.getJsFolder) {
      return (this.context.hostingProvider.getJsFolder(this.context, defaultFolder)) || defaultFolder
    } else { return defaultFolder }
  }
  getCssFolder() {
    const defaultFolder = 'css'
    if (this.context.hostingProvider && this.context.hostingProvider.getCssFolder) {
      return (this.context.hostingProvider.getCssFolder(this.context, defaultFolder)) || defaultFolder
    } else { return defaultFolder }
  }
  getAssetsFolder() {
    const defaultFolder = 'assets'
    if (this.context.hostingProvider && this.context.hostingProvider.getAssetsFolder) {
      return (this.context.hostingProvider.getAssetsFolder(this.context, defaultFolder)) || defaultFolder
    } else { return defaultFolder }
  }
  getDestFolder(ext: string, tagName: string): string {
    // tags
    if (tagName) {
      switch (tagName.toLowerCase()) {
        case 'script':
          return this.getJsFolder()
        case 'link':
          return this.getCssFolder()
        case 'img':
        case 'source':
        case 'video':
          return this.getAssetsFolder()
      }
      // could be an iframe
      return null
    } else if (ext === '.html') {
      return this.getHtmlFolder()
    } else  {
      return this.getAssetsFolder()
    }
  }

  /**
   * the method called to publish a website to a location
   */
  async publish() {
    // check the state
    if (this.isStopped()) {
      console.warn('job is stopped', this.error, this.abort, this.success)
      return
    }

    this.setStatus(`Downloading website ${this.context.from.name}`)

    // download site html and data
    let siteHtmlStr: string
    let siteDataStr: string
    try {
      const [siteHtml, siteData] = await getSite(this.unifile, this.context.session, this.context.from.service, this.context.from.path)
      siteHtmlStr = siteHtml.toString('utf-8')
      siteDataStr = siteData.toString('utf-8')
    } catch(err) {
      console.error('Publication error, could not get website files:', err)
      this.error = true
      this.setStatus(err.message)
      return
    }

    // check the state
    if (this.isStopped()) {
      console.warn('job is stopped', this.error, this.abort, this.success)
      return
    }

    // build folders tree
    this.setStatus(`Splitting file ${this.context.from.name}`)

    // this also works as url is set by cloud explorer's UnifileService::getUrl method
    //  const url = new URL((this.context.from as any).url)
    const url = new URL(`${this.context.config.ceOptions.rootUrl}/${this.context.from.service}/get/${this.context.from.path}`)
    const baseUrl = new URL(url.origin + Path.dirname(url.pathname) + '/')
    const baseUrlStr = baseUrl.href

    // build the dom
    const { html, userHead } = DomTools.extractUserHeadTag(siteHtmlStr)

    // store site DOM in the context, for hosting providers hooks
    let dom
    try {
      dom = new JSDOM(html, { url: baseUrlStr })
    } catch(err) {
      console.error('Publication error, could not parse the website HTML:', err)
      this.error = true
      this.setStatus(err.message)
      return
    }

    // store site data in the context, for hosting providers hooks
    try {
      this.context.data = JSON.parse(siteDataStr) as PersistantData
    } catch(err) {
      console.error('Publication error, could not parse the website JSON data:', err)
      this.error = true
      this.setStatus(err.message)
      return
    }
    try {
      this.context.document = dom.window.document
      // const domPublisher = new DomPublisher(dom, userHead, this.context.url, this.rootPath, (ext, tagName) => await this.getDestFolder(ext, tagName), this.context.data)
      // remove classes used by Silex during edition
      cleanup(dom.window)
      // rewrite URLs and extract assets
      const to = new URL(`${this.context.config.ceOptions.rootUrl}/${this.context.to.service}/get/${this.context.to.path}/`).href
      const hookedRootUrl = this.context.hostingProvider.getRootUrl ? this.context.hostingProvider.getRootUrl(this.context, baseUrl) : null
      this.assets = extractAssets({
        baseUrl: baseUrlStr,
        rootUrl: to,
        hookedRootUrl,
        win: dom.window,
        rootPath: this.rootPath,
        getDestFolder: (ext: string, tagName: string) => this.getDestFolder(ext, tagName),
      })
      this.tree = splitInFiles({
        hookedRootUrl,
        win: dom.window,
        userHead,
      })
      // hide website before styles.css is loaded
      dom.window.document.head.innerHTML += '<style>body { opacity: 0; transition: .25s opacity ease; }</style>'
      // get the first page name, i.e. the default, e.g. index.html
      const newFirstPageName = this.context.hostingProvider && this.context.hostingProvider.getDefaultPageFileName ? this.context.hostingProvider.getDefaultPageFileName(this.context, this.context.data) : null
      // define hooks
      const permalinkHook = (pageName: string) => {
        if (this.context.hostingProvider && this.context.hostingProvider.getPermalink) {
          return this.context.hostingProvider.getPermalink(pageName, this.context)
        }
        return pageName.replace(new RegExp('^' + Constants.PAGE_ID_PREFIX), '')
      }
      const pageTitleHook = (page: PageData) => {
        if (this.context.hostingProvider && this.context.hostingProvider.getPageTitle) {
          return this.context.hostingProvider.getPageTitle(this.context.data.site.title, this.context)
        }
        // default hook adds the page display name
        return this.context.data.site.title + ' - ' + page.displayName
      }
      const pageLinkHook = (href: string) => {
        if (this.context.hostingProvider && this.context.hostingProvider.getPageLink) {
          // let the hosting provider create links
          return this.context.hostingProvider.getPageLink(href, this.context)
        } else if (href.endsWith('index.html')) {
          // links to ./ instead of index.html
          return dirname(href) + '/'
        }
        // do nothing
        return href
      }
      if (this.context.hostingProvider && this.context.hostingProvider.beforeSplit) {
        await this.context.hostingProvider.beforeSplit(this.context)
      }
      // split into pages
      this.pageActions = splitPages({
        newFirstPageName,
        permalinkHook,
        pageTitleHook,
        pageLinkHook,
        win: dom.window,
        rootPath: this.rootPath,
        getDestFolder: (ext: string, tagName: string) => this.getDestFolder(ext, tagName),
          data: this.context.data,
      })

      // release the dom object
      dom.window.close()
    } catch(err) {
      console.error('Publication error, could not optimize the DOM:', err)
      this.error = true
      this.setStatus(err.message)
      return
    }

    // check the state
    if (this.isStopped()) {
      console.warn('job is stopped', 'error:', this.error, 'abort:', this.abort, 'success:', this.success)
      return
    }

    // check existing folder structure (with stat) and download all assets
    let statRoot, statHtml, statCss, statJs, statAssets, assets
    try {
      [statRoot, statHtml, statCss, statJs, statAssets, ...assets] = await this.readOperations()
    } catch(err) {
      // FIXME: will never go through here
      console.error('Publication error, could not download files:', this.assets.map((f) => f.displayName).join(', '), '. Error:', err)
      this.error = true
      this.setStatus(err.message)
      return
    }

    // check the state
    if (this.isStopped()) {
      console.warn('job is stopped', 'error:', this.error, 'abort:', this.abort, 'success:', this.success)
      return
    }

    // write and upload all files in a batch operation
    try {
      await this.writeOperations(statRoot, statHtml, statCss, statJs, statAssets, ...assets)
    } catch(err) {
      console.error('An error occured in write operations', err)
      this.error = true
      this.setStatus(err.message)
      return
    }

    // check the state
    if (this.isStopped()) {
      console.warn('job is stopped', 'error:', this.error, 'abort:', this.abort, 'success:', this.success)
      return
    }

    try {
      if (this.context.hostingProvider) {
        await this.context.hostingProvider.finalizePublication(this.context, (msg) => this.setStatus(msg))
      }
    } catch(err) {
      console.error('An error occured in hosting provider hook', err)
      this.error = true
      this.setStatus(err.message)
      return
    }

    // all operations done
    console.log('Publication done with success')
    this.setStatus(this.getSuccessMessage())
    this.success = true
  }

  readOperations(): Promise<[statRoot: boolean, statHtml: boolean, statCss: boolean, statJs: boolean, statAssets: boolean, assets: Action[]]>  {
    this.setStatus(`Looking for folders: <ul><li>${this.cssFolder}</li><li>${this.jsFolder}</li><li>${this.assetsFolder}</li></ul>`)

    // do not throw an error if the folder is not found, this is what we want to test
    // instead catch the error and do nothing so that the result is null in .then(stat
    const preventErr = (promise) => promise.catch((err) => {
      if (err.code !== 'ENOENT') {
        console.error('The stat operation failed with error:', err)
        this.error = true
        this.setStatus(err.message)
        }
    })

    // start by testing if the folders exist before creating them
    // then download all assets
    // FIXME: should use unifile's batch method to avoid conflicts or the "too many clients" error in FTP
    // return Promise.all([
    return sequential([
      () => preventErr(this.unifile.stat(this.context.session, this.context.to.service, this.rootPath)),
      () => preventErr(this.unifile.stat(this.context.session, this.context.to.service, this.htmlFolder)),
      () => preventErr(this.unifile.stat(this.context.session, this.context.to.service, this.cssFolder)),
      () => preventErr(this.unifile.stat(this.context.session, this.context.to.service, this.jsFolder)),
      () => preventErr(this.unifile.stat(this.context.session, this.context.to.service, this.assetsFolder)),
    ]
    // add the promises to download each asset
    .concat(this.downloadAllAssets(this.assets)))
  }

  writeOperations(statRoot: boolean, statHtml: boolean, statCss: boolean, statJs: boolean, statAssets: boolean, ...assets: Action[]) {
    // build the batch actions
    this.setStatus(`Creating files <ul>${this.pageActions.map((action) => '<li>' + action.displayName + '</li>').join('')}<li>${this.cssFile}</li><li>${this.jsFile}</li></ul>And uploading ${ assets.length } assets.`)
    // create an object to describe a batch of actions
    const batchActions = []
    if (!statRoot) {
      batchActions.push({
        name: 'mkdir',
        path: this.rootPath,
      })
    }
    if (!statHtml && this.htmlFolder.replace(/\/$/, '') !== this.rootPath.replace(/\/$/, '')) {
      batchActions.push({
        name: 'mkdir',
        path: this.htmlFolder,
      })
    }
    batchActions.push(...this.pageActions)

    if (!statCss) {
      batchActions.push({
        name: 'mkdir',
        path: this.cssFolder,
      })
    }
    if (!statJs) {
      batchActions.push({
        name: 'mkdir',
        path: this.jsFolder,
      })
    }
    if (!statAssets) {
      batchActions.push({
        name: 'mkdir',
        path: this.assetsFolder,
      })
    }
    if (this.tree.styleTags.length > 0) {
      const cssAction = domToFileOperations(this.tree.styleTags, this.cssFile, 'CSS styles')
      // show website after styles.css is loaded
      const showBodyRule = 'body.silex-runtime {opacity: 1;}\n'
      cssAction.content += showBodyRule
      // create the style.css file
      batchActions.push(cssAction)
    }
    if (this.tree.scriptTags.length > 0) {
      batchActions.push(domToFileOperations(this.tree.scriptTags, this.jsFile, 'JS scripts'))
    }
    const batchActionsWithAssets = batchActions.concat(
      assets
      .filter((file) => !!file)
      .map((file) => {
        return {
          name: 'writeFile',
          path: file.path,
          content: file.content,
        }
      }),
    )
    // beforeWrite hook
    const hookedActions = this.context.hostingProvider.beforeWrite ? this.context.hostingProvider.beforeWrite(this.context, batchActionsWithAssets) : batchActionsWithAssets

    // creates all files
    return this.unifile.batch(this.context.session, this.context.to.service, hookedActions)
  }

  // create the promises to download each asset
  downloadAllAssets(files) {
    return files.map((file) => {
      const srcPath = decodeURIComponent(file.srcPath)
      const destPath = decodeURIComponent(file.destPath)
      const shortSrcPath = srcPath.substr(srcPath.lastIndexOf('/') + 1)
      return () => {
        return new Promise((resolve, reject) => {
          if (this.isStopped()) {
            console.warn('job is stopped', this.error, this.abort, this.success)
            resolve(null)
            return
          }
          this.setStatus(`Downloading file ${ shortSrcPath }...`)
          // load from URL
          // "encoding: null" is needed for images (which in this case will be served from /static)
          // for(let key in this.context.session) console.log('unifile session key', key, this.context.session[key]);
          // "jar" is needed to pass the client cookies to unifile, because we load resources from different servers including ourself
          request(srcPath, {
            jar: this.jar,
            encoding: null,
          }, (err, res, data) => {
            if (err) { reject(err) } else if (res.statusCode !== 200) {
              console.warn(`Could not download file ${ srcPath }.`)
              reject(`Could not download file ${ srcPath }.`)
            } else {
              resolve({
                content: data,
                path: destPath,
              })
            }
          })
        })
        .catch((err) => {
          this.filesNotDownloaded.push(shortSrcPath)
        })
      }
    })
  }
}
