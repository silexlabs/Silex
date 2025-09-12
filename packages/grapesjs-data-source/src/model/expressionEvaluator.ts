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

import { Component } from 'grapesjs'
import { Expression, StoredToken, State, Property, Filter, DataSourceId, IDataSource, FIXED_TOKEN_ID } from '../types'
import { DataSourceManagerState } from './dataSourceManager'
import { getParentByPersistentId, getState } from './state'
import { fromStored } from './token'
import { toExpression } from '../utils'

/**
 * Expression evaluation context
 */
export interface EvaluationContext {
  readonly dataSources: readonly IDataSource[]
  readonly filters: readonly Filter[]
  readonly previewData: Record<DataSourceId, unknown>
  readonly component: Component
  readonly resolvePreviewIndex: boolean
}

/**
 * Handle preview index for array data
 */
export function handlePreviewIndex(value: unknown, token: StoredToken): unknown {
  if (typeof token.previewIndex === 'undefined') {
    return value
  }

  if (Array.isArray(value)) {
    return value[token.previewIndex]
  }
  return value
}

/**
 * Evaluate a property token
 */
export function evaluatePropertyToken(
  token: Property,
  remaining: Expression,
  context: EvaluationContext,
  prevValues: unknown
): unknown {
  // Handle "fixed" property (hard coded string set by the user)
  if (token.fieldId === FIXED_TOKEN_ID) {
    return evaluateExpressionTokens(remaining, context, token.options?.value)
  }

  // Get data object
  let prevObj
  if (typeof prevValues === 'undefined' || prevValues === null) {
    if (!token.dataSourceId) {
      throw new Error(`Data source ID is missing for token: ${JSON.stringify(token)}`)
    }
    prevObj = context.previewData[token.dataSourceId]
  } else {
    prevObj = prevValues
  }

  // Get the next value
  let value = prevObj ? (prevObj as Record<string, unknown>)[token.fieldId] : null

  // Handle preview index if resolvePreviewIndex is true
  if (context.resolvePreviewIndex) {
    value = handlePreviewIndex(value, token)
  }

  // For non-final tokens, always handle preview index regardless of resolvePreviewIndex
  if (remaining.length > 0 && !context.resolvePreviewIndex) {
    value = handlePreviewIndex(value, token)
  }

  // Special handling for items state
  // @ts-expect-error - Runtime property check for items handling
  if (token.isItems && typeof token.previewIndex !== 'undefined') {
    if (remaining.length > 0) {
      value = [value]
    }
  }

  return evaluateExpressionTokens(remaining, context, value)
}

/**
 * Evaluate expression tokens recursively
 */
export function evaluateExpressionTokens(
  expression: Expression,
  context: EvaluationContext,
  prevValues: unknown = null,
): unknown {
  if (expression.length === 0) {
    return prevValues
  }

  // Always create defensive copies of tokens to prevent mutations from affecting original data
  const cleanExpression = expression.map(token => ({ ...token }))
  const [token, ...rest] = cleanExpression

  switch (token.type) {
  case 'state': {
    return evaluateStateToken(token as State, rest, context, prevValues)
  }
  case 'property': {
    return evaluatePropertyToken(token as Property, rest, context, prevValues)
  }
  case 'filter': {
    return evaluateFilterToken(token as Filter, rest, context, prevValues)
  }
  default:
    throw new Error(`Unsupported token type: ${JSON.stringify(token)}`)
  }
}

/**
 * Evaluate a state token
 */
export function evaluateStateToken(
  state: State,
  remaining: Expression,
  context: EvaluationContext,
  prevValues: unknown
): unknown {
  const resolvedExpression = resolveStateExpression(state, context.component, context)
  if (!resolvedExpression) {
    throw new Error(`Unable to resolve state: ${JSON.stringify(state)}`)
  }

  // Special handling for items state - always wrap result in array when resolvePreviewIndex is true
  const previewIndex = resolvedExpression[resolvedExpression.length - 1]?.previewIndex
  if (state.storedStateId === 'items' && typeof previewIndex !== 'undefined') {
    // @ts-expect-error - Adding runtime property for items state handling
    resolvedExpression[0].isItems = true
  }

  return evaluateExpressionTokens([...resolvedExpression, ...remaining], context, prevValues)
}

/**
 * Resolve a state token to its expression
 */
export function resolveStateExpression(
  state: State,
  component: Component,
  context: DataSourceManagerState | EvaluationContext | readonly IDataSource[]
): Expression | null {
  const parent = getParentByPersistentId(state.componentId, component)
  if (!parent) {
    console.error('Component not found for state', state, component.get('id-plugin-data-source'))
    return null
  }

  // Get the expression of the state
  const storedState = getState(parent, state.storedStateId, state.exposed)
  if (!storedState?.expression) {
    console.warn('State is not defined on component', parent.getId(), state, storedState)
    return null
  }

  // Create a minimal DataTree-like object for fromStored compatibility
  return storedState.expression
    .flatMap((token: StoredToken) => {
      switch (token.type) {
      case 'state': {
        return resolveStateExpression(fromStored(token, component.getId()), parent, context) ?? []
      }
      default:
        return token
      }
    })
}

/**
 * Evaluate a filter token (Liquid filter)
 */
export function evaluateFilterToken(
  token: Filter,
  remaining: Expression,
  context: EvaluationContext,
  prevValues: unknown
): unknown {
  const options = Object.entries(token.options).reduce((acc, [key, value]) => {
    acc[key] = evaluateExpressionTokens(toExpression(value) || [], context, null)
    return acc
  }, {} as Record<string, unknown>)

  const filter = context.filters.find(f => f.id === token.id)
  if (!filter) {
    throw new Error(`Filter not found: ${token.id}`)
  }

  let value
  try {
    value = filter.apply(prevValues, options)
  } catch (e) {
    console.warn(`Filter "${filter.id}" error:`, e, {
      filter: filter.id,
      prevValues,
      options,
      valueType: typeof prevValues,
      isArray: Array.isArray(prevValues),
      isNull: prevValues === null,
    })
    // Mimic behavior of liquid - return null on error
    return null
  }

  // Always handle preview index if resolvePreviewIndex is true, or if there are more tokens
  if (context.resolvePreviewIndex || remaining.length > 0) {
    value = handlePreviewIndex(value, token)
  }

  return evaluateExpressionTokens(remaining, context, value)
}
