import { createRef, Ref, ref } from "lit/directives/ref.js"
import GraphQL, { GraphQLOptions } from "../datasources/GraphQL"
import { DATA_SOURCE_CHANGED, DATA_SOURCE_ERROR, DataSourceEditor, DataSourceEditorViewOptions, IDataSource, IDataSourceModel, IDataSourceOptions } from "../types"
import { getElementFromOption } from "../utils"
import { html, LitElement, render, TemplateResult } from 'lit'
import { customElement, property } from "lit/decorators.js"
import Backbone from "backbone"

export default (editor: DataSourceEditor, options: Partial<DataSourceEditorViewOptions> = {}, opts: any) => {
  // Settings dialog
  if (options.settingsEl) {
    // Get the container element for the UI
    const settingsEl = getElementFromOption(options.settingsEl)
    const dsSettings: Ref<SettingsDataSources> = createRef()
    editor.on(`${DATA_SOURCE_CHANGED} ${DATA_SOURCE_ERROR}`, () => {
      renderSettings()
      dsSettings.value?.render()
    })

    function renderSettings() {
      render(html`
        <ds-settings
          ${ref(dsSettings)}
          .dataSources=${editor.DataSourceManager}
          @change=${(e: CustomEvent) => {
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
    render(html`
      <button @click=${() => {
        const options: GraphQLOptions = {
          id: Date.now().toString(),
          label: 'New data source',
          type: 'graphql',
          url: '',
          method: 'GET',
          headers: {},
          readonly: false,
        }
        this.dataSources.add(new GraphQL(options))
        this.dispatchEvent(new CustomEvent('change'))
      }}>Add</button>
      ${this.dataSources.map((ds: IDataSourceModel) => html`
        <ds-settings__data-source
          ${ref(dsDataSource)}
          .dataSource=${ds}
          @change=${(e: CustomEvent) => {
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

  constructor() {
    super()
    this.dataSource = null
  }

  connectedCallback() {
    this.render()
  }

  render() {
    if(!this.dataSource) throw new Error('No data source provided')
    const dsHeaders: Ref<SettingsHeaders> = createRef()
    render(html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault()
        this.dispatchEvent(new CustomEvent('change'))
      }}
      >
      <label>Label
        <input type="text" name="label" value=${this.dataSource.get('label')} ?readonly=${this.dataSource.get('readonly') !== false} />
      </label>
      <label>ID
        <input type="text" name="id" value=${this.dataSource.get('id')} readonly disabled />
      </label>
      <label>Type
        <select name="type" value=${this.dataSource.get('type')} readonly disabled>
          <option value="graphql" selected>GraphQL</option>
        </select>
      </label>
      <label>URL
        <input type="url" name="url" value=${this.dataSource.get('url')} ?readonly=${this.dataSource.get('readonly') !== false} />
      </label>
      <label>Method
        <select name="method" value=${this.dataSource.get('method')} ?readonly=${this.dataSource.get('readonly') !== false} ?disabled=${this.dataSource.get('readonly') !== false}>
          <option value="GET" selected>GET</option>
          <option value="POST">POST</option>
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
      <button type="submit" ?disabled=${this.dataSource.get('readonly') !== false}>Save</button>
      <button
        type="button"
        @click=${() => {
          this.dispatchEvent(new CustomEvent('delete'))
        }}
        ?disabled=${this.dataSource.get('readonly') !== false}
      >Delete</button>
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
              <input type="text" value=${value} name=${`header-value-${encodeURI(value)}`} />
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
