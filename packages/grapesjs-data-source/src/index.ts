import {Editor, Button} from 'grapesjs'
import DataSourceManager from "./model/DataSourceManager";
import model from './model';
import DynamicDataManager from './model/DynamicDataManager';
import { Component } from 'grapesjs';
import ui from './ui';

// **
// Data plugin, interfaces and types
export interface DataEditor extends Editor {
  DataSourceManager: DataSourceManager,
  DynamicDataManager: DynamicDataManager,
}

export interface DataOptions {
  dataSources?: DataSourceObject[],
  dynamicData?: DynamicDataOptions,
}

export default function (editor: DataEditor, opts: Partial<DataOptions> = {}) {
  model(editor, opts)
  ui(editor, opts)
}
// **
// DynamicData interfaces and types
export interface DynamicDataOptions {
  appendTo?: string | HTMLElement | (() => HTMLElement),
  button?: Button | (() => Button),
  styles?: string,
}

export interface DynamicDataObject {
  component: Component,
  attribute: string,
  dataSource: DataSource,
  variablePath: string[],
  validate: () => boolean,
  getValue(): any,
  getType(): Type,
}

// **
// DataSource interfaces and types
export interface DataSourceObject {
  type: string,
  name: string,
  [key: string]: any,
}

export interface DataSource extends Backbone.Model {
  id: string,
  name: string,
  connect: () => Promise<void>,
  getSchema: () => Promise<Schema>,
  getData: (query: Query) => Promise<any[]>,
}

export type DataSourceConstructor = (options: DataSourceObject) => DataSource

export interface Schema {
  types: Type[],
}

export interface Type {
  name: string,
  fields: Field[],
  kind: string,
  ofType?: Type,
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
