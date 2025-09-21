import { removeState, setState, COMPONENT_NAME_PREFIX, Property, toExpression, StoredFilter } from '@silexlabs/grapesjs-data-source'
import { Silex11tyPluginWebsiteSettings } from './index'
import { Component, Editor, Page } from 'grapesjs'
import { EVENT_UPDATE_PAGE_LIST, getSelectedIndex } from './collection-pages'

export default function(editor: Editor/*, opts: EleventyPluginOptions */): void {
  editor.on('page:select page:update', () => updatePaginationStates(editor))
  editor.on('settings:save:start', () => updatePaginationStates(editor))
  editor.on(EVENT_UPDATE_PAGE_LIST, () => updatePaginationStates(editor, getSelectedIndex()))
}

/**
 * Update pagination states for a page with the ability to control which page index to show
 * @param editor - The GrapesJS editor instance
 * @param pageIndex - The current page index (0-based) for pagination preview. Use 0 for publication.
 */
export function updatePaginationStates(editor: Editor, pageIndex: number = 0) {
  const page = editor.Pages.getSelected()
  const body: Component = page?.getMainComponent() as Component
  if (!body) return // This happens when the current page is deleted

  // Do not show "Body's " prefix for states on the body
  body.set(COMPONENT_NAME_PREFIX, '')

  // Store pagination data in the body component
  // This is for the GraphQL query to include it
  const settings = page?.get('settings') as Silex11tyPluginWebsiteSettings | undefined
  const pageData = toExpression(settings?.eleventyPageData) as (Property[] | null)

  if (pageData && pageData.length > 0) {
    try {
      // Add previewGroup
      pageData.forEach((token) => {
        // token.previewGroup = 2
      })

      // Update body states with the new settings
      setState(body, 'pagination', {
        hidden: true,
        label: 'pagination',
        expression: [{
          label: 'Unused pagination label',
          type: 'property',
          propType: 'field',
          fieldId: 'pagination',
          dataSourceId: 'eleventy',
          typeIds: ['pagination'],
          kind: 'object',
        }]
      }, true, 0)

      // Taken from the pagination object https://www.11ty.dev/docs/pagination/
      // Apply pagination size limit using slice filter
      const pageSize = parseInt(settings?.eleventyPageSize || '1')
      const startIndex = pageIndex * pageSize
      const endIndex = startIndex + pageSize

      // const slice = fromStored({
      //   type: 'filter',
      //   id: 'slice',
      //   label: 'slice',
      //   options: {
      //     start: startIndex,
      //     end: endIndex,
      //   },
      // }, body.getId())
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

      setState(body, 'items', {
        hidden: true,
        label: 'pagination.items',
        expression: itemsExpression,
      }, true, 1)
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
