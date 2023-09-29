import Backbone from "backbone"
import { DataSource, Schema, DataSourceObject, Property, Field } from ".."

export interface GraphQLConnectorOptions extends DataSourceObject {
  url: string,
  headers: Record<string, string>,
  method: 'GET' | 'POST',
}

export type GraphQLKind = 'scalar' | 'object' | 'list'

export interface GQLType {
  name: string,
  type: {
    name: string,
    kind: GraphQLKind,
    ofType?: {
      name: string,
      kind: GraphQLKind,
    },
  },
  fields: {
    name: string,
    type: {
      name: string,
      kind: GraphQLKind,
      ofType?: {
        name: string,
        kind: GraphQLKind,
      },
    },
  }[],
}

export default class GraphQLConnector extends Backbone.Model<GraphQLConnectorOptions> implements DataSource {
  constructor(options: GraphQLConnectorOptions) {
    super(options)
    this.set('type', 'graphql')
    this.set('name', options.name)
    this.set('url', options.url)
    this.set('headers', options.headers)
  }
  async connect(): Promise<void> {
    try {
      const result = await this.call(`
          query {
            __typename
          }
        `) as any
      if (!result?.data?.__typename) throw new Error(`Invalid response: ${JSON.stringify(result)}`)
    } catch (e: any) {
      throw new Error(`GraphQL connection failed: ${e.message}`)
    }
  }
  async getSchema(): Promise<Schema> {
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
        `) as any
      if (!result.data?.__schema?.types) throw new Error(`Invalid response: ${JSON.stringify(result)}`)
      return {
        dataSource: {
          type: 'graphql',
          method: this.get('method') ?? 'POST',
          name: this.get('name') ?? 'GraphQL',
          url: this.get('url')!,
          headers: this.get('headers'),
        } as GraphQLConnectorOptions,
        properties: result
          .data.__schema.types
          .find((type: any) => type.name === 'Query')?.fields
          .map((field: any) => ({
            kind: this.getTypeProp('kind', field),
            ...result.data.__schema.types.find((type: any) => type.name === this.getTypeProp('name', field))
          }))
          //.filter((type: any) => type)
          .map((type: any) => this.graphQLToProp(type)),
      }
    } catch (e: any) {
      throw new Error(`GraphQL introspection failed: ${e.message}`)
    }
  }
  protected graphQLToField(field: GQLType): Field {
    return {
      name: field.name,
      type: this.getTypeProp('name', field),
      kind: this.getTypeProp('kind', field),
    }
  }
  protected getTypeProp(prop: string, field: any): GraphQLKind {
    return (field.type?.ofType?.[prop] ?? field.type?.[prop] ?? field[prop])
      .toLowerCase()
  }
  protected graphQLToProp(type: GQLType): Property {
    return {
      name: type.name,
      kind: this.getTypeProp('kind', type),
      type: 'type',
      fields: type.fields?.map((field: any) => this.graphQLToField(field)),
    }
  }

  //async getData(query: Query): Promise<any[]> {
  //  const result = await this.call(`
  //      query {
  //        ${this.buildQuery(query)}
  //      }
  //    `) as any
  //    console.log('result', result.data)
  //  return result.data.Query[query.name]
  //}

  /**
   * Exported for testing purposes
   */
  async call(query: string): Promise<any[]> {
    const url = this.get('url')
    if (!url) throw new Error('Missing GraphQL URL')
    const headers = this.get('headers')
    if(!headers) throw new Error('Missing GraphQL headers')
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
      throw new Error(`GraphQL call failed with \`${response?.statusText}\` and status ${response?.status}`)
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
