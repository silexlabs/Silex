import Backbone from "backbone"
import {Editor} from 'grapesjs'
import { DataSource, DataSourceOptions } from ".."

export default class DataSourceManager extends Backbone.Collection {
  private options: DataSourceOptions
  private editor: Editor
  private connectors: Record<string, Connector>
  constructor(models: DataSource[], { editor, options, ...opts }: any) {
    super(models, opts)
    this.editor = editor
    this.options = {
      ...opts,
    }
    // Make sure the symbol CRUD operations are undoable
    this.editor.UndoManager.add(this)
    // Init connectors
    this.connectors = {
      graphql: new GraphQLConnector(),
    }
  }
}
