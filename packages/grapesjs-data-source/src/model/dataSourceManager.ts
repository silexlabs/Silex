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

import { COMPONENT_STATE_CHANGED, DATA_SOURCE_CHANGED, DATA_SOURCE_ERROR, DATA_SOURCE_READY, Filter, IDataSource, DataSourceEditorOptions } from '../types'
import { DataTree } from './DataTree'
import { Component, Editor } from 'grapesjs'
import { StoredState, onStateChange } from './state'
import getLiquidFilters from '../filters/liquid'
import {
  initializeDataSourceRegistry,
  getAllDataSources,
  addDataSource as registryAddDataSource,
  removeDataSource as registryRemoveDataSource,
  setDataSources,
  dataSourcesToJSON
} from './dataSourceRegistry'
import { initializePreviewDataLoader, loadPreviewData } from './previewDataLoader'

/**
 * Data source manager state
 */
export interface DataSourceManagerState {
  dataTree: DataTree
  editor: Editor
  options: DataSourceEditorOptions
  eventListeners: {
    dataChangedBinded: (e?: CustomEvent) => void
    dataSourceReadyBinded: (ds: IDataSource) => void
    dataSourceErrorBinded: (message: string, ds: IDataSource) => void
  }
}

// Global manager instance
let globalManager: DataSourceManagerState | null = null

/**
 * Initialize filters from options
 */
function initializeFilters(editor: Editor, options: DataSourceEditorOptions): Filter[] {
  if (typeof options.filters === 'string') {
    return [
      ...getLiquidFilters(editor),
    ]
  } else {
    return (options.filters as Filter[])
      .flatMap((filter: Partial<Filter> | string): Filter[] => {
        if (typeof filter === 'string') {
          switch (filter) {
          case 'liquid': return getLiquidFilters(editor)
          default: throw new Error(`Unknown filters ${filter}`)
          }
        } else {
          return [{
            ...filter as Partial<Filter>,
            type: 'filter',
          } as Filter]
        }
      })
      .map((filter: Filter) => ({ ...filter, type: 'filter' })) as Filter[]
  }
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

  // Initialize the registry
  initializeDataSourceRegistry(editor)

  // Set initial data sources
  setDataSources(dataSources)

  // Create data tree
  const dataTree = new DataTree(editor, {
    dataSources: getAllDataSources(),
    filters,
  })

  // Initialize preview data loader
  initializePreviewDataLoader(editor, dataTree)

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
    dataTree,
    editor,
    options,
    eventListeners
  }

  // Set up event listeners
  setupEventListeners()

  // Listen for data source changes and re-setup event listeners
  editor.on(DATA_SOURCE_CHANGED, () => {
    setupEventListeners()
  })

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
 * Get the data tree
 */
export function getDataTree(): DataTree {
  return getManager().dataTree
}

/**
 * Get filters
 */
export function getFilters(): Filter[] {
  return getManager().dataTree.filters
}

/**
 * Set filters
 */
export function setFilters(filters: Filter[]): void {
  getManager().dataTree.filters = filters
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

  // Update the data tree with current data sources
  manager.dataTree.dataSources = [...dataSources]

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
