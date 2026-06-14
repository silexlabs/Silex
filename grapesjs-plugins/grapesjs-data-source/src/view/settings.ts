import { createRef, Ref, ref } from 'lit/directives/ref.js'
import {repeat} from 'lit/directives/repeat.js'
import GraphQL, { GraphQLOptions, GraphQLBackendType, LightweightType } from '../datasources/GraphQL'
import { COMMAND_ADD_DATA_SOURCE, DATA_SOURCE_CHANGED, DATA_SOURCE_DATA_LOAD_END, DATA_SOURCE_ERROR, DATA_SOURCE_READY, DataSourceEditorViewOptions, IDataSource } from '../types'
import { getDefaultOptions, getElementFromOption } from '../utils'
import { getAllDataSources, addDataSource, removeDataSource } from '../model/dataSourceRegistry'
import { css, html, LitElement, render, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
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
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
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

    // Add a data source
    editor.Commands.add(COMMAND_ADD_DATA_SOURCE, {
      run() {
        dsSettings.value?.openDataSourceModal()
      },
    })
  }
}

function renderSettings(editor: Editor, dsSettings: Ref, settingsEl: HTMLElement) {
  render(html`
    <ds-settings
      ${ref(dsSettings)}
      .dataSources=${[]}
      .editor=${editor}
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
      @change=${() => {
    // Refresh the datasources list when a datasource is edited
    if (dsSettings.value) {
      const settings = dsSettings.value as SettingsDataSources
      settings.dataSources = [...getAllDataSources()]
      settings.requestUpdate()
    }
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

  @state()
  private updateCounter: number = 0

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
    formElement.isEdit = isEdit

    // Handle form events
    const handleSave = () => {
      if (isEdit) {
        // Force new array reference and increment counter to trigger card re-renders
        this.dataSources = [...this.dataSources]
        this.updateCounter++
        this.dispatchEvent(new CustomEvent('change', { detail: ds }))
      } else {
        this.dispatchEvent(new CustomEvent('add', { detail: ds }))
      }
      this.requestUpdate()
      this.editor!.Modal.close()
    }

    const handleDelete = () => {
      this.dispatchEvent(new CustomEvent('delete', { detail: ds }))
      this.editor!.Modal.close()
    }

    const handleCancel = () => {
      this.editor!.Modal.close()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.editor!.Modal.close()
      }
    }

    formElement.addEventListener('change', handleSave)
    formElement.addEventListener('cancel', handleCancel)
    if (isEdit) {
      formElement.addEventListener('delete', handleDelete)
    }

    // Add ESC key handler
    document.addEventListener('keydown', handleKeyDown)

    // Clean up on modal close
    const modalObserver = new MutationObserver(() => {
      if (!this.editor!.Modal.isOpen()) {
        document.removeEventListener('keydown', handleKeyDown)
        modalObserver.disconnect()
      }
    })
    const modalParent = this.editor.Modal.getContentEl()?.parentElement
    if (modalParent) {
      modalObserver.observe(modalParent, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      })
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
            ${repeat(visibleDataSources, (ds: IDataSource) => `${ds.id}-${this.updateCounter}`, (ds: IDataSource) => html`
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
  @property({ type: Boolean })
    isEdit: boolean = false

  // State for the creation flow
  @state()
    errorMessage: string = ''
  @state()
    connected: boolean = false
  @state()
    isLoading: boolean = false
  @state()
    creationPhase: 'config' | 'types' = 'config'  // config = initial form, types = type selection
  @state()
    availableTypes: LightweightType[] = []  // List of types (name + kind) from lightweight query
  @state()
    selectedTypes: Set<string> = new Set()  // Currently selected types
  @state()
    typeSearchQuery: string = ''  // Search/filter for type list
  @state()
    queryTypeName: string = 'Query'  // The query type name from schema introspection

  private loadingIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"><animate attributeName="r" values="3;8;3" dur="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/></circle></svg>`
  private connectedIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
  // private unknownIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/></svg>`

  constructor() {
    super()
    this.dataSource = null
  }

  connectedCallback() {
    super.connectedCallback()
  }

  /**
   * Phase 1: Fetch lightweight type names from the GraphQL endpoint
   */
  async fetchTypeNames() {
    if (!this.dataSource || !(this.dataSource instanceof GraphQL)) {
      this.errorMessage = 'Invalid data source'
      return
    }

    this.isLoading = true
    this.errorMessage = ''
    this.requestUpdate()

    try {
      const ds = this.dataSource as GraphQL
      const result = await ds.fetchTypeNames()
      // Store the queryType name from the schema
      this.queryTypeName = result.queryTypeName
      // Sort types by name
      this.availableTypes = result.types.sort((a, b) => a.name.localeCompare(b.name))

      // For existing datasources with disabledTypes, compute selected = all - disabled
      // Otherwise, apply backend-specific default selection
      if (this.isEdit && ds.disabledTypes && ds.disabledTypes.length > 0) {
        const allTypeNames = this.availableTypes.map(t => t.name)
        const selectedNames = allTypeNames.filter(name => !ds.disabledTypes!.includes(name))
        this.selectedTypes = new Set(selectedNames)
      } else {
        const backendType = ds.backendType || 'generic'
        const defaultEnabled = GraphQL.getDefaultEnabledTypes(backendType, this.availableTypes, this.queryTypeName)
        this.selectedTypes = new Set(defaultEnabled)
      }

      // Move to type selection phase
      this.creationPhase = 'types'
      this.isLoading = false
      this.requestUpdate()
    } catch (e) {
      console.error('[Settings] Failed to fetch type names:', e)
      this.errorMessage = (e as Error).message
      this.isLoading = false
      this.requestUpdate()
    }
  }

  /**
   * Check if a type is required (cannot be blacklisted)
   * The queryType and all SCALAR types are required
   */
  isRequiredType(typeName: string): boolean {
    if (typeName === this.queryTypeName) return true
    const type = this.availableTypes.find(t => t.name === typeName)
    return type?.kind === 'SCALAR'
  }

  /**
   * Toggle a type's selected state
   */
  toggleType(typeName: string) {
    // Query and SCALAR types cannot be unchecked - they're always required
    if (this.isRequiredType(typeName)) return

    if (this.selectedTypes.has(typeName)) {
      this.selectedTypes.delete(typeName)
    } else {
      this.selectedTypes.add(typeName)
    }
    this.selectedTypes = new Set(this.selectedTypes) // Trigger reactivity
    this.requestUpdate()
  }

  /**
   * Select all types
   */
  selectAllTypes() {
    this.selectedTypes = new Set(this.availableTypes.map(t => t.name))
    this.requestUpdate()
  }

  /**
   * Deselect all types (except queryType and SCALAR types which are always required)
   */
  deselectAllTypes() {
    // Always keep queryType and SCALAR types selected
    const requiredTypes = this.availableTypes
      .filter(t => t.name === this.queryTypeName || t.kind === 'SCALAR')
      .map(t => t.name)
    this.selectedTypes = new Set(requiredTypes)
    this.requestUpdate()
  }

  /**
   * Reset types to default selection based on backend type
   */
  resetToDefaults() {
    const isGraphQL = this.dataSource instanceof GraphQL
    if (!isGraphQL) return

    const backendType = (this.dataSource as GraphQL).backendType || 'generic'
    const defaultEnabled = GraphQL.getDefaultEnabledTypes(backendType, this.availableTypes, this.queryTypeName)
    this.selectedTypes = new Set(defaultEnabled)
    this.requestUpdate()
  }

  /**
   * Get filtered types based on search query
   * Selected types are always shown first
   */
  getFilteredTypes(): LightweightType[] {
    let types = this.availableTypes
    if (this.typeSearchQuery) {
      const query = this.typeSearchQuery.toLowerCase()
      types = types.filter(t => t.name.toLowerCase().includes(query))
    }
    // Sort: selected types first, then alphabetically within each group
    return types.sort((a, b) => {
      const aSelected = this.selectedTypes.has(a.name)
      const bSelected = this.selectedTypes.has(b.name)
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      return a.name.localeCompare(b.name)
    })
  }

  /**
   * Go back to config phase
   */
  goBackToConfig() {
    this.creationPhase = 'config'
    this.availableTypes = []
    this.selectedTypes = new Set()
    this.queryTypeName = 'Query'
    this.errorMessage = ''
    this.requestUpdate()
  }

  /**
   * Handle backend type change - updates selected types based on new backend defaults
   */
  onBackendTypeChange(newBackendType: GraphQLBackendType) {
    if (!this.dataSource || !(this.dataSource instanceof GraphQL)) return

    const ds = this.dataSource as GraphQL
    ds.backendType = newBackendType

    // Apply new default selection based on backend type
    const defaultEnabled = GraphQL.getDefaultEnabledTypes(newBackendType, this.availableTypes, this.queryTypeName)
    this.selectedTypes = new Set(defaultEnabled)

    this.requestUpdate()
  }

  connectDataSource() {
    if(!this.dataSource) throw new Error('No data source provided')

    // Compute disabledTypes from selection (blacklist approach)
    if (this.dataSource instanceof GraphQL && this.availableTypes.length > 0) {
      const ds = this.dataSource as GraphQL
      const allTypeNames = this.availableTypes.map(t => t.name)
      const disabledTypes = allTypeNames.filter(name => !this.selectedTypes.has(name))

      // Set disabled types for persistence (only blacklist, no whitelist)
      ds.disabledTypes = disabledTypes
    }

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
      justify-content: space-between;
      align-items: center;
      margin-top: 15px;
    }
    .ds-actions-left {
      display: flex;
      gap: 10px;
    }
    .ds-actions-right {
      display: flex;
      gap: 10px;
      margin-left: auto;
    }
    .ds-no-resize {
      flex: 0 0 auto;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    /* Backend selector styles */
    .ds-backend-selector {
      margin-bottom: 15px;
    }
    .ds-backend-options {
      display: flex;
      gap: 10px;
      border: none;
      padding: 0;
      margin: 0;
    }
    .ds-backend-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 12px 16px;
      border: 2px solid var(--gjs-main-dark-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--gjs-main-dark-color);
      min-width: 80px;
    }
    .ds-backend-option:hover {
      border-color: var(--gjs-light-color);
    }
    .ds-backend-option--selected {
      border-color: var(--ds-primary);
      background: rgba(var(--ds-primary-rgb, 76, 175, 80), 0.1);
    }
    .ds-backend-option input[type="radio"] {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .ds-backend-option svg {
      width: 40px;
      height: 40px;
    }
    .ds-backend-option span {
      font-size: 11px;
      color: var(--gjs-light-color);
      text-align: center;
    }
    .ds-backend-option--beta {
      position: relative;
    }
    .ds-backend-option--beta::after {
      content: 'beta';
      position: absolute;
      top: 4px;
      right: 4px;
      padding: 1px 4px;
      padding-top: 3px;
      font-size: smaller;
      font-weight: bold;
      text-transform: uppercase;
      background: var(--ds-primary);
      color: var(--gjs-secondary-color);
      border-radius: 3px;
      line-height: 1.2;
    }
    /* Inline backend selector (compact for config phase) */
    .ds-backend-selector--inline {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    .ds-backend-option--compact {
      flex-direction: row;
      padding: 8px 14px;
      min-width: auto;
      gap: 8px;
    }
    .ds-backend-option--compact svg {
      width: 20px;
      height: 20px;
    }
    .ds-backend-option--compact span {
      font-size: 13px;
    }
    /* Advanced options accordion */
    .ds-advanced-details {
      margin: 15px 0;
      border: 1px solid var(--gjs-main-dark-color);
      border-radius: 6px;
      background: var(--gjs-main-dark-color);
    }
    .ds-advanced-summary {
      padding: 12px 15px;
      cursor: pointer;
      font-size: 13px;
      color: var(--gjs-light-color);
      user-select: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ds-advanced-summary:hover {
      color: inherit;
    }
    .ds-advanced-summary::before {
      content: '▶';
      font-size: 10px;
      transition: transform 0.2s;
    }
    .ds-advanced-details[open] .ds-advanced-summary::before {
      transform: rotate(90deg);
    }
    .ds-advanced-content {
      padding: 0 15px 15px;
      border-top: 1px solid var(--gjs-main-light-color);
    }
    .ds-hint {
      display: block;
      margin-top: 5px;
      font-size: 11px;
      color: var(--gjs-light-color);
    }
    .ds-help-text {
      margin: 0 0 10px;
      font-size: 11px;
      color: var(--gjs-light-color);
      font-style: italic;
    }
    .ds-types-count-inline {
      font-size: 12px;
      color: var(--gjs-light-color);
      margin-left: auto;
    }
    /* Type selection styles */
    .ds-types-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .ds-types-search {
      flex: 1;
      min-width: 150px;
    }
    .ds-types-actions {
      display: flex;
      gap: 5px;
    }
    .ds-types-actions button {
      padding: 4px 8px;
      font-size: 12px;
    }
    .ds-types-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid var(--gjs-main-dark-color);
      border-radius: 4px;
      padding: 8px;
      background-color: var(--gjs-main-dark-color);
    }
    .ds-type-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      transition: background-color 0.15s;
    }
    .ds-type-item:hover {
      background-color: var(--gjs-main-light-color);
    }
    .ds-type-item input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    .ds-type-item label {
      cursor: pointer;
      flex: 1;
      font-family: monospace;
      font-size: 13px;
    }
    .ds-type-kind {
      font-size: 10px;
      padding: 2px 5px;
      border-radius: 3px;
      background-color: var(--gjs-main-light-color);
      color: var(--gjs-light-color);
      text-transform: lowercase;
    }
    .ds-type-kind--scalar {
      background-color: rgba(100, 200, 100, 0.2);
      color: #4caf50;
    }
    .ds-type-kind--object {
      background-color: rgba(100, 150, 255, 0.2);
      color: #2196f3;
    }
    .ds-type-kind--interface {
      background-color: rgba(200, 150, 255, 0.2);
      color: #9c27b0;
    }
    .ds-type-kind--enum {
      background-color: rgba(255, 200, 100, 0.2);
      color: #ff9800;
    }
    .ds-type-kind--union {
      background-color: rgba(255, 150, 150, 0.2);
      color: #f44336;
    }
    .ds-type-kind--input_object {
      background-color: rgba(150, 200, 200, 0.2);
      color: #00bcd4;
    }
    .ds-types-count {
      font-size: 12px;
      color: var(--gjs-light-color);
      margin-top: 8px;
    }
    `,
    COMMON_STYLES,
  ]

  /**
   * Render the configuration form (Phase 1)
   */
  renderConfigPhase(): TemplateResult {
    if (!this.dataSource) throw new Error('No data source provided')
    const dsHeaders: Ref<SettingsHeaders> = createRef()

    return html`
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
            @input=${(e: Event) => {
    if (this.dataSource) {
      this.dataSource.url = (e.target as HTMLInputElement).value
      this.requestUpdate()
    }
  }}
            ?readonly=${this.dataSource.readonly !== false}
          />
        </label>
        <!-- ID field hidden - not needed by users, auto-generated -->
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
      <details class="ds-advanced-details">
        <summary class="ds-advanced-summary">HTTP Headers</summary>
        <div class="ds-advanced-content">
          <ds-settings__headers
            ${ref(dsHeaders)}
            .headers=${this.dataSource.headers}
            @change=${() => {
    if (this.dataSource) this.dataSource.headers = dsHeaders.value?.headers || {}
    dsHeaders.value?.requestUpdate()
  }}
            ?readonly=${this.dataSource.readonly !== false}
          ></ds-settings__headers>
        </div>
      </details>

        <div class="ds-field">
          <div class="ds-status-section">
            ${this.isLoading
    ? html`<div class="ds-status-item ds-status-loading">${this.loadingIcon} Fetching types...</div>`
    : this.errorMessage
      ? html`<div class="ds-status-item ds-status-error">Error: ${this.errorMessage}</div>`
      : ''
}
          </div>
        </div>

        <div class="ds-field ds-actions">
          <div class="ds-actions-right">
            <button
              type="button"
              class="ds-btn-prim"
              @click=${() => this.dispatchEvent(new CustomEvent('cancel'))}
            >Cancel</button>
            ${this.isEdit ? html`
              <button
                type="button"
                class="ds-btn-prim"
                ?disabled=${this.isLoading || !this.dataSource.url}
                @click=${() => this.fetchTypeNames()}
              >${this.isLoading ? 'Loading...' : 'Options'}</button>
              <button
                type="submit"
                class="ds-btn-prim"
                ?disabled=${this.isLoading || !this.dataSource.url}
              >${this.isLoading ? 'Applying...' : 'Apply'}</button>
            ` : html`
              <button
                type="submit"
                class="ds-btn-prim"
                ?disabled=${this.isLoading || !this.dataSource.url}
              >${this.isLoading ? 'Fetching...' : 'Next'}</button>
            `}
          </div>
        </div>
      </div>
    `
  }

  /**
   * Render the type selection phase (Phase 2)
   */
  renderTypesPhase(): TemplateResult {
    const filteredTypes = this.getFilteredTypes()
    const selectedCount = this.selectedTypes.size
    const totalCount = this.availableTypes.length
    const isGraphQL = this.dataSource instanceof GraphQL
    const backendType = isGraphQL ? (this.dataSource as GraphQL).backendType : 'generic'

    return html`
      <h3 class="ds-property__title">Data Source Options</h3>
      <p class="ds-help-text">Select your backend type. Any GraphQL API is a supported, choose "GraphQL" for a generic connector.</p>

      <div class="ds-backend-selector">
        <fieldset class="ds-backend-options">
          <label class="ds-backend-option ${backendType === 'generic' ? 'ds-backend-option--selected' : ''}">
            <input
              type="radio"
              name="backendType"
              value="generic"
              ?checked=${backendType === 'generic'}
              @change=${() => this.onBackendTypeChange('generic')}
            />
            <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <path fill="#E535AB" d="M57.468 302.66l-14.376-8.3 160.15-277.38 14.376 8.3z"/>
              <path fill="#E535AB" d="M39.8 272.2h320.3v16.6H39.8z"/>
              <path fill="#E535AB" d="M206.348 374.026l-160.21-92.5 8.3-14.376 160.21 92.5zM345.522 132.947l-160.21-92.5 8.3-14.376 160.21 92.5z"/>
              <path fill="#E535AB" d="M54.482 132.883l-8.3-14.375 160.21-92.5 8.3 14.376z"/>
              <path fill="#E535AB" d="M342.568 302.663l-160.15-277.38 14.376-8.3 160.15 277.38zM52.5 107.5h16.6v185H52.5zM330.9 107.5h16.6v185h-16.6z"/>
              <path fill="#E535AB" d="M203.522 367l-7.25-12.558 139.34-80.45 7.25 12.557z"/>
              <path fill="#E535AB" d="M369.5 297.9c-9.6 16.7-31 22.4-47.7 12.8-16.7-9.6-22.4-31-12.8-47.7 9.6-16.7 31-22.4 47.7-12.8 16.8 9.7 22.5 31 12.8 47.7M90.9 137c-9.6 16.7-31 22.4-47.7 12.8-16.7-9.6-22.4-31-12.8-47.7 9.6-16.7 31-22.4 47.7-12.8 16.7 9.7 22.4 31 12.8 47.7M30.5 297.9c-9.6-16.7-3.9-38 12.8-47.7 16.7-9.6 38-3.9 47.7 12.8 9.6 16.7 3.9 38-12.8 47.7-16.8 9.6-38.1 3.9-47.7-12.8M309.1 137c-9.6-16.7-3.9-38 12.8-47.7 16.7-9.6 38-3.9 47.7 12.8 9.6 16.7 3.9 38-12.8 47.7-16.7 9.6-38.1 3.9-47.7-12.8M200 395.8c-19.3 0-34.9-15.6-34.9-34.9 0-19.3 15.6-34.9 34.9-34.9 19.3 0 34.9 15.6 34.9 34.9 0 19.2-15.6 34.9-34.9 34.9M200 74c-19.3 0-34.9-15.6-34.9-34.9 0-19.3 15.6-34.9 34.9-34.9 19.3 0 34.9 15.6 34.9 34.9 0 19.3-15.6 34.9-34.9 34.9"/>
            </svg>
            <span>GraphQL</span>
          </label>
          <label class="ds-backend-option ds-backend-option--beta ${backendType === 'wordpress' ? 'ds-backend-option--selected' : ''}">
            <input
              type="radio"
              name="backendType"
              value="wordpress"
              ?checked=${backendType === 'wordpress'}
              @change=${() => this.onBackendTypeChange('wordpress')}
            />
            <svg viewBox="0 0 122.52 122.523" xmlns="http://www.w3.org/2000/svg">
              <g fill="#21759b">
                <path d="m8.708 61.26c0 20.802 12.089 38.779 29.619 47.298l-25.069-68.686c-2.916 6.536-4.55 13.769-4.55 21.388z"/>
                <path d="m96.74 58.608c0-6.495-2.333-10.993-4.334-14.494-2.664-4.329-5.161-7.995-5.161-12.324 0-4.831 3.664-9.328 8.825-9.328.233 0 .454.029.681.042-9.35-8.566-21.807-13.796-35.489-13.796-18.36 0-34.513 9.42-43.91 23.688 1.233.037 2.395.063 3.382.063 5.497 0 14.006-.667 14.006-.667 2.833-.167 3.167 3.994.337 4.329 0 0-2.847.335-6.015.501l19.138 56.925 11.501-34.493-8.188-22.434c-2.83-.166-5.511-.501-5.511-.501-2.832-.166-2.5-4.496.332-4.329 0 0 8.679.667 13.843.667 5.496 0 14.006-.667 14.006-.667 2.835-.167 3.168 3.994.337 4.329 0 0-2.853.335-6.015.501l18.992 56.494 5.242-17.517c2.272-7.269 4.001-12.49 4.001-16.989z"/>
                <path d="m62.184 65.857-15.768 45.819c4.708 1.384 9.687 2.141 14.846 2.141 6.12 0 11.989-1.058 17.452-2.979-.14-.225-.269-.464-.374-.724z"/>
                <path d="m107.376 36.046c.226 1.674.354 3.471.354 5.404 0 5.333-.996 11.328-3.996 18.824l-16.053 46.413c15.624-9.111 26.133-26.038 26.133-45.426.001-9.137-2.333-17.729-6.438-25.215z"/>
                <path d="m61.262 0c-33.779 0-61.262 27.481-61.262 61.26 0 33.783 27.483 61.263 61.262 61.263 33.778 0 61.265-27.48 61.265-61.263-.001-33.779-27.487-61.26-61.265-61.26zm0 119.715c-32.23 0-58.453-26.223-58.453-58.455 0-32.23 26.222-58.451 58.453-58.451 32.229 0 58.45 26.221 58.45 58.451 0 32.232-26.221 58.455-58.45 58.455z"/>
              </g>
            </svg>
            <span>WordPress</span>
          </label>
          <label class="ds-backend-option ds-backend-option--beta ${backendType === 'gitlab' ? 'ds-backend-option--selected' : ''}">
            <input
              type="radio"
              name="backendType"
              value="gitlab"
              ?checked=${backendType === 'gitlab'}
              @change=${() => this.onBackendTypeChange('gitlab')}
            />
            <svg viewBox="0 0 380 380" xmlns="http://www.w3.org/2000/svg">
              <path fill="#e24329" d="M190 362.6 256.3 158.8H123.7z"/>
              <path fill="#fc6d26" d="M190 362.6 123.7 158.8H15.3z"/>
              <path fill="#fca326" d="m15.3 158.8-13.5 41.6c-1.2 3.8.1 7.9 3.3 10.3L190 362.6z"/>
              <path fill="#e24329" d="M15.3 158.8h108.4L79.8 24.1c-1.4-4.4-7.6-4.4-9 0z"/>
              <path fill="#fc6d26" d="m190 362.6 66.3-203.8h108.4z"/>
              <path fill="#fca326" d="m364.7 158.8 13.5 41.6c1.2 3.8-.1 7.9-3.3 10.3L190 362.6z"/>
              <path fill="#e24329" d="M364.7 158.8H256.3l43.9-134.7c1.4-4.4 7.6-4.4 9 0z"/>
            </svg>
            <span>GitLab</span>
          </label>
          <label class="ds-backend-option ds-backend-option--beta ${backendType === 'strapi' ? 'ds-backend-option--selected' : ''}">
            <input
              type="radio"
              name="backendType"
              value="strapi"
              ?checked=${backendType === 'strapi'}
              @change=${() => this.onBackendTypeChange('strapi')}
            />
            <svg viewBox=".24262095 .26549587 243.32256626 243.58072911" xmlns="http://www.w3.org/2000/svg">
              <g fill="#8e75ff" fill-rule="evenodd">
                <path d="m161.893 165.833v-78.73a5.077 5.077 0 0 0 -5.077-5.076h-78.638v-81.267h159.815a5.077 5.077 0 0 1 5.078 5.077v159.996z"/>
                <path d="m78.178.76v81.267h-75.054a2.539 2.539 0 0 1 -1.796-4.333zm83.715 240.206v-75.133h81.178l-76.844 76.927a2.539 2.539 0 0 1 -4.334-1.794zm-83.715-158.939h81.176a2.539 2.539 0 0 1 2.539 2.538v81.268h-78.638a5.077 5.077 0 0 1 -5.077-5.077z" opacity=".405"/>
              </g>
            </svg>
            <span>Strapi</span>
          </label>
          <label class="ds-backend-option ds-backend-option--beta ${backendType === 'supabase' ? 'ds-backend-option--selected' : ''}">
            <input
              type="radio"
              name="backendType"
              value="supabase"
              ?checked=${backendType === 'supabase'}
              @change=${() => this.onBackendTypeChange('supabase')}
            />
            <svg viewBox="0 0 109 113" xmlns="http://www.w3.org/2000/svg">
              <path fill="url(#supabase-a)" d="M63.7 110.3c-2.5 3.1-7.6 1.4-7.7-2.6l-1.5-66.2h50.2c9.1 0 14.1 10.5 8.4 17.6L63.7 110.3Z"/>
              <path fill="url(#supabase-b)" fill-opacity=".2" d="M63.7 110.3c-2.5 3.1-7.6 1.4-7.7-2.6l-1.5-66.2h50.2c9.1 0 14.1 10.5 8.4 17.6L63.7 110.3Z"/>
              <path fill="#3ECF8E" d="M45.3 2.7c2.5-3.1 7.6-1.4 7.7 2.6l.7 66.2H4.4c-9.1 0-14-10.5-8.3-17.6L45.3 2.7Z"/>
              <defs>
                <linearGradient id="supabase-a" x1="53.97" x2="94.12" y1="54.97" y2="71.95" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#249361"/><stop offset="1" stop-color="#3ECF8E"/>
                </linearGradient>
                <linearGradient id="supabase-b" x1="36.16" x2="54.48" y1="30.58" y2="65.72" gradientUnits="userSpaceOnUse">
                  <stop/><stop offset="1" stop-opacity="0"/>
                </linearGradient>
              </defs>
            </svg>
            <span>Supabase</span>
          </label>
        </fieldset>
      </div>

      <!-- Advanced: Manual type selection -->
      <details class="ds-advanced-details">
        <summary class="ds-advanced-summary">
          Show / hide fields in the expressions
          <span class="ds-types-count-inline">(${selectedCount}/${totalCount})</span>
        </summary>
        <div class="ds-advanced-content">
          <p class="ds-help-text"><br>Uncheck types you don't want to see in your expressions.</p>
          <div class="ds-types-header">
            <input
              type="text"
              class="ds-types-search"
              placeholder="Search types..."
              .value=${this.typeSearchQuery}
              @input=${(e: Event) => {
    this.typeSearchQuery = (e.target as HTMLInputElement).value
    this.requestUpdate()
  }}
            />
            <div class="ds-types-actions">
              <button type="button" class="ds-btn-prim" @click=${() => this.selectAllTypes()}>Select All</button>
              <button type="button" class="ds-btn-prim" @click=${() => this.deselectAllTypes()}>Deselect All</button>
              <button type="button" class="ds-btn-prim" @click=${() => this.resetToDefaults()}>Reset to Defaults</button>
            </div>
          </div>

          <div class="ds-types-list">
            ${filteredTypes.map(type => {
    const isRequired = this.isRequiredType(type.name)
    return html`
              <div class="ds-type-item" @click=${() => this.toggleType(type.name)}>
                <input
                  type="checkbox"
                  .checked=${this.selectedTypes.has(type.name)}
                  ?disabled=${isRequired}
                  @click=${(e: Event) => e.stopPropagation()}
                  @change=${() => this.toggleType(type.name)}
                />
                <label>${type.name}</label>
                <span class="ds-type-kind ds-type-kind--${type.kind.toLowerCase()}">${type.kind}</span>
              </div>
            `})}
            ${filteredTypes.length === 0 ? html`
              <div style="padding: 20px; text-align: center; color: var(--gjs-light-color);">
                No types match "${this.typeSearchQuery}"
              </div>
            ` : ''}
          </div>

          <div class="ds-types-count">
            ${selectedCount} of ${totalCount} types selected
            ${this.typeSearchQuery ? ` (showing ${filteredTypes.length} matching "${this.typeSearchQuery}")` : ''}
          </div>
        </div>
      </details>

      <div class="ds-field">
        <div class="ds-status-section">
          ${this.isLoading
    ? html`<div class="ds-status-item ds-status-loading">${this.loadingIcon} Connecting...</div>`
    : this.errorMessage
      ? html`<div class="ds-status-item ds-status-error">Error: ${this.errorMessage}</div>`
      : this.connected
        ? html`<div class="ds-status-item ds-status-success">${this.connectedIcon} Connection successful</div>`
        : ''
}
        </div>
      </div>

      <div class="ds-field ds-actions">
        <div class="ds-actions-left">
          <button
            type="button"
            class="ds-btn-prim"
            @click=${() => this.goBackToConfig()}
            ?disabled=${this.isLoading}
          >Back</button>
        </div>
        <div class="ds-actions-right">
          <button
            type="button"
            class="ds-btn-prim"
            @click=${() => this.dispatchEvent(new CustomEvent('cancel'))}
          >Cancel</button>
          <button
            type="submit"
            class="ds-btn-prim"
            ?disabled=${this.isLoading || this.selectedTypes.size === 0}
          >${this.isLoading ? 'Connecting...' : 'Apply'}</button>
        </div>
      </div>
    `
  }

  protected render() {
    if (!this.dataSource) throw new Error('No data source provided')

    return html`
      <form
        ?readonly=${this.dataSource.readonly !== false}
        @submit=${(e: Event) => {
    e.preventDefault()
    e.stopImmediatePropagation()
    // Handle form submission based on current phase
    if (this.creationPhase === 'config') {
      if (this.isEdit) {
        this.connectDataSource()
      } else {
        this.fetchTypeNames()
      }
    } else {
      this.connectDataSource()
    }
  }}
      >
        ${this.creationPhase === 'config' ? this.renderConfigPhase() : this.renderTypesPhase()}
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
  // private connectedIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
  // private errorIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`

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
        transition: border-color 0.2s ease, background-color 0.2s ease;
        cursor: pointer;
      }
      .ds-card:hover {
        border-color: var(--ds-highlight);
        background-color: rgba(255, 255, 255, 0.02);
      }
      .ds-card__info {
        flex: 1;
        min-width: 0;
      }
      .ds-card__title {
        font-weight: 500;
        margin: 0 0 4px 0;
        color: inherit;
        display: flex;
        align-items: flex-end;
      }
      .ds-card__url {
        font-size: 12px;
        color: var(--gjs-light-color);
        margin: 0 0 4px 0;
        word-break: break-all;
      }
      .ds-card__logo {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-right: 8px;
        vertical-align: middle;
      }
      .ds-card__backend {
        display: inline-block;
        font-size: 11px;
        font-weight: normal;
        color: var(--gjs-light-color);
        background-color: var(--gjs-main-light-color);
        padding: 2px 6px;
        border-radius: 3px;
        margin-left: 8px;
        vertical-align: middle;
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
      .ds-card__status--error {
        color: var(--ds-highlight);
      }
      .ds-card__actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
        opacity: 0.6;
        transition: opacity 0.2s ease;
      }
      .ds-card:hover .ds-card__actions {
        opacity: 1;
      }
      .ds-card__btn {
        padding: 4px 8px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        background-color: transparent;
        color: var(--gjs-light-color);
        transition: background-color 0.2s ease, color 0.2s ease;
      }
      .ds-card__btn:hover {
        background-color: var(--gjs-main-light-color);
        color: inherit;
      }
      .ds-card__btn--danger {
        color: var(--ds-highlight);
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

  private graphqlLogo = html`<svg class="ds-card__logo" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><path fill="#E535AB" d="M57.468 302.66l-14.376-8.3 160.15-277.38 14.376 8.3z"/><path fill="#E535AB" d="M39.8 272.2h320.3v16.6H39.8z"/><path fill="#E535AB" d="M206.348 374.026l-160.21-92.5 8.3-14.376 160.21 92.5zM345.522 132.947l-160.21-92.5 8.3-14.376 160.21 92.5z"/><path fill="#E535AB" d="M54.482 132.883l-8.3-14.375 160.21-92.5 8.3 14.376z"/><path fill="#E535AB" d="M342.568 302.663l-160.15-277.38 14.376-8.3 160.15 277.38zM52.5 107.5h16.6v185H52.5zM330.9 107.5h16.6v185h-16.6z"/><path fill="#E535AB" d="M203.522 367l-7.25-12.558 139.34-80.45 7.25 12.557z"/><path fill="#E535AB" d="M369.5 297.9c-9.6 16.7-31 22.4-47.7 12.8-16.7-9.6-22.4-31-12.8-47.7 9.6-16.7 31-22.4 47.7-12.8 16.8 9.7 22.5 31 12.8 47.7M90.9 137c-9.6 16.7-31 22.4-47.7 12.8-16.7-9.6-22.4-31-12.8-47.7 9.6-16.7 31-22.4 47.7-12.8 16.7 9.7 22.4 31 12.8 47.7M30.5 297.9c-9.6-16.7-3.9-38 12.8-47.7 16.7-9.6 38-3.9 47.7 12.8 9.6 16.7 3.9 38-12.8 47.7-16.8 9.6-38.1 3.9-47.7-12.8M309.1 137c-9.6-16.7-3.9-38 12.8-47.7 16.7-9.6 38-3.9 47.7 12.8 9.6 16.7 3.9 38-12.8 47.7-16.7 9.6-38.1 3.9-47.7-12.8M200 395.8c-19.3 0-34.9-15.6-34.9-34.9 0-19.3 15.6-34.9 34.9-34.9 19.3 0 34.9 15.6 34.9 34.9 0 19.2-15.6 34.9-34.9 34.9M200 74c-19.3 0-34.9-15.6-34.9-34.9 0-19.3 15.6-34.9 34.9-34.9 19.3 0 34.9 15.6 34.9 34.9 0 19.3-15.6 34.9-34.9 34.9"/></svg>`
  private wordpressLogo = html`<svg class="ds-card__logo" viewBox="0 0 122.52 122.523" xmlns="http://www.w3.org/2000/svg"><g fill="#21759b"><path d="m8.708 61.26c0 20.802 12.089 38.779 29.619 47.298l-25.069-68.686c-2.916 6.536-4.55 13.769-4.55 21.388z"/><path d="m96.74 58.608c0-6.495-2.333-10.993-4.334-14.494-2.664-4.329-5.161-7.995-5.161-12.324 0-4.831 3.664-9.328 8.825-9.328.233 0 .454.029.681.042-9.35-8.566-21.807-13.796-35.489-13.796-18.36 0-34.513 9.42-43.91 23.688 1.233.037 2.395.063 3.382.063 5.497 0 14.006-.667 14.006-.667 2.833-.167 3.167 3.994.337 4.329 0 0-2.847.335-6.015.501l19.138 56.925 11.501-34.493-8.188-22.434c-2.83-.166-5.511-.501-5.511-.501-2.832-.166-2.5-4.496.332-4.329 0 0 8.679.667 13.843.667 5.496 0 14.006-.667 14.006-.667 2.835-.167 3.168 3.994.337 4.329 0 0-2.853.335-6.015.501l18.992 56.494 5.242-17.517c2.272-7.269 4.001-12.49 4.001-16.989z"/><path d="m62.184 65.857-15.768 45.819c4.708 1.384 9.687 2.141 14.846 2.141 6.12 0 11.989-1.058 17.452-2.979-.14-.225-.269-.464-.374-.724z"/><path d="m107.376 36.046c.226 1.674.354 3.471.354 5.404 0 5.333-.996 11.328-3.996 18.824l-16.053 46.413c15.624-9.111 26.133-26.038 26.133-45.426.001-9.137-2.333-17.729-6.438-25.215z"/><path d="m61.262 0c-33.779 0-61.262 27.481-61.262 61.26 0 33.783 27.483 61.263 61.262 61.263 33.778 0 61.265-27.48 61.265-61.263-.001-33.779-27.487-61.26-61.265-61.26zm0 119.715c-32.23 0-58.453-26.223-58.453-58.455 0-32.23 26.222-58.451 58.453-58.451 32.229 0 58.45 26.221 58.45 58.451 0 32.232-26.221 58.455-58.45 58.455z"/></g></svg>`
  private gitlabLogo = html`<svg class="ds-card__logo" viewBox="0 0 380 380" xmlns="http://www.w3.org/2000/svg"><path fill="#e24329" d="M190 362.6 256.3 158.8H123.7z"/><path fill="#fc6d26" d="M190 362.6 123.7 158.8H15.3z"/><path fill="#fca326" d="m15.3 158.8-13.5 41.6c-1.2 3.8.1 7.9 3.3 10.3L190 362.6z"/><path fill="#e24329" d="M15.3 158.8h108.4L79.8 24.1c-1.4-4.4-7.6-4.4-9 0z"/><path fill="#fc6d26" d="m190 362.6 66.3-203.8h108.4z"/><path fill="#fca326" d="m364.7 158.8 13.5 41.6c1.2 3.8-.1 7.9-3.3 10.3L190 362.6z"/><path fill="#e24329" d="M364.7 158.8H256.3l43.9-134.7c1.4-4.4 7.6-4.4 9 0z"/></svg>`
  private strapiLogo = html`<svg class="ds-card__logo" viewBox=".24262095 .26549587 243.32256626 243.58072911" xmlns="http://www.w3.org/2000/svg"><g fill="#8e75ff" fill-rule="evenodd"><path d="m161.893 165.833v-78.73a5.077 5.077 0 0 0 -5.077-5.076h-78.638v-81.267h159.815a5.077 5.077 0 0 1 5.078 5.077v159.996z"/><path d="m78.178.76v81.267h-75.054a2.539 2.539 0 0 1 -1.796-4.333zm83.715 240.206v-75.133h81.178l-76.844 76.927a2.539 2.539 0 0 1 -4.334-1.794zm-83.715-158.939h81.176a2.539 2.539 0 0 1 2.539 2.538v81.268h-78.638a5.077 5.077 0 0 1 -5.077-5.077z" opacity=".405"/></g></svg>`
  private supabaseLogo = html`<svg class="ds-card__logo" viewBox="0 0 109 113" xmlns="http://www.w3.org/2000/svg"><path fill="#3ECF8E" d="M63.7 110.3c-2.5 3.1-7.6 1.4-7.7-2.6l-1.5-66.2h50.2c9.1 0 14.1 10.5 8.4 17.6L63.7 110.3Z"/><path fill="#3ECF8E" d="M45.3 2.7c2.5-3.1 7.6-1.4 7.7 2.6l.7 66.2H4.4c-9.1 0-14-10.5-8.3-17.6L45.3 2.7Z"/></svg>`

  protected render() {
    if (!this.dataSource) return html``

    const isConnected = this.dataSource.isConnected()
    const isGraphQL = this.dataSource instanceof GraphQL
    const backendType = isGraphQL ? (this.dataSource as GraphQL).backendType : null
    const backendLogo = backendType === 'wordpress' ? this.wordpressLogo
      : backendType === 'gitlab' ? this.gitlabLogo
        : backendType === 'strapi' ? this.strapiLogo
          : backendType === 'supabase' ? this.supabaseLogo
            : backendType === 'generic' ? this.graphqlLogo
              : null

    return html`
      <div class="ds-card" @click=${() => this.dispatchEvent(new CustomEvent('edit', { detail: this.dataSource }))}>
        <div class="ds-card__info">
          <h4 class="ds-card__title">
            ${backendLogo}
            ${this.dataSource.label || 'Unnamed Data Source'}
          </h4>
          <p class="ds-card__url">${this.dataSource.url || 'No URL configured'}</p>
          ${this.isTestingConnection ? html`
            <div class="ds-card__status ds-card__status--loading">
              ${this.loadingIcon} Testing...
            </div>
          ` : isConnected ? html`
            <div class="ds-card__status ds-card__status--connected">
              Connected
            </div>
          ` : html`
            <div class="ds-card__status ds-card__status--error">
              Not connected
            </div>
          `}
        </div>
        <div class="ds-card__actions">
          <button
            class="ds-card__btn"
            @click=${(e: Event) => { e.stopPropagation(); this.dispatchEvent(new CustomEvent('test', { detail: this.dataSource })) }}
            ?disabled=${this.isTestingConnection}
          >
            ${this.isTestingConnection ? 'Testing...' : 'Test'}
          </button>
          ${this.dataSource.readonly !== false ? '' : html`
            <button
              class="ds-card__btn ds-card__btn--danger"
              @click=${(e: Event) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete the data source "${this.dataSource!.label || this.dataSource!.id}"?`)) {
      this.dispatchEvent(new CustomEvent('delete', { detail: this.dataSource }))
    }
  }}
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
