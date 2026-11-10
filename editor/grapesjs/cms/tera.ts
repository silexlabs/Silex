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
import { BinaryOperator, Expression, FIXED_TOKEN_ID, StateId, StoredFilter, UnariOperator, fixedText, getExpressionResultType, getFilters, getStateVariableName, toExpression } from '@silexlabs/grapesjs-data-source'
import { DECIMAL, EchoContext, getTemplateExpression, isNumberExpression, persistantId, type BinaryCondition, type Condition, type TemplateSyntax, type UnaryCondition } from './render'
import type { TeraFilter } from './tera-filters'

const INTEGER = /^-?\d+$/
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/
const KEYWORDS = ['true', 'false', 'True', 'False', 'and', 'or', 'not', 'in', 'is', 'none', 'None']

let nextVariable = 0

export function resetTeraVariables() {
  nextVariable = 0
}

interface Code {
  // Tags which set the variables the value reads
  prefix: string
  value: string
}

/**
 * The options of a filter, written for a Tera filter
 */
export interface TeraOptions {
  text(key: string): string
  // A literal integer as is, or a variable for a dynamic one, null when unset or not an integer
  integer(key: string): string | null
  // For a filter which reads its input several times
  variable(value: string): string
  // The fields of an item an option names, like the key to sort on
  path(key: string): string[]
}

function teraVariable(name: string): string {
  return name.replace(/[^A-Za-z0-9_]/g, '_')
}

export function stateVariable(component: Component, stateId: StateId): string {
  return teraVariable(getStateVariableName(persistantId(component), stateId))
}

export function dataSourceVariable(dataSourceId: string): string {
  return teraVariable(`ds_${dataSourceId}`)
}

// Tera has no \u escape, which JSON.stringify writes for control characters
export function teraString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`
}

function isList(component: Component, expression: Expression): boolean {
  return getExpressionResultType(expression, component)?.kind === 'list'
}

function fallbackOf(component: Component, expression: Expression): string {
  if (isList(component, expression)) return '[]'
  return isNumberExpression(component, expression) ? '0' : '""'
}

function bind(prefix: string[], value: string): string {
  const name = `silex_${nextVariable++}`
  prefix.push(`{% set ${name} = ${value} %}`)
  return name
}

function fieldAccess(field: string): string {
  return IDENTIFIER.test(field) && !KEYWORDS.includes(field) ? `?.${field}` : `?[${teraString(field)}]`
}

// Liquid gives nil for a missing field and loops over nil, Tera stops the build
function withFallback(prefix: string[], path: string, fallback: string): string {
  const name = bind(prefix, `${path} | default(value=none)`)
  prefix.push(`{% if ${name} is none %}{% set ${name} = ${fallback} %}{% endif %}`)
  return name
}

function teraOptions(component: Component, filter: StoredFilter, prefix: string[]): TeraOptions {
  const option = (key: string) => filter.options?.[key]
  return {
    text: key => {
      const expression = toExpression(option(key))
      if (!expression) return teraString(`${option(key) ?? ''}`)
      if (!expression.length) return '""'
      return expressionIn(prefix, component, expression, '""')
    },
    integer: key => {
      const expression = toExpression(option(key))
      const text = expression ? fixedText(expression) : `${option(key) ?? ''}`
      if (text === null) return bind(prefix, `${expressionIn(prefix, component, expression!, '0')} | int`)
      return INTEGER.test(text.trim()) ? `${parseInt(text)}` : null
    },
    variable: value => bind(prefix, value),
    path: key => {
      const expression = toExpression(option(key))
      if (!expression) return option(key) ? [`${option(key)}`] : []
      return expression.map(token => token.type === 'property' && token.fieldId === FIXED_TOKEN_ID ? `${token.options?.value ?? ''}` : 'fieldId' in token ? token.fieldId : '')
    },
  }
}

function teraFilter(component: Component, filter: StoredFilter, input: string, prefix: string[]): string {
  const found = getFilters().find(({ id }) => id === filter.id) as TeraFilter | undefined
  if (!found?.toTera) throw new Error(`The filter "${filter.label ?? filter.id}" is not available with Zola`)
  return found.toTera(input, teraOptions(component, filter, prefix))
}

function expressionIn(prefix: string[], component: Component, expression: Expression, fallback: string): string {
  return getTemplateExpression(expression, {
    string: teraString,
    variable: teraVariable,
    field: (base, fields, typed) => fields.length
      ? withFallback(prefix, `${base}${fields.map(fieldAccess).join('')}`, typed === expression ? fallback : fallbackOf(component, typed))
      : base,
    filter: (filter, input) => teraFilter(component, filter, input, prefix),
    // Tera reads no field of a value in parentheses
    fieldOfFiltered: filtered => bind(prefix, filtered),
  })
}

/**
 * Tera code for an expression, a missing field gives the fallback
 */
export function getTeraExpression(component: Component, expression: Expression, fallback: string): Code {
  const prefix: string[] = []
  const value = expressionIn(prefix, component, expression, fallback)
  return { prefix: prefix.join(''), value }
}

function escape(context: EchoContext): string {
  switch (context) {
  case EchoContext.TEXT:
  case EchoContext.STYLE: return ' | safe'
  // Like Liquid, keep the HTML entities of the CMS and only close the attribute
  case EchoContext.ATTRIBUTE:
  case EchoContext.URL: return ' | str | replace(from=\'"\', to="&quot;") | safe'
  }
}

function conditionOperand(component: Component, expression: Expression, other: Expression): Code {
  const fixed = fixedText(expression)
  if (fixed !== null && DECIMAL.test(fixed) && isNumberExpression(component, other)) return { prefix: '', value: fixed }
  return getTeraExpression(component, expression, fallbackOf(component, expression))
}

const BINARY: Record<BinaryOperator, string> = {
  [BinaryOperator.EQUAL]: '==',
  [BinaryOperator.NOT_EQUAL]: '!=',
  [BinaryOperator.GREATER_THAN]: '>',
  [BinaryOperator.LESS_THAN]: '<',
  [BinaryOperator.GREATER_THAN_OR_EQUAL]: '>=',
  [BinaryOperator.LESS_THAN_OR_EQUAL]: '<=',
}

function teraCondition(component: Component, condition: Condition): Code {
  if (Object.values(UnariOperator).includes(condition.operator as UnariOperator)) {
    const unary = condition as UnaryCondition
    const { prefix, value } = getTeraExpression(component, unary.expression, '""')
    switch (unary.operator) {
    case UnariOperator.TRUTHY:
    case UnariOperator.NOT_EMPTY_ARR: return { prefix, value }
    case UnariOperator.FALSY:
    case UnariOperator.EMPTY_ARR: return { prefix, value: `not (${value})` }
    }
  }
  if (!Object.values(BinaryOperator).includes(condition.operator as BinaryOperator)) throw new Error(`If block operator is invalid: ${condition.operator}`)
  const binary = condition as BinaryCondition
  const left = conditionOperand(component, binary.expression, binary.expression2)
  const right = conditionOperand(component, binary.expression2, binary.expression)
  return { prefix: left.prefix + right.prefix, value: `(${left.value}) ${BINARY[binary.operator]} (${right.value})` }
}

export const teraSyntax: TemplateSyntax = {
  echo: (component, expression, context) => {
    const fixed = fixedText(expression)
    if (fixed !== null) return fixed
    const { prefix, value } = getTeraExpression(component, expression, '""')
    return `${prefix}{{ ${value}${escape(context)} }}`
  },
  assign: (stateId: StateId, component, expression) => {
    const { prefix, value } = getTeraExpression(component, expression, isList(component, expression) ? '[]' : '""')
    return `${prefix}{% set ${stateVariable(component, stateId)} = ${value} %}`
  },
  loop: (component, expression) => {
    const { prefix, value } = getTeraExpression(component, expression, '[]')
    return [`${prefix}{% for ${stateVariable(component, '__data')} in ${value} %}`, '{% endfor %}']
  },
  if: (component, condition) => {
    const { prefix, value } = teraCondition(component, condition)
    return [`${prefix}{% if ${value} %}`, '{% endif %}']
  },
}
