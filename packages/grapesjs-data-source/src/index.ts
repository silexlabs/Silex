import { Editor } from 'grapesjs'

import GraphQL, { GraphQLOptions } from './datasources/GraphQL'
import { DataSourceManager } from './model/DataSourceManager'
import { IDataSourceOptions } from './types'
import view, { ViewOptions } from './view'
import { Filter } from './model/DataTree'
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
        default: throw new Error(`Unknown data source: ${ds.name}`)
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
