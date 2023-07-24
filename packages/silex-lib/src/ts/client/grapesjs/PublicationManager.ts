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
import { ApiConnectorLoggedInPostMessage, ApiConnectorLoginQuery, ApiPublicationPublishBody, ApiPublicationPublishQuery, ApiPublicationPublishResponse, ApiPublicationStatusQuery, ApiPublicationStatusResponse, ClientSideFile, ClientSideFileWithContent, ClientSideFileWithSrc, ConnectorData, ConnectorType, ConnectorUser, JobData, JobStatus, PublicationData, PublicationJobData, PublicationSettings, WebsiteData, WebsiteFile, WebsiteId, WebsiteSettings } from '../../types'
import { Editor, ProjectData } from 'grapesjs'
import { PublicationUi } from './PublicationUi'
import { getUser, logout, publicationStatus, publish } from '../api'
import { API_CONNECTOR_LOGIN, API_CONNECTOR_PATH, API_PATH } from '../../constants'
import { ClientEvent } from '../events'

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
    this.settings = {}
    this.status = PublicationStatus.STATUS_LOGGED_OUT
    this.dialog && this.dialog.displayPending(this.job, this.status)
    const params: ApiConnectorLoginQuery = {
      connectorId: connector.connectorId,
      type: connector.type,
    }
    window.open(connector.oauthUrl || `${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN}?connectorId=${params.connectorId}&type=${params.type}`, '_blank')
    return new Promise(resolve => {
      const onMessage = async (event) => {
        const data = event.data as ApiConnectorLoggedInPostMessage
        if (data?.type === 'login') {
          window.removeEventListener('message', onMessage)
          if (data.error) {
            this.status = PublicationStatus.STATUS_LOGGED_OUT
            this.settings = {}
            this.dialog && this.dialog.displayError(data.message, this.job, this.status)
          } else {
            this.editor.trigger(ClientEvent.PUBLISH_LOGIN_END)
            //const uesr = await getUser({type: connector.type, connectorId: data.connectorId})
            this.settings.connector = connector
            this.settings.options = data.options
            this.status = PublicationStatus.STATUS_NONE
            // Save the website with the new settings
            this.editor.store(null)
            // Display the dialog
            this.dialog && this.dialog.displayPending(this.job, this.status)
            //await this.startPublication()
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

  /**
   * Start the publication process
   * This is the command "publish"
   */
  async startPublication() {
    if (this.status === PublicationStatus.STATUS_PENDING) throw new Error('Publication is already in progress')
    this.status = PublicationStatus.STATUS_PENDING
    this.job = null
    this.dialog && this.dialog.displayPending(this.job, this.status)
    this.editor.trigger(ClientEvent.PUBLISH_START)
    const projectData = this.editor.getProjectData() as WebsiteData
    const siteSettings = this.editor.getModel().get('settings') as WebsiteSettings
    // Build the files structure
    const files: ClientSideFile[] = (await this.getSiteFiles(siteSettings))
      .flatMap(file => ([{
        path: file.htmlPath,
        content: file.html,
        type: 'html',
      } as ClientSideFile, {
        path: file.cssPath,
        content: file.css,
        type: 'css',
      } as ClientSideFile]))
      .concat(projectData.assets.map(asset => ({
        ...asset,
        path: `/${asset.src}`,
        src: asset.src,
        type: 'asset',
      }) as ClientSideFile))

    // Create the data to send to the server
    const data: PublicationData = {
      ...projectData,
      settings: siteSettings,
      publication: this.settings,
      files,
    }
    this.editor.trigger(ClientEvent.PUBLISH_DATA, data)
    const storageUser = this.editor.getModel().get('user') as ConnectorUser
    if(!storageUser) throw new Error('User not logged in to a storage connector')
    if(!this.settings.connector?.connectorId) throw new Error('User not logged in to a hosting connector')
    try {
      const websiteId = this.options.websiteId
      const [url, job] = await publish({
        websiteId,
        hostingId: this.settings.connector.connectorId,
        storageId: storageUser.storage.connectorId,
        data: data as ApiPublicationPublishBody,
        options: this.settings.options,
      })
      this.job = job
      this.status = jobStatusToPublicationStatus(this.job.status)
      // Save the publication settings
      // Useless because the url is useful after publish only
      //if(this.settings.url !== url) {
      //  this.settings.url = url
      //  await this.editor.store(null)
      //}
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

  async getSiteFiles(siteSettings: WebsiteSettings): Promise<WebsiteFile[]> {
    return this.editor.Pages.getAll().map(page => {
      const pageSettings = page.get('settings') as WebsiteSettings
      function getSetting(name) {
        return (pageSettings || {})[name] || (siteSettings || [])[name] || ''
      }
      const component = page.getMainComponent()





      const slug = page.get('slug') || getPageSlug(page.get('name') || page.get('type'))
      return {
        html: `
      <!DOCTYPE html>
      <html lang="${getSetting('lang')}">
      <head>
      <link rel="stylesheet" href="/css/${slug}.css" />
      ${siteSettings?.head || ''}
      ${pageSettings?.head || ''}
      <title>${getSetting('title')}</title>
      <link rel="icon" href="${getSetting('favicon')}" />
      ${['description', 'og:title', 'og:description', 'og:image']
    .map(prop => `<meta property="${prop}" content="${getSetting(prop)}"/>`)
    .join('\n')
}
      </head>
      ${this.editor.getHtml({ component })}
      </html>
      `,
        css: this.editor.getCss({ component }),
        cssPath: `/${slug}.css`,
        htmlPath: `/${slug}.html`,
      }
    })
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
}
