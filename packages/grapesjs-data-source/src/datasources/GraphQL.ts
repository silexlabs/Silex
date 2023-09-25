import Backbone from "backbone"
import { DataSource, Query, Schema, DataSourceObject } from ".."

export interface GraphQLConnectorOptions extends DataSourceObject {
  url: string,
  headers: Record<string, string>,
}

export default class GraphQLConnector extends Backbone.Model<GraphQLConnectorOptions> implements DataSource {
  id = 'graphql'
  name = 'GraphQL'
  constructor(options: GraphQLConnectorOptions) {
    super(options)
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
        types: result
          .data.__schema.types
          .filter((type: any) => !type.name.startsWith('__'))
      }
    } catch (e: any) {
      throw new Error(`GraphQL introspection failed: ${e.message}`)
    }
  }
  async getData(query: Query): Promise<any[]> {
    const result = await this.call(`
        query {
          ${this.buildQuery(query)}
        }
      `) as any
      console.log('result', result.data)
    return result.data.Query[query.name]
  }
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

  /**
   * Exported for testing purposes
   */
  buildQuery(query: Query | string): string {
    switch (typeof query) {
      case 'string':
        return query
      case 'object':
      default:
        return `${query.name}${query.attributes?.length ? `(${query
          .attributes
          .map(([name, value]) => `${name}: ${value}`)
          .join(',')
        })` : ''} {
        ${query.children?.map(q => this.buildQuery(q)).join('\n') ?? 'id'}
      }`
    }
  }
}
