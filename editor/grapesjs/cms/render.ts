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

import type { Component, Editor } from 'grapesjs'
import { BinaryOperator, Expression, FIXED_TOKEN_ID, NOTIFICATION_GROUP, Properties, State, StateId, StoredFilter, StoredState, Token, UnariOperator, fixedText, fromStored, getExpressionResultType, getPersistantId, getState, getStateIds, getStateVariableName } from '@silexlabs/grapesjs-data-source'
import { UNWRAP_ID } from './traits'

export interface BinaryCondition {
  operator: BinaryOperator,
  expression: Expression,
  expression2: Expression,
}

export interface UnaryCondition {
  operator: UnariOperator,
  expression: Expression,
}

export type Condition = BinaryCondition | UnaryCondition

export enum EchoContext {
  TEXT = 'text',
  ATTRIBUTE = 'attribute',
  URL = 'url',
  STYLE = 'style',
}

// What a template language writes for the states of a component
export interface TemplateSyntax {
  echo(component: Component, expression: Expression, context: EchoContext): string
  assign(stateId: StateId, component: Component, expression: Expression): string
  loop(component: Component, expression: Expression): [start: string, end: string]
  if(component: Component, condition: Condition): [start: string, end: string]
}

const NUMBER_TYPES = ['Int', 'Float']
export const DECIMAL = /^-?\d+(\.\d+)?$/

// The name a template gives to the data of a source
export function dataSourceName(dataSourceId: string): string {
  return `ds_${dataSourceId}`
}

export function hasNumberType(typeIds: string[]): boolean {
  return typeIds.some(typeId => NUMBER_TYPES.includes(typeId))
}

export function isNumberExpression(component: Component, expression: Expression): boolean {
  const field = getExpressionResultType(expression, component)
  return !!field && field.kind === 'scalar' && hasNumberType(field.typeIds)
}

export function persistantId(component: Component): string {
  const id = getPersistantId(component)
  if (!id) throw new Error('This component has no persistant ID')
  return id
}

// How a template language writes the parts of an expression
export interface ExpressionLanguage {
  string(value: string): string
  variable(name: string): string
  // `typed` is the expression whose result is read, to choose a fallback
  field(base: string, fields: string[], typed: Expression): string
  filter(filter: StoredFilter, input: string, typed: Expression): string
  // A language which reads no field of a filtered value
  fieldOfFiltered?(filtered: string): string
}

export function getTemplateExpression(expression: Expression, language: ExpressionLanguage): string {
  if (expression.length === 0) throw new Error('Expression is empty')
  const fixed = fixedText(expression)
  if (fixed !== null) return language.string(fixed)
  let base = ''
  let fields: string[] = []
  let filtered = false
  expression.forEach((token, index) => {
    switch (token.type) {
    case 'state':
      if (index !== 0) throw new Error('State can only be the first token in an expression')
      base = language.variable(getStateVariableName(token.componentId, token.storedStateId))
      break
    case 'property':
      if (token.fieldId === FIXED_TOKEN_ID) {
        base = language.string(`${token.options?.value ?? ''}`)
        fields = []
        filtered = false
        break
      }
      if (index === 0) {
        if (!token.dataSourceId) throw new Error(`The field "${token.label ?? token.fieldId}" has no data source`)
        base = language.variable(dataSourceName(token.dataSourceId))
      }
      if (filtered && language.fieldOfFiltered) base = language.fieldOfFiltered(base)
      filtered = false
      fields.push(token.fieldId)
      break
    case 'filter': {
      if (index === 0) throw new Error('Expression cannot start with a filter')
      const typed = expression.slice(0, index)
      base = `(${language.filter(token, language.field(base, fields, typed), typed)})`
      fields = []
      filtered = true
      break
    }
    }
  })
  return language.field(base, fields, expression)
}

const URL_ATTRIBUTES = ['href', 'src', 'action', 'poster']

function echoContext(label: string): EchoContext {
  if (label === 'style') return EchoContext.STYLE
  return URL_ATTRIBUTES.includes(label) ? EchoContext.URL : EchoContext.ATTRIBUTE
}

const ATTRIBUTE_MULTIPLE_VALUES = ['class', 'style']

/**
 * A memoization mechanism to avoid rendering the same component multiple times
 * The cache is cleared every time the publication is done
 * This is a workaround because grapesjs editor.getHtml will call each component's toHtml method multiple times
 */
const cache = new Map<string, string>()

export function clearRenderCache() {
  cache.clear()
}

/**
 * A state with the real tokens instead of the stored tokens
 */
interface RealState {
  stateId: StateId,
  label?: string,
  tokens: Token[]
}


/**
 * Make html attribute
 * Quote strings, no values for boolean
 */
function makeAttribute(key: string, value: string | boolean): string {
  switch (typeof value) {
  case 'boolean': return value ? key : ''
  default: return `${key}="${value}"`
  }
}


/**
 * Make stored states into real states
 * Filter out hidden states and empty expressions
 */
function getRealStates(states: { stateId: StateId, state: StoredState }[]): { stateId: StateId, label: string, tokens: State[] }[] {
  return states
    .filter(({ state }) => !state.hidden)
    .filter(({ state }) => state.expression.length > 0)
    // From expression of stored tokens to tokens (with methods not only data)
    .map(({ stateId, state }) => ({
      stateId,
      label: state.label || stateId,
      tokens: state.expression.map(token => {
        const componentId = state.expression[0].type === 'state' ? state.expression[0].componentId : null
        return fromStored(token, componentId)
      }),
    }))
}

/**
 * Check if a state is an attribute
 * Exported for unit tests
 */
export function isAttribute(label: string): boolean {
  if (!label) return false
  return !Object.values(Properties).includes(label as Properties)
}

/**
 * Build the attributes string for a given component
 * Handle attributes which appear multiple times (class, style)
 * Append to the original attributes
 * Exported for unit tests
 */
export function buildAttributes(originalAttributes: Record<string, string>, attributeStates: { stateId: StateId, label: string, value: string }[]): string {
  const attributesArr = Object.entries(originalAttributes)
    // Start with the original attributes
    .map(([label, value]) => ({
      stateId: label,
      label,
      value,
    }))
    // Override or add state attributes
    .concat(attributeStates)
    // Handle attributes which appear multiple times
    .reduce((final, { stateId, label, value }) => {
      const existing = final.find(({ label: existingLabel }) => existingLabel === label)
      if (existing) {
        if (ATTRIBUTE_MULTIPLE_VALUES.includes(label)) {
          // Add to the original value
          existing.value += ' ' + value
        } else {
          // Override the original value
          existing.value = value
        }
      } else {
        // First time we see this attribute
        final.push({
          stateId,
          label,
          value,
        })
      }
      // Return the original array
      return final
    }, [] as ({ stateId: StateId, value: string | boolean, label: string })[])
  // Build final result
  return attributesArr
    // Convert to key="value" string
    .map(({ label, value }) => makeAttribute(label, value))
    // Back to string
    .join(' ')
}

export function withNotification<T>(cbk: () => T, editor: Editor, componentId: string | null): T {
  try {
    return cbk()
  } catch (e) {
    editor.runCommand('notifications:add', {
      type: 'error',
      message: `Error rendering component: ${e.message}`,
      group: NOTIFICATION_GROUP,
      componentId,
    })
    throw e
  }
}

/**
 * Render the components when they are published
 */
function checkLoopData(component: Component, expression: Expression) {
  const field = getExpressionResultType(expression, component)
  if (!field) throw new Error(`Expression ${expression.map(token => token.label).join(' -> ')} is invalid`)
  if (field.kind !== 'list') throw new Error(`Provided property needs to be a list in order to loop, not a ${field.kind}`)
}

export function renderComponent(editor: Editor, syntax: TemplateSyntax, component: Component, toHtml: () => string): string | undefined {
  if(cache.has(component.getId())) {
    return cache.get(component.getId())
  }

  const statesPrivate = withNotification(() => getRealStates(getStateIds(component, false)
    .map(stateId => ({
      stateId,
      state: getState(component, stateId, false)!,
    }))), editor, component.getId())

  const statesPublic = withNotification(() => getRealStates(getStateIds(component, true)
    .map(stateId => ({
      stateId,
      state: getState(component, stateId, true)!,
    }))), editor, component.getId())

  const unwrap = component.get(UNWRAP_ID)

  if (statesPrivate.length > 0 || statesPublic.length > 0 || unwrap) {
    const tagName = component.get('tagName')?.toLowerCase()
    if (tagName) {
      // Convenience key value object
      const statesObj = statesPrivate
        // Filter out attributes, keep only properties
        .filter(({ label }) => !isAttribute(label))
        // Add states
        .concat(statesPublic)
        .reduce((final, { stateId, label, tokens }) => ({
          ...final,
          [stateId]: {
            stateId,
            label,
            tokens,
          },
        }), {} as Record<Properties, RealState>)

      const hasInnerHtml = !!statesObj.innerHTML?.tokens.length
      const hasCondition = !!statesObj.condition?.tokens.length
      const hasData = !!statesObj.__data?.tokens.length

      // Style attribute
      const innerHtml = hasInnerHtml ? syntax.echo(component, statesObj.innerHTML.tokens, EchoContext.TEXT) : component.getInnerHTML()
      const operator = component.get('conditionOperator') ?? UnariOperator.TRUTHY
      const binary = operator && Object.values(BinaryOperator).includes(operator)
      const expression2 = statesObj.condition2?.tokens ?? []
      // A comparison with nothing yet is not a condition
      const [ifStart, ifEnd] = hasCondition && !(binary && !expression2.length) ? syntax.if(component, binary ? {
        expression: statesObj.condition.tokens,
        expression2,
        operator,
      } : {
        expression: statesObj.condition.tokens,
        operator,
      }) : []
      if (hasData) checkLoopData(component, statesObj.__data.tokens)
      const [forStart, forEnd] = hasData ? syntax.loop(component, statesObj.__data.tokens) : []
      const states = statesPublic
        .map(({ stateId, tokens }) => syntax.assign(stateId, component, tokens))
        .join('\n')
      const before = (states ?? '') + (forStart ?? '') + (ifStart ?? '')
      const after = (ifEnd ?? '') + (forEnd ?? '')

      // Attributes
      const originalAttributes = component.get('attributes') as Record<string, string>
      // Add css classes
      originalAttributes.class = component.getClasses().join(' ')
      // Make the list of attributes
      const attributes = buildAttributes(originalAttributes, statesPrivate
        // Filter out properties, keep only attributes
        .filter(({ label }) => isAttribute(label))
        // Make tokens a string
        .map(({ stateId, tokens, label }) => ({
          stateId,
          label,
          value: syntax.echo(component, tokens, echoContext(label)),
        }))
      )
      if (unwrap) {
        const html = `${before}${innerHtml}${after}`
        cache.set(component.getId(), html)
        return html
      } else {
        const html = `${before}<${tagName}${attributes ? ` ${attributes}` : ''}>${innerHtml}</${tagName}>${after}`
        cache.set(component.getId(), html)
        return html
      }
    } else {
      // Not a real component
      // FIXME: understand why
      throw new Error('Why no tagName?')
    }
  } else {
    const html = toHtml()
    cache.set(component.getId(), html)
    return html
  }
}
