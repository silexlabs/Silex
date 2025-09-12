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

import { Page } from 'grapesjs'
import { ComponentExpression, DataSourceId, Expression, IDataSource, Property, Tree } from '../types'
import { getStates } from './state'
import { getOptionObject } from './token'
import { getComponentDebug, NOTIFICATION_GROUP, toExpression } from '../utils'
import { resolveStateExpression } from './expressionEvaluator'
import { DataSourceManagerState } from './dataSourceManager'



// Pure functions for data operations



/**
 * Get all expressions used in a page
 */
export function getPageExpressions(manager: DataSourceManagerState, page: Page): ComponentExpression[] {
  const result: ComponentExpression[] = []
  page.getMainComponent().onAll(component => {
    // Get expressions used by the component from states
    const states = getStates(component, true).concat(getStates(component, false))
    states.forEach(state => {
      if(state.expression) {
        result.push({
          expression: state.expression,
          component,
        })
      }
    })
    // Get expressions used by the component from attributes
    Object.values(component.getAttributes()).forEach((value: string) => {
      const expression = toExpression(value)
      if(expression) {
        result.push({
          expression,
          component,
        })
      }
    })
  })
  return result
}

/**
 * Build a tree of expressions
 */
export function getTrees(
  manager: DataSourceManagerState,
  {expression, component}: ComponentExpression,
  dataSourceId: DataSourceId
): Tree[] {
  if(expression.length === 0) return []
  const next = expression[0]
  switch(next.type) {
  case 'property': {
    if(next.dataSourceId !== dataSourceId) return []
    const trees = getTrees(manager, {expression: expression.slice(1), component}, dataSourceId)
    if(trees.length === 0) return [{
      token: next,
      children: [],
    }]
    return trees
      .flatMap(tree => {
        // Check if this is a "relative" property or "absolute" (a root type)
        if(isRelative(manager, next, tree.token, dataSourceId)) {
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
      .flatMap(exp => getTrees(manager, {expression: exp!, component}, dataSourceId))

    const trees = getTrees(manager, {expression: expression.slice(1), component}, dataSourceId)
    if(trees.length === 0) return options
    return trees.flatMap(tree => [tree, ...options])
  }
  case 'state': {
    const resolved = resolveStateExpression(next, component, manager)
    if(!resolved) {
      manager.editor.runCommand('notifications:add', {
        type: 'error',
        group: NOTIFICATION_GROUP,
        message: `Unable to resolve state <pre>${JSON.stringify(next)}</pre>`,
        componentId: component.getId(),
      })
      throw new Error(`Unable to resolve state ${JSON.stringify(next)}. State defined on component ${getComponentDebug(component)}`)
    }
    return getTrees(manager, {expression: resolved, component}, dataSourceId)
  }
  default:
    manager.editor.runCommand('notifications:add', {
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
 */
export function isRelative(
  manager: DataSourceManagerState,
  parent: Property,
  child: Property,
  dataSourceId: DataSourceId
): boolean {
  const ds = manager.dataSources.find((dataSource: IDataSource) => dataSource.id === dataSourceId)
  if(!ds) throw new Error(`Data source not found ${dataSourceId}`)
  if(!ds.isConnected()) throw new Error(`Data source ${dataSourceId} is not ready (not connected)`)
  const parentTypes = ds.getTypes().filter(t => parent.typeIds.includes(t.id))
  const parentFieldsTypes = parentTypes.flatMap(t => t.fields.map(f => f.typeIds).flat())
  return parentFieldsTypes.length > 0 && child.typeIds.some(typeId => parentFieldsTypes.includes(typeId))
}

/**
 * From expressions to a tree
 */
export function toTrees(
  manager: DataSourceManagerState,
  expressions: ComponentExpression[],
  dataSourceId: DataSourceId
): Tree[] {
  if(expressions.length === 0) return []
  return expressions
    // From Expression to Tree
    .flatMap(expression => getTrees(manager, expression, dataSourceId))
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
        const merged = grouped.reduce((acc, tree) => mergeTrees(acc, tree))
        return merged
      } catch(e) {
        manager.editor.runCommand('notifications:add', {
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
export function mergeTrees(tree1: Tree, tree2: Tree): Tree {
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
          return mergeTrees(child1, child2!)
        })),
  }
}
