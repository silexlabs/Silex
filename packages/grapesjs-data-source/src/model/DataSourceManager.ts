import Backbone from "backbone"
import {Editor} from 'grapesjs'
import { DataSource, DataSourceOptions } from ".."

export default class DataSourceManager extends Backbone.Collection {
  private editor: Editor
  private options: Record<string, DataSourceOptions>
  constructor(models: DataSource[], { editor, ...opts }: any) {
    super(models, opts)
    this.editor = editor
    this.options = {
      ...opts,
    }
    // Make sure the symbol CRUD operations are undoable
    this.editor.UndoManager.add(this)
  }
}
