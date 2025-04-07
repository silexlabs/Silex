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

import Backbone from 'backbone'
import { COMPONENT_STATE_CHANGED, DATA_SOURCE_CHANGED, DATA_SOURCE_ERROR, DATA_SOURCE_READY, DataSourceId, Filter, IDataSource, IDataSourceModel, Property, StoredToken } from '../types'
import { DataSourceEditor, DataSourceEditorOptions } from '../types'
import { DataTree } from './DataTree'
import { Component, Page } from 'grapesjs'
import { StoredState, onStateChange } from './state'
import getLiquidFilters from '../filters/liquid'
import getGenericFilters from '../filters/generic'
import { getComponentDebug, NOTIFICATION_GROUP } from '../utils'

/**
 * FIXME: Why sometimes the methods of the data source are in the attributes?
 * @return ds if it has the getTypes method or ds.attributes if it has the getTypes method
 */
export function getDataSourceClass(ds: IDataSource | { attributes: IDataSource }): IDataSource {
  const unknownTyped = ds as Record<string, unknown>
  if(typeof unknownTyped.getTypes === 'function') return ds as IDataSource
  const unknownAttributes = unknownTyped.attributes as Record<string, unknown>
  if(typeof unknownAttributes.getTypes === 'function') return unknownTyped.attributes as IDataSource
  console.error('Data source has no getTypes method', ds)
  throw new Error('Data source has no getTypes method')
}

/**
 * GrapesJs plugin to manage data sources
 */
export class DataSourceManager extends Backbone.Collection<IDataSourceModel> {
  protected dataTree: DataTree
  get filters() {
    return this.dataTree.filters
  }
  set filters(filters: Filter[]) {
    this.dataTree.filters = this.filters
  }

  constructor(models: IDataSourceModel[], protected editor: DataSourceEditor,  protected options: DataSourceEditorOptions) {
    super(models, options)

    // Make sure the operations are undoable
    this.editor.UndoManager.add(this)

    // Add filters from config
    const filters = (() => {
      // Include preset from filters/
      if (typeof options.filters === 'string') {
        return [
          ...getGenericFilters(editor),
          ...getLiquidFilters(editor),
        ]
      } else {
        // Define filters in the options
        return (options.filters as Filter[])
          .flatMap((filter: Partial<Filter> | string): Filter[] => {
            if (typeof filter === 'string') {
              switch (filter) {
              case 'liquid': return getLiquidFilters(editor)
              case 'generic': return getGenericFilters(editor)
              default: throw new Error(`Unknown filters ${filter}`)
              }
            } else {
              return [{
                ...filter as Partial<Filter>,
                type: 'filter',
              } as Filter]
            }
          })
          .map((filter: Filter)=> ({ ...filter, type: 'filter' })) as Filter[]
      }
    })()

    // Init the data tree
    this.dataTree = new DataTree(editor, {
      dataSources: this.models,
      filters,
    })

    // Update the data tree when the data sources change
    this.on('add update remove change', () => this.modelChanged())
    this.on(DATA_SOURCE_READY, () => this.modelReady())

    // Start listening to data sources
    this.modelChanged()

    // Relay state changes to the editor
    onStateChange((state: StoredState | null, component: Component) => this.editor.trigger(COMPONENT_STATE_CHANGED, { state, component }))
  }

  /**
   * Get all data sources
   */
  getAll(): IDataSourceModel[] {
    return this.models
  }

  /**
   * Forward events from data sources to the editor
   */
  protected dataChangedBinded = this.dataChanged.bind(this)
  dataChanged(e?: CustomEvent) {
    this.editor.trigger(DATA_SOURCE_CHANGED, e?.detail)
  }

  /**
   * Forward events from data sources to the editor
   */
  protected dataSourceReadyBinded = this.dataSourceReady.bind(this)
  dataSourceReady(ds: IDataSource) {
    this.editor.trigger(DATA_SOURCE_READY, ds)
  }

  /**
   * Forward events from data sources to the editor
   */
  protected dataSourceErrorBinded = this.dataSourceError.bind(this)
  dataSourceError(message: string, ds: IDataSource) {
    this.editor.trigger(DATA_SOURCE_ERROR, message, ds)
  }

  /**
   * Listen to data source changes
   */
  modelChanged(e?: CustomEvent) {
    this.dataTree.dataSources = this.models.map(ds => getDataSourceClass(ds)) as IDataSourceModel[]
    // Remove all listeners
    this.models.forEach((dataSource: IDataSourceModel) => {
      dataSource.off(DATA_SOURCE_READY, this.dataSourceReadyBinded)
      dataSource.off(DATA_SOURCE_CHANGED, this.dataChangedBinded)
      dataSource.off(DATA_SOURCE_ERROR, this.dataSourceErrorBinded)
    })
    // Add listeners on all data sources
    this.models.forEach((dataSource: IDataSourceModel) => {
      dataSource.on(DATA_SOURCE_READY, this.dataSourceReadyBinded)
      dataSource.on(DATA_SOURCE_CHANGED, this.dataChangedBinded)
      dataSource.on(DATA_SOURCE_ERROR, this.dataSourceErrorBinded)
    })
    // Update undo manager
    this.editor.getModel().handleUpdates(this, this.toJSON())
    // Forward the event
    this.editor.trigger(DATA_SOURCE_CHANGED, e?.detail)
  }

  /**
   * Listen to data source changes
   */
  modelReady(e?: CustomEvent) {
    // Forward the event
    this.editor.trigger(DATA_SOURCE_READY, e?.detail)
  }

  getDataTree() {
    return this.dataTree
  }

  getPageQuery(page: Page): Record<DataSourceId, string> {
    const expressions = this.dataTree.getPageExpressions(page)
    return this.models
      .map(ds => {
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
                const resolved = this.dataTree.resolveState(token, componentExpression.component)
                if (!resolved) {
                  this.editor.runCommand('notifications:add', {
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
            return first.dataSourceId === ds.id
          })
        const trees = this.dataTree.toTrees(dsExpressions, ds.id)
        if(trees.length === 0) {
          return {
            dataSourceId: ds.id.toString(),
            query: '',
          }
        }
        const query = getDataSourceClass(ds).getQuery(trees)
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

  async getPageValues(page: Page): Promise<Record<DataSourceId, unknown>> {
    const queries = this.getPageQuery(page)
    console.log('Generated queries:', queries)

    try {
      const results = await Promise.all(
        Object.entries(queries).map(async ([dataSourceId, query]) => {
          const ds = this.models.find(ds => ds.id === dataSourceId)
          if (!ds) {
            console.error(`Data source ${dataSourceId} not found`)
            return null
          }
          try {
            const value = await ds.fetchValues(query)
            console.log(`Fetched values for data source ${dataSourceId}:`, value)
            return { dataSourceId, value }
          } catch (err) {
            console.error(`Error fetching values for data source ${dataSourceId}:`, err)
            this.editor.runCommand('notifications:add', {
              type: 'error',
              group: NOTIFICATION_GROUP,
              message: `Error fetching values for data source ${dataSourceId}: ${err}`,
            })
            return null
          }
        })
      )

      return results
        .filter(result => result !== null)
        .reduce((acc, { dataSourceId, value }) => {
          acc[dataSourceId] = value
          return acc
        }, {} as Record<DataSourceId, unknown>)
    } catch (err) {
      console.error('Error while fetching values:', err)
      this.editor.runCommand('notifications:add', {
        type: 'error',
        group: NOTIFICATION_GROUP,
        message: `Error while fetching values: ${err}`,
      })
      return {}
    }
  }
}
