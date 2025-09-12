/**
 * Liquid Filter Engine
 * Centralized management of Liquid template filters
 */

import { Editor } from 'grapesjs'
import { DataSourceEditorOptions, Filter } from '../types'
import getLiquidFilters from './liquid'

/**
 * Liquid Engine interface for managing and applying filters
 */
export interface LiquidEngine {
  readonly filters: ReadonlyMap<string, Filter>
  applyFilter: (value: unknown, filterId: string, options: Record<string, unknown>) => unknown
  hasFilter: (filterId: string) => boolean
}

/**
 * Create a Liquid engine with the given filters
 */
export function createLiquidEngine(filters: readonly Filter[]): LiquidEngine {
  const filterMap = new Map(filters.map(f => [f.id, f]))

  return {
    filters: filterMap,

    applyFilter(value: unknown, filterId: string, options: Record<string, unknown>): unknown {
      const filter = filterMap.get(filterId)
      if (!filter) {
        throw new Error(`Liquid filter not found: ${filterId}`)
      }
      return filter.apply(value, options)
    },

    hasFilter(filterId: string): boolean {
      return filterMap.has(filterId)
    }
  }
}

/**
 * Validate that required filter fields are present
 */
export function validateFilter(filter: Filter): void {
  if (!filter.id) throw new Error('Filter id is required')
  if (!filter.label) throw new Error('Filter label is required')
  if (!filter.validate) throw new Error('Filter validate is required')
  if (!filter.output) throw new Error('Filter output is required')
  if (!filter.apply) throw new Error('Filter apply is required')
}

/**
 * Validate multiple filters
 */
export function validateFilters(filters: readonly Filter[]): void {
  filters.forEach(validateFilter)
}

/**
 * Add filters to an existing engine
 */
export function addFiltersToEngine(engine: LiquidEngine, filters: readonly Filter[]): LiquidEngine {
  validateFilters(filters)
  const allFilters = [...engine.filters.values(), ...filters]
  return createLiquidEngine(allFilters)
}

/**
 * Remove filters from an existing engine
 */
export function removeFiltersFromEngine(engine: LiquidEngine, filterIds: readonly string[]): LiquidEngine {
  const remaining = [...engine.filters.values()].filter(f => !filterIds.includes(f.id))
  return createLiquidEngine(remaining)
}

/**
 * Initialize filters from options
 */
export function initializeFilters(editor: Editor, options: DataSourceEditorOptions): Filter[] {
  if (typeof options.filters === 'string') {
    return [
      ...getLiquidFilters(editor),
    ]
  } else {
    return (options.filters as Filter[])
      .flatMap((filter: Partial<Filter> | string): Filter[] => {
        if (typeof filter === 'string') {
          switch (filter) {
          case 'liquid': return getLiquidFilters(editor)
          default: throw new Error(`Unknown filters ${filter}`)
          }
        } else {
          return [{
            ...filter as Partial<Filter>,
            type: 'filter',
          } as Filter]
        }
      })
      .map((filter: Filter) => ({ ...filter, type: 'filter' })) as Filter[]
  }
}
