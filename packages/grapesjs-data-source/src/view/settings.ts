import { createRef, Ref, ref } from 'lit/directives/ref.js'
import {repeat} from 'lit/directives/repeat.js'
import GraphQL, { GraphQLOptions } from '../datasources/GraphQL'
import { DATA_SOURCE_CHANGED, DATA_SOURCE_ERROR, DATA_SOURCE_READY, DataSourceEditor, DataSourceEditorViewOptions, IDataSourceModel } from '../types'
import { getDefaultOptions, getElementFromOption } from '../utils'
import { css, html, LitElement, render } from 'lit'
import { property } from 'lit/decorators.js'

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
`

export default (editor: DataSourceEditor, options: Partial<DataSourceEditorViewOptions> = {}) => {
  // Settings dialog
  if (options.settingsEl) {
    // Get the container element for the UI
    const settingsEl = getElementFromOption(options.settingsEl, 'options.settingsEl')
    const dsSettings: Ref<SettingsDataSources> = createRef()
    editor.on(`${DATA_SOURCE_CHANGED} ${DATA_SOURCE_ERROR} ${DATA_SOURCE_READY}`, () => {
      if(dsSettings.value) {
        dsSettings.value.dataSources = [...editor.DataSourceManager]
        dsSettings.value.requestUpdate()
      } else {
        renderSettings(editor, dsSettings, settingsEl)
      }
    })
    renderSettings(editor, dsSettings, settingsEl)
  }
}

function renderSettings(editor: DataSourceEditor, dsSettings: Ref, settingsEl: HTMLElement) {
  render(html`
    <ds-settings
      ${ref(dsSettings)}
      .dataSources=${[]}
      @change=${(e: CustomEvent) => {
    const ds = e.detail as IDataSourceModel
    editor.DataSourceManager
    //.set([ds], { merge: true, remove: false })
      .get(ds.get('id'))
      ?.set(ds.toJSON())
      //.reset(dsSettings.value?.dataSources || [])
  }}
      @add=${(e: CustomEvent) => {
    const ds = e.detail as GraphQLOptions
    const newDS = new GraphQL(ds)
    editor.DataSourceManager.add(newDS)
  }}
      @add-top=${(e: CustomEvent) => {
    const ds = e.detail as GraphQLOptions
    const newDS = new GraphQL(ds)
    editor.DataSourceManager.add(newDS, { at: 0 })
  }}
      @delete=${(e: CustomEvent) => {
    const ds = e.detail as IDataSourceModel
    editor.DataSourceManager.remove(ds)
  }}
      ></ds-settings>
  `, settingsEl)
}

/**
 * <ds-settings> is a web component that renders the settings dialog for the DataSourceEditor plugin
 */
class SettingsDataSources extends LitElement {

  @property({ type: Array })
    dataSources: IDataSourceModel[]

  constructor() {
    super()
    this.dataSources = []
  }

  connectedCallback() {
    super.connectedCallback()
  }

  static styles = [
    COMMON_STYLES,
    css`
      .ds-btn-prim--large {
        padding: 10px;
        margin: auto;
        display: block;
      }
      .ds-btn-prim--icon {
        background-color: var(--ds-primary);
        position: absolute;
        right: 20px;
      }
    `,
  ]

  protected render() {
    const dsDataSource: Ref<SettingsDataSources> = createRef()
    const options: GraphQLOptions = getDefaultOptions(this.dataSources.length.toString())
    return html`
    <section>
    <!--
      <button
        type="button"
        class="ds-btn-prim ds-btn-prim--icon"
        @click=${() => {
    this.dispatchEvent(new CustomEvent('add-top', { detail: options }))
  }}>\u2795</button>
    -->
      <hr class="ds-separator">
      ${repeat(this.dataSources.filter(ds => !ds.hidden), (ds: IDataSourceModel) => ds.get('id'), (ds: IDataSourceModel) => html`
        <ds-settings__data-source
          ${ref(dsDataSource)}
          .dataSource=${ds}
          @change=${(e: CustomEvent) => {
    e.preventDefault()
    e.stopImmediatePropagation()
    this.dispatchEvent(new CustomEvent('change', { detail: ds }))
  }}
          @delete=${() => {
    this.dispatchEvent(new CustomEvent('delete', { detail: ds }))
  }}
          ></ds-settings__data-source>
          <hr class="ds-separator">
      `)}
      <button
        type="button"
        class="ds-btn-prim ds-btn-prim--large"
        @click=${() => {
    this.dispatchEvent(new CustomEvent('add', { detail: options }))
  }}>Add a Data Source</button>
    </section>
    `
  }
}

if(!customElements.get('ds-settings')) {
  customElements.define('ds-settings', SettingsDataSources)
}


class SettingsDataSource extends LitElement {
  @property({ type: Object })
    dataSource: IDataSourceModel | null
  errorMessage: string = ''
  connected: boolean = false

  constructor() {
    super()
    this.dataSource = null
  }

  connectedCallback() {
    super.connectedCallback()
  }

  connectDataSource() {
    if(!this.dataSource) throw new Error('No data source provided')
    this.dataSource.connect().then(() => {
      this.dispatchEvent(new CustomEvent('change'))
      this.errorMessage = ''
      this.connected = true
      this.requestUpdate()
    }).catch((err: Error) => {
      console.error('Data source connection error', { err })
      this.errorMessage = err.message
      this.connected = false
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
    .ds-button-bar {
      display: flex;
      justify-content: space-between;
    }
    .ds-no-resize {
      flex: 0 0 auto;
    }
    `,
    COMMON_STYLES,
  ]

  protected render() {
    if(!this.dataSource) throw new Error('No data source provided')
    const dsHeaders: Ref<SettingsHeaders> = createRef()
    return html`
    <form
      ?readonly=${this.dataSource.get('readonly') !== false}
      @submit=${(e: Event) => {
    e.preventDefault()
    e.stopImmediatePropagation()
    this.connectDataSource()
  }}
      >
      <h3 class="ds-property__title">
        ${this.dataSource.get('label')}
        <small>${this.dataSource.get('readonly') !== false ? ' (Read-only)' : ''}</small>
      </h3>
      <div class="ds-property__wrapper ds-property__wrapper--horiz">
      <label class="ds-field">
        <span>Label</span>
        <input
          type="text"
          name="label"
          value=${this.dataSource.get('label')}
          @input=${(e: Event) => {
    this.dataSource?.set('label', (e.target as HTMLInputElement).value)
    // Update the label in the title
    this.requestUpdate()
  }}
          ?readonly=${this.dataSource.get('readonly') !== false}
          />
      </label>
      <label class="ds-field ds-field--large">
        <span>URL</span>
        <input
          type="url"
          name="url"
          value=${this.dataSource.get('url')}
          @change=${(e: Event) => this.dataSource?.set('url', (e.target as HTMLInputElement).value)}
          ?readonly=${this.dataSource.get('readonly') !== false}
          />
      </label>
      <label class="ds-field">
        <span>ID</span>
        <input
          type="text"
          name="id"
          value=${this.dataSource.get('id')}
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
          @change=${(e: Event) => this.dataSource?.set('method', (e.target as HTMLInputElement).value)}
          ?readonly=${this.dataSource.get('readonly') !== false}
          ?disabled=${this.dataSource.get('readonly') !== false}
          >
          <option value="POST" ?selected=${this.dataSource.get('method') === 'POST'}>POST</option>
          <option value="GET" ?selected=${this.dataSource.get('method') === 'GET'}>GET</option>
        </select>
      </label>
      </div>
      <div class="ds-field">
        <details>
          <summary>HTTP Headers</summary>
          <ds-settings__headers
            ${ref(dsHeaders)}
            .headers=${this.dataSource.get('headers')}
            @change=${() => {
    this.dataSource?.set('headers', dsHeaders.value?.headers)
    dsHeaders.value?.requestUpdate()
  }}
            ?readonly=${this.dataSource.get('readonly') !== false}
            ></ds-settings__headers>
        </details>
        <div class="ds-field ds-button-bar">
          <div>
            <div>
              <p>Status: ${this.dataSource.isConnected() ? '\u2713 Connected' : '\u2717 Unknown'}</p>
              <p>${this.errorMessage}</p>
            </div>
          </div>
          <div class="ds-no-resize">
            <div>
              ${this.dataSource.get('readonly') !== false ? '' : html`
                <button
                  type="button"
                  class="ds-btn-prim ds-btn-danger"
                  @click=${() => {
    this.dispatchEvent(new CustomEvent('delete'))
  }}
                >Delete</button>
              `}
              <button
                type="submit"
                class="ds-btn-prim ds-btn-primary"
                >Test connection</button>
            </div>
          </div>
        </div>
      </div>
    </form>
    `
  }
}

if(!customElements.get('ds-settings__data-source')) {
  customElements.define('ds-settings__data-source', SettingsDataSource)
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
