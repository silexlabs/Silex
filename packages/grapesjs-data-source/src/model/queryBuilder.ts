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

import { DataSourceId, Property, StoredToken, ComponentExpression } from '../types'
import { getPageExpressions, toTrees } from './ExpressionTree'
import { getManager } from './dataSourceManager'
import { getAllDataSources } from './dataSourceRegistry'
import { Page, Editor } from 'grapesjs'
import { getComponentDebug, NOTIFICATION_GROUP } from '../utils'
import { resolveStateExpression } from './expressionEvaluator'

/**
 * Get page query for both preview and production use
 * Used by preview system and 11ty site generation
 * @param page - The page to get queries for
 * @param editor - The GrapesJS editor instance
 * @param dataTree - The DataTree instance to use for query generation
 */
export function getPageQuery(page: Page, editor: Editor): Record<DataSourceId, string> {
  const manager = getManager()
  const expressions: ComponentExpression[] = getPageExpressions(manager, page)
  const dataSources = getAllDataSources()

  return dataSources
    .map(ds => {
      if (!ds.isConnected()) {
        console.error('The data source is not yet connected, the value for this page can not be loaded')
        return {
          dataSourceId: ds.id.toString(),
          query: '',
        }
      }

      const dsExpressions = expressions
        // Resolve all states
        .map((componentExpression: ComponentExpression) => ({
          component: componentExpression.component,
          expression: componentExpression.expression.flatMap((token: StoredToken) => {
            switch(token.type) {
            case 'property':
            case 'filter':
              return token
            case 'state': {
              const resolved = resolveStateExpression(token, componentExpression.component, [])
              if (!resolved) {
                editor.runCommand('notifications:add', {
                  type: 'error',
                  group: NOTIFICATION_GROUP,
                  message: `Unable to resolve state ${JSON.stringify(token)}. State defined on component ${getComponentDebug(componentExpression.component)}`,
                  componentId: componentExpression.component.getId(),
                })
                throw new Error(`Unable to resolve state ${JSON.stringify(token)}. State defined on component ${getComponentDebug(componentExpression.component)}`)
              }
              return resolved
            }
            }
          }),
        }))
        // Keep only the expressions for the current data source
        .filter((componentExpression: ComponentExpression) => {
          const e = componentExpression.expression
          if(e.length === 0) return false
          // We resolved all states
          // An expression can not start with a filter
          // So this is a property
          const first = e[0] as Property
          // Keep only the expressions for the current data source
          return first?.dataSourceId === ds.id
        })

      const trees = toTrees(manager, dsExpressions, ds.id)
      if(trees.length === 0) {
        return {
          dataSourceId: ds.id.toString(),
          query: '',
        }
      }

      const query = ds.getQuery(trees)
      return {
        dataSourceId: ds.id.toString(),
        query,
      }
    })
    .filter(obj => !!obj.query)
    .reduce((acc, { dataSourceId, query }) => {
      acc[dataSourceId] = query
      return acc
    }, {} as Record<DataSourceId, string>)
}

/**
 * Build queries for multiple pages
 * Useful for batch operations like site generation
 * @param pages - Array of pages to build queries for
 * @param editor - The GrapesJS editor instance
 * @param dataTree - The DataTree instance to use for query generation
 */
export function buildPageQueries(pages: Page[], editor: Editor): Record<string, Record<DataSourceId, string>> {
  return pages.reduce((acc, page) => {
    acc[page.getId()] = getPageQuery(page, editor)
    return acc
  }, {} as Record<string, Record<DataSourceId, string>>)
}
