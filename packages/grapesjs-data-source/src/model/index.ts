import { Editor } from 'grapesjs'
import DataSourceManager from './DataSourceManager'
import { DataSourceEditor, DataSourceOptions } from '..'

export default (editor: DataSourceEditor, opts: Partial<DataSourceOptions> = {}) => {
  editor.DataSourceManager = new DataSourceManager(opts.dataSources ?? [], opts)
}