// Data sources must implement this interface
export type DataSourceId = string | number // Matches the Backbone.Model.id type
export interface IDataSource {
  // For reference in expressions
  id: DataSourceId
  // Initialization
  connect(): Promise<void>
  // Introspection
  getTypes(): Type[]
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
export type TypeKind = 'scalar' | 'object' | 'list'
export type Type = {
  id: TypeId
  name: string
  fields: Field[]
  kind: TypeKind
  queryable: boolean
  dataSourceId?: DataSourceId // Not required for builtin types
}

// From https://graphql.org/graphql-js/basic-types/
export const builtinTypeIds = ['String', 'Int', 'Float', 'Boolean', 'ID', 'Unknown']
export const builtinTypes: Type[] = builtinTypeIds.map(id => ({
  id,
  name: id,
  fields: [],
  kind: 'scalar',
  queryable: false,
}))

// Fileds
export type FieldId = string
export type FieldKind = 'scalar' | 'object' | 'list'
export type Field = {
  id: FieldId
  name: string
  typeId: TypeId
  kind: FieldKind
  dataSourceId: DataSourceId
}

// **
// Data tree
/**
 * A token can be a property or a filter
 */
export type Token = Property | Filter | State

/**
 * A property is used to make expressions and access data from the data source
 */
export type Property = TypeProperty | FieldProperty

export interface BaseProperty {
  type: 'property'
  propType: 'type' | 'field'
  dataSourceId: DataSourceId | null
  kind: TypeKind
}

export interface TypeProperty extends BaseProperty {
  propType: 'type'
  typeId: TypeId
}

export interface FieldProperty extends BaseProperty {
  propType: 'field'
  typeId: TypeId
  fieldId: FieldId
  parentTypeId: TypeId
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
  options: Record<string, unknown>
  optionsForm: string | null
  validate: (input: Type | null) => boolean
  outputType: (input: Type | null) => Type | TypeId | null
  apply: (input: unknown, options: Record<string, unknown>) => unknown
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

