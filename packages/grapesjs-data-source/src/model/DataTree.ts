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

import { Component, Page } from 'grapesjs'
import { ComponentExpression, DATA_SOURCE_CHANGED, DATA_SOURCE_READY, DataSourceEditor, DataSourceId, Expression, Field, Filter, IDataSource, Property, State, StoredToken, Tree, Type, TypeId } from '../types'
import { getState, getParentByPersistentId, getStates } from './state'
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
  // The data returned by all APIs
  public queryResult: Record<DataSourceId, unknown> = {}
  public filters: Filter[] = []

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

  constructor(protected editor: DataSourceEditor, protected options: {dataSources: IDataSource[], filters: Filter[]}) {
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
    this._allTypes = this.getAllTypes()
    this._queryables = this.getAllQueryables()
  }

  /**
   * Get type from typeId and dataSourceId
   */
  getTypes(dataSourceId?: DataSourceId): Type[] {
    const types = this.dataSources
      // Get the data source
      .find((dataSource: IDataSource) => dataSource.id === dataSourceId)
      // Get its types
      ?.getTypes()
    if(!types) throw new Error(`Data source not found ${dataSourceId}`)
    return types
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
      .flatMap((dataSource: IDataSource) => {
        return dataSource.getTypes()
      })
  }

  /**
   * Get all queryable fields from all data sources
   */
  getAllQueryables(): Field[] {
    return this.dataSources
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
    prevValues: unknown = null,
  ): unknown {
    if (expression.length === 0) {
      return prevValues
    }

    const [token, ...rest] = expression

    switch (token.type) {
    case 'state': {
      const resolvedExpression = this.resolveState(token, component)
      if (!resolvedExpression) {
        throw new Error(`Unable to resolve state: ${JSON.stringify(token)}`)
      }
      return this.getValue(resolvedExpression, component, prevValues)
    }

    case 'property': {
      if (token.fieldId === FIXED_TOKEN_ID) {
        return token.options?.value
      }

      if (!token.dataSourceId) {
        throw new Error(`Data source ID is missing for token: ${JSON.stringify(token)}`)
      }

      const prevObj = prevValues ? prevValues : this.queryResult[token.dataSourceId]
      if (!prevObj) {
        throw new Error(`No query result found for data source ID: ${token.dataSourceId}`)
      }

      let value = null
      if(Array.isArray(prevObj)) {
        value = prevObj.map(item => item[token.fieldId])
        value = value[0] // FIXME: we need some kind of index
      } else {
        value = (prevObj as Record<string, unknown>)[token.fieldId]
      }

      return this.getValue(rest, component, value)
    }
    case 'filter': {
      const options = Object.entries(token.options).reduce((acc, [key, value]) => {
        acc[key] = this.getValue(toExpression(value) || [], component, null)
        return acc
      }, {} as Record<string, unknown>)

      const filter = this.filters.find(f => f.id === token.id)
      if (!filter) {
        throw new Error(`Filter not found: ${token.id}`)
      }

      let result
      try {
        result = filter.apply(prevValues, options)
      } catch(e) {
        console.warn('Error in the filter', filter, 'Error:', e)
        // Mimic behavior of liquid
        return this.getValue(rest, component, prevValues)
      }

      return this.getValue(rest, component, result)
    }

    default:
      console.error('Unsupported token type:', token)
      throw new Error(`Unsupported token type: ${token}`)
    }
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
    return ([] as ComponentExpression[])
      // Visible states (custom / user defined)
      .concat(
        // For each state
        getStates(component, true)
          // Add the component
          .map(({expression}) => ({expression, component}))
      )
      // Hidden states (loop / internals)
      .concat(
        // For each state
        getStates(component, false)
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
      console.warn('Component not found for state', state)
      return null
    }
    // Get the expression of the state
    const storedState = getState(parent, state.storedStateId, state.exposed)
    if (!storedState?.expression) {
      console.warn('State is not defined on component', parent, state)
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
