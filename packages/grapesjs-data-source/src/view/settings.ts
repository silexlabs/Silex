import { createRef, Ref, ref } from "lit/directives/ref.js"
import {repeat} from 'lit/directives/repeat.js'
import GraphQL, { GraphQLOptions } from "../datasources/GraphQL"
import { DATA_SOURCE_CHANGED, DATA_SOURCE_ERROR, DataSourceEditor, DataSourceEditorViewOptions, IDataSource, IDataSourceModel, IDataSourceOptions } from "../types"
import { getElementFromOption } from "../utils"
import { html, LitElement, render, TemplateResult } from 'lit'
import { customElement, property } from "lit/decorators.js"

export default (editor: DataSourceEditor, options: Partial<DataSourceEditorViewOptions> = {}, opts: any) => {
  // Save and load data sources
  editor.on('storage:start:store', data => {
    data.dataSources = editor.DataSourceManager
      .getAll()
      .filter(ds => ds.get('readonly') === false)
  })
  editor.on('storage:end:load', (data) => {
    // Connect the data sources
    const newDataSources: IDataSource[] = (data.dataSources || [] as GraphQLOptions[])
      .map((ds: GraphQLOptions) => new GraphQL(ds))
    newDataSources.forEach((ds: IDataSource) => ds.connect())
    // Get all data sources
    const dataSources = editor.DataSourceManager.getAll()
      // Keep only data sources from the config
      .filter(ds => ds.get('readonly') !== false)
    // Reset the data sources to the original config
    editor.DataSourceManager.reset(dataSources)
    // Add the new data sources
    editor.DataSourceManager.add(newDataSources)
  })
  // Settings dialog
  if (options.settingsEl) {
    // Get the container element for the UI
    const settingsEl = getElementFromOption(options.settingsEl)
    const dsSettings: Ref<SettingsDataSources> = createRef()
    editor.on(`${DATA_SOURCE_CHANGED} ${DATA_SOURCE_ERROR}`, (e) => {
      if(dsSettings.value) {
        dsSettings.value.dataSources = [...editor.DataSourceManager]
        dsSettings.value.render()
      } else {
        renderSettings()
      }
    })

    function renderSettings() {
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
            editor.DataSourceManager.add(newDS, { at: 0 })
          }}
          @delete=${(e: CustomEvent) => {
            const ds = e.detail as IDataSourceModel
            editor.DataSourceManager.remove(ds)
          }}
          ></ds-settings>
      `, settingsEl)
    }
  }
}

/**
 * <ds-settings> is a web component that renders the settings dialog for the DataSourceEditor plugin
 */
@customElement('ds-settings')
class SettingsDataSources extends LitElement {
  @property({ type: Array })
  dataSources: IDataSourceModel[]

  constructor() {
    super()
    this.dataSources = []
  }

  connectedCallback() {
    this.render()
  }

  render() {
    const dsDataSource: Ref<SettingsDataSources> = createRef()
    render(html`
      <button
        class="gjs-btn-prim"
        @click=${() => {
        const options: GraphQLOptions = {
          id: `ds_${Math.random().toString(36).slice(2, 8)}`,
          label: 'New data source',
          type: 'graphql',
          url: '',
          method: 'GET',
          headers: {},
          readonly: false,
        }
        this.dispatchEvent(new CustomEvent('add', { detail: options }))
      }}>Add</button>
      ${repeat(this.dataSources, (ds: IDataSourceModel) => ds.get('id'), (ds: IDataSourceModel) => html`
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
      `)}
    `, this)
  }
}

@customElement('ds-settings__data-source')
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
    this.render()
  }

  connectDataSource() {
    if(!this.dataSource) throw new Error('No data source provided')
    this.dataSource.connect().then(() => {
      this.dispatchEvent(new CustomEvent('change'))
      this.errorMessage = ''
      this.connected = true
      this.render()
    }).catch((err: Error) => {
      console.error({ err })
      this.errorMessage = err.message
      this.connected = false
      this.render()
    })
  }

  render() {
    if(!this.dataSource) throw new Error('No data source provided')
    const dsHeaders: Ref<SettingsHeaders> = createRef()
    render(html`
    <style>
      form.gjs-sm-properties {
        display: flex;
        flex-direction: column;
        align-items: stretch;
      }
      form.gjs-sm-properties :focus {
        outline: 1px solid var(--ds-highlight);
      }
      [disabled],
      [readonly] {
        font-style: italic;
      }
      .gjs-field {
        padding: 10px;
      }
      :not([disabled]) .gjs-field input {
        background-color: var(--gjs-main-dark-color);
      }
      .ds-field--large {
        flex: 1;
      }
      .ds-property__wrapper {
        display: flex;
        flex-direction: column;
        width: 100%;
      }
      .ds-property__wrapper--horiz {
        flex-direction: row;
      }
      .ds-property__wrapper--vert {
        flex-direction: column;
      }
      .ds-btn-danger {
        color: var(--gjs-light-color);
        background-color: transparent;
      }
      .ds-btn-danger:hover {
        color: var(--ds-highlight);
      }
      .ds-button-bar {
        display: flex;
        justify-content: space-between;
      }
    </style>
    <form
      class="gjs-sm-properties gjs-sm-sector gjs-two-color"
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
      <label class="gjs-field">
        <span>Label</span>
        <input
          type="text"
          name="label"
          value=${this.dataSource.get('label')}
          @input=${(e: Event) => {
            this.dataSource?.set('label', (e.target as HTMLInputElement).value)
            // Update the label in the title
            this.render()
          }}
          ?readonly=${this.dataSource.get('readonly') !== false}
          />
      </label>
      <label class="gjs-field ds-field--large">
        <span>URL</span>
        <input
          type="url"
          name="url"
          value=${this.dataSource.get('url')}
          @change=${(e: Event) => this.dataSource?.set('url', (e.target as HTMLInputElement).value)}
          ?readonly=${this.dataSource.get('readonly') !== false}
          />
      </label>
      <label class="gjs-field">
        <span>ID</span>
        <input
          type="text"
          name="id"
          value=${this.dataSource.get('id')}
          readonly
          disabled
          />
      </label>
      <label class="gjs-field">
        <span>Type</span>
        <select
          name="type"
          readonly
          disabled
          >
          <option value="graphql" selected>GraphQL</option>
        </select>
      </label>
      <label class="gjs-field">
        <span>Method</span>
        <select
          name="method"
          @change=${(e: Event) => this.dataSource?.set('method', (e.target as HTMLInputElement).value)}
          ?readonly=${this.dataSource.get('readonly') !== false}
          ?disabled=${this.dataSource.get('readonly') !== false}
          >
          <option value="GET" ?selected=${this.dataSource.get('method') === 'GET'}>GET</option>
          <option value="POST" ?selected=${this.dataSource.get('method') === 'POST'}>POST</option>
        </select>
      </label>
      </div>
      <div class="ds-property__wrapper ds-property__wrapper--vert">
        <details class="gjs-field">
          <summary>Headers</summary>
          <ds-settings__headers
            ${ref(dsHeaders)}
            .headers=${this.dataSource.get('headers')}
            @change=${(e: CustomEvent) => {
              this.dataSource?.set('headers', dsHeaders.value?.headers)
              dsHeaders.value?.render()
            }}
            ?readonly=${this.dataSource.get('readonly') !== false}
            ></ds-settings__headers>
        </details>
        <div class="gjs-field ds-button-bar">
          <div>
            <div>
              <p>Status: ${this.dataSource.isConnected() ? '\u2713 Connected' : '\u2717 Unknown'}</p>
              <p>${this.errorMessage}</p>
            </div>
          </div>
          <div>
            <div>
              ${this.dataSource.get('readonly') !== false ? '' : html`
                <button
                  class="gjs-btn-prim ds-btn-danger"
                  @click=${() => {
                    this.dispatchEvent(new CustomEvent('delete'))
                  }}
                >Delete</button>
              `}
              <button
                class="gjs-btn-prim ds-btn-primary"
                type="submit"
                >Test connection</button>
            </div>
          </div>
        </div>
      </div>
    </form>
    `, this)
  }
}

@customElement('ds-settings__headers')
class SettingsHeaders extends LitElement {
  @property({ type: Array })
  headers: Record<string, string>

  @property({ type: Boolean })
  readonly: boolean

  constructor() {
    super()
    this.headers = {}
    this.readonly = false
  }

  connectedCallback() {
    this.render()
  }

  render() {
    render(html`
      <style>
        fieldset {
          display: block;
          border: none;
          padding: 0;
        }
        .gjs-sm-properties ul {
          list-style: none;
          padding: 0;
        }
        ul > li {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        ul > li > label {
          flex: 1;
          margin: 10px;
        }
        ul > li > button {
          margin: 10px;
        }
      </style>
      <fieldset>
      ${this.readonly ? '' : html`
        <button
          class="gjs-btn-prim"
          @click=${() => {
            this.headers = {
              ...this.headers,
              'Authorization': 'Bearer XXXXXX',
            }
            this.dispatchEvent(new CustomEvent('change'))
          }}
        >Add</button>
      `}
      <ul>
        ${Object.entries(this.headers).map(([name, value]) => html`
          <li>
            <label class="gjs-field">
              <span>Name</span>
              <input
                type="text"
                value=${name}
                name=${`header-key-${encodeURI(name)}`}
                @change=${(e: Event) => {
                  const target = e.target as HTMLInputElement
                  if(!target.value) return
                  typeof this.headers[name] !== 'undefined' && delete this.headers[name]
                  this.headers[target.value] = value
                  this.dispatchEvent(new CustomEvent('change'))
                }}
                />
            </label>
            <label class="gjs-field">
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
                class="gjs-btn-prim"
                @click=${() => {
                  typeof this.headers[name] !== 'undefined' && delete this.headers[name]
                  this.dispatchEvent(new CustomEvent('change'))
                }}
                .disabled=${this.readonly}
              >Delete</button>
            `}
          </li>
        `)}
      </ul>
      </fieldset>
    `, this)
  }
}
