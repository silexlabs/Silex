import { removeState, setState, COMPONENT_NAME_PREFIX, Property, toExpression, StoredFilter, StoredState, Expression } from '@silexlabs/grapesjs-data-source'
import { Silex11tyPluginWebsiteSettings } from './index'
import { Component, Editor } from 'grapesjs'
import { ClientEvent } from '../../events'
import { PAGE_DATA_KEY, PAGE_SIZE_KEY } from './settings-keys'

// States of the body of a collection page, each SSG provides some of them
export const PAGE_STATE_IDS = ['item', 'pagination', 'items'] as const
export type PageStateId = typeof PAGE_STATE_IDS[number]

export function isPageState(stateId: string): stateId is PageStateId {
  return (PAGE_STATE_IDS as readonly string[]).includes(stateId)
}
export const PAGE_ITEM_LABEL = 'Page item'

const providedStates = new WeakMap<Editor, () => readonly PageStateId[]>()

export default function(editor: Editor, getProvidedStates: () => readonly PageStateId[]): void {
  providedStates.set(editor, getProvidedStates)
  editor.on('page:select page:update', () => updatePaginationStates(editor))
  editor.on(ClientEvent.SETTINGS_SAVE_END, () => updatePaginationStates(editor))
}

function getItemLabel(pageData: Expression): string {
  const type = [...pageData].reverse().find(token => token.type === 'property')?.typeIds[0]
  return type ? `${PAGE_ITEM_LABEL} (${type})` : PAGE_ITEM_LABEL
}

function getPageStates(pageData: Expression, pageIndex: number, pageSize: number): Record<PageStateId, StoredState> {
  const startIndex = pageIndex * pageSize
  return {
    // The first item of the page, the preview shows it like the item of a loop
    item: {
      hidden: true,
      label: getItemLabel(pageData),
      kind: 'object',
      expression: pageData.map((token, index) => ({ ...token, previewIndex: index === pageData.length - 1 ? startIndex : undefined })),
    },
    // Taken from the pagination object https://www.11ty.dev/docs/pagination/
    pagination: {
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
      }] as Expression,
    },
    items: {
      hidden: true,
      label: 'Pagination items',
      expression: [
        ...pageData,
        {
          type: 'filter',
          id: 'slice',
          label: 'slice',
          options: {
            start: startIndex,
            end: pageSize,
          },
        } as StoredFilter,
      ],
    },
  }
}

// Without events, for the preview of each page of the collection
function writeSilently(body: Component, id: PageStateId, state: StoredState | null) {
  const states: { id: string }[] = body.attributes.publicStates ?? []
  if (!state) body.attributes.publicStates = states.filter(existing => existing.id !== id)
  else if (states.some(existing => existing.id === id)) body.attributes.publicStates = states.map(existing => existing.id === id ? { id, ...state } : existing)
  else body.attributes.publicStates = [...states, { id, ...state }]
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
  const pageData = toExpression(settings?.[PAGE_DATA_KEY]) as (Property[] | null)
  const provided = providedStates.get(editor)?.() ?? PAGE_STATE_IDS
  const states = pageData?.length ? getPageStates(pageData, pageIndex, parseInt(settings?.[PAGE_SIZE_KEY] || '1')) : null

  try {
    // FIXME: should we let UndoManager save?
    editor.UndoManager.skip(() => PAGE_STATE_IDS.forEach((id, index) => {
      const state = states && provided.includes(id) ? states[id] : null
      if (preventTrigger) writeSilently(body, id, state)
      else if (state) setState(body, id, state, true, index)
      else removeState(body, id, true)
    }))
  } catch (e) {
    console.error('Invalid JSON for eleventyPageData', e)
    PAGE_STATE_IDS.forEach(id => removeState(body, id, true))
    editor.runCommand('notifications:add', {
      type: 'error',
      message: 'Invalid JSON for eleventyPageData',
      group: 'Errors in your settings',
      componentId: body.id,
    })
  }
}
