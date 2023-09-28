import Backbone from "backbone"
import {Editor} from 'grapesjs'
import { DataObject, DataOptions } from ".."

/**
 * GrapesJs plugin to manage data sources
 */
export default class DataManager extends Backbone.Collection {
  private editor: Editor
  private options: DataOptions
  constructor(models: DataObject[], { editor, ...opts }: any) {
    super(models, opts)
    this.editor = editor
    this.options = {
      ...opts,
    }
    // Make sure the symbol CRUD operations are undoable
    this.editor.UndoManager.add(this)
  }
  getAll() {
    return this.models
  }
}

