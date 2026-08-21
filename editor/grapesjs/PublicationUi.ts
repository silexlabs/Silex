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

import { html, nothing, render, TemplateResult } from 'lit-html'
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'
import { live } from 'lit-html/directives/live.js'
//import { map } from 'lit-html/directives/map.js'
import { cmdPublicationLogin, cmdPublicationLogout, cmdPublicationStart, PublicationStatus, PublishableEditor, withConnectorOptions } from './PublicationManager'
import { ConnectorData, ConnectorType, OptionsField, PublicationJobData, PublicationSettings } from '~/common/types'
import { connectorList } from '../api'
import { defaultKms } from './keymaps'
import { titleCase } from '../utils'
import { ClientEvent } from '../events'

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

// The form the hosting asks for, and the ids that tie its parts together.
// The publish button is the submit button of this form even though it stands
// outside of it, which is what the `form` attribute of a button is for.
const optionsFormId = 'publish-options-form'
const fieldId = (field: OptionsField) => `publish-option--${field.name}`
const helpId = (field: OptionsField) => `publish-option--${field.name}--help`

// **
// Semantic Icons
const svgConnector = '<svg width="100%" height="100%" viewBox="0 0 44 23" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"><g><g><path d="M2,11.427c0,0 3.846,-2.655 7.376,0c3.531,2.656 7.45,0 7.45,0" style="fill:none;stroke:#a291ff;stroke-width:4px;"/></g><path d="M32.165,6.424l9.156,0" style="fill:none;stroke:#a291ff;stroke-width:4px;"/><path d="M32.165,2l0,18.854" style="fill:none;stroke:#a291ff;stroke-width:4px;"/><path d="M32.165,16.43l9.156,0" style="fill:none;stroke:#a291ff;stroke-width:4px;"/><path d="M26.253,20.854c-5.203,0 -9.427,-4.224 -9.427,-9.427c-0,-5.203 4.224,-9.427 9.427,-9.427l5.912,-0l0,18.854l-5.912,0Z" style="fill:none;stroke:#a291ff;stroke-width:4px;"/></g></svg>'
const svgSuccess = '<svg viewBox="0 0 40 28" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"><path d="M3,12.969l11.868,11.869l21.838,-21.838" style="fill:none;stroke:#37bf76;stroke-width:6px;"/></svg>'
const svgError = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"><g><path d="M3,28.915l25.915,-25.915" style="fill:none;stroke:#cf4443;stroke-width:6px;"/><path d="M28.915,28.915l-25.915,-25.915" style="fill:none;stroke:#cf4443;stroke-width:6px;"/></g></svg>'

// **
// Types
export type PublicationDialogOptions = {
  appendTo: string
}

// **
// Utils
function cleanupLogEntry(arr: string[][]): string {
  return arr[arr.length - 1]
    ?.map(str => str.replace(/\[[^\]]*\]/g, '').trim())
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
   * Why the dialog is showing the list of hostings
   *
   * Landing back on that list with nothing said reads as a bug, so the reason
   * is written here and shown in place of the usual line.
   */
  private notice = ''
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
  userContent: TemplateResult | null = null
  setUserContent(content: TemplateResult) {
    this.userContent = content
  }
  createDialogElements(): HTMLElement {
    // Create the dialog element
    const el = document.createElement('div')
    el.id = 'publish-dialog'
    el.className = 'silex-dialog-inline silex-dialog gjs-two-color silex-dialog-hide'
    document.body.append(el)
    // Let the other buttons be added, we want to be last
    setTimeout(() => {
      // Create the publish button
      this.editor.Panels.addButton(this.options.appendTo, {
        id: 'publish-button',
        className: 'silex-button--size publish-button',
        command: cmdPublish,
        attributes: { title: `Publish (${titleCase(defaultKms.kmOpenPublish.keys, '+')})` },
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
      ${!this.isOpen ? nothing : this.settings.connector ? await this.renderOpenDialog(job, status) : await this.renderLoginDialog(status)}
    `, this.el)
      if (this.isOpen) {
        this.el.classList.remove('silex-dialog-hide')
        const primaryBtn = this.el.querySelector('.silex-button--primary') as HTMLElement
        if (primaryBtn) primaryBtn.focus()
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
      <span>${unsafeHTML(svgConnector)} Connected to <span class="connector">${this.settings.connector.displayName}</span></span>
      ${this.settings.connector.disableLogout ? nothing : html`
      <button
        class="silex-button silex-button--secondary"
        id="publish-button--secondary"
        @click=${() => this.editor.Commands.run(cmdPublicationLogout)}
      >Disconnect
      </button>`}
    </header>
    <main>
      ${this.userContent || html`
        ${this.isPending(status) ? html`
          <p>Publication in progress...</p>
        ` : nothing}
        ${this.isReady(status) ? html`
          <p>Click on the button below to publish your website.</p>
          ${this.listedOptions().length > 0 ? html`<p>Publication options:</p><ul>${ this.listedOptions().map(([key, value]) => html`<li>${key}: ${value}</li>`) }</ul>` : nothing}
        ` : nothing}
        ${this.isSuccess(status) ? html`
          <h3 class="status">Publication success ${unsafeHTML(svgSuccess)}</h3>
          ${this.settings.options?.websiteUrl ? html`<p><a href="${this.settings.options.websiteUrl}" target="_blank">Click here to view the published website</a></p>` : nothing}
        ` : nothing}
        ${this.isError(status) || this.isLoggedOut(status) ? html`
          <h3 class="status">Publication error ${unsafeHTML(svgError)}</h3>
          ${this.errorMessage ? html`
            <details open>
              <summary>Details</summary>
              ${unsafeHTML(this.errorMessage)}
            </details>
          ` : nothing}
        ` : nothing}
        ${job?.message ? html`
          <div class="silex-publication-message">${unsafeHTML(job.message)}</div>
        ` : nothing}
        ${this.isPending(status) ? html`
          <progress></progress>
        ` : nothing}
        ${this.isReady(status) ? this.renderOptionsForm() : nothing}
        ${job?.logs?.length > 0 && job.logs[0].length > 0 ? html`
          <details>
            <summary>Logs</summary>
            <div class="logs">${unsafeHTML(cleanupLogEntry(job.logs))}</div>
          </details>
        ` : nothing}
        ${job?.errors?.length > 0 && job.errors[0].length > 0 ? html`
          <details>
            <summary>Errors</summary>
            <pre style="
              max-width: 100%;
              font-size: x-small;
              "
            >${unsafeHTML(cleanupLogEntry(job.errors))}
            </pre>
          </details>
        ` : nothing}
        ${this.isPending(status) || this.isLoggedOut(status) ? nothing : html`
          <button
            class="silex-button ${this.isSuccess(status) ? 'silex-button--secondary' : 'silex-button--primary'}"
            id="publish-button--primary"
            type=${this.settings.connector?.optionsForm ? 'submit' : 'button'}
            form=${this.settings.connector?.optionsForm ? optionsFormId : nothing}
            @click=${this.settings.connector?.optionsForm ? nothing : () => this.editor.Commands.run(cmdPublicationStart)}
          >${this.isSuccess(status) ? 'Publish again' : 'Publish'}</button>
        `}
      `}
    </main>
    <footer>
      ${this.isLoggedOut(status) ? html`
        <button
          class="silex-button silex-button--primary"
          id="publish-button--primary"
          @click=${() => this.editor.Commands.run(cmdPublicationLogin, this.settings.connector)}
        >Connect</button>
      `: nothing}
      <a href="https://docs.silex.me/en/user/publish" target="_blank">Help</a>
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
      // A hosting the server just refused is not swapped for another one
      // behind the user's back: they are shown the list and pick, even when
      // there is only one to pick from
      if (hostingConnectors.length === 1 && loggedConnectors.length === 1 && !this.notice) {
        this.settings.connector = loggedConnectors[0]
        // The only hosting there is, taken without going through the login
        // command: what it knows about this website still has to be read, and
        // what the user filled in still wins over it
        this.settings.options = withConnectorOptions(this.settings, loggedConnectors[0])
        return this.renderOpenDialog(null, PublicationStatus.STATUS_NONE)
      }
      //const loggedConnector: ConnectorData = hostingConnectors.find(connector => connector.isLoggedIn)
      //if (loggedConnector) {
      //  this.settings.connector = loggedConnector
      //  return this.renderOpenDialog(null, PublicationStatus.STATUS_NONE)
      //}
      return html`
      <main>
        <p>${this.notice || 'You need to select a hosting connector to publish your website.'}</p>
        ${this.isError(status) || this.isLoggedOut(status) ? html`
          <p>Login error</p>
          <div>${this.errorMessage ? unsafeHTML(this.errorMessage) : nothing}</div>
        ` : nothing}
        <div class="buttons">
          ${hostingConnectors.map(connector => html`
          <button
            class="silex-button"
            id="publish-button--primary"
            @click=${() => this.editor.Commands.run(cmdPublicationLogin, connector)}
          >${connector.displayName}</button>
        `)}
        </div>
      </main>
      <footer>
        <a href="https://docs.silex.me/en/user/publish" target="_blank">Help</a>
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
        <a href="https://docs.silex.me/en/user/publish" target="_blank">Help</a>
        <button
          class="silex-button silex-button--secondary"
          id="publish-button--secondary"
          @click=${() => this.editor.Commands.stop(cmdPublish)}
        >Close</button>
      </footer>
    `
    }
  }
  /**
   * The options shown as a list, which are the ones the form does not ask for
   *
   * An option the user is about to fill in is in the field made for it, and
   * printing it a second line above only makes the dialog say things twice.
   */
  private listedOptions(): Array<[string, unknown]> {
    const asked = (this.settings.connector?.optionsForm?.fields ?? []).map(field => field.name)
    return Object.entries(this.settings.options ?? {})
      .filter(([key]) => !asked.includes(key))
  }

  /**
   * What the hosting needs to know and cannot find out on its own
   *
   * The browser does the work here: the label points at its input, the input
   * carries the type of the field so that a phone offers the right keyboard and
   * an address is checked before it is sent, and the help text is tied to the
   * input so that a screen reader reads it with the field. The publish button
   * submits this form, which is what makes the Enter key publish.
   */
  renderOptionsForm(): TemplateResult | typeof nothing {
    const optionsForm = this.settings.connector?.optionsForm
    if (!optionsForm) return nothing
    const options = this.settings.options ?? {}
    return html`
      <form id=${optionsFormId} class="silex-form" @submit=${(event: Event) => this.publishWithOptions(event)}>
        <h3>${optionsForm.title}</h3>
        <div class="silex-form__group">
          ${optionsForm.fields.map(field => html`
            <div class="silex-form__element">
              <label for=${fieldId(field)}>${field.label}</label>
              ${field.help ? html`<p class="silex-help" id=${helpId(field)}>${field.help}</p>` : nothing}
              <input
                id=${fieldId(field)}
                name=${field.name}
                type=${field.type}
                ?required=${field.required}
                aria-describedby=${field.help ? helpId(field) : nothing}
                .value=${live(options[field.name] ?? field.value ?? '')}
              />
            </div>
          `)}
        </div>
      </form>
    `
  }

  /**
   * Keep what the user wrote, then publish
   *
   * Nothing is saved here: the options leave with the publication itself, and
   * the website is written by the next save like any other change. Publishing
   * is not saving, and a publication must not decide when a site is written.
   */
  private publishWithOptions(event: Event) {
    event.preventDefault()
    const options = { ...this.settings.options }
    new FormData(event.target as HTMLFormElement).forEach((value, name) => {
      const written = typeof value === 'string' ? value.trim() : ''
      if (written) options[name] = written
      else delete options[name]
    })
    this.settings.options = options
    this.editor.Commands.run(cmdPublicationStart)
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
    if (this.sender && typeof this.sender.set === 'function') {
      this.sender.set('active', 0)
    } // Deactivate the button to make it ready to be clicked again
    this.sender = null
    this.editor.trigger(ClientEvent.PUBLICATION_UI_CLOSE, { publicationUi: this })
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
    this.editor.trigger(ClientEvent.PUBLICATION_UI_OPEN, { publicationUi: this })
    // Shown first and asked about after: the answer takes a round trip to the
    // server, and a dialog that waits for it is a dialog that opens late
    await this.refreshConnector()
    this.renderDialog(null, PublicationStatus.STATUS_NONE)
  }

  /**
   * Ask the hosting again about this website, as the dialog opens
   *
   * The connector is saved with the website, so a site published a while ago
   * carries what its hosting answered back then, without the address or the
   * form the hosting knows how to give today. Asked here rather than when the
   * website loads: this is the moment the answer is used, and a website nobody
   * publishes never pays for it.
   *
   * Only a connector with the same id ever takes its place. On the hosted
   * version a user has several, and moving a website to another hosting is not
   * something a dialog opening decides.
   */
  private async refreshConnector(): Promise<void> {
    this.notice = ''
    const saved = this.settings.connector
    if (!saved) return

    let connectors: ConnectorData[]
    try {
      connectors = await connectorList({ type: ConnectorType.HOSTING })
    } catch (err) {
      // Nothing was learned, so nothing changes: what was saved still
      // publishes, and a server that did not answer must not stop the user
      console.error('Could not ask which hostings are available', err)
      return
    }

    const sameOne = connectors.find(connector => connector.connectorId === saved.connectorId)
    if (sameOne) {
      this.settings.connector = sameOne
      this.settings.options = withConnectorOptions(this.settings, sameOne)
      return
    }

    // The server just said it has no such hosting: a website saved on the
    // hosted version and opened in Silex Desktop, or the other way around.
    // Keeping it would let the user publish to nothing, so the dialog goes back
    // to the list and says why. What they typed is theirs and stays.
    this.settings.connector = null
    this.notice = connectors.length > 0
      ? `Silex cannot publish to ${saved.displayName} here. Please choose where to publish.`
      : 'There is no hosting to publish to here.'
  }
}
