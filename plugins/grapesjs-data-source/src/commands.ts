import {
  DataSourceEditorOptions,
  COMMAND_REFRESH,
  COMMAND_PREVIEW_ACTIVATE,
  COMMAND_PREVIEW_DEACTIVATE,
  COMMAND_PREVIEW_REFRESH,
  COMMAND_PREVIEW_TOGGLE,
  PREVIEW_ACTIVATED,
  PREVIEW_DEACTIVATED,
  FIXED_TOKEN_ID,
} from './types'
import { refreshDataSources } from './model/dataSourceManager'
import { Editor, Component } from 'grapesjs'
import { doRender, restoreOriginalRender } from './view/canvas'
import {
  getAllDataSources,
  getDataSource,
  getState,
  getStateIds,
  setState,
  removeState,
  toExpression,
} from './api'

// Command IDs for data source management
export const CMD_DS_LIST = 'data-source:list'
export const CMD_DS_GET_STATES = 'data-source:get-states'
export const CMD_DS_SET_STATE = 'data-source:set-state'
export const CMD_DS_REMOVE_STATE = 'data-source:remove-state'

/**
 * Validate an expression with explicit error messages.
 * Checks both token structure and data source schema references.
 * Throws with a detailed message on the first error found.
 */
function validateExpression(tokens: unknown[]): void {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    throw new Error('Expression must be a non-empty array of tokens.')
  }
  const dataSources = getAllDataSources()
  const dsIds = dataSources.map(ds => ds.id)

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i] as Record<string, unknown>
    const prefix = `Token[${i}]`

    if (!token || typeof token !== 'object') {
      throw new Error(`${prefix}: must be an object. Got ${typeof token}.`)
    }
    if (!token.type) {
      throw new Error(`${prefix}: missing "type". Must be "property", "filter", or "state".`)
    }

    switch (token.type) {
    case 'property': {
      if (!token.fieldId) {
        throw new Error(`${prefix}: property token missing "fieldId". Use "fixed" for a fixed value, or a field name from your data source.`)
      }
      // Fixed values just need options.value
      if (token.fieldId === FIXED_TOKEN_ID) {
        const opts = token.options as Record<string, unknown> | undefined
        if (!opts || opts.value === undefined || opts.value === null) {
          throw new Error(`${prefix}: fixed value token requires options.value. Example: {"type":"property","fieldId":"fixed","options":{"value":"Hello"}}`)
        }
        break
      }
      // Validate data source reference
      if (token.dataSourceId) {
        const dsId = token.dataSourceId as string
        if (!dsIds.includes(dsId)) {
          throw new Error(`${prefix}: data source "${dsId}" not found. Available: ${dsIds.join(', ') || '(none configured)'}. Use data-source:list to see connected sources.`)
        }
        // Validate that the field exists in the data source schema
        const ds = getDataSource(dsId)
        if (ds) {
          const allTypes = ds.getTypes()
          const queryableFieldIds = ds.getQueryables().map(f => f.id)
          const allFieldIds = allTypes.flatMap(t => t.fields.map(f => f.id))
          const allTypeIds = allTypes.map(t => t.id)
          const fieldId = token.fieldId as string
          // Check if fieldId matches a queryable, a field, or a type
          if (!queryableFieldIds.includes(fieldId) && !allFieldIds.includes(fieldId) && !allTypeIds.includes(fieldId)) {
            throw new Error(`${prefix}: field "${fieldId}" not found in data source "${dsId}". Available queryables: ${queryableFieldIds.slice(0, 15).join(', ') || '(none)'}. Use data-source:list for full schema.`)
          }
        }
      }
      break
    }
    case 'filter': {
      if (!token.id) {
        throw new Error(`${prefix}: filter token missing "id" (the filter name, e.g. "date", "upcase", "split").`)
      }
      break
    }
    case 'state': {
      if (!token.componentId) {
        throw new Error(`${prefix}: state token missing "componentId".`)
      }
      if (!token.storedStateId) {
        throw new Error(`${prefix}: state token missing "storedStateId".`)
      }
      break
    }
    default:
      throw new Error(`${prefix}: unknown token type "${token.type}". Must be "property", "filter", or "state".`)
    }
  }
}

// Global state for preview activation
let isPreviewActive = true

export function getPreviewActive(): boolean {
  return isPreviewActive
}

// Function to force GrapesJS to re-render all components
function forceRender(editor: Editor) {
  // Force a complete re-render by refreshing the canvas
  doRender(editor)
}

// GrapesJS plugin to add commands to the editor
export default (editor: Editor, opts: DataSourceEditorOptions) => {
  // Set initial preview state
  isPreviewActive = opts.previewActive

  // Refresh all data sources
  editor.Commands.add(COMMAND_REFRESH, {
    run() {
      refreshDataSources()
    },
  })

  // Activate preview mode
  editor.Commands.add(COMMAND_PREVIEW_ACTIVATE, {
    run() {
      if (!isPreviewActive) {
        isPreviewActive = true
        // Force GrapesJS to re-render to show preview data
        forceRender(editor)
        // Emit event
        editor.trigger(PREVIEW_ACTIVATED)
      }
    },
  })

  // Deactivate preview mode
  editor.Commands.add(COMMAND_PREVIEW_DEACTIVATE, {
    run() {
      if (isPreviewActive) {
        isPreviewActive = false
        // Force GrapesJS to re-render to show original content
        const main = editor.Pages.getSelected()?.getMainComponent()
        if (main) restoreOriginalRender(main)
        // Emit event
        editor.trigger(PREVIEW_DEACTIVATED)
      }
    },
  })

  // Toggle preview mode
  editor.Commands.add(COMMAND_PREVIEW_TOGGLE, {
    run() {
      isPreviewActive = !isPreviewActive
      // Emit event
      if (isPreviewActive) {
        // Force GrapesJS to re-render to reflect the toggled state
        forceRender(editor)
        // Trigger event
        editor.trigger(PREVIEW_ACTIVATED)
      } else {
        // Force GrapesJS to re-render to show original content
        const main = editor.Pages.getSelected()?.getMainComponent()
        if (main) restoreOriginalRender(main)
        // Trigger event
        editor.trigger(PREVIEW_DEACTIVATED)
      }
    },
  })

  // Refresh preview data
  editor.Commands.add(COMMAND_PREVIEW_REFRESH, {
    run() {
      if (isPreviewActive) {
        forceRender(editor)
      }
    },
  })

  // List all data sources with their IDs and types
  editor.Commands.add(CMD_DS_LIST, {
    run() {
      return getAllDataSources().map(ds => ({
        id: ds.id,
        label: ds.label,
        type: ds.type,
      }))
    },
  })

  // Get all states (expressions) on the selected component
  editor.Commands.add(CMD_DS_GET_STATES, {
    run(editor: Editor, sender: any, options: any = {}) {
      const component = options.component || editor.getSelected()
      if (!component) throw new Error('No component selected. Use components:select first.')

      const exported = options.exported !== false
      const ids = getStateIds(component, exported)
      return ids.map(id => {
        const state = getState(component, id, exported)
        return {
          id,
          label: state?.label,
          expression: state?.expression,
          hidden: state?.hidden,
        }
      })
    },
  })

  // Set a state (expression) on the selected component
  editor.Commands.add(CMD_DS_SET_STATE, {
    run(editor: Editor, sender: any, options: any = {}) {
      const component = options.component || editor.getSelected()
      if (!component) throw new Error('No component selected. Use components:select first.')

      const { stateId, expression, label, exported } = options
      if (!stateId) throw new Error('Required: stateId (e.g. "innerHTML", "src", "href")')
      if (!expression) throw new Error('Required: expression — a JSON array of tokens, e.g. [{"type":"property","fieldId":"fixed","options":{"value":"Hello"}}]')

      // Parse string expressions
      let rawTokens = expression
      if (typeof rawTokens === 'string') {
        try { rawTokens = JSON.parse(rawTokens) } catch { throw new Error(`Expression is not valid JSON: ${expression}`) }
      }

      // Validate structure and data source references (throws with detailed message)
      validateExpression(rawTokens)

      const parsed = toExpression(rawTokens)
      if (!parsed) throw new Error(`Invalid expression: token validation passed but toExpression() rejected it. Got: ${JSON.stringify(rawTokens)}`)

      const isExported = exported !== false
      setState(component, stateId, {
        label: label || stateId,
        expression: parsed,
      }, isExported)

      if (isPreviewActive) forceRender(editor)
    },
  })

  // Remove a state from the selected component
  editor.Commands.add(CMD_DS_REMOVE_STATE, {
    run(editor: Editor, sender: any, options: any = {}) {
      const component = options.component || editor.getSelected()
      if (!component) throw new Error('No component selected. Use components:select first.')

      const { stateId, exported } = options
      if (!stateId) throw new Error('Required: stateId (e.g. "innerHTML", "src", "href"). Use data-source:get-states to list existing states.')

      const isExported = exported !== false
      removeState(component, stateId, isExported)

      if (isPreviewActive) forceRender(editor)
    },
  })
}
