import { Component } from 'grapesjs'
import { Expression, Field, FieldArgument, Filter, Options, Property, PropertyOptions, StoredToken, Token, Type, TypeId } from '../types'
import { DataTree } from './DataTree'
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
export function fromStored<T extends Token = Token>(token: StoredToken, dataTree: DataTree, componentId: string | null): T {
  switch (token.type) {
  case 'filter': {
    if ((token as Filter).optionsForm) return token as T
    const original = dataTree.filters.find(filter => filter.id === token.id) as T | undefined
    if (!original) {
      console.error('Filter not found', token)
      throw new Error(`Filter ${token.id} not found`)
    }
    return {
      ...original,
      ...token,
    } as T
  }
  case 'property': {
    if ((token as Property).optionsForm) return token as T
    const field = propertyToField(token, dataTree, componentId)
    if (!field) {
      console.error('Field not found for token', token)
      throw new Error(`Field ${token.fieldId} not found`)
    }
    return {
      ...getTokenOptions(field) ?? {},
      ...token,
    } as T
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
export function tokenToField(token: Token, prev: Field | null, component: Component, dataTree: DataTree): Field | null {
  switch (token.type) {
  case 'filter': {
    try {
      const filter = getFilterFromToken(token, dataTree.filters)
      try {
        if (filter.validate(prev)) {
          return filter.output(prev, filter.options ?? {})
        }
      } catch (e) {
        console.warn('Filter validate error:', e, {token, prev})
        return null
      }
      return null
    } catch {
      // FIXME: notify user
      console.error('Error while getting filter result type', {token, prev, component, dataTree})
      return null
    }
  }
  case 'property':
    try {
      return propertyToField(token, dataTree, component.getId())
    } catch {
      // FIXME: notify user
      console.error('Error while getting property result type', {token, component, dataTree})
      return null
    }
  case 'state': {
    const parent = getParentByPersistentId(token.componentId, component)
    if (!parent) {
      console.warn('Component not found for state', token)
      // TODO: notification
      return null
    }
    const expression = getState(parent, token.storedStateId, token.exposed)?.expression
    if (!expression) {
      console.warn('State is not defined on component', { component: parent, token })
      // TODO: notification
      return null
    }
    try {
      const field = getExpressionResultType(expression, parent, dataTree)
      return field ? {
        ...field,
        kind: token.forceKind ?? field.kind,
      } : null
    } catch {
      // FIXME: notify user
      console.error('Error while getting expression result type in tokenToField', {expression, parent, dataTree, component, token, prev})
      return null
    }
  }
  default:
    console.error('Unknown token type (reading type)', token)
    throw new Error('Unknown token type')
  }
}

/**
 * Get the type corresponding to a property
 * @throws Error if the type is not found
 */
export function propertyToField(property: Property, dataTree: DataTree, componentId: string | null): Field {
  const typeNames = property.typeIds
    .map((typeId: TypeId) => dataTree.getType(typeId, property.dataSourceId ?? null, componentId))
    .map((type: Type | null) => type?.label)

  const args = property.options ? Object.entries(property.options).map(([name, value]) => ({
    typeId: 'JSON', // FIXME: Why is this hardcoded?
    name,
    defaultValue: value, // FIXME: Why is this value, it should keep the inital default
  })) : undefined
  return {
    id: property.fieldId,
    label: typeNames.join(', '),
    typeIds: property.typeIds,
    kind: property.kind,
    dataSourceId: property.dataSourceId,
    arguments: args,
    previewIndex: property.previewIndex,
  }
}

/**
 * Evaluate the types of each token in an expression
 */
export function expressionToFields(expression: Expression, component: Component, dataTree: DataTree): Field[] {
  // Resolve type of the expression 1 step at a time
  let prev: Field | null = null
  const unknownField: Field = {
    id: 'unknown',
    label: 'unknown',
    typeIds: [],
    kind: 'scalar',
  }
  return expression.map((token) => {
    try {
      const field = tokenToField(fromStored(token, dataTree, component.getId()), prev, component, dataTree)
      if (!field) {
        console.warn('Type not found for token in expressionToFields', { token, expression })
        return unknownField
      }
      prev = field
      return field
    } catch {
      // FIXME: notify user
      console.error('Error while getting expression result type in expressionToFields', {expression, component, dataTree, token, prev})
      return unknownField
    }
  })
}

/**
 * Evaluate an expression to a type
 * This is used to validate expressions and for autocompletion
 * @throws Error if the token type is not found
 */
export function getExpressionResultType(expression: Expression, component: Component, dataTree: DataTree): Field | null {
  // Resolve type of the expression 1 step at a time
  return expression.reduce((prev: Field | null, token: StoredToken) => {
    return tokenToField(fromStored(token, dataTree, component.getId()), prev, component, dataTree)
  }, null)
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
