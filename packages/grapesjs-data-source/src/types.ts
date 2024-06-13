/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Editor } from 'grapesjs'
import { TemplateResult } from 'lit'
import { DataSourceManager } from './model/DataSourceManager'
import { Button } from 'grapesjs'

/**
 * Add the DataSourceManager to the GrapesJs editor
 */
export interface DataSourceEditor extends Editor {
  DataSourceManager: DataSourceManager
}

export interface DataSourceEditorViewOptions {
  el?: HTMLElement | string | undefined | (() => HTMLElement)
  settingsEl?: HTMLElement | string | (() => HTMLElement)
  button?: Button | (() => Button)
  styles?: string
  optionsStyles?: string
  defaultFixed?: boolean
  disableStates?: boolean
  disableAttributes?: boolean
  disableProperties?: boolean
}

/**
 * Options for the DataSourceEditor plugin
 */
export interface DataSourceEditorOptions {
  dataSources: IDataSourceOptions[],
  view: DataSourceEditorViewOptions,
  filters: Filter[] | string,
}

// Queries
export type PageId = string // GrapesJs page id type
export interface Query {
  expression: Expression
}

/**
 * Tree structure for creating query from components states
 */
export interface Tree {
  token: Property
  children: Tree[]
}

// Data sources must implement this interface
export type DataSourceId = string | number // Matches the Backbone.Model.id type
export interface IDataSource {
  // For reference in expressions
  id: DataSourceId

  // Hide from users settings
  hidden?: boolean

  // Initialization
  connect(): Promise<void>
  isConnected(): boolean

  // Introspection
  getTypes(): Type[]
  getQueryables(): Field[]
  getQuery(trees: Tree[]): string

  // Access data
  //fetchValues(query: Query): Promise<unknown[]>
}
export const DATA_SOURCE_READY = 'data-source:ready'
export const DATA_SOURCE_ERROR = 'data-source:error'
export const DATA_SOURCE_CHANGED = 'data-source:changed'
export const COMPONENT_STATE_CHANGED = 'component:state:changed'

// For use by the DataSourceManager class which is a Backbone collection
export interface IDataSourceModel extends Backbone.Model, IDataSource {}

// Options of a data source
export interface IDataSourceOptions extends Backbone.ModelSetOptions {
  id: DataSourceId
  label: string
  type: 'graphql'
  readonly?: boolean
}

// Types
export type TypeId = string
export type Type = {
  id: TypeId
  label: string
  fields: Field[]
  dataSourceId?: DataSourceId // Not required for builtin types
}

// From https://graphql.org/graphql-js/basic-types/
export const builtinTypeIds = ['String', 'Int', 'Float', 'Boolean', 'ID', 'Unknown']
export const builtinTypes: Type[] = builtinTypeIds.map(id => ({
  id,
  label: id,
  fields: [],
}))

// Fileds
export type FieldId = string
export type FieldKind = 'scalar' | 'object' | 'list' | 'unknown'
export interface FieldArgument {
  name: string
  typeId: TypeId
  defaultValue?: unknown
}
export interface Field {
  id: FieldId
  label: string
  typeIds: TypeId[]
  kind: FieldKind
  dataSourceId?: DataSourceId
  arguments?: FieldArgument[]
}

// **
// Data tree
/**
 * A token can be a property or a filter
 */
export type Token = Property | Filter | State

/**
 * Stored tokens are how the tokens are stored in the component as JSON
 * Use DataTree#fromStored to convert them back to tokens
 */
export type StoredToken = StoredProperty | StoredFilter | State
export type Options = Record<string, unknown>

/**
 * A property is used to make expressions and access data from the data source
 */
export interface BaseProperty {
  type: 'property'
  propType: /*'type' |*/ 'field'
  dataSourceId?: DataSourceId
}

export type PropertyOptions = Record<string, unknown>
export interface StoredProperty extends BaseProperty {
  typeIds: TypeId[]
  fieldId: FieldId
  label: string
  kind: FieldKind
  options?: PropertyOptions
}
export interface Property extends StoredProperty {
  optionsForm?: (input: Field | null, options: Options, stateName: string) => TemplateResult | null
}

/**
 * A filter is used to alter data in an expression
 * It is provided in the options
 */
export type FilterId = string
export interface StoredFilter {
  type: 'filter'
  id: FilterId
  filterName?: FilterId // Override the id for the filter name if present
  label: string
  options: Options
  quotedOptions?: string[]
  optionsKeys?: string[] // Optional, used to set a specific order
}
export interface Filter extends StoredFilter {
  optionsForm?: (input: Field | null, options: Options, stateName: string) => TemplateResult | null
  validate: (input: Field | null) => boolean
  output: (input: Field | null, options: Options) => Field | null
  apply: (input: unknown, options: Options) => unknown
}

/**
 * A component state
 */
export type StateId = string
export interface State {
  type: 'state'
  storedStateId: StateId // Id of the state stored in the component
  label: string
  componentId: string
  exposed: boolean
  forceKind?: FieldKind
}

///**
// * A fixed value
// */
//export interface Fixed extends Step {
//  type: 'fixed'
//  options: {
//    value: string
//    inpuType: FixedType
//  }
//}

/**
 * A context is a list of available tokens for a component
 */
export type Context = Token[]


/**
 * An expression is a list of tokens which can be evaluated to a value
 * It is used to access data from the data source
 */
export type Expression = StoredToken[]

/**
 * Operators for condition in visibility property
 */
export enum UnariOperator {
  TRUTHY = 'truthy',
  FALSY = 'falsy',
  EMPTY_ARR = 'empty array',
  NOT_EMPTY_ARR = 'not empty array',
}

/**
 * Operators for condition in visibility property
 */
export enum BinariOperator {
  EQUAL = '==',
  NOT_EQUAL = '!=',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN_OR_EQUAL = '<=',
}

/**
 * Properties of elements
 * What is not a property is an attribute or a state
 */
export enum Properties {
  innerHTML = 'innerHTML',
  condition = 'condition',
  condition2 = 'condition2',
  __data = '__data',
}
