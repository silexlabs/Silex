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

import { Editor } from 'grapesjs'

import GraphQL, { GraphQLOptions } from './datasources/GraphQL'
import { DataSourceManager } from './model/DataSourceManager'
import { Filter, IDataSourceOptions } from './types'
import view, { ViewOptions } from './view'

// GrapesJs related types
export interface DataSourceEditor extends Editor {
  DataSourceManager: DataSourceManager
}

export interface DataSourceEditorOptions {
  dataSources: IDataSourceOptions[],
  properties: ViewOptions,
  filters: Filter[],
}

// GrapesJs plugin
export default (editor: DataSourceEditor, opts: Partial<DataSourceEditorOptions> = {}) => {
  const options: DataSourceEditorOptions = {
    dataSources: [],
    filters: [],
    ...opts,
    properties: {
      appendTo: '.gjs-pn-panel.gjs-pn-views-container',
      ...opts?.properties,
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
  console.info('Connecting data sources', dataSources)
  Promise.all(dataSources.map(ds => ds.connect()))
  .then(() => console.info('Data sources connected'))

  // Register the data source manager
  editor.DataSourceManager = new DataSourceManager(dataSources, editor, options)

  // Register the UI for component properties
  view(editor, options.properties)
}

export const version = '__VERSION__'
