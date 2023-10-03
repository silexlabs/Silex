import Backbone from "backbone"
import { DATA_SOURCE_ERROR, DATA_SOURCE_READY, Field, IDataSource, IDataSourceOptions, Type, TypeId, TypeKind, builtinTypeIds, builtinTypes } from "../types"

export interface GraphQLOptions extends IDataSourceOptions {
  url: string
  headers: Record<string, string>
  method: 'GET' | 'POST'
  queryable: TypeId[] | ((type: GQLType) => boolean)
}

export type GraphQLKind = 'SCALAR' | 'OBJECT' | 'LIST'

export interface GQLField {
  name: string,
  type: {
    name: string,
    kind: GraphQLKind,
    ofType?: {
      name: string,
      kind: GraphQLKind,
    },
  },
}
export interface GQLType {
  name: string,
  type: GQLField,
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

      return result
          .data.__schema.types
          // Filter out Query, Mutation, Subscription
          .filter((type: GQLType) => !['Query', 'Mutation', 'Subscription'].includes(type.name))
          // Filter out types that are not in Query
          .map((type: GQLType) => query?.fields.find((field: GQLField) => field.name === type.name) ?? type)

        // return query.fields
        // Add the fields which are not in Query but at the schema's root
        // @ts-ignore
        .map((field: GQLField) => ({
          ...field,
          ...result.data.__schema.types.find((type: GQLType) => type.name === this.getTypeProp('name', field)),
        } as GQLType))
        .map((type: GQLType) => this.graphQLToType(allTypes, type))
        .concat(builtinTypes)

      //return result
      //    .data.__schema.types
      //    .find((type: GQLType) => type.name === 'Query')?.fields
      //    .map((field: GQLType) => ({
      //      kind: this.getTypeProp('kind', field),
      //      ...result.data.__schema.types.find((type: any) => type.name === this.getTypeProp('name', field))
      //    }))
      //    .map((type: any) => this.graphQLToType(allTypes, type))
      //    .concat(builtinTypes)
    } catch (e) {
      return this.triggerError(`GraphQL introspection failed: ${(e as Error).message}`)
    }
  }
  protected graphQLToField(type: GQLField): Field {
    return {
      id: type.name,
      dataSourceId: this.get('id')!,
      name: type.name,
      typeId: this.getTypeProp('name', type),
      kind: (this.getTypeProp('kind', type) ?? 'SCALAR').toLowerCase() as TypeKind,
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getTypeProp(prop: string, type: any): GraphQLKind {
    return (type.type?.ofType?.[prop] ?? type.type?.[prop] ?? type[prop])
  }
  protected graphQLToType(allTypes: TypeId[], type: GQLType): Type {
    const queryable = this.get('queryable') ?? []
    const result = {
      id: type.name,
      dataSourceId: this.get('id')!,
      name: type.name,
      kind: (this.getTypeProp('kind', type) ?? 'SCALAR').toLowerCase() as TypeKind,
      fields: type.fields
        // Do not include fields that are not in the schema
        // FIXME: somehow this happens with fields of type datetime_functions for directus
        //?.filter((field: {name: string, type: any}) => allTypes.includes(field.name))
        ?.filter((field) => allTypes.includes(this.getTypeProp('name', field)))
        ?.map(field => this.graphQLToField(field))
        ?? [],
      queryable: queryable instanceof Array
        ? queryable.includes(type.name)
        : queryable(type),
    }
    return result
  }

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
  getTypes(): Type[] {
    if (!this.ready) return []
    return this.types
  }
  //async getData(query: Query): Promise<any[]> {
  //  const result = await this.call(`
  //      query {
  //        ${this.buildQuery(query)}
  //      }
  //    `) as any
  //  return result.data.Query[query.name]
  //}

  /**
   * Exported for testing purposes
   */
  async call(query: string): Promise<unknown> {
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

  ///**
  // * Exported for testing purposes
  // */
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
}
