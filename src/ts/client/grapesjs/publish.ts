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

import {html, render} from 'lit-html'
import {map} from 'lit-html/directives/map.js'
import { getPageSlug } from '../../page'
import { onAll } from '../utils'
import { HOSTING_PUBLICATION_STATUS_PATH, HOSTING_PUBLISH_PATH, BACKEND_LOGOUT_PATH, BACKEND_LIST_PATH } from '../../constants'
import { BackendData, PublicationSettings, WebsiteId, WebsiteSettings } from '../../types'
import { Editor } from 'grapesjs'

// Constants
export const cmdPublish = 'publish-open-dialog'

// Types
export type PublishableEditor = Editor & {
  PublicationManager: PublicationManager
}

export enum PublicationStatus {
  STATUS_NONE = 'STATUS_NONE',
  STATUS_PENDING = 'STATUS_PENDING',
  STATUS_ERROR = 'STATUS_ERROR',
  STATUS_SUCCESS = 'STATUS_SUCCESS',
  STATUS_AUTH_ERROR = 'STATUS_AUTH_ERROR',
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
  appendTo: string
  websiteId: WebsiteId
  rootUrl: string
}

// plugin init cod
export default function publishPlugin(editor, opts) {
  (editor as PublishableEditor).PublicationManager = new PublicationManager(editor, opts)
}

// Utils
function cleanup(arr: string[][]): string {
  return arr[arr.length-1]
    ?.map(str => str.replace(/\[.*\]/g, '').trim())
    ?.filter(str => !!str)
    ?.join('\n')
}


// The publication manager class
// This class is responsible for the publication dialog and for the publication process
// It is added to the editor instance as editor.PublicationManager
export class PublicationManager {
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
   * Dialog state
   */
  open = false
  /**
   * Dialog content
   */
  errorMessage = ''
  /**
   * Dialog element
   * This is the DOM element of the dialog
   */
  dialog: HTMLElement
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

  constructor(private editor: PublishableEditor, opts: any) {
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
      const model = editor.getModel()
      this.settings = data.publication ?? {}
    })
    // Add the publish button to the editor
    editor.Panels.addButton(opts.appendTo, {
      id: 'publish-button',
      className: 'silex-button--size publish-button',
      command: cmdPublish,
      attributes: { title: 'Publish' },
      label: '<span class="fa-solid fa-upload"></span><span class="silex-button--small">Publish</span>',
    })
    // Add the publish command to the editor
    editor.Commands.add(cmdPublish, {
      run(editor: PublishableEditor) { this.openDialog(editor) },
      stop(editor: PublishableEditor) { this.closeDialog(editor) },
    })
    // Reference to the dialog element
    this.dialog = this.createDialogElements().dialog
  }
  // Functions to open and close the dialog
  getDialogElements() {
    const el = document.querySelector('#publish-dialog') as HTMLElement
    return el ? {
      dialog: el,
      primary: el.querySelector('#publish-button--primary'),
      secondary: el.querySelector('#publish-button--secondary'),
    } : null
  }
  createDialogElements() {
    const el = document.createElement('div')
    el.id = 'publish-dialog'
    el.className = 'silex-dialog-inline silex-dialog gjs-two-color'
    document.body.append(el)
    return this.getDialogElements()
  }
  move(rect) {
    Object.keys(rect).forEach(key => this.dialog.style[key] = rect[key] + 'px')
  }
  // Functions to render the dialog
  async update() {
    const publicationSettings = this.editor.getModel().get('publication') as PublicationSettings
    console.log('update', { publicationSettings })
    render(html`
    ${!open ? '' : publicationSettings.backend ? await this.getOpenPublishDialog() : await this.getOpenLoginDialog()}
  `, this.dialog)
    if (open) {
      this.dialog.classList.remove('silex-dialog-hide')
    } else {
      this.dialog.classList.add('silex-dialog-hide')
    }
  }
  async getOpenPublishDialog() {
    console.log('getOpenPublishDialog', this.state.status)
    return html`
    <main>
      ${this.state.status === PublicationStatus.STATUS_PENDING ? html`
        <p>Publication in progress</p>
      ` : ''}
      ${this.state.status === PublicationStatus.STATUS_SUCCESS ? html`
        <p>Publication success</p>
        ${this.settings.url ? html`<a href="${this.settings.url}" target="_blank">Click here to view the published website</a>` : ''}
      ` : ''}
      ${this.state.status === PublicationStatus.STATUS_ERROR || this.state.status === PublicationStatus.STATUS_AUTH_ERROR ? html`
        <p>Publication error</p>
        <div>${this.errorMessage}</div>
      ` : ''}
      ${this.state?.running ? html`
        <progress
          value=""
          style="width: 100%;"
        ></progress>
      ` : ''}
      ${this.state.logs?.length ? html`
        <details>
          <summary>Logs</summary>
          <pre style="
            max-width: 100%;
            max-height: 50vh;
            overflow: auto;
            font-size: x-small;
            "
          >${cleanup(this.state.logs)}
          </pre>
        </details>
      ` : ''}
      ${this.state.errors?.length ? html`
        <details>
          <summary>Errors</summary>
          <pre style="
            max-width: 100%;
            max-height: 50vh;
            overflow: auto;
            font-size: x-small;
            "
          >${cleanup(this.state.errors)}
          </pre>
        </details>
      ` : ''}
    </main>
    <footer>
      ${this.state.status === PublicationStatus.STATUS_PENDING || this.state.status === PublicationStatus.STATUS_AUTH_ERROR ? '' : html`
        <button
          class="silex-button silex-button--primary"
          id="publish-button--primary"
          @click=${() => this.startPublication()}
        >Publish</button>
      `}
      ${this.state.status === PublicationStatus.STATUS_AUTH_ERROR ? html`
        <button
          class="silex-button silex-button--primary"
          id="publish-button--primary"
          @click=${() => this.goLogin(this.settings.backend)}
        >Login</button>
      `: this.editor.getModel().get('publication')?.disableLogout ? '' : html`
        <button
          class="silex-button silex-button--secondary"
          id="publish-button--secondary"
          @click=${() => this.goLogout()}
        >Logout</button>
      `}
      <button
        class="silex-button silex-button--secondary"
        id="publish-button--secondary"
        @click=${() => this.editor.Commands.stop(cmdPublish)}
      >Close</button>
    </footer>
    `
  }
  async getOpenLoginDialog() {
    try {
      console.log('getOpenLoginDialog', this.state)
      const hostingProviders = await fetch(`${this.options.rootUrl}${BACKEND_LIST_PATH}?type=hosting`).then(res => res.json()) as BackendData[]
      console.log('getOpenLoginDialog', { hostingProviders })
      const loggedProvider: BackendData = hostingProviders.find(provider => provider.isLoggedIn)
      console.log('getOpenLoginDialog', { loggedProvider })

      if (loggedProvider) {
        const updatedPublicationSettings: PublicationSettings = {
          ...this.editor.getModel().get('publication'),
          backend: loggedProvider.backendId,
        }
        this.editor.getModel().set('publication', updatedPublicationSettings)

        this.startPublication()
        return ''
      }
      return html`
      <main>
        <p>You need to login to publish your website</p>
        ${hostingProviders.map(backend => html`
          <button
            class="silex-button silex-button--primary"
            id="publish-button--primary"
            @click=${() => this.goLogin(backend)}
          >Login with ${backend.backendId}</button>
        `)}
      </main>
      <footer>
        <button
          class="silex-button silex-button--secondary"
          id="publish-button--secondary"
          @click=${() => this.editor.Commands.stop(cmdPublish)}
        >Close</button>
      </footer>
    `
    } catch (err) {
      console.error(err)
      return html`
      <header>
        <h3>Oops</h3>
      </header>
      <main>
        <p>Unable to load hosting providers</p>
        <p>Something went wrong: ${err.message}</p> 
      </main>
      <footer>
        <button
          class="silex-button silex-button--secondary"
          id="publish-button--secondary"
          @click=${() => this.editor.Commands.stop(cmdPublish)}
        >Close</button>
      </footer>
    `
    }
  }
  displayError(message: string, _status = PublicationStatus.STATUS_ERROR) {
    console.error(message)
    this.errorMessage = message
    this.state.status = _status
    this.update()
  }
  async closeDialog() {
    this.open = false
    this.update()
  }
  async toggleDialog() {
    if (this.open) this.closeDialog()
    else this.openDialog()
  }
  async openDialog() {
    this.open = true

    // Position
    const buttonEl = this.editor.Panels.getPanel('options').view.el
      .querySelector('.publish-button')
    const rect = buttonEl.getBoundingClientRect()

    const width = 450
    const padding = 10 * 2
    const minHeight = 50
    this.move({
      left: rect.right - width - padding,
      top: rect.bottom + 10,
      width,
      minHeight,
    })

    // Publication
    if (this.state.status === PublicationStatus.STATUS_NONE) {
      this.startPublication()
    } else {
      this.update()
    }
  }

  async goLogin(provider: BackendData) {
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
            this.displayError(event.data.error, PublicationStatus.STATUS_AUTH_ERROR)
          } else {
            console.log('login success')
            this.editor.getModel().set('publication', event.data)
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
    this.editor.getModel().set('publication', {})
    this.update()
  }

  async startPublication() {
    console.log('startPublication')
    if (this.state.status === PublicationStatus.STATUS_PENDING) throw new Error('Publication is already in progress')
    this.state.status = PublicationStatus.STATUS_PENDING
    if (!this.settings?.backend?.backendId) {
      this.displayError('Please login', PublicationStatus.STATUS_AUTH_ERROR)
      return
    }
    this.update()
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
      this.displayError(`An error occured, your site is not published. ${e.message}`)
      this.editor.trigger('publish:stop', { success: false, message: e.message })
      return
    }
    try {
      json = await res.json()
    } catch (e) {
      this.displayError(`Could not parse the server response, your site may be published. ${e.message}`)
      this.editor.trigger('publish:stop', { success: false, message: e.message })
      return
    }
    if (!res.ok) {
      if (res.status === 401) {
        // Auth error, user needs to login again
        this.displayError(`You need to login again to publish your site. ${json.message}`, PublicationStatus.STATUS_AUTH_ERROR)

      } else {
        // Other error
        this.displayError(`An network error occured, your site is not published. ${json.message}`)
      }
      this.editor.trigger('publish:stop', { success: false, message: json.message })
      return
    }
    this.settings.url = json.url
    await this.editor.store(null)
    //if(json.statusUrl) {
    this.trackProgress()
    //} else {
    //  this.state.status = PublicationStatus.STATUS_SUCCESS
    //  update()
    //  this.editor.trigger('publish:stop', {success: true})
    //}
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
      this.displayError(`An error occured, your site is not published. ${e.message}`)
      this.editor.trigger('publish:stop', { success: false, message: e.message })
      return
    }
    try {
      this.state = await res.json()
    } catch (e) {
      this.displayError(`Could not parse the server response, your site may be published. ${e.message}`)
      this.editor.trigger('publish:stop', { success: false, message: e.message })
      return
    }
    if (!res.ok) {
      this.displayError(`An network error occured, your site is not published. ${res.statusText}`)
      this.editor.trigger('publish:stop', { success: false, message: `An network error occured, your site is not published. ${res.statusText}` })
      return
    }
    if (this.state.running) {
      setTimeout(() => this.trackProgress(), 2000)
    } else {
      this.state.status = this.state.error ? PublicationStatus.STATUS_ERROR : PublicationStatus.STATUS_SUCCESS
      this.editor.trigger('publish:stop', { success: this.state.error })
    }
    this.update()
  }
}
