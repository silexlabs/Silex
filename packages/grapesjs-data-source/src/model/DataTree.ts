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

import { Component, Page, Editor } from 'grapesjs'
import { ComponentExpression, DATA_SOURCE_CHANGED, DATA_SOURCE_READY, DataSourceId, Expression, Field, Filter, IDataSource, Property, State, StoredToken, Tree, Type, TypeId } from '../types'
import { getState, getParentByPersistentId, getStates, getPersistantId } from './state'
import { fromStored, getOptionObject } from './token'
import { FIXED_TOKEN_ID, getComponentDebug, NOTIFICATION_GROUP, toExpression } from '../utils'

/**
 * Options of the data tree
 * They can be set on the instance too
 */
export interface DataTreeOptions {
  filters: Partial<Filter>[] | string
  dataSources: IDataSource[]
}

export const STANDARD_TYPES: Type[] = [
  {
    id: 'string',
    label: 'String',
    fields: [],
  },
  {
    id: 'number',
    label: 'Number',
    fields: [],
  },
  {
    id: 'boolean',
    label: 'Boolean',
    fields: [],
  },
  {
    id: 'date',
    label: 'Date',
    fields: [],
  },
  {
    id: 'unknown',
    label: 'Unknown',
    fields: [],
  },
]

///**
// * TODO
// * Error thrown when a query cannot be built
// */
//export interface BuildQueryErrorOptions {
//  expression: Expression
//  component: Component
//  token: Token
//}
//export class BuildQueryError extends Error {
//  public expression: Expression
//  public component: Component
//  public token: Token
//
//  constructor(message: string, options: BuildQueryErrorOptions) {
//    super(message)
//    this.expression = options.expression
//    this.component = options.component
//    this.token = options.token
//  }
//}

export class DataTree {
  public dataSources: IDataSource[] = []
  // Preview data returned by all APIs (for canvas preview only)
  private _previewData: Record<DataSourceId, unknown> = {}
  public filters: Filter[] = []

  // Add getter/setter with logging to track when previewData is modified
  get previewData(): Record<DataSourceId, unknown> {
    return this._previewData
  }

  set previewData(value: Record<DataSourceId, unknown>) {
    // console.log('🔧 DataTree.previewData SET:', {
    //   old: Object.keys(this._previewData),
    //   new: Object.keys(value || {}),
    //   stack: new Error().stack?.split('\n')[1]?.trim()
    // })
    this._previewData = value
  }

  /**
   * All types from all data sources
   * Read only, updated when data sources are updated
   */
  protected _allTypes: Type[] = []
  public get allTypes(): Type[] {
    return this._allTypes
  }

  /**
   * All queryable fields from all data sources
   */
  protected _queryables: Field[] = []
  public get queryables(): Field[] {
    return this._queryables
  }

  constructor(protected editor: Editor, protected options: {dataSources: IDataSource[], filters: Filter[]}) {
    this.dataSources = options.dataSources
    this.filters = options.filters

    // Check that all filters have required fields
    this.filters.forEach((filter: Filter) => {
      if(!filter.id) throw new Error('Filter id is required')
      if(!filter.label) throw new Error('Filter name is required')
      if(!filter.validate) throw new Error('Filter validate is required')
      if(!filter.output) throw new Error('Filter outputType is required')
      if(!filter.apply) throw new Error('Filter apply is required')
    })
    editor.on(`${DATA_SOURCE_CHANGED} ${DATA_SOURCE_READY}`, () => {
      this._allTypes = this.getAllTypes()
      this._queryables = this.getAllQueryables()
    })
  }

  /**
   * Get type from typeId and dataSourceId
   */
  getTypes(dataSourceId?: DataSourceId): Type[] {
    // Get the data source
    const ds = this.dataSources
      .find((dataSource: IDataSource) => dataSource.id === dataSourceId)
    if(!ds) throw new Error(`Data source not found ${dataSourceId}`)
    if(!ds.isConnected()) throw new Error(`Data source ${dataSourceId} is not ready (not connected)`)
    return ds.getTypes()
  }

  /**
   * Get type from typeId and dataSourceId
   * @throws Error if type is not found
   * @param componentId is used for error messages
   */
  getType(typeId: TypeId, dataSourceId: DataSourceId | null, componentId: string | null): Type {
    if(dataSourceId) {
      // Get the data source
      const dataSource = this.dataSources
        .find((dataSource: IDataSource) => !dataSourceId || dataSource.id === dataSourceId)
      if(!dataSource) throw new Error(`Data source not found ${dataSourceId}`)
      // Get its types
      const types = dataSource?.getTypes()
      // Return the requested type
      const type = types.find((type: Type) => type.id === typeId)
      if (!type) {
        this.editor.runCommand('notifications:add', {
          type: 'error',
          group: NOTIFICATION_GROUP,
          message: `Type not found ${dataSourceId ?? ''}.${typeId}`,
          componentId,
        })
        throw new Error(`Type not found ${dataSourceId ?? ''}.${typeId}`)
      }
      return type
    } else {
      // No data source id: search in standard types
      const standardType = STANDARD_TYPES.find(type => type.id === typeId.toLowerCase())
      if(standardType) return standardType
      // No data source id: search in all types
      const type = this.allTypes.find(type => type.id === typeId)
      if (!type) throw new Error(`Unknown type ${typeId}`)
      return type
    }
  }

  /**
   * Get all types from all data sources
   */
  getAllTypes(): Type[] {
    return this.dataSources
      .filter((dataSource: IDataSource) => dataSource.isConnected())
      .flatMap((dataSource: IDataSource) => {
        return dataSource.getTypes()
      })
  }

  /**
   * Get all queryable fields from all data sources
   */
  getAllQueryables(): Field[] {
    return this.dataSources
      .filter((dataSource: IDataSource) => dataSource.isConnected())
      .flatMap((dataSource: IDataSource) => {
        return dataSource.getQueryables()
      })
  }

  /**
   * Evaluate an expression to a value
  */
  getValue(
    expression: Expression,
    component: Component,
    resolvePreviewIndex = true, // False only for loop
    prevValues: unknown = null,
  ): unknown {
    if (expression.length === 0) {
      return prevValues
    }

    // Always create defensive copies of tokens to prevent mutations from affecting original data
    // When resolvePreviewIndex is false (for loop data), also clear any existing preview indices
    const cleanExpression = expression.map(token => {
      return { ...token }
    })
    const [token, ...rest] = cleanExpression

    switch (token.type) {
    case 'state': {
      const state = token as State
      const resolvedExpression = this.resolveState(state, component)
      if (!resolvedExpression) {
        throw new Error(`Unable to resolve state: ${JSON.stringify(state)}`)
      }

      // Special handling for items state - always wrap result in array when resolvePreviewIndex is true
      const previewIndex = resolvedExpression[resolvedExpression.length - 1].previewIndex
      if (state.storedStateId === 'items' && typeof previewIndex !== 'undefined') {
        // @ts-expect-error - Adding runtime property for items state handling
        resolvedExpression[0].isItems = true
      }
      return this.getValue(resolvedExpression.concat(...rest), component, resolvePreviewIndex, prevValues)
    }

    case 'property': {
      // Handle the case of a "fixed" property (hard coded string set by the user)
      if (token.fieldId === FIXED_TOKEN_ID) {
        return this.getValue(rest, component, resolvePreviewIndex, token.options?.value)
      }

      // Handle the case where the property refers to the first level of the data source
      // Or it can be a key in the previewly computed data
      let prevObj
      if (typeof prevValues === 'undefined' || prevValues === null) {
        if (!token.dataSourceId) {
          throw new Error(`Data source ID is missing for token: ${JSON.stringify(token)}`)
        }
        prevObj = this.previewData[token.dataSourceId]
      } else {
        prevObj = prevValues
      }

      // Now get the next value
      let value = prevObj ? (prevObj as Record<string, unknown>)[token.fieldId] : null

      // Always handle preview index if resolvePreviewIndex is true
      if (resolvePreviewIndex) {
        value = this.handlePreviewIndex(value, token)
      }

      // For non-final tokens, always handle preview index regardless of resolvePreviewIndex
      if (rest.length > 0 && !resolvePreviewIndex) {
        value = this.handlePreviewIndex(value, token)
      }
      // @ts-expect-error - Runtime property check for items handling
      if (token.isItems && typeof token.previewIndex !== 'undefined') {
        if(rest.length > 0) {
          value = [value]
        }
      }
      return this.getValue(rest, component, resolvePreviewIndex, value)
    }
    case 'filter': {
      const options = Object.entries(token.options).reduce((acc, [key, value]) => {
        acc[key] = this.getValue(toExpression(value) || [], component, resolvePreviewIndex, null)
        return acc
      }, {} as Record<string, unknown>)

      const filter = this.filters.find(f => f.id === token.id)
      if (!filter) {
        throw new Error(`Filter not found: ${token.id}`)
      }

      let value
      try {
        // value = filter.apply([prevValues], options)
        value = filter.apply(prevValues, options)
      } catch(e) {
        console.warn(`Filter "${filter.id}" error:`, e, {
          filter: filter.id,
          prevValues,
          options,
          valueType: typeof prevValues,
          isArray: Array.isArray(prevValues),
          isNull: prevValues === null
        })
        // Mimic behavior of liquid - return the input value unchanged
        return null
        // return this.getValue(rest, component, resolvePreviewIndex, prevValues)
      }

      // Always handle preview index if resolvePreviewIndex is true, or if there are more tokens
      if (resolvePreviewIndex || rest.length > 0) {
        value = this.handlePreviewIndex(value, token)
      }

      return this.getValue(rest, component, resolvePreviewIndex, value)
    }

    default:
      throw new Error(`Unsupported token type: ${token}`)
    }
  }

  /**
   * Handle preview index for a given value and token
   */
  handlePreviewIndex(value: unknown, token: StoredToken): unknown {
    if (typeof token.previewIndex === 'undefined') {
      return value
    }

    if(Array.isArray(value)) {
      const result = value[token.previewIndex]
      return result
    }
    return value
  }

  /**
   * Get all expressions used in all pages
   */
  getAllPagesExpressions(): { page: Page, expressions: ComponentExpression[] }[] {
    return this.editor.Pages.getAll()
      .map((page: Page) => ({
        page,
        expressions: this.getPageExpressions(page),
      }))
  }

  /**
   * Get all expressions used in a page
   * This will be used to fetch data for the page
   */
  getPageExpressions(page: Page): ComponentExpression[] {
    return this.getComponentExpressionsRecursive(page.getMainComponent())
  }

  /**
   * Get all expressions used by a component and its children
   */
  getComponentExpressionsRecursive(component: Component): ComponentExpression[] {
    const queries = [] as ComponentExpression[]
    queries.push(...this.getComponentExpressions(component))
    component.components()
      .forEach((child: Component) => {
        queries.push(...this.getComponentExpressionsRecursive(child))
      })
    return queries
  }

  /**
   * Get all expressions used by a component
   */
  getComponentExpressions(component: Component): ComponentExpression[] {
    const publicStates = getStates(component, true)
    const privateStates = getStates(component, false)

    return ([] as ComponentExpression[])
      // Visible states (custom / user defined)
      .concat(
        // For each state
        publicStates
          // Add the component
          .map(({expression}) => ({expression, component}))
      )
      // Hidden states (loop / internals)
      .concat(
        // For each state
        privateStates
          // Add the component
          .map(({expression}) => ({expression, component}))
      )
  }

  /**
   * Build a tree of expressions
   */
  getTrees({expression, component}: ComponentExpression, dataSourceId: DataSourceId): Tree[] {
    if(expression.length === 0) return []
    const next = expression[0]
    switch(next.type) {
    case 'property': {
      if(next.dataSourceId !== dataSourceId) return []
      const trees = this.getTrees({expression: expression.slice(1), component}, dataSourceId)
      if(trees.length === 0) return [{
        token: next,
        children: [],
      }]
      return trees
        .flatMap(tree => {
          // Check if this is a "relative" property or "absolute" (a root type)
          if(this.isRelative(next, tree.token, dataSourceId)) {
            return {
              token: next,
              children: [tree],
            }
          } else {
            return [{
              token: next,
              children: [],
            }, tree]
          }
        })
    }
    case 'filter': {
      const options = Object.values(next.options)
        .map((value: unknown) => toExpression(value))
        .filter((exp: Expression | null) => !!exp && exp.length > 0)
        .flatMap(exp => this.getTrees({expression: exp!, component}, dataSourceId))

      const trees = this.getTrees({expression: expression.slice(1), component}, dataSourceId)
      if(trees.length === 0) return options
      return trees.flatMap(tree => [tree, ...options])
    }
    case 'state': {
      const resolved = this.resolveState(next, component)
      if(!resolved) {
        this.editor.runCommand('notifications:add', {
          type: 'error',
          group: NOTIFICATION_GROUP,
          message: `Unable to resolve state <pre>${JSON.stringify(next)}</pre>`,
          componentId: component.getId(),
        })
        throw new Error(`Unable to resolve state ${JSON.stringify(next)}. State defined on component ${getComponentDebug(component)}`)
      }
      return this.getTrees({expression: resolved, component}, dataSourceId)
    }
    default:
      this.editor.runCommand('notifications:add', {
        type: 'error',
        group: NOTIFICATION_GROUP,
        message: `Invalid expression <pre>${JSON.stringify(expression)}</pre>`,
        componentId: component.getId(),
      })
      throw new Error(`Invalid expression ${JSON.stringify(expression)}. Expression used on component ${getComponentDebug(component)}`)
    }
  }

  /**
   * Check if a property is relative to a type
   * A type is "relative" if parent has a type which has a field of type tree.token
   * FIXME: need a better way to check if a property is relative, e.g. have a "relative" flag on the property, set depending on <state-editor root-type
   */
  isRelative(parent: Property, child: Property, dataSourceId: DataSourceId): boolean {
    const parentTypes = this.getTypes(dataSourceId).filter(t => parent.typeIds.includes(t.id))
    const parentFieldsTypes = parentTypes.flatMap(t => t.fields.map(f => f.typeIds).flat())
    return parentFieldsTypes.length > 0 && child.typeIds.some(typeId => parentFieldsTypes.includes(typeId))
  }

  /**
   * From expressions to a tree
   */
  toTrees(expressions: ComponentExpression[], dataSourceId: DataSourceId): Tree[] {
    if(expressions.length === 0) return []
    return expressions
      // From Expression to Tree
      .flatMap(expression => this.getTrees(expression, dataSourceId))
      // Group by root token
      .reduce((acc: Tree[][], tree: Tree) => {
        const existing = acc.find(t => t[0].token.fieldId === tree.token.fieldId && (!tree.token.dataSourceId || t[0].token.dataSourceId === tree.token.dataSourceId))
        if(existing) {
          existing.push(tree)
        } else {
          acc.push([tree])
        }
        return acc
      }, [] as Tree[][])
      // Merge all trees from the root
      .map((grouped: Tree[]) => {
        try {
          const merged = grouped.reduce((acc, tree) => this.mergeTrees(acc, tree))
          return merged
        } catch(e) {
          this.editor.runCommand('notifications:add', {
            type: 'error',
            group: NOTIFICATION_GROUP,
            message: `Unable to merge trees <pre>${JSON.stringify(grouped)}</pre>`,
            componentId: expressions[0].component.getId(),
          })
          throw e
        }
      })
  }

  /**
   * Recursively merge two trees
   */
  protected mergeTrees(tree1: Tree, tree2: Tree): Tree {
    // Check if the trees have the same fieldId
    if (tree1.token.dataSourceId !== tree2.token.dataSourceId
    // Don't check for kind because it can be different for the same fieldId
    // For example `blog` collection (kind: list) for a loop/repeat
    //   and `blog` item (kind: object) from inside the loop
    // FIXME: why is this?
    // || tree1.token.kind !== tree2.token.kind
    ) {
      console.error('Unable to merge trees', tree1, tree2)
      throw new Error(`Unable to build GraphQL query: unable to merge trees ${JSON.stringify(tree1)} and ${JSON.stringify(tree2)}`)
    }

    // Check if there are children with the same fieldId but different options
    // FIXME: we should use graphql aliases: https://graphql.org/learn/queries/#aliases but then it changes the variable name in the result
    const errors = tree1.children
      .filter(child1 => tree2.children.find(child2 =>
        child1.token.fieldId === child2.token.fieldId
        && getOptionObject(child1.token.options, child2.token.options).error
      ))
      .map(child1 => {
        const child2 = tree2.children.find(child2 => child1.token.fieldId === child2.token.fieldId)
        return `${child1.token.fieldId} appears twice with different options: ${JSON.stringify(child1.token.options)} vs ${JSON.stringify(child2?.token.options)}`
      })

    if(errors.length > 0) {
      console.error('Unable to merge trees', errors)
      throw new Error(`Unable to build GraphQL query: unable to merge trees: \n* ${errors.join('\n* ')}`)
    }

    const different = tree1.children
      .filter(child1 => !tree2.children.find(child2 =>
        child1.token.fieldId === child2.token.fieldId
        && child1.token.typeIds.join(',') === child2.token.typeIds.join(',')
        && !getOptionObject(child1.token.options, child2.token.options).error
      ))
      .concat(tree2.children
        .filter(child2 => !tree1.children.find(child1 =>
          child1.token.fieldId === child2.token.fieldId
          && child1.token.typeIds.join(',') === child2.token.typeIds.join(',')
          && !getOptionObject(child1.token.options, child2.token.options).error
        ))
      )
    const same = tree1.children
      .filter(child1 => tree2.children.find(child2 =>
        child1.token.fieldId === child2.token.fieldId
        && child1.token.typeIds.join(',') === child2.token.typeIds.join(',')
        && !getOptionObject(child1.token.options, child2.token.options).error
      ))

    return {
      token: tree1.token,
      children: different
        .concat(same
          .map(child1 => {
            const child2 = tree2.children.find(child2 => child1.token.fieldId === child2.token.fieldId)
            return this.mergeTrees(child1, child2!)
          })),
    }
  }

  /**
   * Get all expressions used by a component
   * Resolves all states token as expressions recursively
   * Resulting expressions contain properties and filters only, no states anymore
   */
  resolveState(state: State, component: Component): Expression | null {
    const parent = getParentByPersistentId(state.componentId, component)
    if (!parent) {
      console.error('Component not found for state', state, component.get('id-plugin-data-source'), component.parent()?.get('id-plugin-data-source'), getPersistantId(component.parent()!))
      return null
    }
    // Get the expression of the state
    const storedState = getState(parent, state.storedStateId, state.exposed)
    if (!storedState?.expression) {
      console.warn('State is not defined on component', parent.getId(), state, storedState)
      return null
    }
    return storedState.expression
      .flatMap((token: StoredToken) => {
        switch (token.type) {
        case 'state': {
          return this.resolveState(fromStored(token, this, component.getId()), parent) ?? []
        }
        default:
          return token
        }
      })
  }
}
