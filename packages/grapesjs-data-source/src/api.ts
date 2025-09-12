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

/**
 * Public API for @silexlabs/grapesjs-data-source
 *
 * This file contains all the functions that calling apps should use.
 * It provides clean, simple APIs that hide internal complexity like DataTree management.
 */

import { Page, Editor, Component } from 'grapesjs'
import { DataSourceId, IDataSource, Expression, StateId, StoredToken, Token, Field, Context, TypeId, Filter } from './types'

// Internal imports
import { getPageQuery as getPageQueryInternal, buildPageQueries as buildPageQueriesInternal } from './model/queryBuilder'
import { refreshDataSources as refreshDataSourcesInternal, getFilters as getFiltersInternal, setFilters as setFiltersInternal, getCachedQueryables as getCachedQueryablesInternal, setPreviewData as setPreviewDataInternal, getManager } from './model/dataSourceManager'
import {
  getAllDataSources as getAllDataSourcesInternal,
  getDataSource as getDataSourceInternal,
  addDataSource as addDataSourceInternal,
  removeDataSource as removeDataSourceInternal
} from './model/dataSourceRegistry'
import {
  loadPreviewData as loadPreviewDataInternal,
  getPreviewData as getPreviewDataInternal,
  clearPreviewData as clearPreviewDataInternal
} from './model/previewDataLoader'
import {
  fromStored as fromStoredInternal,
  getExpressionResultType as getExpressionResultTypeInternal
} from './model/token'
import {
  getPersistantId as getPersistantIdInternal,
  getOrCreatePersistantId as getOrCreatePersistantIdInternal,
  getState as getStateInternal,
  getStateIds as getStateIdsInternal,
  setState as setStateInternal,
  removeState as removeStateInternal,
  getStateVariableName as getStateVariableNameInternal,
  COMPONENT_NAME_PREFIX as COMPONENT_NAME_PREFIX_INTERNAL,
  type PersistantId,
  type StoredState
} from './model/state'
import { NOTIFICATION_GROUP as NOTIFICATION_GROUP_INTERNAL, toExpression as toExpressionInternal, createDataSource as createDataSourceInternal } from './utils'
import { getPageExpressions as getPageExpressionsInternal } from './model/ExpressionTree'
import { evaluateExpressionTokens, EvaluationContext } from './model/expressionEvaluator'
import { GraphQLOptions } from './datasources/GraphQL'
import { getCompletion as getCompletionInternal } from './model/completion'
import getLiquidFiltersInternal from './filters/liquid'

// ===============================
// QUERY GENERATION
// ===============================

/**
 * Generate GraphQL query for a single page
 * Used by both preview and production (11ty site generation)
 *
 * @param page - The GrapesJS page to generate query for
 * @param editor - The GrapesJS editor instance
 * @returns Record of data source ID to GraphQL query string
 */
export function getPageQuery(page: Page, editor: Editor): Record<DataSourceId, string> {
  return getPageQueryInternal(page, editor)
}

/**
 * Generate queries for multiple pages
 * Useful for batch operations like static site generation
 *
 * @param pages - Array of GrapesJS pages
 * @param editor - The GrapesJS editor instance
 * @returns Record of page ID to data source queries
 */
export function buildPageQueries(pages: Page[], editor: Editor): Record<string, Record<DataSourceId, string>> {
  return buildPageQueriesInternal(pages, editor)
}

// ===============================
// DATA SOURCE MANAGEMENT
// ===============================

/**
 * Get all data sources
 * @returns Array of all registered data sources
 */
export function getAllDataSources(): IDataSource[] {
  return getAllDataSourcesInternal()
}

/**
 * Get a specific data source by ID
 * @param id - The data source ID
 * @returns The data source or undefined if not found
 */
export function getDataSource(id: DataSourceId): IDataSource | undefined {
  return getDataSourceInternal(id)
}

/**
 * Add a new data source
 * @param dataSource - The data source to add
 */
export function addDataSource(dataSource: IDataSource): void {
  return addDataSourceInternal(dataSource)
}

/**
 * Remove a data source
 * @param dataSource - The data source to remove
 */
export function removeDataSource(dataSource: IDataSource): void {
  return removeDataSourceInternal(dataSource)
}

/**
 * Refresh preview data from all data sources
 * Triggers data loading for the current page
 */
export function refreshDataSources(): void {
  return refreshDataSourcesInternal()
}

// ===============================
// PREVIEW DATA MANAGEMENT
// ===============================

/**
 * Load preview data for the current page
 * @param forceRefresh - If true, bypass query comparison and force refresh
 * @returns Promise that resolves when data is loaded
 */
export function loadPreviewData(forceRefresh: boolean = false): Promise<void> {
  return loadPreviewDataInternal(forceRefresh)
}

/**
 * Get current preview data
 * @returns Record of data source ID to preview data
 */
export function getPreviewData(): Record<DataSourceId, unknown> {
  return getPreviewDataInternal()
}

/**
 * Set preview data for all data sources
 * @param data - Record mapping data source IDs to their preview data
 */
export function setPreviewData(data: Record<DataSourceId, unknown>): void {
  setPreviewDataInternal(data)
}

/**
 * Clear all preview data
 */

export function clearPreviewData(): void {
  return clearPreviewDataInternal()
}

// ===============================
// DATA TREE OPERATIONS
// ===============================


/**
 * Evaluate an expression with current preview data
 * @param expression - The expression to evaluate
 * @param component - The component context
 * @returns The evaluated result
 */
export function getValue(expression: Expression, component: Component, resolvePreviewIndex = true): unknown {
  const context: EvaluationContext = {
    dataSources: getAllDataSources(),
    filters: getFiltersInternal(),
    previewData: getPreviewDataInternal(),
    component,
    resolvePreviewIndex
  }
  return evaluateExpressionTokens(expression, context)
}

/**
 * Get all expressions used by components on a page
 * @param page - The page to analyze
 * @returns Array of component expressions
 */
export function getPageExpressions(page: Page) {
  const manager = getManager()
  return getPageExpressionsInternal(manager, page)
}

/**
 * Get auto-completion options for expressions
 * @param options - Completion options including component, expression, etc.
 * @returns Context with available tokens for completion
 */
export function getCompletion(options: { component: Component, expression: Expression, rootType?: TypeId, currentStateId?: StateId, hideLoopData?: boolean}): Context {
  const manager = getManager()
  return getCompletionInternal({
    ...options,
    manager
  })
}

/**
 * Convert a stored token to its full form with methods and properties
 * @param token - The stored token to convert
 * @param componentId - The component ID for context (can be null)
 * @returns The full token with all properties and methods
 */
export function fromStored<T extends Token = Token>(token: StoredToken, componentId: string | null): T {
  return fromStoredInternal(token, componentId)
}

/**
 * Get the result type of an expression
 * @param expression - The expression to analyze
 * @param component - The component context
 * @returns The field describing the result type, or null if invalid
 */
export function getExpressionResultType(expression: Expression, component: Component): Field | null {
  return getExpressionResultTypeInternal(expression, component)
}

export function addFilters(filters: Filter | Filter[]) {
  const currentFilters = getFiltersInternal()
  const newFilters = Array.isArray(filters) ? filters : [filters]
  setFiltersInternal(currentFilters.concat(newFilters))
}

/**
 * Remove filters from the data tree.
 * Accepts a single Filter or an array of Filters.
 * Removes by reference.
 */
export function removeFilters(filters: Filter | Filter[]) {
  const currentFilters = getFiltersInternal()
  if (Array.isArray(filters)) {
    setFiltersInternal(currentFilters.filter(f => !filters.includes(f)))
  } else {
    setFiltersInternal(currentFilters.filter(f => f !== filters))
  }
}

// ===============================
// STATE MANAGEMENT
// ===============================

/**
 * Get the persistent ID of a component
 * @param component - The component to get ID for
 * @returns The persistent ID or null if not set
 */
export function getPersistantId(component: Component): PersistantId | null {
  return getPersistantIdInternal(component)
}

/**
 * Get or create the persistent ID of a component
 * @param component - The component to get/create ID for
 * @returns The persistent ID
 */
export function getOrCreatePersistantId(component: Component): PersistantId {
  return getOrCreatePersistantIdInternal(component)
}

/**
 * Get a state from a component
 * @param component - The component to get state from
 * @param id - The state ID
 * @param exported - Whether to get exported (public) or private state
 * @returns The state or null if not found
 */
export function getState(component: Component, id: StateId, exported: boolean = true): StoredState | null {
  return getStateInternal(component, id, exported)
}

/**
 * Get all state IDs from a component
 * @param component - The component to get state IDs from
 * @param exported - Whether to get exported (public) or private state IDs
 * @param before - Optional state ID to get IDs before
 * @returns Array of state IDs
 */
export function getStateIds(component: Component, exported: boolean = true, before?: StateId): StateId[] {
  return getStateIdsInternal(component, exported, before)
}

/**
 * Set a state on a component
 * @param component - The component to set state on
 * @param id - The state ID
 * @param state - The state to set
 * @param exported - Whether to set as exported (public) or private state
 * @param index - Optional index to insert at
 */
export function setState(component: Component, id: StateId, state: StoredState, exported: boolean = true, index: number = -1): void {
  return setStateInternal(component, id, state, exported, index)
}

/**
 * Remove a state from a component
 * @param component - The component to remove state from
 * @param id - The state ID to remove
 * @param exported - Whether to remove from exported (public) or private states
 */
export function removeState(component: Component, id: StateId, exported: boolean = true): void {
  return removeStateInternal(component, id, exported)
}

/**
 * Get the variable name for a state
 * @param componentId - The component ID
 * @param stateId - The state ID
 * @returns The variable name
 */
export function getStateVariableName(componentId: string, stateId: StateId): string {
  return getStateVariableNameInternal(componentId, stateId)
}

// ===============================
// TOKEN AND EXPRESSION UTILITIES
// ===============================

/**
 * Convert JSON or string to an Expression object
 * @param json - The JSON or string to convert
 * @returns The Expression object or null if invalid
 */
export function toExpression(json: unknown | string): Expression | null {
  return toExpressionInternal(json)
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Create a data source instance
 * @param options - The data source configuration
 * @returns The created data source
 */
export function createDataSource(opts: Partial<GraphQLOptions> = {}): IDataSource {
  return createDataSourceInternal(opts)
}

// ===============================
// CONSTANTS
// ===============================

/**
 * Notification group name for data source notifications
 */
export const NOTIFICATION_GROUP = NOTIFICATION_GROUP_INTERNAL

/**
 * Component name prefix for data source components
 */
export const COMPONENT_NAME_PREFIX = COMPONENT_NAME_PREFIX_INTERNAL

// ===============================
// Types
// ===============================

export * from './types'
