import { Component } from "grapesjs"
import { Expression, Field, FieldArgument, Filter, Options, Property, PropertyOptions, StoredToken, Token, Type, TypeId } from "../types"
import { DataTree } from "./DataTree"
import { getParentByPersistentId, getState } from "./state"
import { TemplateResult, html } from "lit"

/**
 * Add missing methonds to the filter
 * When filters are stored they lose their methods
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
 */
export function fromStored < T extends Token = Token > (token: StoredToken, dataTree: DataTree): T {
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
      const field = propertyToField(token, dataTree)
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
      const filter = getFilterFromToken(token, dataTree.filters)
      if (filter.validate(prev)) {
        return filter.output(prev, filter.options ?? {})
      }
      return null
    }
    case 'property':
      return propertyToField(token, dataTree)
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
      const field = getExpressionResultType(expression, parent, dataTree)
      return field ? {
        ...field,
        kind: token.forceKind ?? field.kind,
      } : null
    }
    default:
      console.error('Unknown token type (reading type)', token)
      throw new Error('Unknown token type')
  }
}

export function propertyToField(property: Property, dataTree: DataTree): Field {
  const typeNames = property.typeIds
    .map((typeId: TypeId) => dataTree.getType(typeId, property.dataSourceId ?? null))
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
  }
}

/**
 * Evaluate the types of each token in an expression
 */
export function expressionToFields(expression: Expression, component: Component, dataTree: DataTree): Field[] {
  // Resolve type of the expression 1 step at a time
  let prev: Field | null = null
  return expression.map((token) => {
    const field = tokenToField(fromStored(token, dataTree), prev, component, dataTree)
    if (!field) {
      console.warn('Type not found for token in expressionToFields', { token, expression })
      return {
        id: 'unknown',
        label: 'unknown',
        typeIds: [],
        kind: 'scalar',
      }
    }
    prev = field
    return field
  })
}

/**
 * Evaluate an expression to a type
 * This is used to validate expressions and for autocompletion
 */
export function getExpressionResultType(expression: Expression, component: Component, dataTree: DataTree): Field | null {
  // Resolve type of the expression 1 step at a time
  return expression.reduce((prev: Field | null, token: StoredToken) => {
    return tokenToField(fromStored(token, dataTree), prev, component, dataTree)
  }, null)
}

/**
 * Get the options of a token
 */
export function getTokenOptions(field: Field): { optionsForm: (input: Field | null, options: Options) => TemplateResult, options: Options } | null {
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
export function optionsToOptionsForm(arr: { name: string, value: unknown }[]): (input: Field | null, options: Options) => TemplateResult {
  return (input: Field | null, options: Options) => {
    return html`
              ${arr.map((obj) => {
      const value = options[obj.name] ?? obj.value ?? ''
      return html`<label>${obj.name}</label><input type="text" name=${obj.name} value=${value}>`
    })
      }
          `
  }
}

/**
 * Utility function to shallow compare two objects
 * Used to compare options of tree items
 */
export function sameOptions(option1: PropertyOptions | undefined, option2: PropertyOptions | undefined) {
  // Handle the case where one or both are undefined or empty
  if(!option1 && !option2) return true
  if(isEmpty(option1) && isEmpty(option2)) return true
  // Handle the case where one is undefined or empty and the other is not
  if(!option1 || !option2) return false
  if(isEmpty(option1) || isEmpty(option2)) return false

  const keys1 = Object.keys(option1);
  const keys2 = Object.keys(option2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (option1[key] !== option2[key]) {
      return false;
    }
  }

  return true;
}

function isJson(str: string) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function isEmpty(value: unknown): boolean {
  if(value === null || typeof value === 'undefined') return true
  const isString = typeof value === 'string'
  const isJsonString = isString && isJson(value)
  if (isString && !isJsonString) return value === ''
  const json = isJsonString ? JSON.parse(value) : value
  if (Array.isArray(json)) return json.length === 0
  if (typeof json === 'object') return Object.keys(json).length === 0
  return false
}

export function buildArgs(options: PropertyOptions | undefined): string {
  const args = options ? `(${Object
      .keys(options)
      .map(key => ({ key, value: options![key] }))
      .filter(({ value }) => !isEmpty(value))
      .map(({ key, value }) => typeof value === 'string' && !isJson(value) ? `${key}: "${value}"` : `${key}: ${value}`)
      .join(', ')
    })` : ''
  // Valid args for GraphQL canot be just ()
  const validArgs = args === '()' ? '' : args
  return validArgs
}
