import { createRef, Ref, ref } from "lit/directives/ref.js"
import {repeat} from 'lit/directives/repeat.js'
import GraphQL, { GraphQLOptions } from "../datasources/GraphQL"
import { DATA_SOURCE_CHANGED, DATA_SOURCE_ERROR, DataSourceEditor, DataSourceEditorViewOptions, IDataSource, IDataSourceModel, IDataSourceOptions } from "../types"
import { getElementFromOption } from "../utils"
import { html, LitElement, render, TemplateResult } from 'lit'
import { customElement, property } from "lit/decorators.js"
import Backbone from "backbone"

export default (editor: DataSourceEditor, options: Partial<DataSourceEditorViewOptions> = {}, opts: any) => {
  // Save and load data sources
  editor.on('storage:start:store', data => {
    data.dataSources = editor.DataSourceManager
      .getAll()
      .filter(ds => ds.get('readonly') === false)
    console.log('storage:start:store', data)
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
    editor.on(`all`, (e) => {
      console.log('DATA_SOURCE_CHANGED', DATA_SOURCE_CHANGED, e, editor.DataSourceManager.getAll())
      renderSettings()
      if(dsSettings.value) {
        dsSettings.value.dataSources = editor.DataSourceManager
        dsSettings.value.render()
      }
    })

    function renderSettings() {
      render(html`
        <ds-settings
          ${ref(dsSettings)}
          .dataSources=${editor.DataSourceManager}
          @change=${(e: CustomEvent) => {
            console.log('change', e)
            editor.DataSourceManager.reset(dsSettings.value?.dataSources.models)
            dsSettings.value?.render()
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
  dataSources: Backbone.Collection<IDataSourceModel>

  constructor() {
    super()
    this.dataSources = new Backbone.Collection()
  }

  connectedCallback() {
    this.render()
  }

  render() {
    const dsDataSource: Ref<SettingsDataSources> = createRef()
    console.log('render', this.dataSources)
    render(html`
      <button @click=${() => {
        const options: GraphQLOptions = {
          id: `ds_${Math.random().toString(36).slice(2, 8)}`,
          label: 'New data source',
          type: 'graphql',
          url: '',
          method: 'GET',
          headers: {},
          readonly: false,
        }
        this.dataSources.add(new GraphQL(options), { at: 0 })
        this.dispatchEvent(new CustomEvent('change'))
      }}>Add</button>
      ${repeat(this.dataSources, (ds: IDataSourceModel) => ds.get('id'), (ds: IDataSourceModel) => html`
        <ds-settings__data-source
          ${ref(dsDataSource)}
          .dataSource=${ds}
          @change=${(e: CustomEvent) => {
            console.log('change xxx', ds, e)
            //this.dataSources.get(ds.get('id'))?.set(e.detail)
            dsDataSource.value?.render()
          }}
          @delete=${() => {
            this.dataSources.remove(ds)
            this.dispatchEvent(new CustomEvent('change'))
            this.requestUpdate()
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
    <form
      @submit=${(e: Event) => {
        e.preventDefault()
        //this.dispatchEvent(new CustomEvent('change'))
        this.connectDataSource()
      }}
      >
      <label>Label
        <input
          type="text"
          name="label"
          value=${this.dataSource.get('label')}
          @change=${(e: Event) => this.dataSource?.set('label', (e.target as HTMLInputElement).value)}
          ?readonly=${this.dataSource.get('readonly') !== false}
          />
      </label>
      <label>ID
        <input
          type="text"
          name="id"
          value=${this.dataSource.get('id')}
          readonly
          disabled
          />
      </label>
      <label>Type
        <select
          name="type"
          readonly
          disabled
          >
          <option value="graphql" selected>GraphQL</option>
        </select>
      </label>
      <label>URL
        <input
          type="url"
          name="url"
          value=${this.dataSource.get('url')}
          @change=${(e: Event) => this.dataSource?.set('url', (e.target as HTMLInputElement).value)}
          ?readonly=${this.dataSource.get('readonly') !== false}
          />
      </label>
      <label>Method
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
      <label>Headers
        <ds-settings__headers
          ${ref(dsHeaders)}
          .headers=${this.dataSource.get('headers')}
          @change=${(e: CustomEvent) => {
            this.dataSource?.set('headers', dsHeaders.value?.headers)
            dsHeaders.value?.render()
          }}
          ?readonly=${this.dataSource.get('readonly') !== false}
          ></ds-settings__headers>
      </label>
      <div>
        <p>${this.dataSource.isConnected() ? 'Connected' : 'Not connected'}</p>
        <p>${this.errorMessage}</p>
      </div>
      <div>
        <button type="submit">Connect</button>
        <button
          type="button"
          @click=${() => {
            this.dispatchEvent(new CustomEvent('delete'))
          }}
          ?disabled=${this.dataSource.get('readonly') !== false}
        >Delete</button>
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
      <fieldset>
      <ul>
        ${Object.entries(this.headers).map(([name, value]) => html`
          <li>
            <label>Name
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
            <label>Value
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
            <button @click=${() => {
                typeof this.headers[name] !== 'undefined' && delete this.headers[name]
                this.dispatchEvent(new CustomEvent('change'))
              }}
              .disabled=${this.readonly}
            >Delete</button>
          </li>
        `)}
      </ul>
      <button
        @click=${() => {
          this.headers = {
            ...this.headers,
            'new header': '',
          }
          this.dispatchEvent(new CustomEvent('change'))
        }}
        .disabled=${this.readonly}
      >Add</button>
      </fieldset>
    `, this)
  }
}
