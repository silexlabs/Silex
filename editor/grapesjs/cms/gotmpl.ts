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
import { BinaryOperator, Expression, StateId, UnariOperator, fixedText, getExpressionResultType, getPersistantId, getStateVariableName } from '@silexlabs/grapesjs-data-source'
import { EchoContext, type BinaryCondition, type Condition, type TemplateSyntax, type UnaryCondition } from './render'

const NUMBER_TYPES = ['Int', 'Float']
const DECIMAL = /^-?\d+(\.\d+)?$/

function goVariable(name: string): string {
  return `$${name.replace(/[^A-Za-z0-9_]/g, '_')}`
}

export function dataSourceVariable(dataSourceId: string): string {
  return goVariable(`ds_${dataSourceId}`)
}

function goString(value: string): string {
  return JSON.stringify(value)
}

function isNumberExpression(component: Component, expression: Expression): boolean {
  const field = getExpressionResultType(expression, component)
  return !!field && field.kind === 'scalar' && field.typeIds.some(typeId => NUMBER_TYPES.includes(typeId))
}

// Hugo stops the build on a field of a null object written `.a.b`, index returns nil like Liquid does
function fieldPath(base: string, fields: string[]): string {
  return fields.length ? `(index ${base} ${fields.map(goString).join(' ')})` : base
}

export function getGoExpression(component: Component, expression: Expression): string {
  if (expression.length === 0) throw new Error('Expression is empty')
  const fixed = fixedText(expression)
  if (fixed !== null) return goString(fixed)
  let base = ''
  const fields: string[] = []
  expression.forEach((token, index) => {
    switch (token.type) {
    case 'state':
      if (index !== 0) throw new Error('State can only be the first token in an expression')
      base = goVariable(getStateVariableName(token.componentId, token.storedStateId))
      break
    case 'property':
      if (index === 0) {
        if (!token.dataSourceId) throw new Error(`The field "${token.label ?? token.fieldId}" has no data source`)
        base = dataSourceVariable(token.dataSourceId as string)
      }
      fields.push(token.fieldId)
      break
    case 'filter':
      throw new Error(`The filter "${token.label ?? token.id}" is not available with Hugo`)
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
  const left = conditionOperand(component, binary.expression, binary.expression2)
  const right = conditionOperand(component, binary.expression2, binary.expression)
  switch (binary.operator) {
  case BinaryOperator.EQUAL: return `eq ${left} ${right}`
  case BinaryOperator.NOT_EQUAL: return `ne ${left} ${right}`
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
    return `{{ ${escape(getGoExpression(component, expression), context)} }}`
  },
  assign: (stateId: StateId, component, expression) =>
    `{{ ${goVariable(getStateVariableName(persistantId(component), stateId))} := ${getGoExpression(component, expression)} }}`,
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
