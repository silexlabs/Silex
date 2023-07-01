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
import { HOSTING_PUBLICATION_STATUS_PATH, HOSTING_PUBLISH_PATH, BACKEND_LOGOUT_PATH, BACKEND_LIST_PATH } from '../../constants'
import { BackendData, PublicationSettings, WebsiteId, WebsiteSettings } from '../../types'
import { Editor } from 'grapesjs'
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

export type PublicationState = {
  queued: boolean
  error: boolean
  running: boolean
  logs: string[][]
  errors: string[][]
  status: PublicationStatus
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
   * Publication state
   * This is the state of the publication process
   */
  state: PublicationState = {
    queued: false,
    error: false,
    running: false,
    logs: [],
    errors: [],
    status: PublicationStatus.STATUS_NONE,
  }

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
  async goLogin(provider: BackendData = this.settings.backend) {
    console.log('goLogin', this.settings, provider)
    window.open(`${this.settings.url}?redirect=/api/hosting/login/success`, '_blank')
    return new Promise(resolve => {
      const onMessage = async (event) => {
        if (event.data?.type === 'login') {
          console.log('onMessage', event.data)
          window.removeEventListener('message', onMessage)
          this.editor.trigger('publish:login')
          if (event.data.error) {
            console.log('login error')
            this.state.status = PublicationStatus.STATUS_LOGGED_OUT
            this.dialog && this.dialog.displayError(event.data.error, this.state, this.settings)
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
    await fetch(`${this.options.rootUrl}${BACKEND_LOGOUT_PATH}/?backendId=${this.settings.backend.backendId}`, {
      method: 'POST',
      credentials: 'include',
    })
    this.settings.backend = null
    this.dialog && this.dialog.renderDialog(this.state, this.settings)
  }

  async startPublication() {
    console.log('startPublication')
    if (this.state.status === PublicationStatus.STATUS_PENDING) throw new Error('Publication is already in progress')
    this.state.status = PublicationStatus.STATUS_PENDING
    if (!this.settings?.backend?.backendId) {
      this.state.status = PublicationStatus.STATUS_LOGGED_OUT
      this.dialog && this.dialog.displayError('Please login', this.state, this.settings)
      return
    }
    this.dialog && this.dialog.renderDialog(this.state, this.settings)
    this.editor.trigger('publish:before')
    const projectData = this.editor.getProjectData()
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
    const data = {
      ...projectData,
      settings: siteSettings,
      publication: this.settings,
      id: this.editor.PublicationManager.options.websiteId,
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
    let res
    let json
    try {
      res = await fetch(`${this.options.rootUrl}${HOSTING_PUBLISH_PATH}?backendId=${this.settings.backend.backendId}`, {
        method: 'POST',
        body: JSON.stringify({
          data,
          // token: _token,
        }),
        headers: {
          'Content-Type': 'application/json'
        },
      })
    } catch (e) {
      this.state.status = PublicationStatus.STATUS_ERROR
      this.dialog && this.dialog.displayError(`An error occured, your site is not published. ${e.message}`, this.state, this.settings)
      this.editor.trigger('publish:stop', { success: false, message: e.message })
      return
    }
    try {
      json = await res.json()
    } catch (e) {
      this.state.status = PublicationStatus.STATUS_ERROR
      this.dialog && this.dialog.displayError(`Could not parse the server response, your site may be published. ${e.message}`, this.state, this.settings)
      this.editor.trigger('publish:stop', { success: false, message: e.message })
      return
    }
    if (!res.ok) {
      if (res.status === 401) {
        // Auth error, user needs to login again
        this.state.status = PublicationStatus.STATUS_LOGGED_OUT
        this.dialog && this.dialog.displayError(`You need to login again to publish your site. ${json.message}`, this.state, this.settings)

      } else {
        // Other error
        this.state.status = PublicationStatus.STATUS_ERROR
        this.dialog && this.dialog.displayError(`An network error occured, your site is not published. ${json.message}`, this.state, this.settings)
      }
      this.editor.trigger('publish:stop', { success: false, message: json.message })
      return
    }
    this.settings.url = json.url
    await this.editor.store(null)
    this.trackProgress()
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
    let res
    let json
    try {
      res = await fetch(HOSTING_PUBLICATION_STATUS_PATH)
    } catch (e) {
      this.state.status = PublicationStatus.STATUS_ERROR
      this.dialog && this.dialog.displayError(`An error occured, your site is not published. ${e.message}`, this.state, this.settings)
      this.editor.trigger('publish:stop', { success: false, message: e.message })
      return
    }
    try {
      this.state = await res.json()
    } catch (e) {
      this.state.status = PublicationStatus.STATUS_ERROR
      this.dialog && this.dialog.displayError(`Could not parse the server response, your site may be published. ${e.message}`, this.state, this.settings)
      this.editor.trigger('publish:stop', { success: false, message: e.message })
      return
    }
    if (!res.ok) {
      this.state.status = PublicationStatus.STATUS_ERROR
      this.dialog && this.dialog.displayError(`An network error occured, your site is not published. ${res.statusText}`, this.state, this.settings)
      this.editor.trigger('publish:stop', { success: false, message: `An network error occured, your site is not published. ${res.statusText}` })
      return
    }
    if (this.state.running) {
      setTimeout(() => this.trackProgress(), 2000)
    } else {
      this.state.status = this.state.error ? PublicationStatus.STATUS_ERROR : PublicationStatus.STATUS_SUCCESS
      this.editor.trigger('publish:stop', { success: this.state.error })
    }
    this.dialog && this.dialog.renderDialog(this.state, this.settings)
  }
}
