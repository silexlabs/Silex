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

import { Component, Page } from 'grapesjs'
import { Context, DATA_SOURCE_CHANGED, DATA_SOURCE_READY, DataSourceId, Expression, Field, FieldArgument, Property, Filter, IDataSource, Options, State, StateId, Token, Type, TypeId, StoredToken } from '../types'
import { getStateIds, getState, getOrCreatePersistantId, getParentByPersistentId } from './state'
import { DataSourceEditor } from '..'
import { TemplateResult, html } from 'lit'

/**
 * Options of the data tree
 * They can be set on the instance too
 */
export interface DataTreeOptions {
  filters: Partial<Filter>[] | string
  dataSources: IDataSource[]
}

/**
 * Error thrown when a query cannot be built
 */
export interface BuildQueryErrorOptions {
  expression: Expression
  component: Component
  token: Token
}
export class BuildQueryError extends Error {
  public expression: Expression
  public component: Component
  public token: Token

  constructor(message: string, options: BuildQueryErrorOptions) {
    super(message)
    this.expression = options.expression
    this.component = options.component
    this.token = options.token
  }
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

  /**
   * All queryable fields from all data sources
   */
  protected _queryables: Field[] = []
  public get queryables(): Field[] {
    return this._queryables
  }

  constructor(protected editor: DataSourceEditor, protected options: {dataSources: IDataSource[], filters: Filter[]}) {
    this.dataSources = options.dataSources
    this.filters = options.filters

    // Check that all filters have required fields
    this.filters.forEach((filter: Filter) => {
      if(!filter.id) throw new Error('Filter id is required')
      if(!filter.label) throw new Error('Filter name is required')
      if(!filter.validate) throw new Error('Filter validate is required')
      if(!filter.output) throw new Error('Filter outputType is required')
      if(!filter.apply) throw new Error('Filter apply is required')
    })
    editor.on(`${DATA_SOURCE_CHANGED} ${DATA_SOURCE_READY}`, () => {
      this._allTypes = this.getAllTypes()
      this._queryables = this.getAllQueryables()
    })
    this._allTypes = this.getAllTypes()
    this._queryables = this.getAllQueryables()
  }

  /**
   * Get all types from all data sources
   */
  getAllTypes(): Type[] {
    return this.dataSources
      .flatMap((dataSource: IDataSource) => {
        return dataSource.getTypes()
      })
  }

  /**
   * Get all queryable fields from all data sources
   */
  getAllQueryables(): Field[] {
    return this.dataSources
      .flatMap((dataSource: IDataSource) => {
        return dataSource.getQueryables()
      })
  }

  /**
   * Get the options of a token
   */
  getTokenOptions(field: Field): { optionsForm: (input: Field | null, options: Options) => TemplateResult, options: Options} | null {
    if (field.arguments && field.arguments.length > 0) {
      return {
        optionsForm: this.optionsToOptionsForm(field.arguments.map((arg) => ({ name: arg.name, value: arg.defaultValue }))),
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
  optionsToOptionsForm(arr: {name: string, value: unknown}[]): (input: Field | null, options: Options) => TemplateResult {
    return (input: Field | null, options: Options) => {
      return html`
            <form>
              ${arr.map((obj) => {
        const value = options[obj.name] ?? obj.value ?? ''
        return html`<label>${obj.name}</label><input type="text" name=${obj.name} value=${value}>`
      })
        }
              <div class="buttons">
                <input type="reset" value="Cancel">
                <input type="submit" value="Apply">
              </div>
            </form>
          `
    }
  }

  /**
   * Get the context of a component
   * This includes all parents states, data sources queryable values, values provided in the options
   */
  getContext(component = this.editor.getSelected()): Context {
    if(!component) {
      console.error('Component is required for context')
      throw new Error('Component is required for context')
    }
    // Get all queryable values from all data sources
    const queryable: Property[] = this.queryables
      .map((field: Field) => {
        if(!field.dataSourceId) throw new Error(`Type ${field.id} has no data source`)
        return this.fieldToToken(field)
      })
    // Get all states in the component scope
    const states: State[] = []
    const loopProperties: Token[] = []
    let parent = component
    while(parent) {
      // Get explicitely set states
      states.push(...(getStateIds(parent, true)
        .map((stateId: StateId): State => ({
          type: 'state',
          storedStateId: stateId,
          label: getState(parent, stateId, true)?.label || stateId,
          componentId: getOrCreatePersistantId(parent),
          exposed: true,
        }))))
      // Get states from loops
      //if (parent !== component) {
        const loopDataState = getState(parent, '__data', false)
        if (loopDataState) {
          const loopDataField = this.getExpressionResultType(loopDataState.expression, parent)
          if (loopDataField) {
            if (loopDataField.kind === 'list') {
              loopProperties.push({
                type: 'state',
                storedStateId: '__data',
                componentId: getOrCreatePersistantId(parent),
                exposed: false,
                forceKind: 'object', // FIXME: this may be a scalar
                label: loopDataField.label,
              }, {
                type: 'property',
                propType: 'field',
                fieldId: 'loopindex0',
                label: 'Loop index (0 based)',
                kind: 'scalar',
                typeIds: ['number'],
              }, {
                type: 'property',
                propType: 'field',
                fieldId: 'loopindex',
                label: 'Loop index (starts at 1)',
                kind: 'scalar',
                typeIds: ['number'],
              })
            } else {
              console.warn('Loop data is not a list for component', parent, 'and state', loopDataState)
            }
          } else {
            console.warn('Loop data type not found for component', parent, 'and state', loopDataState)
          }
        }
      //}
      // Go up to parent
      parent = parent.parent() as Component
    }
    // Get filters which accept no input
    const filters: Filter[] = this.filters
      .filter(filter => filter.validate(null))
    // Return the context
    return [
      ...queryable,
      ...states,
      ...loopProperties,
      ...filters,
    ]
  }

  /**
   * Create a property token from a field
   */
  fieldToToken(field: Field): Property {
    if(!field) throw new Error('Field is required for token')
    if(!field.dataSourceId) throw new Error(`Field ${field.id} has no data source`)
    return {
      type: 'property',
      propType: 'field',
      fieldId: field.id,
      label: field.label,
      typeIds: field.typeIds,
      dataSourceId: field.dataSourceId,
      kind: field.kind,
      ...this.getTokenOptions(field) ?? {},
    }
  }

  /**
   * Evaluate an expression to a value
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getValue(context: Context, expression: Expression): unknown {
    throw new Error('Not implemented')
  }

  findType(typeId: TypeId, dataSourceId?: DataSourceId): Type | null {
    return this.allTypes
      .find((type: Type) => (!dataSourceId || type.dataSourceId === dataSourceId) && type.id === typeId) ?? null
  }

  /**
   * Add missing methonds to the filter
   * When filters are stored they lose their methods
   */
  getFilterFromToken(token: Filter, filters: Filter[]): Filter {
    const filter = filters.find(filter => filter.id === token.id)
    if(!filter) {
      console.error('Filter not found', token)
      throw new Error(`Filter ${token.id} not found`)
    }
    return {
      ...token,
      ...filter,
    }
  }

  /**
   * Get the token from its stored form
   */
  fromStored<T extends Token = Token>(token: StoredToken): T {
    switch (token.type) {
      case 'filter': {
        if((token as Filter).optionsForm) return token as T
        const original = this.filters.find(filter => filter.id === token.id) as T | undefined
        if(!original) {
          console.error('Filter not found', token)
          throw new Error(`Filter ${token.id} not found`)
        }
        return {
          ...original,
          ...token,
        } as T
      }
      case 'property': {
        if((token as Property).optionsForm) return token as T
        const field = this.propertyToField(token)
        if(!field) {
          console.error('Field not found for token', token)
          throw new Error(`Field ${token.fieldId} not found`)
        }
        return {
          ...this.getTokenOptions(field) ?? {},
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
  tokenToField(token: Token, prev: Field | null, component: Component): Field | null {
    switch (token.type) {
      case 'filter': {
        const filter = this.getFilterFromToken(token, this.filters)
        if(filter.validate(prev)) {
          return filter.output(prev, filter.options ?? {})
        }
        return null
      }
      case 'property':
        return this.propertyToField(token)
      case 'state': {
        const parent = getParentByPersistentId(token.componentId, component)
        if(!parent) {
          console.warn('Component not found for state', token)
          // TODO: notification
          return null
        }
        const expression = getState(parent, token.storedStateId, token.exposed)?.expression
        if(!expression) {
          console.warn('State is not defined on component', { component: parent, token })
          // TODO: notification
          return null
        }
        const field = this.getExpressionResultType(expression, parent)
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

  propertyToField(property: Property): Field {
    const typeNames = property.typeIds
      .map((typeId: TypeId) => this.findType(typeId, property.dataSourceId))
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
  expressionToFields(expression: Expression, component: Component): Field[] {
    // Resolve type of the expression 1 step at a time
    let prev: Field | null = null
    return expression.map((token) => {
      const field = this.tokenToField(this.fromStored(token), prev, component)
      if(!field) {
        console.warn('Type not found for token in expressionToFields', {token, expression})
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
  getExpressionResultType(expression: Expression, component: Component): Field | null {
    // Resolve type of the expression 1 step at a time
    return expression.reduce((prev: Field | null, token: StoredToken) => {
      return this.tokenToField(this.fromStored(token), prev, component)
    }, null)
  }

  /**
   * Auto complete an expression
   * @returns a list of possible tokens to add to the expression
   */
  getCompletion(component: Component, expression: Expression): Context {
    if(!component) throw new Error('Component is required for completion')
    if(!expression) throw new Error('Expression is required for completion')
    if(expression.length === 0) return this.getContext(component)
    const field = this.getExpressionResultType(expression, component)
    if(!field) {
      console.warn('Result type not found for expression', expression)
      return []
    }
    return ([] as Token[])
      // Add fields if the kind is object
      .concat(field.kind === 'object' ? field.typeIds
        // Find possible types
        .map((typeId: TypeId) => this.findType(typeId, field.dataSourceId))
        // Add all of their fields
        .flatMap((type: Type | null) => type?.fields ?? [])
        // To token
        .map(
          (field: Field): Token  => {
            // const t: Type | null = this.findType(field.typeIds, field.dataSourceId) 
            // if(!t) throw new Error(`Type ${field.typeIds} not found`)
            return this.fieldToToken(field)
          }
        ) : [])
      // Add filters
      .concat(
        this.filters
          // Match input type
          .filter(filter => filter.validate(field))
      )
  }

  /**
   * Get all expressions used in all pages
   */
  getAllPagesExpressions(): { page: Page, expressions: Expression[] }[] {
    return this.editor.Pages.getAll()
      .map((page: Page) => ({
        page,
        expressions: this.getPageExpressions(page),
      }))
  }

  /**
   * Get all expressions used in a page
   * This will be used to fetch data for the page
   */
  getPageExpressions(page: Page): Expression[] {
    return this.getComponentExpressionsRecursive(page.getMainComponent())
  }

  /**
   * Get all expressions used by a component and its children
   */
  getComponentExpressionsRecursive(component: Component): Expression[] {
    const queries = [] as Expression[]
    queries.push(...this.getComponentExpressions(component))
    component.components()
      .forEach((child: Component) => {
        queries.push(...this.getComponentExpressionsRecursive(child))
      })
    return queries
  }

  /**
   * Get all expressions used by a component
   * Resolves all states token as expressions recursively
   * Resulting expressions contain properties and filters only, no states anymore
   */
  resolveState(state: State, component: Component): Expression | null {
    const parent = getParentByPersistentId(state.componentId, component)
    if(!parent) {
      console.warn('Component not found for state', state)
      return null
    }
    // Get the expression of the state
    const soredState = getState(parent, state.storedStateId, state.exposed)
    if(!soredState?.expression) {
      console.warn('State is not defined on component', parent, state)
      return null
    }
    return soredState.expression
      .flatMap((token: StoredToken) => {
        switch (token.type) {
          case 'state': {
            return this.resolveState(this.fromStored(token), parent) ?? []
          }
          default:
            return token
        }
      })
  }

  /**
   * Get all expressions used by a component
   * Resolves all states token as expressions recursively
   * Resulting expressions contain properties and filters only, no states anymore
   */
  getComponentExpressions(component: Component): Expression[] {
    return ([] as Expression[])
      // Visible states (custom / user defined)
      .concat(getStateIds(component, true).map(stateId => getState(component, stateId, true)?.expression))
      // Hidden states (loop / internals)
      .concat(getStateIds(component, false).map(stateId => getState(component, stateId, false)?.expression))
      // Resolve state expressions
      .map((expression) => expression?.flatMap((token: StoredToken) => {
        switch (token.type) {
          case 'state':
            return this.resolveState(token, component) ?? []
          default:
            return token
        }
      }))
  }
}
