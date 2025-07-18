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

import { COMPONENT_STATE_CHANGED, DATA_SOURCE_CHANGED, DATA_SOURCE_DATA_LOAD_CANCEL, DATA_SOURCE_DATA_LOAD_END, DATA_SOURCE_DATA_LOAD_START, DATA_SOURCE_ERROR, DATA_SOURCE_READY, DataSourceId, Filter, IDataSource, Property, StoredToken, DataSourceEditorOptions } from '../types'
import { DataTree } from './DataTree'
import { Component, Page, Editor } from 'grapesjs'
import { StoredState, onStateChange } from './state'
import getLiquidFilters from '../filters/liquid'
import { getComponentDebug, NOTIFICATION_GROUP } from '../utils'


/**
 * Data source manager state
 */
export interface DataSourceManagerState {
  dataSources: IDataSource[]
  dataTree: DataTree
  editor: Editor
  options: DataSourceEditorOptions
  currentUpdatePid: number
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

  // Create data tree
  const dataTree = new DataTree(editor, {
    dataSources,
    filters,
  })

  // Create bound event handlers
  const eventListeners = {
    dataChangedBinded: (e?: CustomEvent) => {
      editor.trigger(DATA_SOURCE_CHANGED, e?.detail)
    },
    dataSourceReadyBinded: (ds: IDataSource) => {
      editor.trigger(DATA_SOURCE_READY, ds)
      updateData() // load the data for the current page
    },
    dataSourceErrorBinded: (message: string, ds: IDataSource) => {
      editor.trigger(DATA_SOURCE_ERROR, message, ds)
    }
  }

  globalManager = {
    dataSources: [...dataSources],
    dataTree,
    editor,
    options,
    currentUpdatePid: 0,
    eventListeners
  }

  // Set up event listeners
  setupEventListeners()

  // Relay state changes to the editor
  onStateChange((state: StoredState | null, component: Component) => {
    updateData().then(() => editor.trigger(COMPONENT_STATE_CHANGED, { state, component }))
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
 * Get all data sources
 */
export function getAllDataSources(): IDataSource[] {
  return [...getManager().dataSources]
}

/**
 * Add a data source
 */
export async function addDataSource(dataSource: IDataSource): Promise<void> {
  const manager = getManager()
  manager.dataSources.push(dataSource)
  setupEventListeners()
  manager.editor.trigger(DATA_SOURCE_CHANGED)
}

/**
 * Remove a data source
 */
export function removeDataSource(dataSource: IDataSource): void {
  const manager = getManager()
  const index = manager.dataSources.indexOf(dataSource)
  if (index > -1) {
    manager.dataSources.splice(index, 1)
    setupEventListeners()
    updateData()
    manager.editor.trigger(DATA_SOURCE_CHANGED)
  }
}

/**
 * Get a data source by ID
 */
export function getDataSource(id: DataSourceId): IDataSource | undefined {
  return getManager().dataSources.find(ds => ds.id === id)
}

/**
 * Refresh all data sources data
 */
export function refreshDataSources(): void {
  updateData()
}

/**
 * Reset all data sources
 */
export function resetDataSources(dataSources: IDataSource[]): void {
  const manager = getManager()
  manager.dataSources = [...dataSources]
  setupEventListeners()
  // Don't auto-update data - let the editor load event handle it
  manager.editor.trigger(DATA_SOURCE_CHANGED)
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
  return getManager().dataSources.map(ds => ({
    id: ds.id,
    label: ds.label,
    url: ds.url,
    type: ds.type,
    method: ds.method,
    headers: ds.headers,
    readonly: ds.readonly,
    hidden: ds.hidden
  }))
}

/**
 * Set up event listeners on all data sources
 */
function setupEventListeners(): void {
  const manager = getManager()

  // Update the data tree with current data sources
  manager.dataTree.dataSources = [...manager.dataSources]

  // Remove all listeners
  manager.dataSources.forEach((dataSource: IDataSource) => {
    if (typeof dataSource.off === 'function') {
      dataSource.off(DATA_SOURCE_READY, manager.eventListeners.dataSourceReadyBinded)
      dataSource.off(DATA_SOURCE_CHANGED, manager.eventListeners.dataChangedBinded)
      dataSource.off(DATA_SOURCE_ERROR, manager.eventListeners.dataSourceErrorBinded)
    }
  })

  // Add listeners on all data sources
  manager.dataSources.forEach((dataSource: IDataSource) => {
    if (typeof dataSource.on === 'function') {
      dataSource.on(DATA_SOURCE_READY, manager.eventListeners.dataSourceReadyBinded)
      dataSource.on(DATA_SOURCE_CHANGED, manager.eventListeners.dataChangedBinded)
      dataSource.on(DATA_SOURCE_ERROR, manager.eventListeners.dataSourceErrorBinded)
    }
  })
}

/**
 * Get page query
 */
export function getPageQuery(page: Page): Record<DataSourceId, string> {
  const manager = getManager()
  const expressions = manager.dataTree.getPageExpressions(page)
  return manager.dataSources
    .map(ds => {
      if (!ds.isConnected()) {
        console.error('The data source is not yet connected, the value for this page can not be loaded')
        return {
          dataSourceId: ds.id.toString(),
          query: '',
        }
      }
      const dsExpressions = expressions
        // Resolve all states
        .map((componentExpression) => ({
          component: componentExpression.component,
          expression: componentExpression.expression.flatMap((token: StoredToken) => {
            switch(token.type) {
            case 'property':
            case 'filter':
              return token
            case 'state': {
              const resolved = manager.dataTree.resolveState(token, componentExpression.component)
              if (!resolved) {
                manager.editor.runCommand('notifications:add', {
                  type: 'error',
                  group: NOTIFICATION_GROUP,
                  message: `Unable to resolve state ${JSON.stringify(token)}. State defined on component ${getComponentDebug(componentExpression.component)}`,
                  componentId: componentExpression.component.getId(),
                })
                throw new Error(`Unable to resolve state ${JSON.stringify(token)}. State defined on component ${getComponentDebug(componentExpression.component)}`)
              }
              return resolved
            }
            }
          })
        }))
        // Keep only the expressions for the current data source
        .filter(componentExpression => {
          const e = componentExpression.expression
          if(e.length === 0) return false
          // We resolved all states
          // An expression can not start with a filter
          // So this is a property
          const first = e[0] as Property
          // Keep only the expressions for the current data source
          return first?.dataSourceId === ds.id
        })
      const trees = manager.dataTree.toTrees(dsExpressions, ds.id)
      if(trees.length === 0) {
        return {
          dataSourceId: ds.id.toString(),
          query: '',
        }
      }
      const query = ds.getQuery(trees)
      return {
        dataSourceId: ds.id.toString(),
        query,
      }
    })
    .filter(obj => !!obj.query)
    .reduce((acc, { dataSourceId, query }) => {
      acc[dataSourceId] = query
      return acc
    }, {} as Record<DataSourceId, string>)
}

/**
 * Update data
 */
export async function updateData(): Promise<void> {
  const manager = getManager()
  manager.editor.trigger(DATA_SOURCE_DATA_LOAD_START)
  const page = manager.editor.Pages.getSelected()
  if (!page) return
  manager.currentUpdatePid++
  const data = await updatePageData(page)
  if (data !== 'interrupted') {
    manager.editor.trigger(DATA_SOURCE_DATA_LOAD_END, data)
  } else {
    console.warn(`Data update process for PID ${manager.currentUpdatePid} was interrupted.`)
    manager.editor.trigger(DATA_SOURCE_DATA_LOAD_CANCEL, data)
  }
}


/**
 * Get page data
 * Update page data
 * @param page - The page object for which data needs to be updated
 * @return The data returned by all data sources, for the current page's query, or the string 'interrupted' if the update process was interrupted by another call to update data
 */
export async function updatePageData(page: Page): Promise<Record<DataSourceId, unknown> | 'interrupted'> {
  const manager = getManager()
  const myPid = manager.currentUpdatePid
  const queries = getPageQuery(page)
  // Reset page data
  manager.dataTree.queryResult = {}

  try {
    const results = await Promise.all(
      Object.entries(queries)
        .map(async ([dataSourceId, query]) => {
          if (myPid !== manager.currentUpdatePid) return
          const ds = manager.dataSources.find(ds => ds.id === dataSourceId)
          if (!ds) {
            console.error(`Data source ${dataSourceId} not found`)
            return null
          }
          if (!ds.isConnected()) {
            console.warn(`Data source ${dataSourceId} is not connected.`)
            return null
          }
          try {
            const value = await ds.fetchValues(query)
            manager.dataTree.queryResult[dataSourceId] = value
            return { dataSourceId, value }
          } catch (err) {
            console.error(`Error fetching values for data source ${dataSourceId}:`, err)
            manager.editor.runCommand('notifications:add', {
              type: 'error',
              group: NOTIFICATION_GROUP,
              message: `Error fetching values for data source ${dataSourceId}: ${err}`,
            })
            return null
          }
        })
    )

    if (myPid !== manager.currentUpdatePid) return 'interrupted'

    return results
      .filter(result => result !== null)
      .reduce((acc, result) => {
        const { dataSourceId, value } = result!
        acc[dataSourceId] = value
        return acc
      }, {} as Record<DataSourceId, unknown>)
  } catch (err) {
    console.error('Error while fetching values:', err)
    manager.editor.runCommand('notifications:add', {
      type: 'error',
      group: NOTIFICATION_GROUP,
      message: `Error while fetching values: ${err}`,
    })
    return {}
  }
}
