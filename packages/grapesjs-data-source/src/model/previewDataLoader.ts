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

import { DataSourceId, DATA_SOURCE_DATA_LOAD_START, DATA_SOURCE_DATA_LOAD_END, DATA_SOURCE_DATA_LOAD_CANCEL } from '../types'
import { DataTree } from './DataTree'
import { getAllDataSources } from './dataSourceRegistry'
import { getPageQuery } from './queryBuilder'
import { Page, Editor } from 'grapesjs'
import { NOTIFICATION_GROUP } from '../utils'

/**
 * Preview data loader state
 */
interface PreviewDataLoaderState {
  editor: Editor
  dataTree: DataTree
  currentUpdatePid: number
  lastQueries: Record<DataSourceId, string>
}

// Global loader instance
let globalLoader: PreviewDataLoaderState | null = null

/**
 * Initialize the preview data loader
 */
export function initializePreviewDataLoader(editor: Editor, dataTree: DataTree): void {
  globalLoader = {
    editor,
    dataTree,
    currentUpdatePid: 0,
    lastQueries: {}
  }
}

/**
 * Get the global loader (throws if not initialized)
 */
function getLoader(): PreviewDataLoaderState {
  if (!globalLoader) {
    throw new Error('PreviewDataLoader not initialized. Call initializePreviewDataLoader first.')
  }
  return globalLoader
}

/**
 * Compare two query objects to see if they are equal
 */
function areQueriesEqual(queries1: Record<DataSourceId, string>, queries2: Record<DataSourceId, string>): boolean {
  const keys1 = Object.keys(queries1).sort()
  const keys2 = Object.keys(queries2).sort()
  
  // Check if they have the same number of keys
  if (keys1.length !== keys2.length) {
    return false
  }
  
  // Check if all keys are the same
  if (!keys1.every(key => keys2.includes(key))) {
    return false
  }
  
  // Check if all values are the same
  return keys1.every(key => queries1[key] === queries2[key])
}

/**
 * Load preview data for the current page
 * @param forceRefresh - If true, bypass query comparison and force refresh
 */
export async function loadPreviewData(forceRefresh: boolean = false): Promise<void> {
  const loader = getLoader()
  loader.editor.trigger(DATA_SOURCE_DATA_LOAD_START)
  
  const page = loader.editor.Pages.getSelected()
  if (!page) return
  
  // Get current queries
  const currentQueries = getPageQuery(page, loader.editor, loader.dataTree)
  
  // Compare with last queries to see if we need to refresh
  const queriesChanged = !areQueriesEqual(loader.lastQueries, currentQueries)
  
  if (!forceRefresh && !queriesChanged) {
    // Queries haven't changed, no need to refresh data sources
    // But still trigger load end to maintain expected event flow
    loader.editor.trigger(DATA_SOURCE_DATA_LOAD_END, loader.dataTree.previewData)
    return
  }
  
  // Update last queries
  loader.lastQueries = { ...currentQueries }
  
  loader.currentUpdatePid++
  const data = await fetchPagePreviewData(page)
  
  if (data !== 'interrupted') {
    loader.editor.trigger(DATA_SOURCE_DATA_LOAD_END, data)
  } else {
    console.warn(`Preview data update process for PID ${loader.currentUpdatePid} was interrupted.`)
    loader.editor.trigger(DATA_SOURCE_DATA_LOAD_CANCEL, data)
  }
}

/**
 * Fetch preview data for a specific page
 * @param page - The page object for which preview data needs to be fetched
 * @return The preview data returned by all data sources, or 'interrupted' if cancelled
 */
export async function fetchPagePreviewData(page: Page): Promise<Record<DataSourceId, unknown> | 'interrupted'> {
  const loader = getLoader()
  const myPid = loader.currentUpdatePid
  const queries = getPageQuery(page, loader.editor, loader.dataTree)
  
  // Reset preview data
  loader.dataTree.previewData = {}

  try {
    const results = await Promise.all(
      Object.entries(queries)
        .map(async ([dataSourceId, query]) => {
          if (myPid !== loader.currentUpdatePid) return
          
          const ds = getAllDataSources().find(ds => ds.id === dataSourceId)
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
            loader.dataTree.previewData[dataSourceId] = value
            return { dataSourceId, value }
          } catch (err) {
            console.error(`Error fetching preview data for data source ${dataSourceId}:`, err)
            loader.editor.runCommand('notifications:add', {
              type: 'error',
              group: NOTIFICATION_GROUP,
              message: `Error fetching preview data for data source ${dataSourceId}: ${err}`,
            })
            return null
          }
        })
    )

    if (myPid !== loader.currentUpdatePid) return 'interrupted'

    return results
      .filter(result => result !== null)
      .reduce((acc, result) => {
        const { dataSourceId, value } = result!
        acc[dataSourceId] = value
        return acc
      }, {} as Record<DataSourceId, unknown>)
  } catch (err) {
    console.error('Error while fetching preview data:', err)
    loader.editor.runCommand('notifications:add', {
      type: 'error',
      group: NOTIFICATION_GROUP,
      message: `Error while fetching preview data: ${err}`,
    })
    return {}
  }
}

/**
 * Get current preview data
 */
export function getPreviewData(): Record<DataSourceId, unknown> {
  return getLoader().dataTree.previewData
}

/**
 * Clear preview data
 */
export function clearPreviewData(): void {
  getLoader().dataTree.previewData = {}
}