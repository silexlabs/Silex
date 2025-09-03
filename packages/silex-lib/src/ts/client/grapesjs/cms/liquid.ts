import {
  Expression,
  Filter, Property, State, StateId, Token, getPersistantId, getStateVariableName, toExpression,
  FIXED_TOKEN_ID,
  UnariOperator,
  getExpressionResultType,
  BinaryOperator,
} from '@silexlabs/grapesjs-data-source'
import { Component } from 'grapesjs'
import { EleventyDataSourceId } from './DataSource'

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

/**
 * Generate liquid instructions which echo the value of an expression
 */
export function echoBlock(component: Component, expression: Expression): string {
  if (expression.length === 0) throw new Error('Expression is empty')
  if (expression.length === 1 && expression[0].type === 'property' && expression[0].fieldId === FIXED_TOKEN_ID) {
    return expression[0].options?.value as string ?? ''
  }
  const statements = getLiquidBlock(component, expression)
  return `{% liquid
    ${statements
    .map(({ liquid }) => liquid)
    .join('\n\t')
}
    echo ${statements[statements.length - 1].variableName}
  %}`
}

/**
 * Generate liquid instructions which echo the value of an expression, on 1 line
 */
export function echoBlock1line(component: Component, expression: Expression): string {
  if (expression.length === 0) throw new Error('Expression is empty')
  if (expression.length === 1 && expression[0].type === 'property' && expression[0].fieldId === FIXED_TOKEN_ID) {
    return expression[0].options?.value as string ?? ''
  }
  const statements = getLiquidBlock(component, expression)
  return `{% ${statements
    .map(({ liquid }) => liquid)
    .join(' %}{% ')
  } %}{{ ${statements[statements.length - 1].variableName} }}`
}

/**
 * Generate liquid instructions which define a variable for later use
 * This is used for components states
 */
export function assignBlock(stateId: StateId, component: Component, expression: Expression): string {
  if (expression.length === 0) throw new Error('Expression is empty')
  const statements = getLiquidBlock(component, expression)
  const persistantId = getPersistantId(component)
  if (!persistantId) throw new Error('This component has no persistant ID')
  return `{% liquid
    ${statements
    .map(({ liquid }) => liquid)
    .join('\n\t')
}
    assign ${getStateVariableName(persistantId, stateId)} = ${statements[statements.length - 1].variableName}
  %}`
}

/**
 * Generate liquid instructions which start and end a loop over the provided expression
 * This is used for components states
 */
export function loopBlock(component: Component, expression: Expression): [start: string, end: string] {
  if (expression.length === 0) throw new Error('Expression is empty')
  // Check data to loop over
  const field = getExpressionResultType(expression, component)
  if (!field) throw new Error(`Expression ${expression.map(token => token.label).join(' -> ')} is invalid`)
  if (field.kind !== 'list') throw new Error(`Provided property needs to be a list in order to loop, not a ${field.kind}`)
  const statements = getLiquidBlock(component, expression)
  const loopDataVariableName = statements[statements.length - 1].variableName
  const persistantId = getPersistantId(component)
  if (!persistantId) {
    console.error('Component', component, 'has no persistant ID. Persistant ID is required to get component states.')
    throw new Error('This component has no persistant ID')
  }
  return [`{% liquid
    ${statements
    .map(({ liquid }) => liquid)
    .join('\n\t')
}
    %}
    {% for ${getStateVariableName(persistantId, '__data')} in ${loopDataVariableName} %}
  `, '{% endfor %}']
}

/**
 * Generate liquid instructions which define a variable for later use
 * This is used for components states
 */
export function ifBlock(component: Component, condition: Condition): [start: string, end: string] {
  // Check the first expression
  if (condition.expression.length === 0) throw new Error('If block expression is empty')

  // Check the operator
  const unary = Object.values(UnariOperator).includes(condition.operator as UnariOperator) ? condition as UnaryCondition : null
  const binary = Object.values(BinaryOperator).includes(condition.operator as BinaryOperator) ? condition as BinaryCondition : null
  if (!unary && !binary) throw new Error(`If block operator is invalid: ${condition.operator}`)

  // Check the second expression
  if (binary && binary.expression2.length === 0) return ['', '']

  // Get liquid for the first expression
  const statements = getLiquidBlock(component, condition.expression)
  const lastVariableName = statements[statements.length - 1].variableName

  // Get liquid for the second
  let lastVariableName2 = ''
  if (binary) {
    statements.push(...getLiquidBlock(component, binary.expression2))
    lastVariableName2 = statements[statements.length - 1].variableName
  }

  // Get liquid for the whole if block
  return [`{% liquid
    ${statements
    .map(({ liquid }) => liquid)
    .join('\n\t')
}
    %}
    {% if ${unary ? getUnaryOp(lastVariableName, unary.operator) : getBinaryOp(lastVariableName, lastVariableName2, binary!.operator)} %}
  `, '{% endif %}']
}

function getUnaryOp(variableName: string, operator: UnariOperator): string {
  switch (operator) {
  case UnariOperator.TRUTHY: return `${variableName} and ${variableName} != blank and ${variableName} != empty`
  case UnariOperator.FALSY: return `not ${variableName}`
  case UnariOperator.EMPTY_ARR: return `${variableName}.size == 0`
  case UnariOperator.NOT_EMPTY_ARR: return `${variableName}.size > 0`
  }
}

function getBinaryOp(variableName: string, variableName2: string, operator: BinaryOperator): string {
  switch (operator) {
  case BinaryOperator.EQUAL: return `${variableName} == ${variableName2}`
  case BinaryOperator.NOT_EQUAL: return `${variableName} != ${variableName2}`
  case BinaryOperator.GREATER_THAN: return `${variableName} > ${variableName2}`
  case BinaryOperator.LESS_THAN: return `${variableName} < ${variableName2}`
  case BinaryOperator.GREATER_THAN_OR_EQUAL: return `${variableName} >= ${variableName2}`
  case BinaryOperator.LESS_THAN_OR_EQUAL: return `${variableName} <= ${variableName2}`
  }
}

let numNextVar = 0
/**
 * Pagination data has no filter and no states in it
 */
export function getPaginationData(expression: Property[]): string {
  const statement = getLiquidStatementProperties(expression)
  const firstToken = expression[0]
  if (firstToken) {
    if (!firstToken.dataSourceId || firstToken.dataSourceId === EleventyDataSourceId) {
      return statement
    }
    return `${firstToken.dataSourceId}.${statement}`
  } else {
    return ''
  }
}

/**
 * Convert an expression to liquid code
 */
export function getLiquidBlock(component: Component, expression: Expression): { variableName: string, liquid: string }[] {
  if (expression.length === 0) return []
  const result = [] as { variableName: string, liquid: string }[]
  const firstToken = expression[0]
  let lastVariableName = ''
  if (firstToken.type === 'filter') throw new Error('Expression cannot start with a filter')
  if (firstToken.type === 'property' && firstToken.dataSourceId && firstToken.dataSourceId !== 'eleventy') {
    lastVariableName = firstToken.dataSourceId as string
  }
  const rest = [...expression]
  while (rest.length) {
    // Move all tokens until the first filter
    const firstFilterIndex = rest.findIndex(token => token.type === 'filter')
    const variableExpression = firstFilterIndex === -1 ? rest.splice(0) : rest.splice(0, firstFilterIndex)
    // Add all the filters until a property again
    const firstNonFilterIndex = rest.findIndex(token => token.type !== 'filter')
    const filterExpression = firstNonFilterIndex === -1 ? rest.splice(0) : rest.splice(0, firstNonFilterIndex)
    const variableName = getNextVariableName(component, numNextVar++)
    const statement = getLiquidStatement(variableExpression.concat(filterExpression), variableName, lastVariableName)
    lastVariableName = variableName
    result.push({
      variableName,
      liquid: statement,
    })
  }
  return result
}

export function getNextVariableName(component: Component, numNextVar: number): string {
  return `var_${component.ccid}_${numNextVar}`
}

/**
 * Get the liquid assign statement for the expression
 * The expression must
 * - start with a property or state
 * - once it has a filter it canot have a property again
 * - state can only be the first token
 *
 * Example of return value: `countries.continent.countries | first.name`
 */
export function getLiquidStatement(expression: Expression, variableName: string, lastVariableName: string = ''): string {
  if (expression.length === 0) throw new Error('Expression cannot be empty')
  // Split expression in 2: properties and filters
  const firstFilterIndex = expression.findIndex(token => token.type === 'filter')
  if (firstFilterIndex === 0) throw new Error('Expression cannot start with a filter')
  const properties = (firstFilterIndex < 0 ? expression : expression.slice(0, firstFilterIndex)) as (Property | State)[]
  const filters = firstFilterIndex > 0 ? expression.slice(firstFilterIndex) as Filter[] : []
  // Check that no properties or state come after filter
  if (filters.find(token => token.type !== 'filter')) {
    throw new Error('A filter cannot be followed by a property or state')
  }
  // Start with the assign statement
  return `assign ${variableName} = ${lastVariableName ? `${lastVariableName}.` : ''
  }${
    // Add all the properties
    getLiquidStatementProperties(properties)
  }${
    // Add all the filters
    getLiquidStatementFilters(filters)
  }`
}

export function getLiquidStatementProperties(properties: (Property | State)[]): string {
  return properties.map((token, index) => {
    switch (token.type) {
    case 'state': {
      if (index !== 0) throw new Error('State can only be the first token in an expression')
      return getStateVariableName(token.componentId, token.storedStateId)
    }
    case 'property': {
      if (token.fieldId === FIXED_TOKEN_ID) {
        return `"${token.options?.value ?? ''}"`
      }
      return token.fieldId
    }
    default: {
      throw new Error(`Only state or property can be used in an expression, got ${(token as Token).type}`)
    }
    }
  })
    .join('.')
}

export function getLiquidStatementFilters(filters: Filter[]): string {
  if (!filters.length) return ''
  return ' | ' + filters.map(token => {
    const options = token.options ? Object.entries(token.options)
      // Order the filter's options by the order they appear in the filter's optionsKeys
      .map(([key, value]) => ({
        key,
        value: value,
        order: token.optionsKeys?.indexOf(key),
      }))
      .sort((a, b) => {
        if (a.order === undefined && b.order === undefined) return 0
        if (a.order === undefined) return 1
        if (b.order === undefined) return -1
        return a.order - b.order
      })
      // Convert the options to liquid
      .map(({ key, value }) => handleFilterOption(token, key, value as string)) : []
    return `${token.filterName ?? token.id}${options.length ? `: ${options.join(', ')}` : ''}`
  })
    .join(' | ')
}

/**
 * Quote a string for liquid
 * Check that the string is not already quoted
 * Escape existing quotes
 */
function quote(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) return value
  return `"${value.replace(/"/g, '\\"')}"`
}

function handleFilterOption(filter: Filter, key: string, value: string): string {
  try {
    const expression = toExpression(value)
    if (expression) {
      const result = expression.map(token => {
        switch (token.type) {
        case 'property': {
          if (token.fieldId === FIXED_TOKEN_ID) {
            return `"${token.options?.value ?? ''}"`
          }
          return token.fieldId
        }
        case 'state': {
          return getStateVariableName(token.componentId, token.storedStateId)
        }
        case 'filter': {
          throw new Error('Filter cannot be used in a filter option')
        }
        }
      })
        .join('.')
      return filter.quotedOptions?.includes(key) ? quote(result) : result
    }
  } catch {
    // Ignore
  }
  return filter.quotedOptions?.includes(key) ? quote(value) : value
}
