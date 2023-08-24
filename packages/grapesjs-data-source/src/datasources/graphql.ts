import { DataSource, DataSourceOptions, Query, Schema } from ".."

export interface GraphQLConnectorOptions extends DataSourceOptions {
  url: string,
  bearerToken: string,
}


export default function(options: GraphQLConnectorOptions) {
  return {
    id: 'graphql',
    name: 'GraphQL',
    connect: async function (): Promise<void> {
      try {
        const result = await call(options, `
          query {
            __typename
          }
        `) as any
        if (!result?.data?.__typename) throw new Error(`Invalid response: ${JSON.stringify(result)}`)
      } catch(e: any) {
        throw new Error(`GraphQL connection failed: ${e.message}`)
      }
    },
    getSchema: async function (): Promise<Schema> {
      try {
        const result = await call(options, `
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
    },
    getData: async function (query: Query): Promise<any[]> {
      const result = await call(options, `
        query {
          ${buildQuery(query)}
        }
      `) as any
      return result.data[query.name]
    }
  }
}

/**
 * Exported for testing purposes
 */
export async function call(options: GraphQLConnectorOptions, query: string): Promise<any[]> {
  // GraphQL Introspcetion
  const response = await fetch(options.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.bearerToken}`,
    },
    body: JSON.stringify({
      query,
    }),
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
export function buildQuery(query: Query | string): string {
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
      ${query.children?.map(buildQuery).join('\n') ?? 'id'}
    }`
  }
}