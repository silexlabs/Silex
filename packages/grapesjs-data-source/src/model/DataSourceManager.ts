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
import { DATA_SOURCE_CHANGED, DATA_SOURCE_ERROR, DATA_SOURCE_READY, DataSourceId, Filter, IDataSourceModel } from "../types"
import { DataSourceEditor, DataSourceEditorOptions } from ".."
import { DataTree } from "./DataTree"
import { Page } from "grapesjs"

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

    // Init the data tree
    this.dataTree = new DataTree(editor, {
      filters: options.filters,
      dataSources: this.models,
    })

    // Update the data tree when the data sources change
    this.on('all', () => this.modelChanged())

    // Start listening to data sources
    this.modelChanged()
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
    this.dataTree.dataSources = this.models
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
    this.editor.trigger('datasource:change', e?.detail)
  }

  getDataTree() {
    return this.dataTree
  }

  getPageQuery(page: Page): Record<DataSourceId, string> {
    const expressions = this.dataTree.getPageExpressions(page)
    return this.models
      .map(ds => {
        const query = ds.getQuery(expressions
          .filter(e => {
            const first = e[0]
            if (!first || first.type !== 'property') {
              console.warn('Invalid expression', e)
              return false
            }
            return first.dataSourceId === ds.id
          }))
        return {
          dataSourceId: ds.id.toString(),
          query,
        }
      })
      .reduce((acc, { dataSourceId, query }) => {
        acc[dataSourceId] = query
        return acc
      }, {} as Record<DataSourceId, string>)
  }
}
