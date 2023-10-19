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

// Data sources must implement this interface
export type DataSourceId = string | number // Matches the Backbone.Model.id type
export interface IDataSource {
  // For reference in expressions
  id: DataSourceId

  // Initialization
  connect(): Promise<void>

  // Introspection
  getTypes(): Type[]
  getQueryables(): Field[]

  // Access data
  //fetchValues(type: TypeId): Promise<any[]>
}
export const DATA_SOURCE_READY = 'data-source:ready'
export const DATA_SOURCE_ERROR = 'data-source:error'
export const DATA_SOURCE_CHANGED = 'data-source:changed'

// For use by the DataSourceManager class which is a Backbone collection
export interface IDataSourceModel extends Backbone.Model, IDataSource {}

// Options of a data source
export interface IDataSourceOptions extends Backbone.ModelSetOptions {
  id: DataSourceId
  name: string
  type: 'graphql' // | 'rest' | 'database' | 'csv' | 'json'
}

// Types
export type TypeId = string
export type Type = {
  id: TypeId
  name: string
  fields: Field[]
  dataSourceId?: DataSourceId // Not required for builtin types
}

// From https://graphql.org/graphql-js/basic-types/
export const builtinTypeIds = ['String', 'Int', 'Float', 'Boolean', 'ID', 'Unknown']
export const builtinTypes: Type[] = builtinTypeIds.map(id => ({
  id,
  name: id,
  fields: [],
}))

// Fileds
export type FieldId = string
export type FieldKind = 'scalar' | 'object' | 'list'
export interface FieldArgument {
  name: string
  typeId: TypeId
  defaultValue?: unknown
}
export interface Field {
  id: FieldId
  name: string
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
export type Options = Record<string, unknown>

/**
 * A property is used to make expressions and access data from the data source
 */
export type Property = /*TypeProperty |*/ FieldProperty

export interface BaseProperty {
  type: 'property'
  propType: 'type' | 'field'
  dataSourceId?: DataSourceId
}

//export interface TypeProperty extends BaseProperty {
//  propType: 'type'
//  typeId: TypeId
//}

export interface FieldProperty extends BaseProperty {
  propType: 'field'
  typeIds: TypeId[]
  fieldId: FieldId
  kind: FieldKind
  options?: Record<string, unknown>
  optionsForm?: (input: Field | null, options: Options) => string | null
}

/**
 * A filter is used to alter data in an expression
 * It is provided in the options
 */
export type FilterId = string
export interface Filter {
  type: 'filter'
  id: FilterId
  name: string
  options: Options
  optionsForm?: (input: Field | null, options: Options) => string | null
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
  id: StateId
  componentId: string
  exposed: boolean
}

/**
 * A context is a list of available tokens for a component
 */
export type Context = Token[]


/**
 * An expression is a list of tokens which can be evaluated to a value
 * It is used to access data from the data source
 */
export type Expression = Token[]

