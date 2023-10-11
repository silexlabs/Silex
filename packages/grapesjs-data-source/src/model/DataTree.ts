import { Component } from 'grapesjs'
import { DATA_SOURCE_CHANGED, DATA_SOURCE_READY, DataSourceId, Field, FieldId, IDataSource, Type, TypeId, TypeKind } from '../types'
import { StateId, getState, getStates } from './state'
import { DataSourceEditor } from '..'

/**
 * A token can be a property or a filter
 */
export type Token = Property | Filter | State

/**
 * A property is used to make expressions and access data from the data source
 */
export type Property = TypeProperty | FieldProperty

export interface BaseProperty {
  type: 'property'
  propType: 'type' | 'field'
  dataSourceId: DataSourceId | null
  kind: TypeKind
}

export interface TypeProperty extends BaseProperty {
  propType: 'type'
  typeId: TypeId
}

export interface FieldProperty extends BaseProperty {
  propType: 'field'
  typeId: TypeId
  fieldId: FieldId
  parentTypeId: TypeId
}

/**
 * A filter is used to alter data in an expression
 * It is provided in the options
 */
export type FilterId = string
export interface Filter {
  type: 'filter'
  id: FilterId
  name: string
  options: Record<string, unknown>
  optionsForm: string | null
  validate: (input: Type | null) => boolean
  outputType: (input: Type | null) => Type | null
  apply: (input: unknown, options: Record<string, unknown>) => unknown
}

/**
 * A component state
 */
export interface State {
  type: 'state'
  id: StateId
  typeId: TypeId
  componentCid: string
}

/**
 * A context is a list of available tokens for a component
 */
export type Context = Token[]


/**
 * An expression is a list of tokens which can be evaluated to a value
 * It is used to access data from the data source
 */
export type Expression = Token[]

/**
 * Options of the data tree
 * They can be set on the instance too
 */
export interface DataTreeOptions {
  filters: Partial<Filter>[]
  dataSources: IDataSource[]
}

export class DataTree {
  public dataSources: IDataSource[] = []
  public filters: Filter[] = []

  /**
   * All types from all data sources
   * Read only, updated when data sources are updated
   */
  protected _allTypes: Type[] = []
  public get allTypes(): Type[] {
    return this._allTypes
  }

  constructor(editor: DataSourceEditor, options: DataTreeOptions) {
    this.dataSources = options.dataSources
    this.filters = options.filters.map((filter: Partial<Filter>) => ({
      type: 'filter',
      ...filter,
    } as Filter))
    // Check that all filters have required fields
    this.filters.forEach((filter: Filter) => {
      if(!filter.id) throw new Error('Filter id is required')
      if(!filter.name) throw new Error('Filter name is required')
      if(!filter.validate) throw new Error('Filter validate is required')
      if(!filter.outputType) throw new Error('Filter outputType is required')
      if(!filter.apply) throw new Error('Filter apply is required')
    })
    editor.on(`${DATA_SOURCE_CHANGED} ${DATA_SOURCE_READY}`, () => {
      this._allTypes = this.getAllTypes()
    })
    this._allTypes = this.getAllTypes()
  }

  /**
   * Get all types from all data sources
   * FIXME: This should be cached
   */
  getAllTypes(): Type[] {
    return this.dataSources
      .flatMap((dataSource: IDataSource) => {
        return dataSource.getTypes()
      })
  }

  /**
   * Get the context of a component
   * This includes all parents states, data sources queryable values, values provided in the options
   */
  getContext(component: Component): Context {
    // Get all queryable values from all data sources
    const queryable: TypeProperty[] = this.allTypes
      .filter((type: Type) => type.queryable)
      .map((type: Type) => {
        if(!type.dataSourceId) throw new Error(`Type ${type.id} has no data source`)
        return {
          type: 'property',
          propType: 'type',
          typeId: type.id,
          dataSourceId: type.dataSourceId,
          kind: type.kind,
        }
      })
    // Get all states in the component scope
    const states: State[] = []
    let parent = component
    while(parent) {
      const parentStates: State[] = getStates(parent)
        .map((stateId: StateId) => ({
          type: 'state',
          id: stateId,
          typeId: getState(parent, stateId).typeId,
          componentCid: parent.cid,
        }))
      states.push(...parentStates)
      parent = parent.parent() as Component
    }
    // Get filters which accept no input
    const filters: Filter[] = this.filters
      .filter(filter => filter.validate(null))
    // Return the context
    return [
      ...queryable,
      ...states,
      ...filters,
    ]
  }

  /**
   * Evaluate an expression to a value
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getValue(context: Context, expression: Expression): unknown {
    throw new Error('Not implemented')
  }

  findType(typeId: TypeId, dataSourceId?: DataSourceId | null): Type | null {
    return this.allTypes
      .find((type: Type) => (!dataSourceId || type.dataSourceId === dataSourceId) && type.id === typeId) ?? null
  }

  /**
   * Get the type corresponding to a token
   */
  getTypeFromToken(token: Token, prevType: Type | null): Type | null {
    switch (token.type) { 
      case 'filter':
        return token.outputType(prevType)
      case 'property':
        switch (token.propType) {
          case 'type':
            return this.findType(token.typeId, token.dataSourceId) ?? null
          case 'field': {
            const type = this.findType(token.typeId, token.dataSourceId) ?? null
            if(type) {
              return {
                ...type,
                kind: token.kind,
              }
            }
            return null
          }
          default:
            console.error('Unknown property type (reading propType)', token)
            throw new Error('Unknown property type')
        }
      case 'state':
        return this.findType(token.typeId) ?? null
      default:
        console.error('Unknown token type (reading type)', token)
        throw new Error('Unknown token type')
    }
  }

  /**
   * Evaluate the types of each token in an expression
   */
  getAllTypesFromExpression(expression: Expression): Type[] {
    // Resolve type of the expression 1 step at a time
    let lastType: Type | null = null
    return expression.map((token: Token) => {
      lastType = this.getTypeFromToken(token, lastType)
      if(!lastType) throw new Error(`Type not found for token ${token.type}`)
      return lastType
    })
  }

  /**
   * Evaluate an expression to a type
   * This is used to validate expressions and for autocompletion
   */
  getTypeFromExpression(expression: Expression): Type | null {
    // Resolve type of the expression 1 step at a time
    return expression.reduce((type: Type | null, token: Token) => {
      return this.getTypeFromToken(token, type)
    }, null)
  }

  /**
   * Get the type corresponding to a property token
   */
  getTypeFromProperty(token: Property): Type | null {
    switch (token.propType) {
      case 'type':
        return this.findType(token.typeId, token.dataSourceId) ?? null
      case 'field': {
        const type = this.findType(token.typeId, token.dataSourceId) ?? null
        return type
      }
      default:
        console.error('Unknown property type (reading propType)', token)
        throw new Error('Unknown property type')
    }
  }

  /**
   * Auto complete an expression
   * @returns a list of possible tokens to add to the expression
   */
  getCompletion(component: Component, expression: Expression): Context {
    if(!component) throw new Error('Component is required for completion')
    if(!expression) throw new Error('Expression is required for completion')
    if(expression.length === 0) return this.getContext(component)
    const type = this.getTypeFromExpression(expression)
    if(!type) {
      console.error('Type not found for expression', expression)
      throw new Error('Type not found for expression')
    }
    return ([] as Token[])
      // Add fields if the kind is object
      .concat(type.kind === 'object' ? type.fields
        // To type
        .map(
          (field: Field): Token  => {
            const t: Type | null = this.findType(field.typeId, field.dataSourceId) 
            if(!t) throw new Error(`Type ${field.typeId} not found`)
            // To token
            return {
              type: 'property',
              propType: 'field',
              typeId: t.id,
              fieldId: field.id,
              parentTypeId: type.id,
              kind: field.kind,
              dataSourceId: t.dataSourceId ?? null,
            }
          }
        ) : [])
      // Add filters
      .concat(
        this.filters
          // Match input type
          .filter(filter => filter.validate(type))
      )
  }
}
