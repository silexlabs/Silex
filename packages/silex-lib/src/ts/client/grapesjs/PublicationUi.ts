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

import { html, render, TemplateResult } from 'lit-html'
//import { map } from 'lit-html/directives/map.js'
import { cmdPublicationLogin, cmdPublicationLogout, cmdPublicationStart, PublicationState, PublicationStatus, PublishableEditor } from './PublicationManager'
import { BackendData, PublicationSettings } from '../../types'
import { BACKEND_LIST_PATH } from '../../constants'

/**
 * @fileoverview define the publication dialog
 * This is the UI of the publication feature
 * It is a dialog which allows the user to login to a backend and publish the website
 * It also displays the publication status and logs during the publication process
 * This class is used by the PublicationManager
 * This is optional, you can use the PublicationManager without this UI
 */

// **
// Constants
export const cmdPublish = 'publish-open-dialog'

// **
// Types
export type PublicationDialogOptions = {
  appendTo: string
  rootUrl: string
}

// **
// Utils
function cleanupLogEntry(arr: string[][]): string {
  return arr[arr.length - 1]
    ?.map(str => str.replace(/\[.*\]/g, '').trim())
    ?.filter(str => !!str)
    ?.join('\n')
}

/**
 * Class to manage the publication dialog
 */
export class PublicationUi {
  /**
   * Dialog state
   */
  private isOpen = false
  /**
   * Dialog content
   */
  private errorMessage = ''
  /**
   * Dialog element
   * This is the DOM element of the dialog
   */
  private el: HTMLElement

  /**
   * Initialize the dialog and the publish button
   */
  constructor(private editor: PublishableEditor, private options: PublicationDialogOptions) {
    // Add the publish button to the editor
    console.log('PublicationUi add button', options.appendTo)
    // Reference to the dialog element
    this.el = this.createDialogElements()
    // Add the publish command to the editor
    const ui: PublicationUi = this
    editor.Commands.add(cmdPublish, {
      run(editor: PublishableEditor) { ui.openDialog() },
      stop(editor: PublishableEditor) { ui.closeDialog() },
    })
  }

  // **
  // Convenient state checkers
  isSuccess(state: PublicationState) {
    return state.status === PublicationStatus.STATUS_SUCCESS
  }
  isPending(state: PublicationState) {
    return state.status === PublicationStatus.STATUS_PENDING
  }
  isError(state: PublicationState) {
    return state.status === PublicationStatus.STATUS_ERROR
  }
  isLoggedOut(state: PublicationState) {
    return state.status === PublicationStatus.STATUS_LOGGED_OUT
  }

  // **
  // Functions to open and close the dialog
  getDialogElements(): { el: HTMLElement, primary: HTMLElement, secondary: HTMLElement } {
    const el = document.querySelector('#publish-dialog') as HTMLElement
    const primary = el?.querySelector('#publish-button--primary') as HTMLElement
    const secondary = el?.querySelector('#publish-button--secondary') as HTMLElement
    console.log('get dialog elements', el, primary, secondary)
    if(!el || !primary || !secondary) throw new Error('Publication dialog elements not found')
    return { el, primary, secondary }
  }
  createDialogElements(): HTMLElement {
    // Create the dialog element
    const el = document.createElement('div')
    el.id = 'publish-dialog'
    el.className = 'silex-dialog-inline silex-dialog gjs-two-color'
    document.body.append(el)
    console.log('create dialog elements', el)
    // Create the publish button
    this.editor.Panels.addButton(this.options.appendTo, {
      id: 'publish-button',
      className: 'silex-button--size publish-button',
      command: cmdPublish,
      attributes: { title: 'Publish' },
      label: '<span class="fa-solid fa-upload"></span><span class="silex-button--small">Publish</span>',
    })
    return el
  }
  move(rect) {
    Object.keys(rect).forEach(key => this.el.style[key] = rect[key] + 'px')
  }

  // **
  // Functions to render the dialog
  async renderDialog(state: PublicationState, settings: PublicationSettings) {
    console.log('update', state, settings)
    try {
      if(this.isOpen && (!state || !settings)) throw new Error('PublicationUi: open but no state or settings')
      render(html`
      ${!this.isOpen ? '' : settings.backend ? await this.renderOpenDialog(state, settings) : await this.renderLoginDialog(state, settings)}
    `, this.el)
      if (this.isOpen) {
        this.el.classList.remove('silex-dialog-hide')
      } else {
        this.el.classList.add('silex-dialog-hide')
      }
    } catch (err) {
      console.error('Error while rendering the dialog', err)
    }
  }
  async renderOpenDialog(state: PublicationState, settings: PublicationSettings): Promise<TemplateResult> {
    console.log('getOpenPublishDialog', state.status)
    return html`
    <main>
      ${this.isPending(state) ? html`
        <p>Publication in progress</p>
      ` : ''}
      ${this.isSuccess(state) ? html`
        <p>Publication success</p>
        ${settings.url ? html`<a href="${settings.url}" target="_blank">Click here to view the published website</a>` : ''}
      ` : ''}
      ${this.isError(state) || this.isLoggedOut(state) ? html`
        <p>Publication error</p>
        <div>${this.errorMessage}</div>
      ` : ''}
      ${state?.running ? html`
        <progress
          value=""
          style="width: 100%;"
        ></progress>
      ` : ''}
      ${state.logs?.length ? html`
        <details>
          <summary>Logs</summary>
          <pre style="
            max-width: 100%;
            max-height: 50vh;
            overflow: auto;
            font-size: x-small;
            "
          >${cleanupLogEntry(state.logs)}
          </pre>
        </details>
      ` : ''}
      ${state.errors?.length ? html`
        <details>
          <summary>Errors</summary>
          <pre style="
            max-width: 100%;
            max-height: 50vh;
            overflow: auto;
            font-size: x-small;
            "
          >${cleanupLogEntry(state.errors)}
          </pre>
        </details>
      ` : ''}
    </main>
    <footer>
      ${this.isPending(state) || this.isLoggedOut(state) ? '' : html`
        <button
          class="silex-button silex-button--primary"
          id="publish-button--primary"
          @click=${() => this.editor.Commands.run(cmdPublicationStart)}
        >Publish</button>
      `}
      ${this.isLoggedOut(state) ? html`
        <button
          class="silex-button silex-button--primary"
          id="publish-button--primary"
          @click=${() => this.editor.Commands.run(cmdPublicationLogin)}
        >Login</button>
      `: settings.backend.disableLogout ? '' : html`
        <button
          class="silex-button silex-button--secondary"
          id="publish-button--secondary"
          @click=${() => this.editor.Commands.run(cmdPublicationLogout)}
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
  async renderLoginDialog(state: PublicationState, settings: PublicationSettings): Promise<TemplateResult> {
    try {
      console.log('getOpenLoginDialog', state)
      const hostingProviders = await fetch(`${this.options.rootUrl}${BACKEND_LIST_PATH}?type=hosting`).then(res => res.json()) as BackendData[]
      console.log('getOpenLoginDialog', { hostingProviders })
      const loggedProvider: BackendData = hostingProviders.find(provider => provider.isLoggedIn)
      console.log('getOpenLoginDialog', { loggedProvider })

      if (loggedProvider) {
        settings.backend = loggedProvider
        this.editor.Commands.run(cmdPublicationStart)
        return html``
      }
      return html`
      <main>
        <p>You need to login to publish your website</p>
        ${hostingProviders.map(backend => html`
          <button
            class="silex-button silex-button--primary"
            id="publish-button--primary"
            @click=${() => this.editor.Commands.run(cmdPublicationLogin, backend)}
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
  displayError(message: string, state: PublicationState, settings: PublicationSettings) {
    console.error(message)
    this.errorMessage = message
    this.renderDialog(state, settings)
  }
  async closeDialog() {
    this.isOpen = false
    this.renderDialog(null, null)
  }
  async toggleDialog() {
    if (this.isOpen) this.closeDialog()
    else this.openDialog()
  }
  async openDialog() {
    this.isOpen = true

    // Position
    const buttonEl = this.editor.Panels.getPanel('options')?.view.el.querySelector('.publish-button')
    if(buttonEl) {
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
    } else {
      console.error('Unable to find publish button')
    }

    // Publication
    this.editor.Commands.run(cmdPublicationStart)
  }
}
