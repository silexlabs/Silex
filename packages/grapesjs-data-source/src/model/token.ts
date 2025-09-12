import { Component } from 'grapesjs'
import { Expression, Field, FieldArgument, Filter, Options, Property, PropertyOptions, StoredToken, Token, Type, TypeId } from '../types'
import { DataSourceManagerState } from './dataSourceManager'
import { getParentByPersistentId, getState } from './state'
import { TemplateResult, html } from 'lit'

/**
 * Add missing methonds to the filter
 * When filters are stored they lose their methods
 * @throws Error if the filter is not found
 */
export function getFilterFromToken(token: Filter, filters: Filter[]): Filter {
  if(token.type !== 'filter') throw new Error('Token is not a filter')
  const filter = filters.find(filter => filter.id === token.id)
  if (!filter) {
    console.error('Filter not found', token)
    throw new Error(`Filter ${token.id} not found`)
  }
  return {
    ...token,
    ...filter,
    // Keep the options as they are stored
    options: token.options,
  }
}

/**
 * Get the token from its stored form
 * @throws Error if the token type is not found
 */
export function fromStored<T extends Token = Token>(token: StoredToken, componentId: string | null): T {
  switch (token.type) {
  case 'filter': {
    // TODO: Get filter from manager
    return token as T
  }
  case 'property': {
    // TODO: Get property from manager
    return token as T
  }
  case 'state':
    return token as T
  default:
    console.error('Unknown token type (reading type)', token)
    throw new Error('Unknown token type')
  }
}

/**
 * Get the type corresponding to a token
 */
export function tokenToField(token: Token, prev: Field | null, component: Component): Field | null {
  // TODO: Update to use manager instead of dataTree
  return null
}

/**
 * Get the type corresponding to a property
 * @throws Error if the type is not found
 */
export function propertyToField(property: Property, componentId: string | null): Field {
  // TODO: Update to use manager instead of dataTree
  return {
    id: property.fieldId,
    label: property.label,
    typeIds: property.typeIds,
    kind: property.kind,
    dataSourceId: property.dataSourceId,
    previewIndex: property.previewIndex,
  }
}

/**
 * Evaluate the types of each token in an expression
 */
export function expressionToFields(expression: Expression, component: Component): Field[] {
  // TODO: Update to use manager instead of dataTree
  return []
}

/**
 * Evaluate an expression to a type
 * This is used to validate expressions and for autocompletion
 * @throws Error if the token type is not found
 */
export function getExpressionResultType(expression: Expression, component: Component): Field | null {
  // TODO: Update to use manager instead of dataTree
  return null
}

/**
 * Get the options of a token
 */
export function getTokenOptions(field: Field): { optionsForm: (selected: Component, input: Field | null, options: Options) => TemplateResult, options: Options } | null {
  if (field.arguments && field.arguments.length > 0) {
    return {
      optionsForm: optionsToOptionsForm(field.arguments.map((arg) => ({ name: arg.name, value: arg.defaultValue }))),
      options: field.arguments.reduce((options: Record<string, unknown>, arg: FieldArgument) => {
        options[arg.name] = arg.defaultValue
        return options
      }, {}),
    }
  }
  return null
}

/**
 * Get the options of a token or a field
 */
export function optionsToOptionsForm(arr: { name: string, value: unknown }[]): (selected: Component, input: Field | null, options: Options) => TemplateResult {
  return (selected: Component, input: Field | null, options: Options) => {
    return html`
              ${arr.map((obj) => {
    const value = options[obj.name] ?? obj.value ?? ''
    return html`<label>${obj.name}</label><input type="text" name=${obj.name} .value=${value}>`
  })
}
          `
  }
}

/**
 * Utility function to shallow compare two objects
 * Used to compare options of tree items
 */
export function getOptionObject(option1: PropertyOptions | undefined, option2: PropertyOptions | undefined): { error: boolean, result: PropertyOptions | undefined } {
  // Handle the case where one or both are undefined or empty
  if(!option1 && !option2) return { error: false, result: undefined }
  if(isEmpty(option1) && isEmpty(option2)) return { error: false, result: undefined }
  // Handle the case where one is undefined or empty and the other is not
  if(!option1 || !option2) return { error: true, result: undefined }
  if(isEmpty(option1) || isEmpty(option2)) return { error: true, result: undefined }

  const keys1 = Object.keys(option1)
  const keys2 = Object.keys(option2)

  if (keys1.length !== keys2.length) {
    return { error: true, result: undefined }
  }

  for (const key of keys1) {
    if (option1[key] !== option2[key]) {
      return { error: true, result: undefined }
    }
  }

  return { error: false, result: option1 }
}

function isJson(str: string) {
  if(typeof str !== 'string') return false
  if(str.length === 0) return false
  try {
    JSON.parse(str)
  } catch {
    return false
  }
  return true
}

function isEmpty(value: unknown): boolean {
  if(value === null || typeof value === 'undefined') return true
  const isString = typeof value === 'string'
  const isJsonString = isString && isJson(value)
  if (isString && !isJsonString) return value === ''
  const json = isJsonString ? JSON.parse(value) : value
  if (Array.isArray(json)) return json.length === 0
  if (typeof json === 'object') return Object.values(json).filter(v => !!v).length === 0
  return false
}

export function buildArgs(options: PropertyOptions | undefined): string {
  const args = options ? `(${Object
    .keys(options)
    .map(key => ({ key, value: options![key] }))
    .filter(({ value }) => !isEmpty(value))
    .map(({ key, value }) => {
      //return typeof value === 'string' && !isJson(value) ? `${key}: "${value}"` : `${key}: ${value}`
      return `${key}: ${value}`
    })
    .join(', ')
  })` : ''
  // Valid args for GraphQL canot be just ()
  const validArgs = args === '()' ? '' : args
  return validArgs
}
