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

import Backbone from "backbone"
import { DATA_SOURCE_ERROR, DATA_SOURCE_READY, Field, FieldKind, IDataSource, IDataSourceOptions, Tree, Type, TypeId, builtinTypeIds, builtinTypes } from "../types"
import graphqlIntrospectionQuery from "./graphql-introspection-query"
import dedent from "dedent-js"
import { FIXED_TOKEN_ID } from "../utils"
import { buildArgs } from "../model/token"

/**
 * @fileoverview GraphQL DataSource implementation
 */

/**
 * GraphQL Data source options
 */
interface GraphQLQueryOptions {
  url: string
  headers: Record<string, string>
  method: 'GET' | 'POST'
  queryable?: TypeId[]
  readonly?: boolean
}

/**
 * GraphQL Data source options with server to server options
 */
export interface GraphQLOptions extends GraphQLQueryOptions, IDataSourceOptions {
  serverToServer?: GraphQLQueryOptions
}

// GraphQL specific types
// Exported for unit tests
export type GQLKind = 'SCALAR' | 'OBJECT' | 'LIST' | 'NON_NULL' | 'UNION'

export interface GQLOfType {
  name?: string,
  kind: GQLKind,
  ofType?: GQLOfType,
  possibleTypes?: {name: string, kind: GQLKind}[],
}
export interface GQLField {
  name: string,
  type: GQLOfType,
  args?: {
    name: string,
    type: GQLOfType,
    defaultValue?: string,
  }[],
}
export interface GQLType {
  name: string,
  fields: GQLField[],
}

/**
 * GraphQL DataSource implementation
 * This is a Backbone model used in the DataSourceManager collection
 */
export default class GraphQL extends Backbone.Model<GraphQLOptions> implements IDataSource {
  protected types: Type[] = []
  protected queryables: Field[] = []
  protected queryType: string = ''
  protected ready = false
  constructor(options: GraphQLOptions) {
    super(options)
    this.set('id', options.id)
    this.set('label', options.label)
    this.set('url', options.url)
    this.set('headers', options.headers)
    this.set('queryable', options.queryable)
    this.set('readonly', options.readonly)
  }
  /**
   * @throws Error
   */
  protected triggerError<T>(message: string): T {
    this.trigger(DATA_SOURCE_ERROR, {message})
    throw new Error(message)
  }
  protected async loadData(): Promise<[Type[], Field[], string]> {
    try {
      const result = await this.call(graphqlIntrospectionQuery) as {data: {__schema: {types: GQLType[], queryType: {name: string}}}}
      if (!result.data?.__schema?.types) return this.triggerError(`Invalid response: ${JSON.stringify(result)}`)
      const allTypes = result.data.__schema.types.map((type: GQLType) => type.name)
          .concat(builtinTypeIds)

      const queryType: string = result.data.__schema.queryType?.name
      if(!queryType) return this.triggerError(`Invalid response, queryType not found: ${JSON.stringify(result)}`)

      const query: GQLType | undefined = result.data.__schema.types.find((type: GQLType) => type.name === queryType)
      if(!query) return this.triggerError(`Invalid response, query not found: ${JSON.stringify(result)}`)

      // Get non-queryable types
      const nonQueryables = result.data.__schema.types
        // Filter out Query, Mutation, Subscription
        //.filter((type: GQLType) => !['Query', 'Mutation', 'Subscription'].includes(type.name))
        // Filter out introspection types
        .filter((type: GQLType) => !type.name.startsWith('__'))
        // Filter out types that are not in Query
        //.map((type: GQLType) => query?.fields.find((field: GQLField) => field.name === type.name) ?? type)
        // Filter out types that are in Query (the queryables are handled separately)
        .filter((type: GQLType) => !query?.fields.find((field: GQLField) => field.name === type.name))

        // Map to Type
        .map((type: GQLType) => this.graphQLToType(allTypes, type, 'SCALAR', false))
        // Add builtin types
        .concat(builtinTypes)

      // Get queryable types
      const queryableTypes = query.fields
        // Map to GQLType, keeping kind for later
        .map((field: GQLField) => ({
          type: {
            ...result.data.__schema.types.find((type: GQLType) => type.name === this.getOfTypeProp<string>('name', field.type, field.name)),
            name: field.name,
          } as GQLType,
          kind: this.ofKindToKind(field.type),
        }))
        // Map to Type
        .map(({type, kind}) => this.graphQLToType(allTypes, type, kind, true))
      
      // Get all queryables as fields
      const queryableFields = query.fields
        // Map to Field
        .map((field: GQLField) => this.graphQLToField(field))
      
      // Return all types, queryables and non-queryables
      return [queryableTypes.concat(nonQueryables), queryableFields, queryType]
    } catch (e) {
      return this.triggerError(`GraphQL introspection failed: ${(e as Error).message}`)
    }
  }
  protected graphQLToField(field: GQLField): Field {
    const kind = this.ofKindToKind(field.type)
    return {
      id: field.name,
      dataSourceId: this.get('id')!,
      label: field.name,
      typeIds: this.graphQLToTypes(field),
      kind: kind ? this.graphQLToKind(kind) : 'unknown',
      arguments: field.args?.map(arg => ({
        name: arg.name,
        typeId: this.getOfTypeProp<string>('name', arg.type, arg.name),
        defaultValue: arg.defaultValue,
      })),
    }
  }

  /**
   * Recursively search for a property on a GraphQL type
   * Check the deepest values in ofType first
   */
  protected getOfTypeProp<T>(prop: string, type: GQLOfType, defaultValue?: T): T {
    const result = this.getOfTypePropRecursive<T>(prop, type)
    if(result) return result
    if(defaultValue) return defaultValue
    throw new Error(`Type ${JSON.stringify(type)} has no property ${prop} and no default was provided`)
  }

  protected getOfTypePropRecursive<T>(prop: string, type: GQLOfType): T | undefined {
    if(!type) {
      console.error('Invalid type', type)
      throw new Error('Invalid type')
    }
    if(type.ofType) {
      const ofTypeResult = this.getOfTypePropRecursive<T>(prop, type.ofType)
      if(ofTypeResult) return ofTypeResult
    }
    return type[prop as keyof GQLOfType] as T
  }

  /**
   * Recursively search for a property on a GraphQL type
   * Handles Union types with possibleTypes
   * Handles list and object and non-null types with ofType
   */
  protected graphQLToTypes(field: GQLField): TypeId[] {
    const possibleTypes = this.getOfTypeProp<{name: string, kind: GQLKind}[]>('possibleTypes', field.type, [])
    if(possibleTypes.length > 0) return possibleTypes.map(type => type.name)
    return [this.getOfTypeProp<string>('name', field.type, field.name)]
  }

  /**
   * Convert GraphQL kind to FieldKind
   * @throws Error if kind is not valid or is NON_NULL
   */
  protected graphQLToKind(kind: GQLKind): FieldKind {
    switch(kind) {
      case 'LIST': return 'list'
      case 'OBJECT': return 'object'
      case 'SCALAR': return 'scalar'
      case 'UNION':
      case 'NON_NULL':
      default:
        throw new Error(`Unable to find a valid kind for ${kind}`)
    }
  }

  /**
   * Check if a GraphQL kind has a valid FieldKind equivalent
   */
  protected validKind(kind: GQLKind): boolean {
    return ['LIST', 'OBJECT', 'SCALAR'].includes(kind)
  }

  /**
   * Recursively search for a GraphQL kind of type list, object or scalar
   */
  protected ofKindToKind(ofKind: GQLOfType): GQLKind | null {
    if(ofKind.possibleTypes) {
      const foundKind = ofKind.possibleTypes
      .reduce((prev: GQLKind | null, type: {kind: GQLKind, name: string}) => {
        if(!prev) return type.kind as GQLKind
        if(prev !== type.kind) {
          console.error('Unable to find a valid kind, union types with different kind is not supported', ofKind)
          throw new Error(`Unable to find a valid kind for ${ofKind.kind}. Union types with different kind is not supported`)
        }
        return prev as GQLKind
      }, null)
      if(!foundKind) {
        console.error('Unable to find a valid kind (1)', ofKind)
        return null
      }
      return foundKind
    }
    if(this.validKind(ofKind.kind)) return ofKind.kind
    if(ofKind.ofType) return this.ofKindToKind(ofKind.ofType)
    // This happens when the type is missing
    // Remove the warning because it happens with directus and polutes the logs
    // console.error('Unable to find a valid kind (2)', ofKind)
    return null
  }

  /**
   * Convert a GraphQL type to a Type
   */
  protected graphQLToType(allTypes: TypeId[], type: GQLType, kind: GQLKind | null, queryable: boolean): Type {
    const queryableOverride = this.get('queryable')
    const result = {
      id: type.name,
      dataSourceId: this.get('id')!,
      label: type.name,
      fields: type.fields
        // Do not include fields that are not in the schema
        // FIXME: somehow this happens with fields of type datetime_functions for directus
        //?.filter((field: {name: string, type: any}) => allTypes.includes(field.name))
        ?.filter((field) => allTypes.includes(this.getOfTypeProp<string>('name', field.type, field.name)))
        ?.map(field => this.graphQLToField(field))
        ?? [],
      queryable: queryable && (!queryableOverride || queryableOverride!.includes(type.name)),
    }
    return result
  }

  /**
   * Connect to the GraphQL endpoint and load the schema
   * This has to be implemented as it is a DataSource method
   */
  async connect(): Promise<void> {
    try {
      // const result = await this.call(`
      //     query {
      //       __typename
      //     }
      //   `) as any
      // if (!result?.data?.__typename) return this.triggerError(`Invalid response: ${JSON.stringify(result)}`)
      const [types, fields, queryType] = await this.loadData()
      if(types.length === 0) return this.triggerError(`No types found in GraphQL schema`)
      if(fields.length === 0) return this.triggerError(`No fields found in GraphQL schema`)
      if(!queryType) return this.triggerError(`No query type found in GraphQL schema`)
      this.types = types
      this.queryables = fields
      this.queryType = queryType
      this.ready = true
      this.trigger(DATA_SOURCE_READY)
    } catch (e) {
      return this.triggerError(`GraphQL connection failed: ${(e as Error).message}`)
    }
  }

  /**
   * Check if the DataSource is ready
   * This has to be implemented as it is a DataSource method
   */
  isConnected(): boolean {
    return this.ready
  }

  /**
   * Get all types
   * This has to be implemented as it is a DataSource method
   */
  getTypes(): Type[] {
    return this.types
  }

  /**
   * Get all queryable fields
   * This has to be implemented as it is a DataSource method
   */
  getQueryables(): Field[] {
    return this.queryables
  }

  /**
   * Call the GraphQL endpoint
   */
  protected async call(query: string): Promise<unknown> {
    const url = this.get('url')
    if (!url) return this.triggerError('Missing GraphQL URL')
    const headers = this.get('headers')
    if(!headers) return this.triggerError('Missing GraphQL headers')
    const method = this.get('method') ?? 'POST'
    // GraphQL Introspcetion
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      // Body when POST
      ...(method === 'POST' ? {
        body: JSON.stringify({ query }),
      } : {}),
    })
    if (!response?.ok) {
      console.error('GraphQL call failed', response?.status, response?.statusText, query)
      return this.triggerError(`GraphQL call failed with \`${response?.statusText}\` and status ${response?.status}`)
    }
    return response.json()
  }

  /**
   * Build a GraphQL query from a tree
   */
  getQuery(children: Tree[]): string {
    return this.getQueryRecursive({
      // Add the main query object which is the root of the tree
      token: {
        dataSourceId: this.get('id'),
        fieldId: 'query',
        kind: 'object',
        typeIds: [this.queryType],
      },
      children,
    } as Tree)
  }

  protected getQueryRecursive(tree: Tree, indent = '', fragment = ''): string {
    // Check if the tree is a fragment
    const typeOrFragment = fragment ? `...on ${fragment}` : `${tree.token.fieldId}${buildArgs(tree.token.options)}`

    // Build the value
    switch(tree.token.kind) {
      case 'scalar':
        if(tree.token.fieldId === FIXED_TOKEN_ID) return ''
        return indent + typeOrFragment
      case 'object':
      case 'list': {
        const types = this.getTypes().filter(t => tree.token.typeIds?.includes(t.id))
        if(types.length === 0) {
          throw new Error(`Type not found for ${tree.token.fieldId} (${tree.token.typeIds})`)
        } else if(types.length > 1) throw new Error(`Multiple types found for ${tree.token.fieldId}`)
        const type = types[0] as Type
        const fieldTypes = tree.children
          .map(child => {
            const fieldType = type.fields.find(f => f.id === child.token.fieldId)
            if(!fieldType) {
              // Not a queryable type
              return null
            }
            return {
              fieldType,
              child,
            }
          })
          // Remove non-queryable types
          .filter(fieldType => fieldType !== null) as {fieldType: Field, child: Tree}[]

        // Handle fragments
        const fragments = fieldTypes
          .filter(({fieldType}) => fieldType.typeIds.length > 1)
          .map(({child}) => {
            return {
              query: this.getQueryRecursive(child, indent + '  ', child.token.typeIds[0]),
              child,
            }
          })

        const fragmentsQuery = fragments
          .map(({query, child}) => dedent`
            ${indent}${child.token.fieldId} {
              ${query}
            }
          `)
          .join('\n')

        // Handle simple case, no fragment
        const childQuery = fieldTypes
          .filter(({fieldType}) => fieldType.typeIds.length === 1)
          .map(({child}) => {
            return this.getQueryRecursive(child, indent + '  ')
          })
          .join('\n')

        return dedent`${indent}${typeOrFragment} {
        ${indent}  __typename
        ${childQuery}
        ${fragmentsQuery}
        ${indent}}`
      }
      default:
        console.error('Unable to build GraphQL query', tree)
        throw new Error(`Unable to build GraphQL query: unable to build tree ${JSON.stringify(tree)}`)
    }
  }

  //async getData(query: Query): Promise<any[]> {
  //  const result = await this.call(`
  //      query {
  //        ${this.buildQuery(query)}
  //      }
  //    `) as any
  //  return result.data.Query[query.name]
  //}
}
