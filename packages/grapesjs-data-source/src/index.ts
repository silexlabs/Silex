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
import { DATA_SOURCE_ERROR, DATA_SOURCE_READY, DataSourceEditor, DataSourceEditorOptions, IDataSource, IDataSourceOptions } from './types'
import { NOTIFICATION_GROUP } from './utils'
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
export * from './view/state-editor'

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
        default: throw new Error(`Unknown data source type: ${ds.label}`)
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

  // Use grapesjs-notifications plugin for errors
  editor.on(DATA_SOURCE_ERROR, (msg: string, ds: IDataSource) => editor.runCommand('notifications:add', { type: 'error', message: `Data source \`${ds.id}\` error: ${msg}`, group: NOTIFICATION_GROUP }))
  editor.on(DATA_SOURCE_READY, (ds: IDataSource) => editor.runCommand('notifications:add', { type: 'success', message: `Data source ready: ${ds.id}`, group: NOTIFICATION_GROUP }))
}

/**
 * Version of the plugin
 * This is replaced by the build script
 */
export const version = '__VERSION__'
