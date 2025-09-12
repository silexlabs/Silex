import { createRef, Ref, ref } from 'lit/directives/ref.js'
import {repeat} from 'lit/directives/repeat.js'
import GraphQL, { GraphQLOptions } from '../datasources/GraphQL'
import { DATA_SOURCE_CHANGED, DATA_SOURCE_DATA_LOAD_END, DATA_SOURCE_ERROR, DATA_SOURCE_READY, DataSourceEditorViewOptions, IDataSource } from '../types'
import { getDefaultOptions, getElementFromOption } from '../utils'
import { getAllDataSources, addDataSource, removeDataSource } from '../model/dataSourceRegistry'
import { css, html, LitElement, render } from 'lit'
import { property } from 'lit/decorators.js'
import { Editor } from 'grapesjs'

const COMMON_STYLES = css`
    :host {
      font-family: var(--gjs-main-font);
      font-size: var(--gjs-font-size);
    }
    .ds-field {
      padding: 10px;
    }
    .ds-field > span {
      display: block;
    }
    hr.ds-separator {
      border: none;
      border-top: 1px solid var(--ds-button-bg);
    }
    .ds-field input,
    .ds-field select {
      background-color: var(--gjs-main-dark-color);
      border: none;
      box-shadow: none;
      border-radius: 2px;
      box-sizing: border-box;
      padding: 0;
      position: relative;

      padding: 10px;
      color: inherit;
      width: 100%;
    }
    .ds-btn-prim {
      color:inherit;
      background-color:var(--gjs-main-light-color);
      border-radius:2px;
      padding:3px 6px;
      padding:var(--gjs-input-padding);
      cursor:pointer;
      border:none
    }
    .ds-btn-prim:active {
      background-color:var(--gjs-main-light-color)
    }
    .ds-btn-danger {
      color: var(--gjs-light-color);
      background-color: transparent;
    }
    .ds-btn-danger:hover {
      color: var(--ds-highlight);
    }
    [disabled],
    [readonly] {
      font-style: italic;
    }

    /* Modal specific styles */
    :host(.ds-modal) {
      max-width: 600px;
      width: 90vw;
    }
`

export default (editor: Editor, options: Partial<DataSourceEditorViewOptions> = {}) => {
  // Settings dialog
  if (options.settingsEl) {
    // Get the container element for the UI
    const settingsEl = getElementFromOption(options.settingsEl, 'options.settingsEl')
    const dsSettings: Ref<SettingsDataSources> = createRef()
    editor.on(`${DATA_SOURCE_CHANGED} ${DATA_SOURCE_ERROR} ${DATA_SOURCE_READY} ${DATA_SOURCE_DATA_LOAD_END}`, () => {
      if(dsSettings.value) {
        dsSettings.value.dataSources = [...getAllDataSources()]
        dsSettings.value.requestUpdate()
      } else {
        renderSettings(editor, dsSettings, settingsEl)
      }
    })
    renderSettings(editor, dsSettings, settingsEl)
  }
}

function renderSettings(editor: Editor, dsSettings: Ref, settingsEl: HTMLElement) {
  render(html`
    <ds-settings
      ${ref(dsSettings)}
      .dataSources=${[]}
      .editor=${editor}
      @change=${(e: CustomEvent) => {
    const ds = e.detail as IDataSource
    // Handle data source changes - this may need to be reimplemented
    // depending on how the data source update logic should work
    console.log('Data source changed:', ds)
  }}
      @add=${(e: CustomEvent) => {
    const ds = e.detail as GraphQLOptions
    const newDS = new GraphQL(ds)
    addDataSource(newDS)
  }}
      @add-top=${(e: CustomEvent) => {
    const ds = e.detail as GraphQLOptions
    const newDS = new GraphQL(ds)
    addDataSource(newDS)
  }}
      @delete=${(e: CustomEvent) => {
    const ds = e.detail as IDataSource
    removeDataSource(ds)
  }}
      ></ds-settings>
  `, settingsEl)
}

/**
 * <ds-settings> is a web component that renders the settings dialog for the DataSourceEditor plugin
 */
class SettingsDataSources extends LitElement {

  @property({ type: Array })
    dataSources: IDataSource[]

  @property({ type: Object })
    editor: Editor | null

  constructor() {
    super()
    this.dataSources = []
    this.editor = null
  }

  connectedCallback() {
    super.connectedCallback()
  }

  openDataSourceModal(dataSource: IDataSource | null = null) {
    if (!this.editor) return

    const isEdit = !!dataSource
    const title = isEdit ? 'Edit Data Source' : 'Add Data Source'

    // Create or use existing data source
    const ds = dataSource || new GraphQL(getDefaultOptions(this.dataSources.length.toString()))

    // Create the form element
    const formElement = document.createElement('ds-settings__data-source') as SettingsDataSource
    formElement.dataSource = ds

    // Handle form events
    const handleSave = () => {
      if (isEdit) {
        this.dispatchEvent(new CustomEvent('change', { detail: ds }))
      } else {
        this.dispatchEvent(new CustomEvent('add', { detail: ds }))
      }
      this.editor!.Modal.close()
    }

    const handleDelete = () => {
      this.dispatchEvent(new CustomEvent('delete', { detail: ds }))
      this.editor!.Modal.close()
    }

    formElement.addEventListener('change', handleSave)
    if (isEdit) {
      formElement.addEventListener('delete', handleDelete)
    }

    // Open the modal
    this.editor.Modal.open({
      title,
      content: formElement,
      attributes: { class: 'ds-modal' },
    })
  }

  static styles = [
    COMMON_STYLES,
    css`
      .ds-settings {
        padding: 16px 0;
      }
      .ds-empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        text-align: center;
      }
      .ds-empty-state__content {
        max-width: 300px;
      }
      .ds-empty-state__title {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: inherit;
      }
      .ds-empty-state__description {
        margin: 0 0 24px 0;
        color: var(--gjs-light-color);
        line-height: 1.4;
      }
      .ds-data-sources {
        margin-bottom: 16px;
      }
      .ds-add-section {
        padding: 16px 0;
        border-top: 1px solid var(--ds-button-bg);
        text-align: center;
      }
      .ds-btn-prim--large {
        padding: 12px 24px;
        font-size: 14px;
      }
    `,
  ]

  protected render() {
    const visibleDataSources = this.dataSources.filter(ds => !ds.hidden)

    return html`
      <section class="ds-settings">
        ${visibleDataSources.length === 0 ? html`
          <div class="ds-empty-state">
            <div class="ds-empty-state__content">
              <h3 class="ds-empty-state__title">No Data Sources</h3>
              <p class="ds-empty-state__description">
                Connect to GraphQL APIs to display dynamic data in your website
              </p>
              <button
                type="button"
                class="ds-btn-prim ds-btn-prim--large"
                @click=${() => this.openDataSourceModal()}
              >
                Add Your First Data Source
              </button>
            </div>
          </div>
        ` : html`
          <div class="ds-data-sources">
            ${repeat(visibleDataSources, (ds: IDataSource) => ds.id, (ds: IDataSource) => html`
              <ds-data-source-card
                .dataSource=${ds}
                data-id=${ds.id}
                @edit=${(e: CustomEvent) => this.openDataSourceModal(e.detail)}
                @test=${(e: CustomEvent) => this.testConnection(e.detail)}
                @delete=${(e: CustomEvent) => {
    this.dispatchEvent(new CustomEvent('delete', { detail: e.detail }))
  }}
              ></ds-data-source-card>
            `)}
          </div>
          <div class="ds-add-section">
            <button
              type="button"
              class="ds-btn-prim"
              @click=${() => this.openDataSourceModal()}
            >
              Add Data Source
            </button>
          </div>
        `}
      </section>
    `
  }

  testConnection(dataSource: IDataSource) {
    // Find the card component to update its loading state
    const cardElement = this.shadowRoot?.querySelector(`ds-data-source-card[data-id="${dataSource.id}"]`) as DataSourceCard
    if (cardElement) {
      cardElement.isTestingConnection = true
    }

    // Create a temporary form element to handle the connection test
    const tempForm = document.createElement('ds-settings__data-source') as SettingsDataSource
    tempForm.dataSource = dataSource

    // Override the original connectDataSource to handle card updates
    tempForm.connectDataSource = () => {
      if (cardElement) {
        cardElement.isTestingConnection = true
      }

      dataSource.connect().then(() => {
        if (cardElement) {
          cardElement.isTestingConnection = false
        }
        this.dispatchEvent(new CustomEvent('change', { detail: dataSource }))
        this.requestUpdate()
      }).catch((err: Error) => {
        console.error('Data source connection error', { err })
        if (cardElement) {
          cardElement.isTestingConnection = false
        }
        this.requestUpdate()
      })
    }

    tempForm.connectDataSource()
  }
}

if(!customElements.get('ds-settings')) {
  customElements.define('ds-settings', SettingsDataSources)
}


class SettingsDataSource extends LitElement {
  @property({ type: Object })
    dataSource: IDataSource | null
  errorMessage: string = ''
  connected: boolean = false
  isLoading: boolean = false

  private loadingIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"><animate attributeName="r" values="3;8;3" dur="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/></circle></svg>`
  private connectedIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
  private unknownIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/></svg>`

  constructor() {
    super()
    this.dataSource = null
  }

  connectedCallback() {
    super.connectedCallback()
  }

  connectDataSource() {
    if(!this.dataSource) throw new Error('No data source provided')
    this.isLoading = true
    this.errorMessage = ''
    this.requestUpdate()

    this.dataSource.connect().then(() => {
      this.dispatchEvent(new CustomEvent('change'))
      this.errorMessage = ''
      this.connected = true
      this.isLoading = false
      this.requestUpdate()
    }).catch((err: Error) => {
      console.error('Data source connection error', { err })
      this.errorMessage = err.message
      this.connected = false
      this.isLoading = false
      this.requestUpdate()
    })
  }

  static styles = [
    css`
    form {
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }
    form :focus {
      outline: 1px solid var(--ds-highlight);
    }
    .ds-field--large {
      flex: 1 1 auto;
    }
    .ds-property__wrapper {
      display: flex;
      flex-direction: column;
      width: 100%;
      flex-wrap: wrap;
    }
    .ds-property__wrapper--horiz {
      flex-direction: row;
    }
    .ds-property__wrapper--vert {
      flex-direction: column;
    }
    .ds-status-section {
      margin: 10px 0;
    }
    .ds-status-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
    }
    .ds-status-loading {
      background-color: var(--gjs-main-dark-color);
      color: var(--ds-highlight);
    }
    .ds-status-success {
      background-color: var(--gjs-main-dark-color);
      color: var(--ds-primary);
    }
    .ds-status-error {
      background-color: var(--gjs-main-dark-color);
      color: var(--ds-highlight);
    }
    .ds-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-start;
      margin-top: 15px;
    }
    .ds-no-resize {
      flex: 0 0 auto;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    `,
    COMMON_STYLES,
  ]

  protected render() {
    if(!this.dataSource) throw new Error('No data source provided')
    const dsHeaders: Ref<SettingsHeaders> = createRef()
    return html`
    <form
      ?readonly=${this.dataSource.readonly !== false}
      @submit=${(e: Event) => {
    e.preventDefault()
    e.stopImmediatePropagation()
    this.connectDataSource()
  }}
      >
      <h3 class="ds-property__title">
        ${this.dataSource.label || 'Unnamed'}
        <small>${this.dataSource.readonly !== false ? ' (Read-only)' : ''}</small>
      </h3>
      <div class="ds-property__wrapper ds-property__wrapper--horiz">
      <label class="ds-field">
        <span>Label</span>
        <input
          type="text"
          name="label"
          value=${this.dataSource.label}
          @input=${(e: Event) => {
    if (this.dataSource) this.dataSource.label = (e.target as HTMLInputElement).value
    // Update the label in the title
    this.requestUpdate()
  }}
          ?readonly=${this.dataSource.readonly !== false}
          />
      </label>
      <label class="ds-field ds-field--large">
        <span>URL</span>
        <input
          type="url"
          name="url"
          value=${this.dataSource.url}
          @change=${(e: Event) => { if (this.dataSource) this.dataSource.url = (e.target as HTMLInputElement).value }}
          ?readonly=${this.dataSource.readonly !== false}
          />
      </label>
      <label class="ds-field">
        <span>ID</span>
        <input
          type="text"
          name="id"
          value=${this.dataSource.id}
          readonly
          disabled
          />
      </label>
      <label class="ds-field">
        <span>Type</span>
        <select
          name="type"
          readonly
          disabled
          >
          <option value="graphql" selected>GraphQL</option>
        </select>
      </label>
      <label class="ds-field">
        <span>Method</span>
        <select
          name="method"
          @change=${(e: Event) => { if (this.dataSource) this.dataSource.method = (e.target as HTMLInputElement).value as 'GET' | 'POST' }}
          ?readonly=${this.dataSource.readonly !== false}
          ?disabled=${this.dataSource.readonly !== false}
          >
          <option value="POST" ?selected=${this.dataSource.method === 'POST'}>POST</option>
          <option value="GET" ?selected=${this.dataSource.method === 'GET'}>GET</option>
        </select>
      </label>
      </div>
      <div class="ds-field">
        <details>
          <summary>HTTP Headers</summary>
          <ds-settings__headers
            ${ref(dsHeaders)}
            .headers=${this.dataSource.headers}
            @change=${() => {
    if (this.dataSource) this.dataSource.headers = dsHeaders.value?.headers || {}
    dsHeaders.value?.requestUpdate()
  }}
            ?readonly=${this.dataSource.readonly !== false}
            ></ds-settings__headers>
        </details>

        <div class="ds-field">
          <div class="ds-status-section">
            ${this.isLoading
    ? html`<div class="ds-status-item ds-status-loading">${this.loadingIcon} Testing connection...</div>`
    : this.errorMessage
      ? html`<div class="ds-status-item ds-status-error">Error: ${this.errorMessage}</div>`
      : this.dataSource.isConnected()
        ? html`<div class="ds-status-item ds-status-success">${this.connectedIcon} Connection successful</div>`
        : ''
}
          </div>
        </div>

        <div class="ds-field ds-actions">
          <button
            type="submit"
            class="ds-btn-prim"
            ?disabled=${this.isLoading}
            >${this.isLoading ? 'Testing...' : 'Test Connection'}</button>
          ${this.dataSource.readonly !== false ? '' : html`
            <button
              type="button"
              class="ds-btn-prim ds-btn-danger"
              @click=${() => {
    this.dispatchEvent(new CustomEvent('delete'))
  }}
            >Delete Data Source</button>
          `}
        </div>
      </div>
    </form>
    `
  }
}

if(!customElements.get('ds-settings__data-source')) {
  customElements.define('ds-settings__data-source', SettingsDataSource)
}

/**
 * Compact card component for displaying data source summary
 */
class DataSourceCard extends LitElement {
  @property({ type: Object })
    dataSource: IDataSource | null

  @property({ type: Boolean })
    isTestingConnection: boolean = false

  private loadingIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"><animate attributeName="r" values="3;8;3" dur="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/></circle></svg>`
  private connectedIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`

  constructor() {
    super()
    this.dataSource = null
    this.isTestingConnection = false
  }

  static styles = [
    css`
      .ds-card {
        background-color: var(--gjs-main-dark-color);
        border: 1px solid var(--ds-button-bg);
        border-radius: 6px;
        padding: 16px;
        margin: 8px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: border-color 0.2s ease;
      }
      .ds-card:hover {
        border-color: var(--ds-highlight);
      }
      .ds-card__info {
        flex: 1;
        min-width: 0;
      }
      .ds-card__title {
        font-weight: 500;
        margin: 0 0 4px 0;
        color: inherit;
      }
      .ds-card__url {
        font-size: 12px;
        color: var(--gjs-light-color);
        margin: 0 0 8px 0;
        word-break: break-all;
      }
      .ds-card__status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }
      .ds-card__status--connected {
        color: var(--ds-primary);
      }
      .ds-card__status--loading {
        color: var(--ds-highlight);
      }
      .ds-card__actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
      .ds-card__btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        background-color: var(--gjs-main-light-color);
        color: inherit;
        transition: background-color 0.2s ease;
      }
      .ds-card__btn:hover {
        background-color: var(--ds-button-bg);
      }
      .ds-card__btn--danger {
        color: var(--ds-highlight);
        background-color: transparent;
      }
      .ds-card__btn--danger:hover {
        background-color: rgba(255, 0, 0, 0.1);
      }
      .ds-card__btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
    COMMON_STYLES,
  ]

  protected render() {
    if (!this.dataSource) return html``

    const isConnected = this.dataSource.isConnected()

    return html`
      <div class="ds-card">
        <div class="ds-card__info">
          <h4 class="ds-card__title">${this.dataSource.label || 'Unnamed Data Source'}</h4>
          <p class="ds-card__url">${this.dataSource.url || 'No URL configured'}</p>
          ${this.isTestingConnection ? html`
            <div class="ds-card__status ds-card__status--loading">
              ${this.loadingIcon} Testing...
            </div>
          ` : isConnected ? html`
            <div class="ds-card__status ds-card__status--connected">
              ${this.connectedIcon} Connected
            </div>
          ` : ''}
        </div>
        <div class="ds-card__actions">
          <button
            class="ds-card__btn"
            @click=${() => this.dispatchEvent(new CustomEvent('edit', { detail: this.dataSource }))}
            ?disabled=${this.isTestingConnection}
          >
            Edit
          </button>
          <button
            class="ds-card__btn"
            @click=${() => this.dispatchEvent(new CustomEvent('test', { detail: this.dataSource }))}
            ?disabled=${this.isTestingConnection}
          >
            ${this.isTestingConnection ? 'Testing...' : 'Test'}
          </button>
          ${this.dataSource.readonly !== false ? '' : html`
            <button
              class="ds-card__btn ds-card__btn--danger"
              @click=${() => this.dispatchEvent(new CustomEvent('delete', { detail: this.dataSource }))}
              ?disabled=${this.isTestingConnection}
            >
              Delete
            </button>
          `}
        </div>
      </div>
    `
  }
}

if(!customElements.get('ds-data-source-card')) {
  customElements.define('ds-data-source-card', DataSourceCard)
}

class SettingsHeaders extends LitElement {
  @property({ type: Array })
    headers: Record<string, string>

  @property({ type: Boolean })
    readonly: boolean

  static styles = [
    css`
    fieldset {
      display: block;
      border: none;
      padding: 0;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    ul > li {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    ul > li > label {
      flex: 1 1 auto;
    }
    ul > li > button {
      margin: 10px;
    }
    `,
    COMMON_STYLES,
  ]

  constructor() {
    super()
    this.headers = {}
    this.readonly = false
  }

  connectedCallback() {
    super.connectedCallback()
  }

  protected render() {
    return html`
      <div class="ds-field">
      <fieldset>
      ${this.readonly ? '' : html`
        <button
          type="button"
          class="ds-btn-prim"
          @click=${() => {
    // Default name and value
    let name = 'Authorization'
    let value = 'Bearer XXXXXX'
    // Make sure the header name is unique
    // Add a number if the header already exists
    let i = 0
    while(typeof this.headers[name] !== 'undefined') {
      i++
      name = `Header ${i}`
      value = ''
    }
    // Add the header
    this.headers = {
      ...this.headers,
      [name]: value,
    }
    this.dispatchEvent(new CustomEvent('change'))
  }}
        >Add a header</button>
      `}
      <ul>
        ${Object.entries(this.headers).map(([name, value]) => html`
          <li>
            <label class="ds-field">
              <span>Name</span>
              <input
                type="text"
                value=${name}
                name=${`header-key-${encodeURI(name)}`}
                @change=${(e: Event) => {
    const target = e.target as HTMLInputElement
    if(!target.value) return
    if (typeof this.headers[name] !== 'undefined') delete this.headers[name]
    this.headers[target.value] = value
    this.dispatchEvent(new CustomEvent('change'))
  }}
                />
            </label>
            <label class="ds-field">
              <span>Value</span>
              <input
                type="text"
                value=${value}
                name=${`header-value-${encodeURI(value)}`}
                @change=${(e: Event) => {
    const target = e.target as HTMLInputElement
    this.headers[name] = target.value
    this.dispatchEvent(new CustomEvent('change'))
  }}
                />
            </label>
            ${this.readonly ? '' : html`
              <button
                type="button"
                class="ds-btn-prim"
                @click=${() => {
    if (typeof this.headers[name] !== 'undefined') delete this.headers[name]
    this.dispatchEvent(new CustomEvent('change'))
  }}
                .disabled=${this.readonly}
              >Delete</button>
            `}
          </li>
        `)}
      </ul>
      </fieldset>
      </div>
    `
  }
}

if(!customElements.get('ds-settings__headers')) {
  customElements.define('ds-settings__headers', SettingsHeaders)
}
