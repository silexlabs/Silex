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
import { Context, DATA_SOURCE_CHANGED, DATA_SOURCE_READY, DataSourceEditor, DataSourceId, Expression, Field, Filter, IDataSource, Property, State, StoredToken, Token, Tree, Type, TypeId } from '../types'
import { getStateIds, getState, getComponentByPersistentId, getParentByPersistentId } from './state'
import { fromStored, sameOptions } from './token'
import { toExpression } from '../utils'

/**
 * Options of the data tree
 * They can be set on the instance too
 */
export interface DataTreeOptions {
  filters: Partial<Filter>[] | string
  dataSources: IDataSource[]
}

/**
 * Error thrown when a query cannot be built
 */
export interface BuildQueryErrorOptions {
  expression: Expression
  component: Component
  token: Token
}
export class BuildQueryError extends Error {
  public expression: Expression
  public component: Component
  public token: Token

  constructor(message: string, options: BuildQueryErrorOptions) {
    super(message)
    this.expression = options.expression
    this.component = options.component
    this.token = options.token
  }
}

export class DataTree {
  public dataSources: IDataSource[] = []
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
   */
  getType(typeId: TypeId, dataSourceId: DataSourceId | null): Type {
    const type = dataSourceId ?
      // Search in the specified data source
      this.dataSources
        // Get the data source
        .find((dataSource: IDataSource) => !dataSourceId || dataSource.id === dataSourceId)
        // Get its types
        ?.getTypes()
        // Return the requested type
        .find((type: Type) => type.id === typeId)
      // No data source id: search in all types
      : this.allTypes.find(type => type.id === typeId)
    if (!type) throw new Error(`Type not found ${dataSourceId ?? ''}.${typeId}`)
    return type
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getValue(context: Context, expression: Expression): unknown {
    throw new Error('Not implemented')
  }

  /**
   * Get all expressions used in all pages
   */
  getAllPagesExpressions(): { page: Page, expressions: Expression[] }[] {
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
  getPageExpressions(page: Page): Expression[] {
    return this.getComponentExpressionsRecursive(page.getMainComponent())
  }

  /**
   * Get all expressions used by a component and its children
   */
  getComponentExpressionsRecursive(component: Component): Expression[] {
    const queries = [] as Expression[]
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
  getComponentExpressions(component: Component): Expression[] {
    return ([] as Expression[])
      // Visible states (custom / user defined)
      .concat(getStateIds(component, true).map(stateId => getState(component, stateId, true)?.expression))
      // Hidden states (loop / internals)
      .concat(getStateIds(component, false).map(stateId => getState(component, stateId, false)?.expression))
  }

  /**
   * Build a tree of expressions
   */
  getTrees(expression: Expression, dataSourceId: DataSourceId): Tree[] {
    if(expression.length === 0) return []
    const next = expression[0]
    switch(next.type) {
      case 'property': {
        if(next.dataSourceId !== dataSourceId) return []
        const trees = this.getTrees(expression.slice(1), dataSourceId)
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
          .flatMap(exp => this.getTrees(exp!, dataSourceId))

        const trees = this.getTrees(expression.slice(1), dataSourceId)
        if(trees.length === 0) return options
        return trees.flatMap(tree => [tree, ...options])
      }
      case 'state': {
        const component = getComponentByPersistentId(next.componentId, this.editor)
        if(!component) throw new Error(`Component not found ${next.componentId}`)
        const resolved = this.resolveState(next, component)
        if(!resolved) throw new Error(`Unable to resolve state ${JSON.stringify(next)}`)
        return this.getTrees(resolved, dataSourceId)
      }
      default:
        console.error('Invalid expression', expression)
        throw new Error(`Invalid expression ${JSON.stringify(expression)}`)
    }
  }

  /**
   * Check if a property is relative to a type
   * A type is "relative" if next has a type which has a field of type tree.token
   */
  isRelative(parent: Property, child: Property, dataSourceId: DataSourceId): boolean {
    const parentTypes = this.getTypes(dataSourceId).filter(t => parent.typeIds.includes(t.id))
    const parentFieldsTypes = parentTypes.flatMap(t => t.fields.map(f => f.typeIds).flat())
    return child.typeIds.some(typeId => parentFieldsTypes.includes(typeId))
  }

  /**
   * From expressions to a tree
   */
  toTrees(expressions: Expression[], dataSourceId: DataSourceId): Tree[] {
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
        const merged = grouped.reduce((acc, tree) => this.mergeTrees(acc, tree))
        return merged
      })
  }

  /**
   * Recursively merge two trees
   */
  protected mergeTrees(tree1: Tree, tree2: Tree): Tree {
    // Check if the trees have the same fieldId
    if (tree1.token.kind !== tree2.token.kind || tree1.token.dataSourceId !== tree2.token.dataSourceId) {
      console.error('Unable to merge trees', tree1, tree2)
      throw new Error(`Unable to build GraphQL query: unable to merge trees ${JSON.stringify(tree1)} and ${JSON.stringify(tree2)}`)
    }

    // Check if there are children with the same fieldId but different options
    // FIXME: we should use graphql aliases: https://graphql.org/learn/queries/#aliases but then it changes the variable name in the result
    const errors = tree1.children
      .filter(child1 => tree2.children.find(child2 =>
        child1.token.fieldId === child2.token.fieldId
        && !sameOptions(child1.token.options, child2.token.options)
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
        && sameOptions(child1.token.options, child2.token.options)
      ))
      .concat(tree2.children
        .filter(child2 => !tree1.children.find(child1 =>
          child1.token.fieldId === child2.token.fieldId
          && child1.token.typeIds.join(',') === child2.token.typeIds.join(',')
          && sameOptions(child1.token.options, child2.token.options)
        ))
      )
    const same = tree1.children
      .filter(child1 => tree2.children.find(child2 =>
        child1.token.fieldId === child2.token.fieldId
        && child1.token.typeIds.join(',') === child2.token.typeIds.join(',')
        && sameOptions(child1.token.options, child2.token.options)
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
    const soredState = getState(parent, state.storedStateId, state.exposed)
    if (!soredState?.expression) {
      console.warn('State is not defined on component', parent, state)
      return null
    }
    return soredState.expression
      .flatMap((token: StoredToken) => {
        switch (token.type) {
          case 'state': {
            return this.resolveState(fromStored(token, this), parent) ?? []
          }
          default:
            return token
        }
      })
  }
}
