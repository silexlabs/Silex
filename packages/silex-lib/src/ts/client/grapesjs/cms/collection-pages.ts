import { ClientConfig } from '../../config'
import { CMS_SETTINGS_SECTION_ID, EleventyPluginOptions, Silex11tyPluginWebsiteSettings } from './index'
import { Editor } from 'grapesjs'
import { html, render } from 'lit-html'
import { COMMAND_PREVIEW_REFRESH, COMMAND_REFRESH, DATA_SOURCE_DATA_LOAD_END, getState, getValue, toExpression, setPreviewIndex, Property } from '@silexlabs/grapesjs-data-source'
import { TemplateResult } from 'lit-html'
import { ClientEvent } from '../../events'
import { cmdOpenSettings } from '../settings'
import { updatePaginationStates } from './states'
import { debounce } from '../../utils'

// Add CSS for collection pages
document.querySelector('head')?.insertAdjacentHTML('beforeend', `
  <style>
  .pages__empty {
    padding: 16px;
    text-align: center;
    color: #888;
    font-size: 12px;
    font-style: italic;
  }
  .pages__page {
    cursor: pointer;
  }
  .pages__page:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  </style>
`)

let currentPage = 0
export const EVENT_UPDATE_PAGE_LIST = 'update:collection:pages:list'

export default function (editor: Editor, opts: EleventyPluginOptions): void {
  let done = false
  editor.once(`
    ${ ClientEvent.STARTUP_END }
    storage:end:load
    `, (...args) => {
    if (done) throw new Error('FIXME: this should never happen')
    done = true

    if (!opts.enable11ty) return // Do not add the settings if 11ty is disabled

    const pagesContainer = editor.Panels.getPanel('project-bar-container')
      ?.view
      ?.el
      ?.querySelector('.page-panel-container')

    const container = document.createElement('div')
    pagesContainer?.appendChild(container)

    // Listen for data changes and page selection
    editor.on(`
      ${ DATA_SOURCE_DATA_LOAD_END }
      storage:load:end
      page
      `, debounce<() => void>(() => {
  currentPage = 0
  renderCollectionPageList(editor, container)
}))

    editor.on(`
      ${ EVENT_UPDATE_PAGE_LIST }
    `, debounce<() => void>(() => {
  renderCollectionPageList(editor, container)
  editor.runCommand(COMMAND_PREVIEW_REFRESH)
}))

    // Initial render
    renderCollectionPageList(editor, container)
  })
}

function renderCollectionPageList(editor: Editor, container: HTMLElement) {
  // Guard: Ensure Pages exist, there are pages, and a selected page has a main component
  const pages = editor.Pages
  if (
    !pages ||
    pages.getAll().length === 0 ||
    !pages.getSelected()?.getMainComponent()
  ) {
    return
  }
  render(getHtml(editor), container)
}

function getHtml(editor: Editor): TemplateResult {
  const groups = getCollectionData(editor)
  const result = html`
    <header class="project-bar__panel-header">
      <h3 class="project-bar__panel-header-title">Collection Pages</h3>
    </header>
    <div class="pages__wrapper">
      <section class="pages">
        <main class="pages__main">
          <div class="pages__list">
            ${groups.length === 0
    ? html`<div class="pages__empty">
      No collection items found.&nbsp;
      <a
        href="#"
        @click=${(event: MouseEvent) => {
    event.preventDefault()
    editor.runCommand(cmdOpenSettings, {
      page: editor.Pages.getSelected(),
      sectionId: CMS_SETTINGS_SECTION_ID,
    })
  }}
          >
          Add pagination data in the page settings
        </a>
    </div>`
    : groups.map((items, index) => {
      // Temporary pagination to this particular page
      updatePaginationStates(editor, index, true)
      return html`
                  <div
                    class="pages__page ${index === currentPage ? 'pages__page-selected' : ''}"
                    data-item-index="${index}"
                    @click=${() => handleItemClick(editor, index)}
                  >
                    <div class="pages__page-name">
                      ${getItemDisplayName(editor, index)}
                    </div>
                    ${index === currentPage ? html`<i class="pages__icon pages__remove-btn"></i>` : ''}
                  </div>
                `
    })
}
          </div>
        </main>
      </section>
    </div>
  `
  if (groups.length > 0) {
    // Reset to current page
    updatePaginationStates(editor, currentPage, true)
  }
  return result
}

function getCollectionData(editor: Editor): unknown[][] {
  const page = editor.Pages.getSelected()
  const body = page?.getMainComponent()

  if (!body) return

  const settings = page?.get('settings') as Silex11tyPluginWebsiteSettings | undefined
  const pageData = toExpression(settings?.eleventyPageData) as (Property[] | null)
  const pageSize = parseInt(settings?.eleventyPageSize || '1')

  if (pageData && pageData.length > 0) {
    const rawData = getValue(pageData, body as never, false)

    if (Array.isArray(rawData) && rawData.length > 0) {
      // Group rawData into chunks of size groupBy
      const grouped: unknown[][] = []
      for (let i = 0; i < rawData.length; i += pageSize) {
        grouped.push(rawData.slice(i, i + pageSize))
      }
      return grouped
    }
  }

  return []
}

function getItemDisplayName(editor: Editor, index: number): string {
  try {
    const page = editor.Pages.getSelected()
    const settings = page?.get('settings') as Silex11tyPluginWebsiteSettings | undefined

    const body = page?.getMainComponent()
    if (!body) return

    if (settings?.eleventySeoTitle || settings?.eleventyPermalink) {
      // Parse the permalink expression
      const nameExpression = toExpression(settings.eleventySeoTitle || settings.eleventyPermalink)

      if (Array.isArray(nameExpression) && nameExpression.length > 0) {
        const name = getValue(nameExpression, body, false)
        if (typeof name === 'string') return name
      }
    }
    return `Page ${index}`
  } catch (e) {
    console.error('Error generating permalink for item:', e)
  }

  // Final fallback to index-based name
  return `Page ${index + 1}`
}

function handleItemClick(editor: Editor, index: number) {
  const page = editor.Pages.getSelected()
  const body = page?.getMainComponent()
  currentPage = index

  if (!body) return

  // Trigger the canvas refresh
  editor.trigger(EVENT_UPDATE_PAGE_LIST)
  // editor.Canvas.refresh()
}
