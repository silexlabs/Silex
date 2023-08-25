import DataSourceManager from './DataSourceManager'
import { DataSource, DataSourceEditor, DataSourceEditorOptions } from '..'

export default (editor: DataSourceEditor, opts: Partial<DataSourceEditorOptions> = {}) => {
  editor.DataSourceManager = new DataSourceManager(opts.dataSources ?? [], { editor, ...opts})
}