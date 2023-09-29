import {Editor, Button, Component} from 'grapesjs'
import DataSourceManager from "./model/DataSourceManager";
import model from './model';
import DataManager from './model/DataManager';
import view from './view';
import { Step } from '@silexlabs/steps-selector';
import { GraphQLKind } from './datasources/GraphQL';
import { ExpressionBuilder } from './view/dynamic-properties';

// **
// Data plugin, interfaces and types

/**
 * DataEditor is GrapesJs Editor with references to our plugins
 */
export interface DataEditor extends Editor {
  DataSourceManager: DataSourceManager,
  DataManager: DataManager,
  ExpressionBuilder: ExpressionBuilder,
}

/**
 * Options for our two plugins
 */
export interface Options {
  dataSources?: DataSourceObject[],
  data?: DataOptions,
}

/**
 * GrapesJs plugin to initialize our models and views plugins
 */
export default function (editor: DataEditor, opts: Partial<Options> = {}) {
  model(editor, opts)
  view(editor, opts)
}

// **
// Data interfaces and types

/**
 * DataOptions holds options for Data plugin
 */
export interface DataOptions {
  appendTo?: string | HTMLElement | (() => HTMLElement),
  button?: Button | (() => Button),
  styles?: string,
}

/**
 * ExpressionItem is a property or a filter
 */
export type ExpressionItem = Filter | Property | Step

/**
 * Filters are a subset of ExpressionItem and Step
 */
export interface Filter {
  name: string
  type: string
  list: boolean
  helpText?: string
  options?: any
  optionsForm?: string
  typeOut: string
  listOut: boolean
}

/**
 * An Expression is a list of properties and filters
 * You can get a value from a data source out of an expression
 */
export type Expression = ExpressionItem[]

export type ComponentData = Record<string, Expression>

/**
 * DataObject holds logic to manipulate data source for a component attribute
 */
export interface DataObject {
  component: Component,
  attribute: string,
  dataSource: DataSource,
  expression: Expression,
  validate: () => boolean,
  getValue(): any,
  getProperty(): Property,
}

///**
// * A component's context is all the data available at the component level
// */
//export type Context = DataObject[]

// **
// Data source interfaces and types

/**
 * DataSourceObject holds data to create a DataSource from config
 */
export interface DataSourceObject {
  type: 'graphql', // | 'rest' | 'sql' | 'mongo' | 'firebase' | 'custom',
  name: string,
}

///**
// * Query is the data structure used to query a DataSource
// */
//export interface Query {
//  name: string,
//  attributes?: string[][],
//  properties?: Property[],
//}

/**
 * DataSource is what a data source must implement
 */
export interface DataSource extends Backbone.Model {
  connect: () => Promise<void>,
  getSchema: () => Promise<Schema>,
  //getData: (query: Query) => Promise<any[]>,
}

/**
 * This is used to specify the constructor of a DataSource
 * Because interfaces cannot have constructors
 */
export type DataSourceConstructor = (options: DataSourceObject) => DataSource

/**
 * All types of types
 */
export type Kind = GraphQLKind

/**
 * Properties are a subset of ExpressionItem and Step
 */
export interface Property {
  name: string
  kind: Kind
  type: 'data_source' | 'type' | 'fixed'
  fields?: Field[]
}

/**
 * Fields are a subset of ExpressionItem and Step
 */
export interface Field {
  name: string
  type: string
  kind: Kind
}

/**
 * Schema is the data structure returned by a DataSource
 */
export interface Schema {
  dataSource: DataSourceObject,
  properties?: Property[],
}
