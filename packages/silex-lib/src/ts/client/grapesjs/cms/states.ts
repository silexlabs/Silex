import { removeState, setState, COMPONENT_NAME_PREFIX, Property, toExpression, StoredFilter, State, StoredState, StoredToken, Expression } from '@silexlabs/grapesjs-data-source'
import { Silex11tyPluginWebsiteSettings } from './index'
import { Component, Editor, Page } from 'grapesjs'
import { ClientEvent } from '../../events'

export default function(editor: Editor/*, opts: EleventyPluginOptions */): void {
  editor.on('page:select page:update', () => updatePaginationStates(editor))
  editor.on(ClientEvent.SETTINGS_SAVE_END, () => updatePaginationStates(editor))
}

/**
 * Update pagination states for a page with the ability to control which page index to show
 * @param editor - The GrapesJS editor instance
 * @param pageIndex - The current page index (0-based) for pagination preview. Use 0 for publication.
 */
export function updatePaginationStates(editor: Editor, pageIndex = 0, preventTrigger = false) {
  const page = editor.Pages.getSelected()
  const body: Component = page?.getMainComponent() as Component
  if (!body) return // This happens when the current page is deleted

  // Do not show "Body's " prefix for states on the body
  body.attributes.COMPONENT_NAME_PREFIX = ''

  // Store pagination data in the body component
  // This is for the GraphQL query to include it
  const settings = page?.get('settings') as Silex11tyPluginWebsiteSettings | undefined
  const pageData = toExpression(settings?.eleventyPageData) as (Property[] | null)

  if (pageData && pageData.length > 0) {
    try {
      // Taken from the pagination object https://www.11ty.dev/docs/pagination/
      // Apply pagination size limit using slice filter
      const pageSize = parseInt(settings?.eleventyPageSize || '1')
      const startIndex = pageIndex * pageSize
      const endIndex = startIndex + pageSize

      const slice = {
        type: 'filter',
        id: 'slice',
        label: 'slice',
        options: {
          start: startIndex,
          end: endIndex,
        },
      } as StoredFilter

      const itemsExpression = [
        ...pageData,
        slice,
      ]

      if (preventTrigger) {
        const itemsState: StoredState = body.attributes.publicStates.find((state: StoredFilter) => state.id === 'items')
        if (!itemsState) {
          if (!body.attributes.publicStates) body.attributes.publicStates = []
          body.attributes.publicStates.push({
            hidden: true,
            label: 'pagination.items',
            expression: itemsExpression,
          })
        } else {
          itemsState.expression = itemsExpression
        }

        // Add or update pagination state in publicStates
        const paginationState: StoredState = body.attributes.publicStates.find((state: StoredFilter) => state.id === 'pagination')
        const paginationExpression = [{
          label: 'Unused pagination label',
          type: 'property',
          propType: 'field',
          fieldId: 'pagination',
          dataSourceId: 'eleventy',
          typeIds: ['pagination'],
          kind: 'object',
        }] as Expression
        if (!paginationState) {
          body.attributes.publicStates.push({
            hidden: true,
            label: 'pagination',
            expression: paginationExpression,
          })
        } else {
          paginationState.expression = paginationExpression
        }
      } else {
        // FIXME: should we let UndoManager save?
        editor.UndoManager.skip(() => {
          setState(body, 'items', {
            hidden: true,
            label: 'pagination.items',
            expression: itemsExpression,
          }, true, 1)

          // Update body states with the new settings
          setState(body, 'pagination', {
            hidden: true,
            label: 'pagination',
            expression: [{
              label: 'Unused pagination label',
              type: 'property' as const,
              propType: 'field' as const,
              fieldId: 'pagination',
              dataSourceId: 'eleventy',
              typeIds: ['pagination'],
              kind: 'object' as const,
            }]
          }, true, 0)
        })
      }
    } catch (e) {
      console.error('Invalid JSON for eleventyPageData', e)
      removeState(body, 'pagination', true)
      removeState(body, 'items', true)
      editor.runCommand('notifications:add', {
        type: 'error',
        message: 'Invalid JSON for eleventyPageData',
        group: 'Errors in your settings',
        componentId: body.id,
      })
      return
    }
  } else {
    removeState(body, 'pagination', true)
    removeState(body, 'items', true)
  }
}
