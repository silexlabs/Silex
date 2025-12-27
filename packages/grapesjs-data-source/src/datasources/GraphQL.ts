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

import { IDataSourceOptions, Type, Field, Tree, TypeId, IDataSource, DATA_SOURCE_ERROR, builtinTypeIds, builtinTypes, FieldKind, DATA_SOURCE_READY, DATA_SOURCE_CHANGED } from '../types'
import graphqlIntrospectionQuery from './graphql-introspection-query'
import dedent from 'dedent-js'
import { FIXED_TOKEN_ID } from '../types'
import { buildArgs } from '../model/token'

/**
 * @fileoverview GraphQL DataSource implementation
 */

/**
 * Backend type for GraphQL datasources
 * Determines default type selection behavior
 */
export type GraphQLBackendType = 'gitlab' | 'wordpress' | 'strapi' | 'supabase' | 'generic'

/**
 * Lightweight query to fetch type names and kinds during datasource creation
 * Also fetches queryType name to know which type is the root query type
 * Does NOT fetch fields, interfaces, enums, inputs, or possibleTypes
 */
export const lightweightTypeNamesQuery = `
  query TypeNamesQuery {
    __schema {
      queryType {
        name
      }
      types {
        name
        kind
      }
    }
  }
`

/**
 * Simplified fragment for selective introspection query
 * Fetches type name, field names, field types, and field arguments
 * This keeps the query lightweight and avoids GitLab complexity limits
 */
const selectiveIntrospectionFragment = `
  fragment SelectiveType on __Type {
    name
    kind
    fields(includeDeprecated: false) {
      name
      args {
        name
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
        defaultValue
      }
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
    }
  }
`

/**
 * Number of types to fetch per batch request
 * Balances between number of HTTP requests and query complexity
 * Default is 100, but GitLab requires smaller batches (5) due to query complexity limits
 */
export const DEFAULT_BATCH_SIZE = 100
export const GITLAB_BATCH_SIZE = 5

export function getBatchSize(backendType: GraphQLBackendType): number {
  return backendType === 'gitlab' ? GITLAB_BATCH_SIZE : DEFAULT_BATCH_SIZE
}

/**
 * Build a selective introspection query for a batch of types
 * Uses __type(name: "...") for each type
 * @param typeNames - Array of type names to fetch
 * @returns GraphQL query string
 */
export function buildBatchTypeQuery(typeNames: string[]): string {
  const typeQueries = typeNames
    .map(name => {
      const alias = `type_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`
      return `  ${alias}: __type(name: "${name}") { ...SelectiveType }`
    })
    .join('\n')

  return `
    query BatchTypeIntrospection {
${typeQueries}
    }
    ${selectiveIntrospectionFragment}
  `
}

/**
 * Result type for lightweight type query
 */
export interface LightweightType {
  name: string
  kind: 'SCALAR' | 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'INPUT_OBJECT' | 'LIST' | 'NON_NULL'
}

/**
 * Result type for fetchTypeNames method
 */
export interface LightweightTypesResult {
  types: LightweightType[]
  queryTypeName: string
}

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
  hidden?: boolean
  /**
   * Backend type for this datasource (gitlab, wordpress, generic)
   * Determines default type selection behavior
   */
  backendType?: GraphQLBackendType
  /**
   * List of disabled type names for this datasource
   * Types in this list will be filtered out during introspection
   * If undefined or empty, all types are enabled
   * Using disabledTypes (instead of enabledTypes) ensures new types added to the schema are visible by default
   */
  disabledTypes?: string[]
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
 * Simple JS object that implements IDataSource interface
 */
export default class GraphQL implements IDataSource {
  id: string
  label: string
  url: string
  type = 'graphql' as const
  method: 'GET' | 'POST' = 'POST'
  headers: Record<string, string> = {}
  queryable?: TypeId[]
  readonly?: boolean
  hidden?: boolean
  backendType: GraphQLBackendType = 'generic'
  disabledTypes?: string[]

  protected types: Type[] = []
  protected queryables: Field[] = []
  protected queryType: string = ''
  protected ready = false
  private eventListeners: Record<string, ((...args: unknown[]) => void)[]> = {}

  constructor(options: GraphQLOptions) {
    this.id = options.id.toString()
    this.label = options.label
    this.url = options.url
    this.type = options.type
    this.method = options.method || 'POST'
    this.headers = options.headers || {}
    this.queryable = options.queryable
    this.readonly = options.readonly
    this.hidden = options.hidden
    this.backendType = options.backendType || 'generic'
    this.disabledTypes = options.disabledTypes
  }

  // Simple event handling
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (!this.eventListeners[event]) return
    if (callback) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback)
    } else {
      this.eventListeners[event] = []
    }
  }

  trigger(event: string, ...args: unknown[]): void {
    if (!this.eventListeners[event]) return
    this.eventListeners[event].forEach(callback => callback(...args))
  }

  /**
   * Fetch only type names and kinds from the GraphQL endpoint
   * This is a lightweight query used during datasource creation
   * Returns an object with types array and queryTypeName
   */
  async fetchTypeNames(): Promise<LightweightTypesResult> {
    try {
      const result = await this.call(lightweightTypeNamesQuery) as {data: {__schema: {queryType: {name: string}, types: LightweightType[]}}}
      if (!result.data?.__schema?.types) {
        throw new Error(`Invalid response: ${JSON.stringify(result)}`)
      }
      const queryTypeName = result.data.__schema.queryType?.name || 'Query'
      const types = result.data.__schema.types
        // Filter out introspection types (starting with __)
        .filter((type: LightweightType) => !type.name.startsWith('__'))
      return { types, queryTypeName }
    } catch (e) {
      console.error('[GraphQL] Failed to fetch type names:', (e as Error).message)
      throw new Error(`Failed to fetch type names: ${(e as Error).message}`)
    }
  }

  /**
   * Get default enabled types based on backend type
   * @param backendType - The backend type (gitlab, wordpress, generic)
   * @param allTypes - Array of all available types from the schema with their kinds
   * @param queryTypeName - The name of the query type from the schema (e.g., 'Query', 'RootQuery')
   * @returns Array of type names that should be enabled by default
   */
  static getDefaultEnabledTypes(backendType: GraphQLBackendType, allTypes: LightweightType[], queryTypeName: string = 'Query'): string[] {
    // Get all type names for filtering
    const allTypeNames = allTypes.map(t => t.name)

    // Automatically detect all SCALAR types from the schema
    // This includes String, Boolean, Int, Float, ID, and any custom scalars like DateTime, JSON, etc.
    const scalarTypeNames = allTypes
      .filter(t => t.kind === 'SCALAR')
      .map(t => t.name)

    switch (backendType) {
    case 'gitlab': {
      // GitLab: Essential types + connections for listing
      const gitlabCoreTypes = [
        'Project',
        'Namespace',
        'User',
        'Group',
        'Repository',
        'Commit',
        'Branch',
        'MergeRequest',
        'Issue',
        'Pipeline',
        'Job',
        'Release',
        'Milestone',
        'Label',
        'Note',
        'Discussion',
        'Snippet',
        'Board',
        'Epic',
        'Vulnerability',
        'Package',
        'ContainerRepository',
        'Environment',
        'Deployment',
        'CiRunner',
        'Topic',
        'PageInfo',
      ]
      const gitlabDefaults = [
        ...scalarTypeNames,
        queryTypeName,
        ...gitlabCoreTypes,
        // Include connection types for pagination (e.g., GroupConnection, ProjectConnection)
        ...allTypeNames.filter(name => {
          // Exclude input/enum types
          if (name.endsWith('Input') || name.endsWith('Enum')) return false
          // Include connections and edges for core types
          return (
            name.endsWith('Connection') ||
              name.endsWith('Edge') ||
              // Include core type variations
              gitlabCoreTypes.some(core => name.startsWith(core))
          )
        }),
      ]
      return allTypeNames.filter(name => gitlabDefaults.includes(name))
    }

    case 'wordpress': {
      // WordPress/WPGraphQL: Blacklist approach for headless CMS
      // All types are enabled by default, except those explicitly blacklisted
      // This ensures CPTs (like ACF custom post types) are included automatically

      // Get all INPUT_OBJECT types (used for mutations, not queries)
      const inputTypes = allTypes
        .filter(t => t.kind === 'INPUT_OBJECT')
        .map(t => t.name)

      // Types to blacklist (not useful for static site generation)
      const blacklistedTypes = [
        // Mutation root
        'RootMutation',

        // Settings (admin only)
        'Settings',
        'DiscussionSettings',
        'GeneralSettings',
        'ReadingSettings',
        'WritingSettings',

        // Admin-only types
        'Plugin',
        'Theme',
        'UserRole',
        'Avatar',

        // Content templates (WP internal, not CPTs)
        'ContentTemplate',
        'DefaultTemplate',
      ]

      // Patterns to blacklist
      const blacklistPatterns = [
        // All mutation inputs and payloads
        /^Create.+Input$/,
        /^Update.+Input$/,
        /^Delete.+Input$/,
        /^Register.+Input$/,
        /^Reset.+Input$/,
        /^Restore.+Input$/,
        /^Send.+Input$/,
        /Payload$/,

        // Admin connections
        /^RootQueryToPlugin/,
        /^RootQueryToTheme/,
        /^RootQueryToUserRole/,

        // Plugin/Theme/UserRole related
        /Plugin(?:Connection|Edge|PageInfo|Status)/,
        /Theme(?:Connection|Edge|PageInfo)/,
        /UserRole(?:Connection|Edge|PageInfo)/,

        // Enqueued assets (internal WP)
        /Enqueued/,
        /Script(?!$)/,  // Exclude Script-related but not if it's just "Script"
        /Stylesheet/,

        // Revisions (internal WP)
        /Revision/,

        // Comments (usually not needed for static sites)
        /Comment/,
        /Commenter/,

        // Post formats (rarely used)
        /PostFormat/,

        // Generic content types (not needed if querying specific collections)
        /^ContentNode/,
        /^RootQueryToContentNode/,
      ]

      const isBlacklisted = (name: string): boolean => {
        // Blacklist all INPUT_OBJECT types (mutation inputs)
        if (inputTypes.includes(name)) return true

        // Blacklist explicitly named types
        if (blacklistedTypes.includes(name)) return true

        // Blacklist by pattern
        return blacklistPatterns.some(pattern => pattern.test(name))
      }

      // Return all types except blacklisted ones
      return allTypeNames.filter(name => !isBlacklisted(name))
    }

    case 'strapi': {
      // Strapi v4/v5 GraphQL: Blacklist approach for headless CMS
      // Strapi generates types for content types, media, and internal admin types

      // Get all INPUT_OBJECT types (used for mutations, not queries)
      const inputTypes = allTypes
        .filter(t => t.kind === 'INPUT_OBJECT')
        .map(t => t.name)

      // Types to blacklist (not useful for static site generation)
      const blacklistedTypes = [
        // Mutation root
        'Mutation',

        // Generic internal type
        'GenericMorph',
      ]

      // Patterns to blacklist
      const blacklistPatterns = [
        // Mutation payloads
        /Payload$/,

        // Users & Permissions plugin (admin)
        /^UsersPermissions/,

        // Upload folder management (admin)
        /^UploadFolder/,

        // i18n internal types
        /^I18N/,

        // Entity wrappers (Strapi v4 internal)
        /EntityResponse$/,
        /EntityResponseCollection$/,

        // Content type metadata (admin)
        /^ContentType/,

        // Admin panel types
        /^Admin/,
      ]

      const isBlacklisted = (name: string): boolean => {
        // Blacklist all INPUT_OBJECT types (mutation inputs)
        if (inputTypes.includes(name)) return true

        // Blacklist explicitly named types
        if (blacklistedTypes.includes(name)) return true

        // Blacklist by pattern
        return blacklistPatterns.some(pattern => pattern.test(name))
      }

      // Return all types except blacklisted ones
      return allTypeNames.filter(name => !isBlacklisted(name))
    }

    case 'supabase': {
      // Supabase (pg_graphql): Blacklist approach
      // pg_graphql generates types from PostgreSQL tables

      // Get all INPUT_OBJECT types (used for mutations, not queries)
      const inputTypes = allTypes
        .filter(t => t.kind === 'INPUT_OBJECT')
        .map(t => t.name)

      // Types to blacklist (not useful for static site generation)
      const blacklistedTypes = [
        // Mutation root
        'Mutation',

        // Cursor type (internal pagination)
        'Cursor',
      ]

      // Patterns to blacklist
      const blacklistPatterns = [
        // Mutation-related types
        /InsertInput$/,
        /UpdateInput$/,
        /DeleteInput$/,
        /InsertResponse$/,
        /UpdateResponse$/,
        /DeleteResponse$/,

        // Ordering types (query params, not data)
        /OrderBy$/,
        /OrderByDirection$/,

        // Filter types (query params, not data)
        /Filter$/,
        /FilterInput$/,

        // Edge types (keep Connection but not Edge for simpler queries)
        /Edge$/,
      ]

      const isBlacklisted = (name: string): boolean => {
        // Blacklist all INPUT_OBJECT types (mutation inputs)
        if (inputTypes.includes(name)) return true

        // Blacklist explicitly named types
        if (blacklistedTypes.includes(name)) return true

        // Blacklist by pattern
        return blacklistPatterns.some(pattern => pattern.test(name))
      }

      // Return all types except blacklisted ones
      return allTypeNames.filter(name => !isBlacklisted(name))
    }

    case 'generic':
    default:
      // Generic: All types checked by default
      return [...allTypeNames]
    }
  }

  /**
   * @throws Error
   */
  protected triggerError<T>(message: string): T {
    console.error('GraphQL error:', message)
    this.trigger(DATA_SOURCE_ERROR, message, this)
    throw new Error(message)
  }
  protected async loadData(): Promise<[Type[], Field[], string]> {
    try {
      let schemaTypes: GQLType[]
      let queryTypeName: string

      // If disabledTypes is set, compute enabled types and use selective introspection
      if (this.disabledTypes && this.disabledTypes.length > 0) {
        // Fetch all type names (lightweight query)
        const lightweightResult = await this.call(lightweightTypeNamesQuery) as {data: {__schema: {queryType: {name: string}, types: LightweightType[]}}}
        if (!lightweightResult.data?.__schema?.types) {
          return this.triggerError(`Invalid lightweight response: ${JSON.stringify(lightweightResult)}`)
        }

        const allTypeNames = lightweightResult.data.__schema.types
          .map(t => t.name)
          .filter(name => !name.startsWith('__'))

        // Get the queryType name from the lightweight query
        const lightweightQueryTypeName = lightweightResult.data.__schema.queryType?.name || 'Query'

        // Compute enabled types by excluding disabled ones (blacklist logic)
        // Always include queryType and SCALAR types - they cannot be blacklisted
        const scalarTypeNames = lightweightResult.data.__schema.types
          .filter(t => t.kind === 'SCALAR' && !t.name.startsWith('__'))
          .map(t => t.name)

        const enabledTypeNames = allTypeNames.filter(name => !this.disabledTypes!.includes(name))

        // Ensure queryType is always included (e.g., Query, RootQuery, etc.)
        if (!enabledTypeNames.includes(lightweightQueryTypeName) && allTypeNames.includes(lightweightQueryTypeName)) {
          enabledTypeNames.push(lightweightQueryTypeName)
        }

        // Ensure all SCALAR types are always included
        for (const scalarName of scalarTypeNames) {
          if (!enabledTypeNames.includes(scalarName)) {
            enabledTypeNames.push(scalarName)
          }
        }

        // Split types into batches (smaller batches for GitLab due to query complexity limits)
        const batchSize = getBatchSize(this.backendType)
        const batches: string[][] = []
        for (let i = 0; i < enabledTypeNames.length; i += batchSize) {
          batches.push(enabledTypeNames.slice(i, i + batchSize))
        }

        // Fetch batches in parallel
        const batchResults = await Promise.all(
          batches.map(async (batch) => {
            try {
              const query = buildBatchTypeQuery(batch)
              const result = await this.call(query) as {data: {[key: string]: GQLType | null}}
              // Extract types from aliased responses
              const types: GQLType[] = []
              for (const [key, value] of Object.entries(result.data || {})) {
                if (key.startsWith('type_') && value !== null) {
                  types.push(value)
                }
              }
              return types
            } catch (e) {
              console.warn('[GraphQL] Failed to fetch batch:', (e as Error).message)
              return []
            }
          })
        )

        // Flatten batch results
        schemaTypes = batchResults.flat()
        queryTypeName = lightweightQueryTypeName
      } else {
        // No blacklist - use full introspection query
        const result = await this.call(graphqlIntrospectionQuery) as {data: {__schema: {types: GQLType[], queryType: {name: string}}}}
        if (!result.data?.__schema?.types) {
          return this.triggerError(`Invalid response: ${JSON.stringify(result)}`)
        }
        schemaTypes = result.data.__schema.types
        queryTypeName = result.data.__schema.queryType?.name
      }

      if (!queryTypeName) {
        return this.triggerError('Invalid response, queryType not found')
      }

      const allTypes = schemaTypes.map((type: GQLType) => type.name)
        .concat(builtinTypeIds)

      const query: GQLType | undefined = schemaTypes.find((type: GQLType) => type.name === queryTypeName)
      if (!query) {
        return this.triggerError(`Query type "${queryTypeName}" not found in schema. Make sure to enable it.`)
      }

      // Get non-queryable types
      const nonQueryables = schemaTypes
        // Filter out introspection types
        .filter((type: GQLType) => !type.name.startsWith('__'))
        // Filter out types that are in Query (the queryables are handled separately)
        .filter((type: GQLType) => !query?.fields?.find((field: GQLField) => field.name === type.name))
        // Map to Type
        .map((type: GQLType) => this.graphQLToType(allTypes, type, 'SCALAR', false))
        // Add builtin types
        .concat(builtinTypes)

      // Get queryable types
      const queryableTypes = (query.fields || [])
        // Map to GQLType, keeping kind for later
        .map((field: GQLField) => ({
          type: {
            ...schemaTypes.find((type: GQLType) => type.name === this.getOfTypeProp<string>('name', field.type, field.name)),
            name: field.name,
          } as GQLType,
          kind: this.ofKindToKind(field.type),
        }))
        // Filter out types that were excluded
        .filter(({type}) => type.fields !== undefined)
        // Map to Type
        .map(({type, kind}) => this.graphQLToType(allTypes, type, kind, true))

      // Get all queryables as fields
      const queryableFields = (query.fields || [])
        // Filter out fields whose types were not fetched
        .filter((field: GQLField) => {
          const typeName = this.getOfTypeProp<string>('name', field.type, field.name)
          // Include if the type exists in schemaTypes or is a builtin type
          return schemaTypes.some(t => t.name === typeName) || builtinTypeIds.includes(typeName)
        })
        // Map to Field
        .map((field: GQLField) => this.graphQLToField(field))

      // Return all types, queryables and non-queryables
      return [queryableTypes.concat(nonQueryables), queryableFields, queryTypeName]
    } catch (e) {
      return this.triggerError(`GraphQL introspection failed: ${(e as Error).message}`)
    }
  }
  protected graphQLToField(field: GQLField): Field {
    const kind = this.ofKindToKind(field.type)
    return {
      id: field.name,
      dataSourceId: this.id,
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
    const queryableOverride = this.queryable
    const result = {
      id: type.name,
      dataSourceId: this.id,
      label: type.name,
      fields: type.fields
        // Do not include fields whose type is not in the schema (blacklisted types)
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
      if(types.length === 0) return this.triggerError('No types found in GraphQL schema')
      if(fields.length === 0) return this.triggerError('No fields found in GraphQL schema')
      if(!queryType) return this.triggerError('No query type found in GraphQL schema')
      this.types = types
      this.queryables = fields
      this.queryType = queryType
      if (this.ready) {
        this.trigger(DATA_SOURCE_CHANGED, this)
      } else {
        this.ready = true
        this.trigger(DATA_SOURCE_READY, this)
      }
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
    if (!this.ready) {
      console.error('DataSource is not ready. Attempted to get types before ready status was achieved.')
      throw new Error('DataSource is not ready. Ensure it is connected and ready before querying.')
    }

    if (this.types.length === 0) {
      console.error('No types available. It seems the data source may not be connected or the schema is incomplete.', this.ready)
      throw new Error('No types found. The data source may not be connected or there might be an issue with the schema.')
    }
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
    // Retrieve the URL for the GraphQL endpoint
    const url = this.url
    if (!url) return this.triggerError('Missing GraphQL URL') // Ensure the URL is provided

    // Retrieve the headers for the GraphQL request
    const headers = this.headers
    if (!headers) return this.triggerError('Missing GraphQL headers') // Ensure headers are provided

    // Ensure the Content-Type header is set to 'application/json', normalizing the case
    const key = Object.keys(headers).find(name => name.toLowerCase() === 'content-type')
    headers[key || 'Content-Type'] = headers[key || 'Content-Type'] || 'application/json'

    // Retrieve the HTTP method (defaulting to 'POST' for GraphQL queries)
    const method = this.method ?? 'POST'

    // Make the HTTP request to the GraphQL endpoint
    const response = await fetch(url, {
      method,
      headers,
      // Include a body only for POST requests
      ...(method === 'POST' ? {
        body: JSON.stringify({ query }),
      } : {}),
    })

    // Handle non-OK responses with detailed error logging
    if (!response?.ok) {
      console.error('GraphQL call failed', response?.status, response?.statusText, query)
      return this.triggerError(`GraphQL call failed with \`${response?.statusText}\` and status ${response?.status}`)
    }

    // Return the parsed JSON response
    return response.json()
  }

  /**
   * Build a GraphQL query from a tree
   */
  getQuery(children: Tree[]): string {
    return this.getQueryRecursive({
      // Add the main query object which is the root of the tree
      token: {
        dataSourceId: this.id,
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

  async fetchValues(query: string): Promise<unknown[]> {
    const result = await this.call(query) as { data: unknown[] }
    return result.data
  }
}
