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
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'
//import { map } from 'lit-html/directives/map.js'
import { cmdPublicationLogin, cmdPublicationLogout, cmdPublicationStart, PublicationStatus, PublishableEditor } from './PublicationManager'
import { ConnectorData, ConnectorType, PublicationJobData, PublicationSettings } from '../../types'
import { connectorList } from '../api'

/**
 * @fileoverview define the publication dialog
 * This is the UI of the publication feature
 * It is a dialog which allows the user to login to a connector and publish the website
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
    // Reference to the dialog element
    this.el = this.createDialogElements()
    // Add the publish command to the editor
    const openDialog = () => this.openDialog()
    const closeDialog = () => this.closeDialog()
    editor.Commands.add(cmdPublish, {
      run(editor: PublishableEditor) { openDialog() },
      stop(editor: PublishableEditor) { closeDialog() },
    })
  }

  // **
  // Convenient state checkers
  isSuccess(status: PublicationStatus) {
    return status === PublicationStatus.STATUS_SUCCESS
  }
  isPending(status: PublicationStatus) {
    return status === PublicationStatus.STATUS_PENDING
  }
  isError(status: PublicationStatus) {
    return status === PublicationStatus.STATUS_ERROR
  }
  isLoggedOut(status: PublicationStatus) {
    return status === PublicationStatus.STATUS_LOGGED_OUT
  }

  // **
  // Functions to open and close the dialog
  getDialogElements(): { el: HTMLElement, primary: HTMLElement, secondary: HTMLElement } {
    const el = document.querySelector('#publish-dialog') as HTMLElement
    const primary = el?.querySelector('#publish-button--primary') as HTMLElement
    const secondary = el?.querySelector('#publish-button--secondary') as HTMLElement
    if(!el || !primary || !secondary) throw new Error('Publication dialog elements not found')
    return { el, primary, secondary }
  }
  createDialogElements(): HTMLElement {
    // Create the dialog element
    const el = document.createElement('div')
    el.id = 'publish-dialog'
    el.className = 'silex-dialog-inline silex-dialog gjs-two-color'
    document.body.append(el)
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
  private async renderDialog(job: PublicationJobData, status: PublicationStatus, settings: PublicationSettings) {
    try {
      if(this.isOpen && (!status || !settings)) throw new Error('PublicationUi: open but no status or settings')
      render(html`
      ${!this.isOpen ? '' : settings.connector ? await this.renderOpenDialog(job, status, settings) : await this.renderLoginDialog(status, settings)}
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
  async renderOpenDialog(job: PublicationJobData, status: PublicationStatus, settings: PublicationSettings): Promise<TemplateResult> {
    return html`
    <main>
      ${this.isPending(status) ? html`
        <p>Publication in progress</p>
      ` : ''}
      ${this.isSuccess(status) ? html`
        <p>Publication success</p>
        ${settings.url ? html`<a href="${settings.url}" target="_blank">Click here to view the published website</a>` : ''}
      ` : ''}
      ${this.isError(status) || this.isLoggedOut(status) ? html`
        <p>Publication error</p>
        <div>${unsafeHTML(this.errorMessage)}</div>
      ` : ''}
      ${job && job.message ? html`
        <div>${unsafeHTML(job.message)}</div>
      ` : ''}
      ${this.isPending(status) ? html`
        <progress
          value=""
          style="width: 100%;"
        ></progress>
      ` : ''}
      ${job && job.logs?.length ? html`
        <br><details>
          <summary>Logs</summary>
          <pre style="
            max-width: 100%;
            max-height: 50vh;
            overflow: auto;
            font-size: x-small;
            "
          >${unsafeHTML(cleanupLogEntry(job.logs))}
          </pre>
        </details>
      ` : ''}
      ${job && job.errors?.length ? html`
        <br><details>
          <summary>Errors</summary>
          <pre style="
            max-width: 100%;
            max-height: 50vh;
            overflow: auto;
            font-size: x-small;
            "
          >${unsafeHTML(cleanupLogEntry(job.errors))}
          </pre>
        </details>
      ` : ''}
    </main>
    <footer>
      ${this.isPending(status) || this.isLoggedOut(status) ? '' : html`
        <button
          class="silex-button silex-button--primary"
          id="publish-button--primary"
          @click=${() => this.editor.Commands.run(cmdPublicationStart)}
        >Publish</button>
      `}
      ${this.isLoggedOut(status) ? html`
        <button
          class="silex-button silex-button--primary"
          id="publish-button--primary"
          @click=${() => this.editor.Commands.run(cmdPublicationLogin)}
        >Login</button>
      `: settings.connector.disableLogout ? '' : html`
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
  async renderLoginDialog(status: PublicationStatus, settings: PublicationSettings): Promise<TemplateResult> {
    try {
      const hostingConnectors = await connectorList(ConnectorType.HOSTING)
      const loggedConnector: ConnectorData = hostingConnectors.find(connector => connector.isLoggedIn)

      if (loggedConnector) {
        settings.connector = loggedConnector
        this.editor.Commands.run(cmdPublicationStart)
        return html``
      }
      return html`
      <main>
        <p>You need to login to publish your website</p>
        ${this.isError(status) || this.isLoggedOut(status) ? html`
          <p>Login error</p>
          <div>${unsafeHTML(this.errorMessage)}</div>
        ` : ''}
        ${hostingConnectors.map(connector => html`
          <button
            class="silex-button silex-button--primary"
            id="publish-button--primary"
            @click=${() => this.editor.Commands.run(cmdPublicationLogin, connector)}
          >Login with ${connector.connectorId}</button>
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
        <p>Unable to load hosting connectors</p>
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
  displayPending(job: PublicationJobData, status: PublicationStatus, settings: PublicationSettings) {
    this.errorMessage = null
    this.renderDialog(job, status, settings)
  }
  displayError(message: string, job: PublicationJobData, status: PublicationStatus, settings: PublicationSettings) {
    console.error(message, job?.message)
    this.errorMessage = message
    this.renderDialog(job, status, settings)
  }
  async closeDialog() {
    this.isOpen = false
    this.renderDialog(null, null, null)
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