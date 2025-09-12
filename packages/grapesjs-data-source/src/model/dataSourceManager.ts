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

import { COMPONENT_STATE_CHANGED, DATA_SOURCE_CHANGED, DATA_SOURCE_ERROR, DATA_SOURCE_READY, Filter, IDataSource, DataSourceEditorOptions, DataSourceId, Type, Field } from '../types'

const STANDARD_TYPES: Type[] = [
  {
    id: 'string',
    label: 'String',
    fields: [],
  },
  {
    id: 'number',
    label: 'Number',
    fields: [],
  },
  {
    id: 'boolean',
    label: 'Boolean',
    fields: [],
  },
  {
    id: 'date',
    label: 'Date',
    fields: [],
  },
  {
    id: 'unknown',
    label: 'Unknown',
    fields: [],
  },
]
import { Component, Editor } from 'grapesjs'
import { StoredState, onStateChange } from './state'
import {
  initializeDataSourceRegistry,
  getAllDataSources,
  addDataSource as registryAddDataSource,
  removeDataSource as registryRemoveDataSource,
  setDataSources,
  dataSourcesToJSON
} from './dataSourceRegistry'
import { initializePreviewDataLoader, loadPreviewData } from './previewDataLoader'
import { initializeFilters } from '../filters'
import { validateFilters } from '../filters'

/**
 * Data source manager state
 */
export interface DataSourceManagerState {
  dataSources: IDataSource[]
  filters: Filter[]
  previewData: Record<DataSourceId, unknown>
  readonly editor: Editor
  options: DataSourceEditorOptions
  cachedTypes: Type[]
  cachedQueryables: Field[]
  eventListeners: {
    dataChangedBinded: (e?: CustomEvent) => void
    dataSourceReadyBinded: (ds: IDataSource) => void
    dataSourceErrorBinded: (message: string, ds: IDataSource) => void
  }
}

// Global manager instance
let globalManager: DataSourceManagerState | null = null

/**
 * Get all types from all connected data sources
 */
function getAllTypes(manager: DataSourceManagerState): Type[] {
  return manager.dataSources
    .filter(ds => ds.isConnected())
    .flatMap(ds => ds.getTypes())
    .concat(STANDARD_TYPES)
}

/**
 * Get all queryable fields from all connected data sources
 */
function getAllQueryables(manager: DataSourceManagerState): Field[] {
  return manager.dataSources
    .filter(ds => ds.isConnected())
    .flatMap(ds => ds.getQueryables())
}

/**
 * Update cached types and queryables
 */
function updateCachedData(): void {
  const manager = getManager()
  
  manager.cachedTypes = getAllTypes(manager)
  manager.cachedQueryables = getAllQueryables(manager)
}

/**
 * Initialize the global data source manager
 */
export function initializeDataSourceManager(
  dataSources: IDataSource[],
  editor: Editor,
  options: DataSourceEditorOptions
): void {
  const filters = initializeFilters(editor, options)

  // Validate filters
  validateFilters(filters)

  // Initialize the registry
  initializeDataSourceRegistry(editor)

  // Set initial data sources
  setDataSources(dataSources)

  // Get current data sources
  const currentDataSources = getAllDataSources()

  // Initialize preview data loader - we'll update this later
  // initializePreviewDataLoader(editor, dataTree)

  // Create bound event handlers
  const eventListeners = {
    dataChangedBinded: (e?: CustomEvent) => {
      editor.trigger(DATA_SOURCE_CHANGED, e?.detail)
    },
    dataSourceReadyBinded: (ds: IDataSource) => {
      editor.trigger(DATA_SOURCE_READY, ds)
      loadPreviewData(true) // force refresh when data source becomes ready
    },
    dataSourceErrorBinded: (message: string, ds: IDataSource) => {
      editor.trigger(DATA_SOURCE_ERROR, message, ds)
    }
  }

  globalManager = {
    editor,
    options,
    previewData: {},
    cachedTypes: [],
    cachedQueryables: [],
    dataSources: currentDataSources,
    filters,
    eventListeners
  }

  // Set up event listeners
  setupEventListeners()

  // Listen for data source changes and re-setup event listeners
  editor.on(DATA_SOURCE_CHANGED, () => {
    setupEventListeners()
    updateCachedData()
  })

  // Update cached data initially
  updateCachedData()

  // Relay state changes to the editor
  onStateChange((state: StoredState | null, component: Component) => {
    loadPreviewData().then(() => editor.trigger(COMPONENT_STATE_CHANGED, { state, component }))
  })
}

/**
 * Get the global manager (throws if not initialized)
 */
function getManager(): DataSourceManagerState {
  if (!globalManager) {
    throw new Error('DataSourceManager not initialized. Call initializeDataSourceManager first.')
  }
  return globalManager
}

/**
 * Add a data source
 */
export async function addDataSource(dataSource: IDataSource): Promise<void> {
  registryAddDataSource(dataSource)
  setupEventListeners()
}

/**
 * Remove a data source
 */
export function removeDataSource(dataSource: IDataSource): void {
  registryRemoveDataSource(dataSource)
  setupEventListeners()
  loadPreviewData(true) // force refresh when data source is removed
}

/**
 * Refresh all data sources data
 */
export function refreshDataSources(): void {
  loadPreviewData(true) // force refresh when explicitly requested
}

/**
 * Reset all data sources
 */
export function resetDataSources(dataSources: IDataSource[]): void {
  setDataSources(dataSources)
  setupEventListeners()
}


/**
 * Get filters
 */
export function getFilters(): Filter[] {
  return getManager().filters
}

/**
 * Set filters
 */
export function setFilters(filters: Filter[]): void {
  getManager().filters = filters
  updateCachedData()
}

/**
 * Get preview data
 */
export function getPreviewData(): Record<DataSourceId, unknown> {
  return getManager().previewData
}

/**
 * Set preview data
 */
export function setPreviewData(data: Record<DataSourceId, unknown>): void {
  getManager().previewData = data
}

/**
 * Get all types from all data sources
 */
export function getTypes(): Type[] {
  return getAllTypes(getManager())
}

/**
 * Get all queryable fields from all data sources
 */
export function getQueryables(): Field[] {
  return getAllQueryables(getManager())
}

/**
 * Get cached types
 */
export function getCachedTypes(): Type[] {
  return getManager().cachedTypes
}

/**
 * Get cached queryables
 */
export function getCachedQueryables(): Field[] {
  return getManager().cachedQueryables
}

/**
 * Convert to JSON for storage
 */
export function toJSON(): unknown[] {
  return dataSourcesToJSON()
}

/**
 * Set up event listeners on all data sources
 */
function setupEventListeners(): void {
  const manager = getManager()
  const dataSources = getAllDataSources()

  // Update the manager with current data sources
  manager.dataSources = [...dataSources]

  // Remove all listeners
  dataSources.forEach((dataSource: IDataSource) => {
    if (typeof dataSource.off === 'function') {
      dataSource.off(DATA_SOURCE_READY, manager.eventListeners.dataSourceReadyBinded)
      dataSource.off(DATA_SOURCE_CHANGED, manager.eventListeners.dataChangedBinded)
      dataSource.off(DATA_SOURCE_ERROR, manager.eventListeners.dataSourceErrorBinded)
    }
  })

  // Add listeners on all data sources
  dataSources.forEach((dataSource: IDataSource) => {
    if (typeof dataSource.on === 'function') {
      dataSource.on(DATA_SOURCE_READY, manager.eventListeners.dataSourceReadyBinded)
      dataSource.on(DATA_SOURCE_CHANGED, manager.eventListeners.dataChangedBinded)
      dataSource.on(DATA_SOURCE_ERROR, manager.eventListeners.dataSourceErrorBinded)
    }
  })
}
