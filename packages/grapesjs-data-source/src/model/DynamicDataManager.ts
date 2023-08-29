import Backbone from "backbone"
import {Editor} from 'grapesjs'
import { DataSource, DataOptions, DynamicDataObject } from ".."

/**
 * GrapesJs plugin to manage data sources
 */
export default class DynamicDataManager extends Backbone.Collection {
  private editor: Editor
  private options: Record<string, DataOptions>
  constructor(models: DynamicDataObject[], { editor, ...opts }: any) {
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

