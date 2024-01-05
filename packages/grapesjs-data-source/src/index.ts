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

import GraphQL, { GraphQLOptions } from './datasources/GraphQL'
import { DataSourceManager } from './model/DataSourceManager'
import { DataSourceEditor, DataSourceEditorOptions, IDataSourceOptions } from './types'
import view from './view'

/**
 * Export the public API
 */
export * from './model/state'
export * from './model/DataTree'
export * from './model/DataSourceManager'
export * from './model/token'
export * from './model/completion'
export * from './types'
export * from './utils'

/**
 * GrapeJs plugin entry point
 */
export default (editor: DataSourceEditor, opts: Partial<DataSourceEditorOptions> = {}) => {
  const options: DataSourceEditorOptions = {
    dataSources: [],
    filters: [],
    ...opts,
    view: {
      el: '.gjs-pn-panel.gjs-pn-views-container',
      ...opts?.view,
    },
  }

  // Create the data sources from config
  const dataSources = options.dataSources
    .map((ds: IDataSourceOptions) => {
      switch (ds.type) {
        case 'graphql': return new GraphQL(ds as GraphQLOptions)
        default: throw new Error(`Unknown data source: ${ds.label}`)
      }
    })
  
  // Connect the data sources (async)
  Promise.all(dataSources.map(ds => ds.connect()))
  .then(() => console.info('Data sources connected'))
  .catch(err => console.error('Error while connecting data sources', err))

  // Register the data source manager
  editor.DataSourceManager = new DataSourceManager(dataSources, editor, options)

  // Register the UI for component properties
  view(editor, options.view)
}

/**
 * Version of the plugin
 * This is replaced by the build script
 */
export const version = '__VERSION__'
