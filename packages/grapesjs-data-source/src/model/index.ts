import DataSourceManager from './DataSourceManager'
import { DataEditor, DataOptions, DataSourceObject } from '..'
import DynamicDataManager from './DynamicDataManager'
import GraphQL, { GraphQLConnectorOptions } from '../datasources/GraphQL'

export default (editor: DataEditor, opts: Partial<DataOptions> = {}) => {
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
  editor.DynamicDataManager = new DynamicDataManager([], { editor, ...opts})
}