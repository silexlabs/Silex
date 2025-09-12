import { Component } from 'grapesjs'
import { Context, DataSourceId, Expression, Field, Filter, IDataSource, Property, State, StateId, Token, Type, TypeId } from '../types'
import { DataSourceManagerState, getManager, getTypes, STANDARD_TYPES } from './dataSourceManager'
import { getOrCreatePersistantId, getState, getStateIds } from './state'
import { getExpressionResultType, getTokenOptions } from './token'
import { getFixedToken, NOTIFICATION_GROUP } from '../utils'

/**
 * Get the context of a component
 * This includes all parents states, data sources queryable values, values provided in the options
 */
export function getContext(component: Component, manager: DataSourceManagerState, currentStateId?: StateId, hideLoopData = false): Context {
  if (!component) {
    console.error('Component is required for context')
    throw new Error('Component is required for context')
  }
  // Get all queryable values from all data sources
  const queryable: Property[] = manager.cachedQueryables
    .map((field: Field) => {
      if (!field.dataSourceId) throw new Error(`Type ${field.id} has no data source`)
      return fieldToToken(field)
    })
  // Get all states in the component scope
  const states: State[] = []
  const loopProperties: Token[] = []
  let parent = component
  while (parent) {
    // Get explicitely set states
    states
      .push(...(getStateIds(parent, true, parent === component ? currentStateId : undefined)
        .map((stateId: StateId): State => ({
          type: 'state',
          storedStateId: stateId,
          previewIndex: 8888,
          label: getState(parent, stateId, true)?.label || stateId,
          componentId: getOrCreatePersistantId(parent),
          exposed: true,
        }))))
    // Get states from loops
    if (parent !== component || !hideLoopData) { // If it is a loop on the parent or if we don't hide the loop data
      const loopDataState = getState(parent, '__data', false)
      if (loopDataState) {
        try {
          const loopDataField = getExpressionResultType(loopDataState.expression, parent)
          if (loopDataField) {
            const displayName = (label: string) => `${parent.getName() ?? 'Unknown'}'s ${loopDataField.label} ${label}`
            if (loopDataField.kind === 'list') {
              loopProperties.push({
                type: 'state',
                storedStateId: '__data',
                componentId: getOrCreatePersistantId(parent),
                previewIndex: loopDataField.previewIndex,
                exposed: false,
                forceKind: 'object', // FIXME: this may be a scalar
                label: `Loop data (${loopDataField.label})`,
              }, {
                type: 'property',
                propType: 'field',
                fieldId: 'forloop.index0',
                label: displayName('forloop.index0'),
                kind: 'scalar',
                typeIds: ['number'],
              }, {
                type: 'property',
                propType: 'field',
                fieldId: 'forloop.index',
                label: displayName('forloop.index'),
                kind: 'scalar',
                typeIds: ['number'],
              })
            } else {
              console.warn('Loop data is not a list for component', parent, 'and state', loopDataState)
            }
          } else {
            console.warn('Loop data type not found for component', parent, 'and state', loopDataState)
          }
        } catch {
          console.error('Error while getting loop data for component', parent, 'and state', loopDataState)
        }
      }
    }
    // Go up to parent
    parent = parent.parent() as Component
  }
  // Get filters which accept no input
  const filters: Filter[] = manager.filters
    .filter(filter => {
      try {
        return filter.validate(null)
      } catch (e) {
        console.warn('Filter validate error:', e, {filter})
        return false
      }
    })
  // Add a fixed value
  const fixedValue = getFixedToken('')
  // Return the context
  return [
    ...queryable,
    ...states,
    ...loopProperties,
    ...filters,
    fixedValue,
  ]
}

/**
 * Create a property token from a field
 */
export function fieldToToken(field: Field): Property {
  if (!field) throw new Error('Field is required for token')
  if (!field.dataSourceId) throw new Error(`Field ${field.id} has no data source`)
  return {
    type: 'property',
    propType: 'field',
    fieldId: field.id,
    label: field.label,
    typeIds: field.typeIds,
    dataSourceId: field.dataSourceId,
    kind: field.kind,
    ...getTokenOptions(field) ?? {},
  }
}

function getType(typeId: TypeId, dataSourceId: DataSourceId | null, componentId: string | null): Type {
  const manager = getManager()
  if(dataSourceId) {
    // Get the data source
    const dataSource = manager.dataSources
      .find((dataSource: IDataSource) => !dataSourceId || dataSource.id === dataSourceId)
    if(!dataSource) throw new Error(`Data source not found ${dataSourceId}`)
    // Get its types
    const types = dataSource?.getTypes()
    // Return the requested type
    const type = types.find((type: Type) => type.id === typeId)
    if (!type) {
      manager.editor.runCommand('notifications:add', {
        type: 'error',
        group: NOTIFICATION_GROUP,
        message: `Type not found ${dataSourceId ?? ''}.${typeId}`,
        componentId,
      })
      throw new Error(`Type not found ${dataSourceId ?? ''}.${typeId}`)
    }
    return type
  } else {
    // No data source id: search in standard types
    const standardType = STANDARD_TYPES.find(type => type.id === typeId.toLowerCase())
    if(standardType) return standardType
    // No data source id: search in all types
    const type = getTypes().find(type => type.id === typeId)
    if (!type) throw new Error(`Unknown type ${typeId}`)
    return type
  }
}

/**
 * Auto complete an expression
 * @returns a list of possible tokens to add to the expression
 */
export function getCompletion(options: { component: Component, expression: Expression, manager: DataSourceManagerState, rootType?: TypeId, currentStateId?: StateId, hideLoopData?: boolean}): Context {
  const { component, expression, manager, rootType, currentStateId, hideLoopData } = options
  if (!component) throw new Error('Component is required for completion')
  if (!expression) throw new Error('Expression is required for completion')
  if (expression.length === 0) {
    if (rootType) {
      const type = getType(rootType, null, component.getId())
      if (!type) {
        console.warn('Root type not found', rootType)
        return []
      }
      return type.fields
        .map((field: Field) => fieldToToken(field))
    }
    return getContext(component, manager, currentStateId, hideLoopData)
  }
  const field = getExpressionResultType(expression, component)
  if (!field) {
    console.warn('Result type not found for expression', expression)
    return []
  }
  return ([] as Token[])
    // Add fields if the kind is object
    .concat(field.kind === 'object' ? field.typeIds
      // Find possible types
      .map((typeId: TypeId) => getType(typeId, field.dataSourceId ?? null, component.getId()))
      // Add all of their fields
      .flatMap((type: Type | null) => type?.fields ?? [])
      // To token
      .flatMap(
        (fieldOfField: Field): Token[] => {
          // const t: Type | null = this.findType(field.typeIds, field.dataSourceId)
          // if(!t) throw new Error(`Type ${field.typeIds} not found`)
          return fieldOfField.typeIds.map((typeId: TypeId) => ({
            ...fieldToToken(fieldOfField),
            typeIds: [typeId ],
          }))
        }
      ) : [])
    // Add filters
    .concat(
      manager.filters
        // Match input type
        .filter((filter: Filter) => {
          try {
            return filter.validate(field)
          } catch (e) {
            console.warn('Filter validate error:', e, {filter, field })
            return false
          }
        })
    )
}
