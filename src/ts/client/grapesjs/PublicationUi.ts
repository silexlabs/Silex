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
 * @TODO Use publication events instead of calls from the PublicationManager
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
  public isOpen = false
  /**
   * Dialog content
   */
  private errorMessage = ''
  /**
   * Dialog element
   * This is the DOM element of the dialog
   */
  private el: HTMLElement

  public settings: PublicationSettings

  private sender = null

  /**
   * Initialize the dialog and the publish button
   */
  constructor(private editor: PublishableEditor, private options: PublicationDialogOptions) {
    // Reference to the dialog element
    this.el = this.createDialogElements()
    // Add the publish command to the editor
    const openDialog = () => this.openDialog()
    const closeDialog = () => this.closeDialog()
    const setSender = sender => this.sender = sender
    editor.Commands.add(cmdPublish, {
      run(editor: PublishableEditor, sender) {
        setSender(sender)
        openDialog()
      },
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
  isReady(status: PublicationStatus) {
    return status === PublicationStatus.STATUS_NONE
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
    // Let the other buttons be added, we want to be last
    setTimeout(() => {
      // Create the publish button
      this.editor.Panels.addButton(this.options.appendTo, {
        id: 'publish-button',
        className: 'silex-button--size publish-button',
        command: cmdPublish,
        attributes: { title: 'Publish' },
        label: '<span class="fa-solid fa-upload"></span><span class="silex-button--small">Publish</span>',
      })
    })
    return el
  }
  move(rect) {
    Object.keys(rect).forEach(key => this.el.style[key] = rect[key] + 'px')
  }

  // **
  // Functions to render the dialog
  private async renderDialog(job: PublicationJobData, status: PublicationStatus) {
    try {
      if(this.isOpen && (!status || !this.settings)) throw new Error('PublicationUi: open but no status or settings')
      render(html`
      ${!this.isOpen ? '' : this.settings.connector ? await this.renderOpenDialog(job, status) : await this.renderLoginDialog(status)}
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
  async renderOpenDialog(job: PublicationJobData, status: PublicationStatus): Promise<TemplateResult> {
    return html`
    <header>
      <h3>Publication</h3>
    </header>
    <main>
      ${this.isPending(status) ? html`
        <p>Publication in progress</p>
      ` : ''}
      ${this.isReady(status) ? html`
        <p>You are connected to ${this.settings.connector.displayName}</p><p>Click on the publish button to publish your website</p>
        ${this.settings.options && Object.entries(this.settings.options).length && html`<p>Publication options: <ul>${ Object.entries(this.settings.options).map(([key, value]) => html`<li>${key}: ${value}</li>`) }</ul></p>`}
      ` : ''}
      ${this.isSuccess(status) ? html`
        <p>Publication success</p>
        ${this.settings.options?.websiteUrl ? html`<p><a href="${this.settings.options.websiteUrl}" target="_blank">Click here to view the published website</a></p>` : ''}
      ` : ''}
      ${this.isError(status) || this.isLoggedOut(status) ? html`
        <p>Publication error</p>
        <div>${unsafeHTML(this.errorMessage)}</div>
      ` : ''}
      ${job?.message ? html`
        <p>${unsafeHTML(job.message)}</p>
      ` : ''}
      ${this.isPending(status) ? html`
        <progress
          value=""
          style="width: 100%;"
        ></progress>
      ` : ''}
      ${job?.logs?.length && job.logs[0].length ? html`
        <br><details>
          <summary>Logs</summary>
          <pre style="
            max-width: 100%;
            font-size: x-small;
            " >${unsafeHTML(cleanupLogEntry(job.logs))}
          </pre>
        </details>
      ` : ''}
      ${job?.errors?.length && job.errors[0].length ? html`
        <br><details>
          <summary>Errors</summary>
          <pre style="
            max-width: 100%;
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
          @click=${() => this.editor.Commands.run(cmdPublicationLogin, this.settings.connector)}
        >Connect</button>
      `: this.settings.connector.disableLogout ? '' : html`
        <button
          class="silex-button silex-button--secondary"
          id="publish-button--secondary"
          @click=${() => this.editor.Commands.run(cmdPublicationLogout)}
        >Disconnect</button>
      `}
      <button
        class="silex-button silex-button--secondary"
        id="publish-button--secondary"
        @click=${() => this.editor.Commands.stop(cmdPublish)}
      >Close</button>
    </footer>
    `
  }
  async renderLoginDialog(status: PublicationStatus): Promise<TemplateResult> {
    try {
      render(html`<main><p>Loading</p></main>`, this.el)
      const hostingConnectors = await connectorList({ type: ConnectorType.HOSTING })
      const loggedConnectors: ConnectorData[] = hostingConnectors.filter(connector => connector.isLoggedIn)
      if (hostingConnectors.length === 1 && loggedConnectors.length === 1) {
        this.settings.connector = loggedConnectors[0]
        return this.renderOpenDialog(null, PublicationStatus.STATUS_NONE)
      }
      //const loggedConnector: ConnectorData = hostingConnectors.find(connector => connector.isLoggedIn)
      //if (loggedConnector) {
      //  this.settings.connector = loggedConnector
      //  return this.renderOpenDialog(null, PublicationStatus.STATUS_NONE)
      //}
      return html`
      <main>
        <p>You need to connect a hosting connector to publish your website</p>
        ${this.isError(status) || this.isLoggedOut(status) ? html`
          <p>Login error</p>
          <div>${unsafeHTML(this.errorMessage)}</div>
        ` : ''}
        ${hostingConnectors.map(connector => html`
          <button
            class="silex-button silex-button--primary"
            id="publish-button--primary"
            @click=${() => this.editor.Commands.run(cmdPublicationLogin, connector)}
          >${connector.displayName}</button>
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
  displayPending(job: PublicationJobData, status: PublicationStatus) {
    this.errorMessage = null
    this.renderDialog(job, status)
  }
  displayError(message: string, job: PublicationJobData, status: PublicationStatus) {
    console.info(message)
    this.errorMessage = message
    this.renderDialog(job, status)
  }
  async closeDialog() {
    this.isOpen = false
    this.renderDialog(null, null)
    if(this.sender) this.sender.set('active', 0) // Deactivate the button to make it ready to be clicked again
    this.sender = null
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
    //this.editor.Commands.run(cmdPublicationStart)
    this.renderDialog(null, PublicationStatus.STATUS_NONE)
  }
}
