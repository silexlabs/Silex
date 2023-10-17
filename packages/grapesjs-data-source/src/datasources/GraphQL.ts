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
import { DATA_SOURCE_ERROR, DATA_SOURCE_READY, Field, IDataSource, IDataSourceOptions, Type, TypeId, TypeKind, builtinTypeIds, builtinTypes } from "../types"

/**
 * @fileoverview GraphQL DataSource implementation
 */

/**
 * GraphQL Data source options
 */
export interface GraphQLOptions extends IDataSourceOptions {
  url: string
  headers: Record<string, string>
  method: 'GET' | 'POST'
  queryable?: TypeId[] | ((type: GQLType) => boolean)
}

// GraphQL specific types
// Exported for unit tests
export type GQLKind = 'SCALAR' | 'OBJECT' | 'LIST' | 'NON_NULL'

export interface GQLOfType {
  name?: string,
  kind: GQLKind,
  ofType?: GQLOfType,
}
export interface GQLField {
  name: string,
  type: GQLOfType,
}
export interface GQLType {
  name: string,
  fields: GQLField[],
}

export default class GraphQL extends Backbone.Model<GraphQLOptions> implements IDataSource {
  protected types: Type[] = []
  protected ready = false
  constructor(options: GraphQLOptions) {
    super(options)
    this.set('id', options.id)
    this.set('name', options.name)
    this.set('url', options.url)
    this.set('headers', options.headers)
    this.set('queryable', options.queryable)
  }
  /**
   * @throws Error
   */
  protected triggerError<T>(message: string): T {
    this.trigger(DATA_SOURCE_ERROR, {message})
    throw new Error(message)
  }
  protected async loadTypes(): Promise<Type[]> {
    try {
      const result = await this.call(`
        query {
          __schema {
            types {
              name
              fields {
                name
                type {
                  name
                  kind
                  ofType {
                    name
                    kind
                    ofType {
                      name
                      kind
                      ofType {
                        name
                        kind
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `) as {data: {__schema: {types: GQLType[]}}}
      if (!result.data?.__schema?.types) return this.triggerError(`Invalid response: ${JSON.stringify(result)}`)
      const allTypes = result.data.__schema.types.map((type: GQLType) => type.name)
          .concat(builtinTypeIds)

      const query: GQLType | undefined = result.data.__schema.types.find((type: GQLType) => type.name === 'Query')

      if(!query) return this.triggerError(`Invalid response: ${JSON.stringify(result)}`)

      // Get non-queryable types
      const nonQueryables = result.data.__schema.types
        // Filter out Query, Mutation, Subscription
        .filter((type: GQLType) => !['Query', 'Mutation', 'Subscription'].includes(type.name))
        // Filter out introspection types
        .filter((type: GQLType) => !type.name.startsWith('__'))
        // Filter out types that are not in Query
        //.map((type: GQLType) => query?.fields.find((field: GQLField) => field.name === type.name) ?? type)
        // Filter out types that are in Query (the queryables are handled separately)
        .filter((type: GQLType) => !query?.fields.find((field: GQLField) => field.name === type.name))

        // Map to GQLType
        //.map((field: GQLType) => ({
        //  type: result.data.__schema.types
        //    .find((type: GQLType) => 
        //      type.name === field.name
        //      || (field.type && type.name === this.getOfTypeProp<string>('name', field.type, field.name))
        //    ) as GQLType,
        //  kind: this.getOfTypeProp('kind', field.type),
        //}))
        // Map to Type
        .map((type: GQLType) => this.graphQLToType(allTypes, type, 'SCALAR', false))
        // Add builtin types
        .concat(builtinTypes)

      // Get fields from Query, which are the queryables
      const queryables = query.fields
        // Map to GQLType
        .map((field: GQLField) => ({
          type: {
            ...result.data.__schema.types.find((type: GQLType) => type.name === this.getOfTypeProp<string>('name', field.type, field.name)),
            name: field.name,
          } as GQLType,
          kind: this.getOfTypeProp<TypeKind>('kind', field.type) as GQLKind,
        }))
        // Map to Type
        .map(({type, kind}) => this.graphQLToType(allTypes, type, kind, true))
      
      // Return all types, queryables and non-queryables
      return queryables.concat(nonQueryables)
    } catch (e) {
      return this.triggerError(`GraphQL introspection failed: ${(e as Error).message}`)
    }
  }
  protected graphQLToField(field: GQLField): Field {
    return {
      id: field.name,
      dataSourceId: this.get('id')!,
      name: field.name,
      typeId: this.getOfTypeProp<string>('name', field.type, field.name),
      kind: (this.getOfTypeProp<TypeKind>('kind', field.type) ?? 'SCALAR').toLowerCase() as TypeKind,
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
   * Convert GraphQL kind to TypeKind
   * @throws Error if kind is not valid or is NON_NULL
   */
  protected graphQLToKind(kind: GQLKind): TypeKind {
    switch(kind) {
      case 'LIST': return 'list'
      case 'OBJECT': return 'object'
      case 'SCALAR': return 'scalar'
      case 'NON_NULL':
      default:
        throw new Error(`Invalid kind ${kind}`)
    }
  }

  /**
   * Check if a GraphQL kind has a valid TypeKind equivalent
   */
  protected validKind(kind: GQLKind): boolean {
    return ['LIST', 'OBJECT', 'SCALAR'].includes(kind)
  }

  /**
   * Convert a GraphQL type to a Type
   */
  protected graphQLToType(allTypes: TypeId[], type: GQLType, kind: GQLKind, queryable: boolean): Type {
    const queryableOverride = this.get('queryable')
    const result = {
      id: type.name,
      dataSourceId: this.get('id')!,
      name: type.name,
      kind: this.graphQLToKind(kind),//: (this.getTypeProp<TypeKind>('kind', type) ?? 'SCALAR').toLowerCase() as TypeKind,
      fields: type.fields
        // Do not include fields that are not in the schema
        // FIXME: somehow this happens with fields of type datetime_functions for directus
        //?.filter((field: {name: string, type: any}) => allTypes.includes(field.name))
        ?.filter((field) => allTypes.includes(this.getOfTypeProp<string>('name', field.type, field.name)))
        ?.map(field => this.graphQLToField(field))
        ?? [],
      queryable: queryable && (!queryableOverride || (queryableOverride instanceof Array
        ? queryableOverride!.includes(type.name)
        : queryableOverride!(type))
      ),
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
      this.types = await this.loadTypes()
      this.ready = true
      this.trigger(DATA_SOURCE_READY)
    } catch (e) {
      return this.triggerError(`GraphQL connection failed: ${(e as Error).message}`)
    }
  }

  /**
   * Get all types
   * This has to be implemented as it is a DataSource method
   */
  getTypes(): Type[] {
    if (!this.ready) return []
    return this.types
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
      headers,
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

  //buildQuery(query: Query | string): string {
  //  switch (typeof query) {
  //    case 'string':
  //      return query
  //    case 'object':
  //    default:
  //      return `${query.name}${query.attributes?.length ? `(${query
  //        .attributes
  //        .map(([name, value]) => `${name}: ${value}`)
  //        .join(',')
  //      })` : ''} {
  //      ${query.children?.map(q => this.buildQuery(q)).join('\n') ?? 'id'}
  //    }`
  //  }
  //}

  //async getData(query: Query): Promise<any[]> {
  //  const result = await this.call(`
  //      query {
  //        ${this.buildQuery(query)}
  //      }
  //    `) as any
  //  return result.data.Query[query.name]
  //}
}
