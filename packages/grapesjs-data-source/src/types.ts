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
export const builtinTypeIds = ['String', 'Int', 'Float', 'Boolean', 'ID']
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
