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

import GraphQL, { GraphQLBackendType, LightweightType, LightweightTypesResult, lightweightTypeNamesQuery } from '../datasources/GraphQL'

export const BACKENDS: GraphQLBackendType[] = ['wordpress', 'strapi', 'supabase', 'gitlab', 'generic']

const SOURCE_ID = /^[a-z][a-z0-9_]{0,23}$/

export function checkSourceId(id: unknown, taken: string[]): string {
  if (typeof id !== 'string' || !SOURCE_ID.test(id)) {
    throw new Error('Set source to a short id: lowercase letters, digits and _, starting with a letter, like "wp". Paths start with it.')
  }
  if (id === 'item') throw new Error('"item" is how paths name the item of a loop, choose another source id.')
  if (taken.includes(id)) throw new Error(`Source "${id}" already exists. Sources: ${taken.join(', ')}. Use action "update", or another id.`)
  return id
}

// The URL and the headers are written into the JavaScript of the published site
// (cms/publication.ts), inside quotes and template literals
const UNSAFE_IN_URL = /[\s`'"\\$<>{}]/
const UNSAFE_IN_HEADER = /[^\x20-\x7e]|[`\\$]/

export function checkUrl(url: unknown): string {
  if (typeof url !== 'string' || !url) throw new Error('Set url to the GraphQL endpoint, like https://name.wp.cms.blue/graphql.')
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`"${url}" is not a URL. Write it like https://name.wp.cms.blue/graphql.`)
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) {
    throw new Error('The url must start with https:// (http:// only for localhost).')
  }
  if (UNSAFE_IN_URL.test(url)) throw new Error('The url cannot contain spaces, quotes, backslashes, $, < > or { }.')
  return url
}

export function checkAuthorization(value: unknown): string {
  if (typeof value !== 'string') throw new Error('authorization must be text, like "Bearer <token>".')
  if (UNSAFE_IN_HEADER.test(value)) throw new Error('authorization can only contain printable ASCII characters, without ` \\ or $.')
  return value
}

export function detectBackend({ types, queryTypeName }: LightweightTypesResult): GraphQLBackendType {
  const has = (name: string) => types.some((type: LightweightType) => type.name === name)
  if (queryTypeName === 'RootQuery' && has('ContentNode')) return 'wordpress'
  if (has('UploadFile') && has('UsersPermissionsUser')) return 'strapi'
  if (has('FilterIs')) return 'supabase'
  if (has('CiRunner')) return 'gitlab'
  return 'generic'
}

function bodyStart(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > 200 ? `${flat.slice(0, 200)}…` : flat
}

/**
 * The light introspection query, with the failures told apart: the data source
 * reports them all as one message, and the whole response body
 */
export async function probe(url: string, headers: Record<string, string>): Promise<LightweightTypesResult> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ query: lightweightTypeNamesQuery }),
    })
  } catch (e) {
    console.warn('[cms] probe failed', url, e)
    throw new Error(`Cannot reach ${url}. Check the URL (on WordPress it usually ends with /graphql). The server must also allow requests from Silex (CORS).`, { cause: e })
  }
  const text = await response.text()
  if (response.status === 401 || response.status === 403) {
    throw new Error(`${url} refused the request (${response.status}). Set authorization, like "Bearer <token>" or "Basic <base64 of user:application-password>".`)
  }
  if (response.status === 404) throw new Error(`${url} answered 404: no GraphQL endpoint there. On WordPress the path is usually /graphql.`)
  if (response.status >= 500) throw new Error(`${url} answered ${response.status}: the server failed. Try again later.`)
  let json: { data?: { __schema?: { queryType?: { name: string }, types?: LightweightType[] } }, errors?: { message: string }[] }
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`${url} is not a GraphQL endpoint (it answered a web page${response.redirected ? ' after a redirection' : ''}). Use the API address, usually ending with /graphql.`)
  }
  const schema = json.data?.__schema
  if (!schema?.types) {
    const message = json.errors?.[0]?.message ?? ''
    if (/authentication|introspection|not allowed|permission/i.test(message)) {
      throw new Error(`The schema of ${url} is private. Set authorization, or enable public introspection (in WordPress: GraphQL > Settings).`)
    }
    throw new Error(`${url} answered ${response.status} without a GraphQL schema: ${bodyStart(message || text)}`)
  }
  return {
    queryTypeName: schema.queryType?.name || 'Query',
    types: schema.types.filter(type => !type.name.startsWith('__')),
  }
}

// Under the 45 s the desktop waits for a command: past it, the agent would not know
// whether the source was added
const CONNECT_TIMEOUT_MS = 40_000

export function within<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms) })
  return Promise.race([promise, late]).finally(() => clearTimeout(timer))
}

interface ConnectOptions {
  id: string
  label: string
  url: string
  headers: Record<string, string>
  backend?: GraphQLBackendType
  // A source of the same server: its choice of types, made in the settings, stays
  keep?: GraphQL
}

/**
 * A data source ready to use, or an error that says why: nothing is registered
 * before the connection works
 */
export function connectSource(options: ConnectOptions): Promise<GraphQL> {
  return within(connect(options), CONNECT_TIMEOUT_MS, `${options.url} did not answer within ${CONNECT_TIMEOUT_MS / 1000} s.`)
}

async function connect(options: ConnectOptions): Promise<GraphQL> {
  const { id, label, url, headers, keep } = options
  const light = await probe(url, headers)
  const backendType = options.backend ?? detectBackend(light)
  const enabled = GraphQL.getDefaultEnabledTypes(backendType, light.types, light.queryTypeName)
  const disabledTypes = keep ? keep.disabledTypes : light.types.map(type => type.name).filter(name => !enabled.includes(name))
  const ds = new GraphQL({
    id, label, type: 'graphql', url, headers, readonly: false, backendType, disabledTypes,
    method: keep?.method ?? 'POST',
    queryable: keep?.queryable,
  })
  try {
    await ds.connect()
  } catch (e) {
    const hint = backendType === 'generic' ? ' Try backend "wordpress" if it is a WordPress site, it loads fewer types.' : ''
    throw new Error(`Loading the schema of ${url} failed: ${(e as Error).message.slice(0, 200)}.${hint}`, { cause: e })
  }
  return ds
}
