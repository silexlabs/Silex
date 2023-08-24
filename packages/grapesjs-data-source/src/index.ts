import {Editor} from 'grapesjs'
import DataSourceManager from "./model/DataSourceManager";

export interface DataSourceOptions {}

export interface DataSourceEditor extends Editor {
  DataSourceManager: DataSourceManager,
}

export type DataSource = (options: DataSourceOptions) => ({
  id: string,
  name: string,
  connect: () => Promise<void>,
  getSchema: () => Promise<Schema>,
  getData: (query: Query) => Promise<any[]>,
})

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
