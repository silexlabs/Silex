import DataSourceManager from './DataSourceManager'
import { DataEditor, Options, DataSourceObject } from '..'
import DataManager from './DataManager'
import GraphQL, { GraphQLConnectorOptions } from '../datasources/GraphQL'

export default (editor: DataEditor, opts: Partial<Options> = {}) => {
  // Data source manager
  editor.DataSourceManager = new DataSourceManager(
    (opts.dataSources ?? []).map((ds: DataSourceObject) => {
      switch (ds.type) {
        case 'graphql': return new GraphQL(ds as GraphQLConnectorOptions)
        default: throw new Error(`Unknown data source: ${ds.name}`)
      }
    }),
    { editor, ...opts})
  
  // Dynamic data manager
  editor.DataManager = new DataManager([], { editor, ...opts})
}