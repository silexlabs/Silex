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

import type { Component } from 'grapesjs'
import { BinaryOperator, Expression, FIXED_TOKEN_ID, StateId, StoredFilter, UnariOperator, fixedText, getExpressionResultType, getFilters, getPersistantId, getStateVariableName, toExpression } from '@silexlabs/grapesjs-data-source'
import { EchoContext, type BinaryCondition, type Condition, type TemplateSyntax, type UnaryCondition } from './render'
import type { HugoFilter } from './hugo-filters'

const NUMBER_TYPES = ['Int', 'Float']
const DECIMAL = /^-?\d+(\.\d+)?$/
const POSITIVE_INTEGER = /^\d+$/

export function hasNumberType(typeIds: string[]): boolean {
  return typeIds.some(typeId => NUMBER_TYPES.includes(typeId))
}

function goVariable(name: string): string {
  return `$${name.replace(/[^A-Za-z0-9_]/g, '_')}`
}

export function stateVariable(component: Component, stateId: StateId): string {
  return goVariable(getStateVariableName(persistantId(component), stateId))
}

export function dataSourceVariable(dataSourceId: string): string {
  return goVariable(`ds_${dataSourceId}`)
}

function goString(value: string): string {
  return JSON.stringify(value)
}

function isNumberExpression(component: Component, expression: Expression): boolean {
  const field = getExpressionResultType(expression, component)
  return !!field && field.kind === 'scalar' && hasNumberType(field.typeIds)
}

// Hugo stops the build on a field of a null object written `.a.b`, index returns nil like Liquid does
function fieldPath(base: string, fields: string[]): string {
  return fields.length ? `(index ${base} ${fields.map(goString).join(' ')})` : base
}

/**
 * The options of a filter, written for a Hugo function
 */
export interface GoOptions {
  text(key: string, fallback: string): string
  number(key: string, fallback: string): string
  // Index or count: data from the CMS are float64 in Hugo
  integer(key: string, fallback: string): string
  isSet(key: string): boolean
  // The input of the filter is a number
  isNumber(): boolean
  // Fields of the option read in each item of the input list
  path(key: string): string[]
  isNumberKey(key: string): boolean
  // Hugo stops where and sort on a key under a null object, Liquid skips the item
  withoutNullParents(key: string, input: string): string
  // The items set aside by withoutNullParents
  withNullParents(key: string, input: string): string
}

function goOptions(component: Component, filter: StoredFilter, input: Expression): GoOptions {
  const expression = (key: string) => toExpression(filter.options?.[key]) ?? []
  const option = (key: string, fallback: string, literal: (fixed: string) => string | null, guard: (go: string) => string) => {
    if (expression(key).length === 0) return fallback
    const fixed = fixedText(expression(key))
    if (fixed === null) return guard(getGoExpression(component, expression(key)))
    return literal(fixed) ?? fallback
  }
  const path = (key: string) => expression(key).map(token => token.type === 'property' ? token.fieldId : '')
  const parents = (key: string) => path(key).slice(0, -1).map((_, index) => goString(path(key).slice(0, index + 1).join('.')))
  return {
    text: (key, fallback) => option(key, goString(fallback), fixed => fixed === '' ? null : goString(fixed), go => `(string ${go})`),
    number: (key, fallback) => option(key, fallback, fixed => DECIMAL.test(fixed) ? fixed : null, go => `(default ${fallback} ${go})`),
    integer: (key, fallback) => option(key, fallback, fixed => POSITIVE_INTEGER.test(fixed) ? fixed : null, go => `(int (default ${fallback} ${go}))`),
    isSet: key => expression(key).length > 0,
    isNumber: () => isNumberExpression(component, input),
    path,
    isNumberKey: key => {
      const last = expression(key).at(-1)
      return last?.type === 'property' && hasNumberType(last.typeIds)
    },
    withoutNullParents: (key, list) => parents(key).reduce((result, parent) => `(where ${result} ${parent} "ne" nil)`, list),
    withNullParents: (key, list) => {
      const levels = parents(key).map((parent, index) => `(where ${parents(key).slice(0, index).reduce((result, above) => `(where ${result} ${above} "ne" nil)`, list)} ${parent} "eq" nil)`)
      return levels.reduce((result, level) => `(append ${level} ${result})`, 'slice')
    },
  }
}

function goFilter(component: Component, filter: StoredFilter, input: string, inputExpression: Expression): string {
  const hugoFilter = getFilters().find(({ id }) => id === filter.id) as HugoFilter | undefined
  if (!hugoFilter?.toGo) throw new Error(`The filter "${filter.label ?? filter.id}" is not available with Hugo`)
  return hugoFilter.toGo(input, goOptions(component, filter, inputExpression))
}

export function getGoExpression(component: Component, expression: Expression): string {
  if (expression.length === 0) throw new Error('Expression is empty')
  const fixed = fixedText(expression)
  if (fixed !== null) return goString(fixed)
  let base = ''
  let fields: string[] = []
  expression.forEach((token, index) => {
    switch (token.type) {
    case 'state':
      if (index !== 0) throw new Error('State can only be the first token in an expression')
      base = goVariable(getStateVariableName(token.componentId, token.storedStateId))
      break
    case 'property':
      if (token.fieldId === FIXED_TOKEN_ID) {
        base = goString(`${token.options?.value ?? ''}`)
        fields = []
        break
      }
      if (index === 0) {
        if (!token.dataSourceId) throw new Error(`The field "${token.label ?? token.fieldId}" has no data source`)
        base = dataSourceVariable(token.dataSourceId as string)
      }
      fields.push(token.fieldId)
      break
    case 'filter':
      if (index === 0) throw new Error('Expression cannot start with a filter')
      base = `(${goFilter(component, token, fieldPath(base, fields), expression.slice(0, index))})`
      fields = []
      break
    }
  })
  return fieldPath(base, fields)
}

function escape(value: string, context: EchoContext): string {
  switch (context) {
  case EchoContext.TEXT: return `${value} | safeHTML`
  case EchoContext.URL: return `${value} | safeURL`
  case EchoContext.STYLE: return `${value} | safeCSS`
  case EchoContext.ATTRIBUTE: return value
  }
}

function persistantId(component: Component): string {
  const id = getPersistantId(component)
  if (!id) throw new Error('This component has no persistant ID')
  return id
}

function conditionOperand(component: Component, expression: Expression, other: Expression): string {
  const fixed = fixedText(expression)
  if (fixed !== null && DECIMAL.test(fixed) && isNumberExpression(component, other)) return fixed
  return getGoExpression(component, expression)
}

// As Hugo writes a float64 with string: 10.50 is 10.5, 007 is 7
function numberText(decimal: string): string {
  return decimal.replace(/^(-?)0+(?=\d)/, '$1').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

// Hugo finds a number and a string different without an error, and before 0.167 an int and a float too
function equalityOperand(component: Component, expression: Expression, other: Expression): string {
  const fixed = fixedText(expression)
  if (fixed === null) return `(string ${getGoExpression(component, expression)})`
  return goString(DECIMAL.test(fixed) && isNumberExpression(component, other) ? numberText(fixed) : fixed)
}

function goCondition(component: Component, condition: Condition): string {
  if (Object.values(UnariOperator).includes(condition.operator as UnariOperator)) {
    const unary = condition as UnaryCondition
    const value = getGoExpression(component, unary.expression)
    switch (unary.operator) {
    case UnariOperator.TRUTHY: return value
    case UnariOperator.FALSY: return `not ${value}`
    case UnariOperator.EMPTY_ARR: return `not ${value}`
    case UnariOperator.NOT_EMPTY_ARR: return value
    }
  }
  if (!Object.values(BinaryOperator).includes(condition.operator as BinaryOperator)) throw new Error(`If block operator is invalid: ${condition.operator}`)
  const binary = condition as BinaryCondition
  if (binary.operator === BinaryOperator.EQUAL || binary.operator === BinaryOperator.NOT_EQUAL) {
    const operator = binary.operator === BinaryOperator.EQUAL ? 'eq' : 'ne'
    return `${operator} ${equalityOperand(component, binary.expression, binary.expression2)} ${equalityOperand(component, binary.expression2, binary.expression)}`
  }
  const left = conditionOperand(component, binary.expression, binary.expression2)
  const right = conditionOperand(component, binary.expression2, binary.expression)
  switch (binary.operator) {
  case BinaryOperator.GREATER_THAN: return `gt ${left} ${right}`
  case BinaryOperator.LESS_THAN: return `lt ${left} ${right}`
  case BinaryOperator.GREATER_THAN_OR_EQUAL: return `ge ${left} ${right}`
  case BinaryOperator.LESS_THAN_OR_EQUAL: return `le ${left} ${right}`
  }
}

export const goSyntax: TemplateSyntax = {
  echo: (component, expression, context) => {
    const fixed = fixedText(expression)
    if (fixed !== null) return fixed
    const value = getGoExpression(component, expression)
    // CMS texts come with HTML entities, like &#8217; from WordPress, which Hugo would escape again in an attribute
    if (context === EchoContext.ATTRIBUTE && getExpressionResultType(expression, component)?.kind === 'scalar') return `{{ ${value} | htmlUnescape }}`
    return `{{ ${escape(value, context)} }}`
  },
  assign: (stateId: StateId, component, expression) =>
    `{{ ${stateVariable(component, stateId)} := ${getGoExpression(component, expression)} }}`,
  loop: (component, expression) => {
    const field = getExpressionResultType(expression, component)
    if (!field) throw new Error(`Expression ${expression.map(token => token.label).join(' -> ')} is invalid`)
    if (field.kind !== 'list') throw new Error(`Provided property needs to be a list in order to loop, not a ${field.kind}`)
    return [`{{ range ${goVariable(getStateVariableName(persistantId(component), '__data'))} := ${getGoExpression(component, expression)} }}`, '{{ end }}']
  },
  if: (component, condition) => {
    if (condition.expression.length === 0) throw new Error('If block expression is empty')
    if ('expression2' in condition && condition.expression2.length === 0) return ['', '']
    return [`{{ if ${goCondition(component, condition)} }}`, '{{ end }}']
  },
}
