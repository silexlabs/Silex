import GraphQL, { GraphQLOptions } from "./datasources/GraphQL"
import { DataSourceEditor, IDataSource } from "./types"

export default (editor: DataSourceEditor) => {
  // Save and load data sources
  editor.on('storage:start:store', data => {
    data.dataSources = editor.DataSourceManager
      .getAll()
      .filter(ds => typeof ds.get('readonly') === 'undefined' || ds.get('readonly') === false)
  })
  editor.on('storage:end:load', (data) => {
    // Connect the data sources
    const newDataSources: IDataSource[] = (data.dataSources || [] as GraphQLOptions[])
      .map((ds: GraphQLOptions) => new GraphQL(ds))
    newDataSources.forEach((ds: IDataSource) => ds.connect())
    // Get all data sources
    const dataSources = editor.DataSourceManager.getAll()
      // Keep only data sources from the config
      .filter(ds => ds.get('readonly') === true)
    // Reset the data sources to the original config
    editor.DataSourceManager.reset(dataSources)
    // Add the new data sources
    editor.DataSourceManager.add(newDataSources)
  })
}