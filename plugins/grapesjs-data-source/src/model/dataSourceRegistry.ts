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

import { DataSourceId, IDataSource, DATA_SOURCE_CHANGED } from '../types'
import { Editor } from 'grapesjs'

/**
 * Data source registry state
 */
interface DataSourceRegistryState {
  dataSources: IDataSource[]
  editor: Editor
}

// Global registry instance
let globalRegistry: DataSourceRegistryState | null = null

/**
 * Initialize the data source registry
 */
export function initializeDataSourceRegistry(editor: Editor): void {
  globalRegistry = {
    dataSources: [],
    editor,
  }
}

/**
 * Get the global registry (throws if not initialized)
 */
function getRegistry(): DataSourceRegistryState {
  if (!globalRegistry) {
    throw new Error('DataSourceRegistry not initialized. Call initializeDataSourceRegistry first.')
  }
  return globalRegistry
}

/**
 * Get all data sources
 */
export function getAllDataSources(): IDataSource[] {
  return [...getRegistry().dataSources]
}

/**
 * Add a data source
 */
export function addDataSource(dataSource: IDataSource): void {
  const registry = getRegistry()
  registry.dataSources.push(dataSource)
  dataSource.connect()
    .then(() => {
      registry.editor.trigger(DATA_SOURCE_CHANGED)
    })
    .catch((error) => {
      console.error('Failed to connect data source:', error)
      registry.editor.trigger(DATA_SOURCE_CHANGED)
    })
}

/**
 * Remove a data source
 */
export function removeDataSource(dataSource: IDataSource): void {
  const registry = getRegistry()
  const index = registry.dataSources.indexOf(dataSource)
  if (index > -1) {
    registry.dataSources.splice(index, 1)
    registry.editor.trigger(DATA_SOURCE_CHANGED)
  }
}

/**
 * Get a data source by ID
 */
export function getDataSource(id: DataSourceId): IDataSource | undefined {
  return getRegistry().dataSources.find(ds => ds.id === id)
}

/**
 * Set all data sources (replaces existing)
 */
export function setDataSources(dataSources: IDataSource[]): void {
  const registry = getRegistry()
  registry.dataSources = [...dataSources]
  registry.editor.trigger(DATA_SOURCE_CHANGED)
}

/**
 * Convert to JSON for storage
 */
export function dataSourcesToJSON(): unknown[] {
  return getRegistry().dataSources.map(ds => ({
    id: ds.id,
    label: ds.label,
    url: ds.url,
    type: ds.type,
    method: ds.method,
    headers: ds.headers,
    readonly: ds.readonly,
    hidden: ds.hidden,
  }))
}
