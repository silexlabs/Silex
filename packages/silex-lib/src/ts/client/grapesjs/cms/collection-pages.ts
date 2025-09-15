import { ClientConfig } from '../../config'
import { CMS_SETTINGS_SECTION_ID, EleventyPluginOptions, Silex11tyPluginWebsiteSettings } from './index'
import { Editor } from 'grapesjs'
import { html, render } from 'lit-html'
import { COMMAND_PREVIEW_REFRESH, COMMAND_REFRESH, DATA_SOURCE_DATA_LOAD_END, getState, getValue, setPreviewIndex, toExpression } from '@silexlabs/grapesjs-data-source'
import { TemplateResult } from 'lit-html'
import { ClientEvent } from '../../events'
import { cmdOpenSettings } from '../settings'

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
const EVENT_UPDATE_PAGE_LIST = 'update:collection:pages:list'

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

    // Function to update the collection pages display
    function updatePages() {
      render(getHtml(editor), container)
    }
    function updatePagesWithReset() {
      currentPage = 0
      render(getHtml(editor), container)
    }

    // Listen for data changes and page selection
    editor.on(`
      ${ DATA_SOURCE_DATA_LOAD_END }
      storage:load:end
      page:all
      `, updatePagesWithReset)

    editor.on(EVENT_UPDATE_PAGE_LIST, updatePages)

    // Initial render
    updatePagesWithReset()
  })
}

function getHtml(editor: Editor): TemplateResult {
  const items = getCollectionData(editor)
  console.log('RENDER', {currentPage})
  return html`
    <header class="project-bar__panel-header">
      <h3 class="project-bar__panel-header-title">Collection Pages</h3>
    </header>
    <div class="pages__wrapper">
      <section class="pages">
        <main class="pages__main">
          <div class="pages__list">
            ${items.length === 0
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
    : items.map((item, index) => html`
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
                `)
}
          </div>
        </main>
      </section>
    </div>
  `
}

function getCollectionData(editor: Editor): unknown[] {
  const page = editor.Pages.getSelected()
  const body = page?.getMainComponent()
  console.log('COLLECTION DATA', {page, body})

  if (!body) {
    console.log('COLLECTION DATA NULL')
    return []
  }

  // Find the items state
  const itemsState = getState(body, 'items', true)
  if (!itemsState?.expression?.length) {
    console.log('COLLECTION DATA NULL')
    return []
  }

  console.log('COLLECTION DATA', {itemsState})
  try {
    setPreviewIndex(itemsState.expression, undefined, undefined)
    const rawData = getValue(itemsState.expression, body as never, false)

    if (Array.isArray(rawData) && rawData.length > 0) {
      // Get current preview index from the expression
      console.log('COLLECTION DATA', {rawData})
      return rawData
    }
  } catch (e) {
    console.error('Error getting collection data:', e)
  }

  console.log('COLLECTION DATA NULL')
  return []
}

function getItemDisplayName(editor: Editor, index: number): string {
  try {
    const page = editor.Pages.getSelected()
    const settings = page?.get('settings') as Silex11tyPluginWebsiteSettings | undefined

    const body = page?.getMainComponent()
    if (!body) return

    console.log('getItemDisplayName - index:', index)
    console.log('getItemDisplayName - settings.eleventySeoTitle:', settings?.eleventySeoTitle)
    console.log('getItemDisplayName - settings.eleventyPermalink:', settings?.eleventyPermalink)

    if (settings?.eleventySeoTitle || settings?.eleventyPermalink) {
      // Parse the permalink expression
      const permalinkExpression = toExpression(settings.eleventySeoTitle || settings.eleventyPermalink)
      console.log('getItemDisplayName - parsed permalinkExpression (before setPreviewIndex):', permalinkExpression)

      if (Array.isArray(permalinkExpression) && permalinkExpression.length > 0) {
        const group = settings.eleventyPageSize || 1
        setPreviewIndex(permalinkExpression, index, group)
        console.log('getItemDisplayName - permalinkExpression (after setPreviewIndex):', permalinkExpression)
        const valueFalse = getValue(permalinkExpression, body, false)
        const valueTrue = getValue(permalinkExpression, body, true)
        console.log('getItemDisplayName - getValue(permalinkExpression, body, false):', valueFalse)
        console.log('getItemDisplayName - getValue(permalinkExpression, body, true):', valueTrue)
        return valueFalse as string
      }
    }
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

  // Find the items state
  const itemsState = getState(body, 'items', true)
  console.log('CLICK', {itemsState, body})
  if (itemsState?.expression?.length > 0) {
    // Update the preview index
    const settings = page.get('settings') as Silex11tyPluginWebsiteSettings || {}
    const group = settings.eleventyPageSize || 1
    setPreviewIndex(itemsState.expression, index, group)

    // Trigger the canvas refresh
    editor.Canvas.refresh()
    editor.trigger(EVENT_UPDATE_PAGE_LIST)
  }
}
