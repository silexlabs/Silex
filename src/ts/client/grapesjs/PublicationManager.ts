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
import { onAll } from '../utils'
import { API_PUBLICATION_STATUS, API_PUBLICATION_PUBLISH, API_BACKEND_LOGOUT, API_BACKEND_LIST } from '../../constants'
import { ApiPublicationPublishRequestBody, ApiPublicationPublishRequestQuery, ApiPublicationPublishResponse, ApiPublicationStatusRequestQuery, ApiPublicationStatusResponse, BackendData, JobData, JobStatus, PublicationJobData, PublicationSettings, WebsiteData, WebsiteId, WebsiteSettings } from '../../types'
import { Editor, ProjectData } from 'grapesjs'
import e from 'express'
import { PublicationUi } from './PublicationUi'

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

export enum PublicationRoute {
  PUBLICATION_PUBLISH = API_PUBLICATION_PUBLISH,
  PUBLICATION_STATUS = API_PUBLICATION_STATUS,
  BACKEND_LOGOUT = API_BACKEND_LOGOUT,
  BACKEND_LIST = API_BACKEND_LIST,
}

export type PublicationManagerOptions = {
  appendTo?: string // If not provided, no button nor dialog will be created
  websiteId: WebsiteId
  rootUrl: string
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
  settings: PublicationSettings
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
    })
    // Add the publish command to the editor
    editor.Commands.add(cmdPublicationStart, () => this.startPublication())
    editor.Commands.add(cmdPublicationLogin, (editor: PublishableEditor, sender: any, provider: BackendData) => this.goLogin(provider))
    editor.Commands.add(cmdPublicationLogout, () => this.goLogout())
    // Add the publication dialog to the editor
    if (this.options.appendTo) {
      this.dialog = new PublicationUi(editor, {
        appendTo: this.options.appendTo,
        rootUrl: this.options.rootUrl,
      })
    } else {
      console.info('PublicationUi is disabled because no appendTo option is set')
    }
  }

  async api<ReqQuery, ReqBody, ResBody>(route: PublicationRoute, method = 'POST', query?: ReqQuery, payload?: ReqBody): Promise<ResBody> {
    console.log('api', route, method, query, payload)
    try {
      const url = `${this.options.rootUrl}${route.toString()}?${new URLSearchParams(Object.entries(query)).toString()}`
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload && JSON.stringify(payload), // assuming that the payload needs to be stringified
        credentials: 'include', // sends the cookies with the request
      })

      if (!response.ok) {
        const json = await response.json()
        throw new Error(`${response.statusText}: ${json.message}`)
      }

      return await response.json() as ResBody
    } catch (error) {
      console.error('There was a problem calling the API', error, error.message)
      throw error
    }
  }

  async goLogin(provider: BackendData = this.settings.backend) {
    console.log('goLogin', this.settings, provider)
    window.open(provider.url, '_blank')
    return new Promise(resolve => {
      const onMessage = async (event) => {
        if (event.data?.type === 'login') {
          console.log('onMessage', event.data)
          window.removeEventListener('message', onMessage)
          this.editor.trigger('publish:login')
          if (event.data.error) {
            console.log('login error')
            this.status = PublicationStatus.STATUS_LOGGED_OUT
            this.dialog && this.dialog.displayError(event.data.error, this.job, this.status, this.settings)
          } else {
            console.log('login success')
            this.settings.backend = event.data
            await this.startPublication()
          }
        }
      }
      window.addEventListener('message', onMessage, false)
    })
  }

  async goLogout() {
    console.log('goLogout')
    await this.api(PublicationRoute.BACKEND_LOGOUT, 'POST', { backendId: this.settings.backend.backendId })
    this.settings.backend = null
    this.dialog && this.dialog.renderDialog(this.job, this.status, this.settings)
  }

  async startPublication() {
    console.log('startPublication')
    if (this.status === PublicationStatus.STATUS_PENDING) throw new Error('Publication is already in progress')
    this.status = PublicationStatus.STATUS_PENDING
    if (!this.settings?.backend?.backendId) {
      this.status = PublicationStatus.STATUS_LOGGED_OUT
      this.dialog && this.dialog.displayError('Please login', this.job, this.status, this.settings)
      return
    }
    this.dialog && this.dialog.renderDialog(this.job, this.status, this.settings)
    this.editor.trigger('publish:before')
    const projectData = this.editor.getProjectData() as WebsiteData
    console.log('projectData', projectData)
    const siteSettings = this.editor.getModel().get('settings') as WebsiteSettings
    // Update assets URL to display outside the editor
    const assetsFolderUrl = this.settings?.assets?.url
    if (assetsFolderUrl) {
      const publishedUrl = path => `${assetsFolderUrl}/${path.split('/').pop()}`
      // New URLs for assets, according to site config
      onAll(this.editor, c => {
        // Attributes
        if (c.get('type') === 'image') {
          const path = c.get('src')
          c.set('tmp-src', path)
          c.set('src', publishedUrl(path))
        }
        //// Inline styles
        //// This is handled by the editor.Css.getAll loop
        //const bgUrl = c.getStyle()['background-image']?.match(/url\('(.*)'\)/)?.pop()
        //if(bgUrl) {
        //  c.set('tmp-bg-url', bgUrl)
        //  c.setStyle({
        //    ...c.getStyle(),
        //    'background-image': `url('${publishedUrl(bgUrl)}')`,
        //  })
        //}
      })
      this.editor.Css.getAll()
        .forEach(c => {
          const bgUrl = c.getStyle()['background-image']?.match(/url\('(.*)'\)/)?.pop()
          if (bgUrl) {
            c.setStyle({
              ...c.getStyle(),
              'background-image': `url('${publishedUrl(bgUrl)}')`,
            })
            c.set('tmp-bg-url-css' as any, bgUrl)
          }
        })
    }
    // Build the files structure
    const files = await this.getFiles(siteSettings)

    // Create the data to send to the server
    const data: WebsiteData = {
      ...projectData,
      settings: siteSettings,
      publication: this.settings,
      files,
    }
    // Reset asset URLs
    if (assetsFolderUrl) {
      onAll(this.editor, c => {
        if (c.get('type') === 'image' && c.has('tmp-src')) {
          c.set('src', c.get('tmp-src'))
          c.set('tmp-src')
        }
        //// This is handled by the editor.Css.getAll loop
        //if(c.getStyle()['background-image'] && c.has('tmp-bg-url')) {
        //  c.setStyle({
        //    ...c.getStyle(),
        //    'background-image': `url('${c.get('tmp-bg-url')}')`,
        //  })
        //  c.set('tmp-bg-url')
        //}
      })
      this.editor.Css.getAll()
        .forEach(c => {
          if (c.has('tmp-bg-url-css' as any)) {
            c.setStyle({
              ...c.getStyle(),
              'background-image': `url('${c.get('tmp-bg-url-css' as any)}')`,
            })
            c.set('tmp-bg-url-css' as any)
          }
        })
    }
    this.editor.trigger('publish:start', data)
    try {
      const id = this.options.websiteId
      const publishResponse = await this.api<ApiPublicationPublishRequestQuery, ApiPublicationPublishRequestBody, ApiPublicationPublishResponse>(
        PublicationRoute.PUBLICATION_PUBLISH,
        'POST',
        { id },
        data)
      this.job = publishResponse.job
      this.status = jobStatusToPublicationStatus(this.job.status)
      // Save the publication settings
      if(this.settings.url !== publishResponse.url) {
        this.settings.url = publishResponse.url
        await this.editor.store(null)
      }
      this.trackProgress()
    } catch (e) {
      this.status = PublicationStatus.STATUS_ERROR
      this.dialog && this.dialog.displayError(`An error occured, your site is not published. ${e.message}`, this.job, this.status, this.settings)
      this.editor.trigger('publish:stop', { success: false, message: e.message })
      return
    }
  }

  async getFiles(siteSettings: WebsiteSettings) {
    return this.editor.Pages.getAll().map(page => {
      const pageSettings = page.get('settings') as WebsiteSettings
      const pageName = this.settings?.autoHomePage !== false && page.get('type') === 'main' ? 'index' : (page.get('name') || page.get('type'))
      function getSetting(name) {
        return (pageSettings || {})[name] || (siteSettings || [])[name] || ''
      }
      const component = page.getMainComponent()
      const slug = getPageSlug(pageName)
      return {
        html: `
      <!DOCTYPE html>
      <html lang="${getSetting('lang')}">
      <head>
      <link rel="stylesheet" href="${this.settings?.css?.url || ''}/${slug}.css" />
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
        cssPath: `${this.settings?.css?.path || ''}/${slug}${this.settings?.css?.ext || '.css'}`,
        htmlPath: `${this.settings?.html?.path || ''}/${slug}${this.settings?.html?.ext || '.html'}`,
      }
    })
  }

  async trackProgress() {
    try {
      this.job = await this.api<ApiPublicationStatusRequestQuery, null, ApiPublicationStatusResponse>(PublicationRoute.PUBLICATION_STATUS, 'GET', { jobId: this.job.jobId }) as PublicationJobData
      this.status = jobStatusToPublicationStatus(this.job.status)
    } catch (e) {
      this.status = PublicationStatus.STATUS_ERROR
      this.dialog && this.dialog.displayError(`An error occured, your site is not published. ${e.message}`, this.job, this.status, this.settings)
      this.editor.trigger('publish:stop', { success: false, message: e.message })
      return
    }
    if (this.job.status === JobStatus.IN_PROGRESS) {
      setTimeout(() => this.trackProgress(), 2000)
    } else {
      this.editor.trigger('publish:stop', { success: this.job.status === JobStatus.SUCCESS, message: this.job.message })
    }
    this.dialog && this.dialog.renderDialog(this.job, this.status, this.settings)
  }
}
