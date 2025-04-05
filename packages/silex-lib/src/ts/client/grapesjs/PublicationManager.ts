/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { getPageSlug } from '../../page'
import { ApiConnectorLoggedInPostMessage, ApiConnectorLoginQuery, ApiPublicationPublishBody, ClientSideFile, ClientSideFileType, ConnectorData, ConnectorType, ConnectorUser, JobStatus, Initiator, PublicationData, PublicationJobData, PublicationSettings, WebsiteData, WebsiteFile, WebsiteId, WebsiteSettings } from '../../types'
import { Editor } from 'grapesjs'
import { PublicationUi } from './PublicationUi'
import { getUser, logout, publicationStatus, publish } from '../api'
import { API_CONNECTOR_LOGIN, API_CONNECTOR_PATH, API_PATH } from '../../constants'
import { ClientEvent } from '../events'
import { resetRenderComponents, resetRenderCssRules, transformPermalink, transformFiles, transformPath, renderComponents, renderCssRules } from '../publication-transformers'
import { hashString } from '../utils'
import { displayedToStored } from '../assetUrl'

/**
 * @fileoverview Publication manager for Silex
 * This plugin adds a publication feature to Silex
 * It lets the user publish the website to a hosting service
 * It can optionally display a button and a dialog
 * Useful commands:
 * - publish: starts the publication process and optionally open the dialog
 * - publish-login: open the login dialog
 * - publish-logout: logout from the hosting service and let the user choose a hosting service again
 */

// Constants
export const cmdPublicationStart = 'publish'
export const cmdPublicationLogin = 'publish-login'
export const cmdPublicationLogout = 'publish-logout'

// Types
export type PublishableEditor = Editor & {
  PublicationManager: PublicationManager
}

export enum PublicationStatus {
  STATUS_NONE = 'STATUS_NONE',
  STATUS_PENDING = 'STATUS_PENDING',
  STATUS_ERROR = 'STATUS_ERROR',
  STATUS_SUCCESS = 'STATUS_SUCCESS',
  STATUS_LOGGED_OUT = 'STATUS_AUTH_ERROR',
}

export type PublicationManagerOptions = {
  appendTo?: string // If not provided, no button nor dialog will be created
  websiteId: WebsiteId
}

// plugin init cod
export default function publishPlugin(editor, opts) {
  (editor as PublishableEditor).PublicationManager = new PublicationManager(editor, opts)
}

function jobStatusToPublicationStatus(status: JobStatus): PublicationStatus {
  switch (status) {
  case JobStatus.IN_PROGRESS:
    return PublicationStatus.STATUS_PENDING
  case JobStatus.ERROR:
    return PublicationStatus.STATUS_ERROR
  case JobStatus.SUCCESS:
    return PublicationStatus.STATUS_SUCCESS
  }
  throw new Error(`Unknown job status ${status}`)
}

// Orging and path, should we use config.rootUrl?
const SERVER_URL = window.location.origin + window.location.pathname.replace(/\/$/, '')

// The publication manager class
// This class is responsible for the publication dialog and for the publication process
// It is added to the editor instance as editor.PublicationManager
export class PublicationManager {
  /**
   * Publication dialog
   * This class is responsible for the  UI
   */
  dialog?: PublicationUi
  /**
   * Publication settings
   * This is the data which is stored in the website settings
   */
  _settings: PublicationSettings
  get settings(): PublicationSettings {
    return this._settings
  }
  set settings(newSettings: PublicationSettings) {
    this._settings = newSettings
    this.dialog && (this.dialog.settings = newSettings)
  }
  /**
   * Plugin options
   * This is the data which is passed to the plugin by grapesjs
   */
  options: PublicationManagerOptions
  /**
   * Publication job during the publication process
   */
  job: PublicationJobData | null = null
  /**
   * Publication state
   * This is the state of the publication process
   */
  status: PublicationStatus = PublicationStatus.STATUS_NONE

  constructor(private editor: PublishableEditor, opts: PublicationManagerOptions) {
    this.options = {
      appendTo: 'options',
      ...opts,
    } as PublicationManagerOptions
    // Save the publication settings in the website settings
    editor.on('storage:start:store', (data) => {
      data.publication = this.settings
    })
    // load publication settings from the website
    editor.on('storage:end:load', (data) => {
      this.settings = data.publication ?? {}
      // Check if the user is logged in
      getUser({ type: ConnectorType.HOSTING, connectorId: this.settings.connector?.connectorId })
        .then((user) => {})
        .catch((err) => {
          this.status = PublicationStatus.STATUS_LOGGED_OUT
          this.settings = {}
          this.dialog && this.dialog.displayError('Please login', this.job, this.status)
        })
    })
    // Add the publish command to the editor
    editor.Commands.add(cmdPublicationStart, () => this.startPublication())
    editor.Commands.add(cmdPublicationLogin, (editor: PublishableEditor, sender: any, connector: ConnectorData) => this.goLogin(connector))
    editor.Commands.add(cmdPublicationLogout, () => this.goLogout())
    // Add the publication dialog to the editor
    if (this.options.appendTo) {
      this.dialog = new PublicationUi(editor, {
        appendTo: this.options.appendTo,
      })
    } else {
      console.info('PublicationUi is disabled because no appendTo option is set')
    }
  }

  async goLogin(connector: ConnectorData) {
    let preventDefault = false
    this.editor.trigger(ClientEvent.PUBLISH_LOGIN_START, { connector, publicationManager: this, preventDefault: () => preventDefault = true })
    if(preventDefault) {
      this.status = PublicationStatus.STATUS_NONE
      this.dialog && this.dialog.displayPending(this.job, this.status)
      return
    }
    // Check if the user is already logged in
    if(connector.isLoggedIn) {
      this.settings = {
        ...this.settings, // In case there are options
        connector,
      }
      this.status = PublicationStatus.STATUS_NONE
      // Save the website with the new settings
      // WIP: prevent saving during publication
      // await this.editor.store(null)
      // Display the dialog
      this.dialog && this.dialog.displayPending(this.job, this.status)
      return
    }
    this.settings = {}
    this.status = PublicationStatus.STATUS_LOGGED_OUT
    this.dialog && this.dialog.displayPending(this.job, this.status)
    const params: ApiConnectorLoginQuery = {
      connectorId: connector.connectorId,
      type: connector.type,
    }
    window.open(connector.oauthUrl || `${SERVER_URL}${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN}?connectorId=${params.connectorId}&type=${params.type}`, '_blank')
    return new Promise<void>((resolve, reject) => {
      const onMessage = async (event) => {
        const data = event.data as ApiConnectorLoggedInPostMessage
        if (data?.type === 'login') {
          window.removeEventListener('message', onMessage)
          if (data.error) {
            this.status = PublicationStatus.STATUS_LOGGED_OUT
            this.settings = {}
            this.dialog && this.dialog.displayError(data.message, this.job, this.status)
            reject(new Error(data.message))
          } else {
            this.editor.trigger(ClientEvent.PUBLISH_LOGIN_END)
            //const uesr = await getUser({type: connector.type, connectorId: data.connectorId})
            this.settings.connector = connector
            this.settings.options = data.options
            this.status = PublicationStatus.STATUS_NONE
            // Save the website with the new settings
            // WIP: prevent saving during publication
            // await this.editor.store(null)
            // Display the dialog
            this.dialog && this.dialog.displayPending(this.job, this.status)
            //await this.startPublication()
            resolve()
          }
        }
      }
      window.addEventListener('message', onMessage, false)
    })
  }

  async goLogout() {
    try {
      await logout({type: ConnectorType.HOSTING, connectorId: this.settings.connector.connectorId})
      this.settings = {}
      this.dialog && this.dialog.displayPending(this.job, this.status)
    } catch (e) {
      console.error('logout error', e)
      this.status = PublicationStatus.STATUS_ERROR
      this.dialog && this.dialog.displayError(e.message, this.job, this.status)
    }
  }

  async getPublicationData(projectData, siteSettings, preventDefault: () => void): Promise<PublicationData> {
    // Data to publish
    // See assetUrl.ts which is a default transformer, always present
    this.setPublicationTransformers()
    // Build the files structure
    const files: ClientSideFile[] = (await this.getHtmlFiles(siteSettings, preventDefault))
      .flatMap(file => ([{
        path: file.htmlPath, // Already "transformed" in getHtmlFiles
        content: file.html,
        type: ClientSideFileType.HTML,
      } as ClientSideFile, {
        path: file.cssPath, // Already "transformed" in getHtmlFiles
        content: file.css,
        type: ClientSideFileType.CSS,
      } as ClientSideFile]))
      .concat(projectData.assets
        .map(asset => {
          // TODO: is this needed?
          // // Remove /assets that is added by grapesjs
          // const initialPath = asset.src
          //   .replace(/^\/assets/, '')
          // Transform the file paths with the transformers
          const path = transformPath(this.editor, asset.src, ClientSideFileType.ASSET)
          //const src = transformPermalink(this.editor, asset.src, ClientSideFileType.ASSET)
          // This is done in transformPermalink and transformPath but other transformers may change it
          // So we do this only using displayedToStored for the path
          // As path is used to download the asset
          const src = displayedToStored(asset.src)
            // Remove the /asset prefix to keep only the file name
            .replace(/^\/assets\//, '')
          return {
            ...asset,
            path,
            src,
            type: ClientSideFileType.ASSET, // Replaces grapesjs's 'image' type
          } as ClientSideFile
        }))
    // Create the data to send to the server
    const data: PublicationData = {
      ...projectData,
      settings: siteSettings,
      publication: this.settings,
      files,
    }
    this.resetPublicationTransformers()
    // Let plugins transform the data
    transformFiles(this.editor, data)
    this.editor.trigger(ClientEvent.PUBLISH_DATA, { data, preventDefault, publicationManager: this })
    // Return the data
    return data
  }

  /**
   * Start the publication process
   * This is the command "publish"
   */
  async startPublication() {
    try {
      if (this.status === PublicationStatus.STATUS_PENDING) throw new Error('Publication is already in progress')
      this.status = PublicationStatus.STATUS_PENDING
      this.job = null
      this.dialog && this.dialog.displayPending(this.job, this.status)
      // Get the data to publish, clone the objects because plugins can change it
      const projectData = { ...this.editor.getProjectData() as WebsiteData }
      const siteSettings = { ...this.editor.getModel().get('settings') as WebsiteSettings }
      let preventDefaultStart = false
      this.editor.trigger(ClientEvent.PUBLISH_START, {projectData, siteSettings, preventDefault: () => preventDefaultStart = true, publicationManager: this })
      if(preventDefaultStart) {
        this.status = PublicationStatus.STATUS_NONE
        this.dialog && this.dialog.displayPending(this.job, this.status)
        return
      }
      // Get the data to publish
      let preventDefaultData = false
      const data = await this.getPublicationData(projectData, siteSettings, () => preventDefaultData = true)
      if(preventDefaultData) {
        this.status = PublicationStatus.STATUS_NONE
        this.dialog && this.dialog.displayPending(this.job, this.status)
        return
      }
      // User and where to publish
      const storageUser = this.editor.getModel().get('user') as ConnectorUser
      if(!storageUser) throw new Error('User not logged in to a storage connector')
      if(!this.settings.connector?.connectorId) throw new Error('User not logged in to a hosting connector')
      const websiteId = this.options.websiteId
      const storageId = storageUser.storage.connectorId
      // Use the publication API
      const [url, job] = await publish({
        websiteId,
        hostingId: this.settings.connector.connectorId,
        storageId,
        data: data as ApiPublicationPublishBody,
        options: this.settings.options,
      })

      // in gitlab pages situation, getUrl from gitlabHostingConnector gives publication url obtained with Gitlab API pages
      console.info('Gitlab url: ', url)
      // could be used in an future UI

      this.job = job
      this.status = jobStatusToPublicationStatus(this.job.status)
      this.trackProgress()
    } catch (e) {
      console.error('publish error', e)
      if(e.code === 401 || e.httpStatusCode === 401) {
        this.status = PublicationStatus.STATUS_LOGGED_OUT
        this.settings = {}
        this.dialog && this.dialog.displayError('Please login.', this.job, this.status)
      } else {
        this.status = PublicationStatus.STATUS_ERROR
        this.dialog && this.dialog.displayError(`An error occured, your site is not published. ${e.message}`, this.job, this.status)
      }
      this.editor.trigger(ClientEvent.PUBLISH_ERROR, { success: false, message: e.message })
      this.editor.trigger(ClientEvent.PUBLISH_END, { success: false, message: e.message })
      return
    }
  }

  async getHtmlFiles(siteSettings: WebsiteSettings, preventDefault): Promise<WebsiteFile[]> {
    const files: WebsiteFile[] = []
    const generator = this.getHtmlFilesYield(siteSettings, preventDefault)

    for await (const file of generator) {
      if (file) {
        files.push(file)
      }
    }

    return files
  }

  async *getHtmlFilesYield(siteSettings: WebsiteSettings, preventDefault): AsyncGenerator<WebsiteFile | undefined> {
    for (const page of this.editor.Pages.getAll()) {
      // Clone the settings because plugins can change them
      const clonedSiteSettings = { ...siteSettings }
      const pageSettings = { ...page.get('settings') as WebsiteSettings }

      // Utility function to get a setting from the page or the site settings
      const getSetting = (name: string) =>
        (pageSettings || {})[name] || (clonedSiteSettings || [])[name] || ''

      // Get the content from GrapesJS
      const body = page.getMainComponent()
      const cssContent = this.editor.getCss({ component: body })
      console.time(`getHtml ${page.getId()} ${page.get('name')}`)
      const htmlContent = this.editor.getHtml({ component: body })
      console.timeEnd(`getHtml ${page.getId()} ${page.get('name')}`)
      yield undefined // Yield control to avoid blocking the main thread

      // Transform the file paths
      const slug = getPageSlug(page.get('name'))
      const cssInitialPath = `/css/${slug}-${await hashString(cssContent)}.css`
      const htmlInitialPath = `/${slug}.html`
      const cssPermalink = transformPermalink(this.editor, cssInitialPath, ClientSideFileType.CSS, Initiator.HTML)
      yield undefined // Yield control to avoid blocking the main thread
      const cssPath = transformPath(this.editor, cssInitialPath, ClientSideFileType.CSS)
      yield undefined // Yield control to avoid blocking the main thread
      const htmlPath = transformPath(this.editor, htmlInitialPath, ClientSideFileType.HTML)
      yield undefined // Yield control to avoid blocking the main thread

      // Let plugins transform the data
      this.editor.trigger(ClientEvent.PUBLISH_PAGE, {
        page,
        siteSettings: clonedSiteSettings,
        pageSettings,
        preventDefault,
        publicationManager: this,
      })

      // Useful data for HTML result
      const title = getSetting('title')
      const favicon = getSetting('favicon')

      // Return the HTML file
      yield {
        html: `<!DOCTYPE html>
<html lang="${getSetting('lang')}">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="${cssPermalink}" />
${clonedSiteSettings?.head || ''}
${pageSettings?.head || ''}
${title ? `<title>${title}</title>` : ''}
${favicon ? `<link rel="icon" href="${favicon}" />` : ''}
${['description', 'og:title', 'og:description', 'og:image']
    .filter((prop) => !!getSetting(prop))
    .map((prop) => `<meta name="${prop}" property="${prop}" content="${getSetting(prop)}"/>`)
    .join('\n')}
</head>
${htmlContent}
</html>`,
        css: cssContent,
        cssPath,
        htmlPath,
      }
    }
  }

  async trackProgress() {
    try {
      this.job = await publicationStatus({jobId: this.job.jobId})
      this.status = jobStatusToPublicationStatus(this.job.status)
    } catch (e) {
      this.status = PublicationStatus.STATUS_ERROR
      this.dialog && this.dialog.displayError(`An error occured, your site is not published. ${e.message}`, this.job, this.status)
      this.editor.trigger(ClientEvent.PUBLISH_END, { success: false, message: e.message })
      this.editor.trigger(ClientEvent.PUBLISH_ERROR, { success: false, message: e.message })
      return
    }
    if (this.job.status === JobStatus.IN_PROGRESS) {
      setTimeout(() => this.trackProgress(), 2000)
    } else {
      this.editor.trigger(ClientEvent.PUBLISH_END, { success: this.job.status === JobStatus.SUCCESS, message: this.job.message })
    }
    this.dialog && this.dialog.displayPending(this.job, this.status)
  }

  private setPublicationTransformers() {
    renderComponents(this.editor)
    renderCssRules(this.editor)
  }

  private resetPublicationTransformers() {
    resetRenderComponents(this.editor)
    resetRenderCssRules(this.editor)
  }
}
