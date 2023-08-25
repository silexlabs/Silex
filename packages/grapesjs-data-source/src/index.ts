import {Editor} from 'grapesjs'
import DataSourceManager from "./model/DataSourceManager";
import model from './model';

export interface DataSourceOptions {}

export interface DataSourceEditor extends Editor {
  DataSourceManager: DataSourceManager,
}

export interface DataSourceImpl {
  id: string,
  name: string,
  connect: () => Promise<void>,
  getSchema: () => Promise<Schema>,
  getData: (query: Query) => Promise<any[]>,
}
export type DataSource = (options: DataSourceOptions) => DataSourceImpl

export interface Schema {
  types: Type[],
}

export interface Type {
  name: string,
  kind: string,
  fields: Field[],
}

export interface Field {
  name: string,
  type: Type,
}

export interface Query {
  name: string,
  attributes?: string[][],
  children?: Array<string | Query>,
}

export interface DataSourceEditorOptions {
  dataSources?: DataSource[],
}

export default function (editor: DataSourceEditor, opts: Partial<DataSourceEditorOptions> = {}) {
  model(editor, opts)
}
