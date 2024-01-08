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

import Backbone from "backbone"
import { COMPONENT_STATE_CHANGED, DATA_SOURCE_CHANGED, DATA_SOURCE_ERROR, DATA_SOURCE_READY, DataSourceId, Expression, Filter, IDataSource, IDataSourceModel, Property, StoredToken } from "../types"
import { DataSourceEditor, DataSourceEditorOptions } from ".."
import { DataTree } from "./DataTree"
import { Component, Page } from "grapesjs"
import { StoredState, getComponentByPersistentId, onStateChange } from "./state"
import getLiquidFilters from "../filters/liquid"
import getGenericFilters from "../filters/generic"

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

    // Make sure the symbol CRUD operations are undoable
    this.editor.UndoManager.add(this)

    // Add filters from config
    const filters = typeof options.filters === 'string'
      // Include preset from filters/
      ? [
        ...getGenericFilters(editor),
        ...getLiquidFilters(editor),
      ]
      // Define filters in the options
      : options.filters.map((filter: Partial<Filter>) => ({
      type: 'filter',
      ...filter,
    } as Filter))

    // Init the data tree
    this.dataTree = new DataTree(editor, {
      dataSources: this.models,
      filters,
    })

    // Update the data tree when the data sources change
    this.on('all', () => this.modelChanged())

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
  dataSourceReady(e?: CustomEvent) {
    this.editor.trigger(DATA_SOURCE_READY, e?.detail)
  }

  /**
   * Forward events from data sources to the editor
   */
  protected dataSourceErrorBinded = this.dataSourceError.bind(this)
  dataSourceError(e?: CustomEvent) {
    this.editor.trigger(DATA_SOURCE_ERROR, e?.detail)
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
    this.editor.trigger(DATA_SOURCE_CHANGED, e?.detail)
  }

  getDataTree() {
    return this.dataTree
  }

  getPageQuery(page: Page): Record<DataSourceId, string> {
    const expressions: Expression[] = this.dataTree.getPageExpressions(page)
    return this.models
      .map(ds => {
        const dsExpressions: Expression[] = expressions
          .map((e: Expression) => e.flatMap((token: StoredToken) => {
            switch(token.type) {
              case 'property':
              case 'filter':
                return token
              case 'state': {
                const component = getComponentByPersistentId(token.componentId, this.editor)
                if(!component) throw new Error(`Component ${token.componentId} not found`)
                const resolved = this.dataTree.resolveState(token, component)
                if (!resolved) throw new Error(`Unable to resolve state ${JSON.stringify(token)}`)
                return resolved
              }
            }
          }))
          .filter((e: Expression) => {
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
          throw new Error(`No tree for data source ${ds.id}`)
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
}
