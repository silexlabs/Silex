import { ClientConfig } from '../../config'
import { CMS_SETTINGS_SECTION_ID, EleventyPluginOptions, Silex11tyPluginWebsiteSettings } from './index'
import { Editor } from 'grapesjs'
import { html, render } from 'lit-html'
import { COMMAND_PREVIEW_REFRESH, COMMAND_REFRESH, DATA_SOURCE_DATA_LOAD_END, getValue } from '@silexlabs/grapesjs-data-source'
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
    function updatePages(...args: unknown[]) {
      render(getHtml(editor), container)
    }

    // Listen for data changes and page selection
    editor.on(`
      ${ DATA_SOURCE_DATA_LOAD_END }
      storage:load:end
      page:all
      `, updatePages)

    // Initial render
    updatePages()
  })
}

function getHtml(editor: Editor): TemplateResult {
  const { items, currentIndex } = getCollectionData(editor)
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
                    class="pages__page ${index === currentIndex ? 'pages__page-selected' : ''}"
                    data-item-index="${index}"
                    @click=${() => handleItemClick(editor, index)}
                  >
                    <div class="pages__page-name">
                      ${getItemDisplayName(editor, item, index)}
                    </div>
                    ${index === currentIndex ? html`<i class="pages__icon pages__remove-btn fa fa-trash"></i>` : ''}
                  </div>
                `)
}
          </div>
        </main>
      </section>
    </div>
  `
}

function getCollectionData(editor: Editor) {
  const page = editor.Pages.getSelected()
  const body = page?.getMainComponent()

  if (!body) {
    return { items: [], currentIndex: 0 }
  }

  // Find the items state
  const itemsState = body.attributes.publicStates?.find((s: unknown) => (s as { id: string }).id === 'items')
  if (!itemsState?.expression?.length) {
    return { items: [], currentIndex: 0 }
  }

  try {
    const rawData = getValue(itemsState.expression, body as never, false)

    if (Array.isArray(rawData) && rawData.length > 0) {
      // Get current preview index from the expression
      const lastToken = itemsState.expression[itemsState.expression.length - 1]
      const currentIndex = (lastToken && typeof lastToken === 'object' && 'previewIndex' in lastToken)
        ? (lastToken as { previewIndex?: number }).previewIndex || 0
        : 0

      return { items: rawData, currentIndex: Math.min(currentIndex, rawData.length - 1) }
    }
  } catch (e) {
    console.error('Error getting collection data:', e)
  }

  return { items: [], currentIndex: 0 }
}

function getItemDisplayName(editor: Editor, item: unknown, index: number): string {
  try {
    const page = editor.Pages.getSelected()
    const settings = page?.get('settings') as Silex11tyPluginWebsiteSettings | undefined

    if (settings?.eleventyPermalink) {
      // Parse the permalink expression
      const permalinkExpression = JSON.parse(settings.eleventyPermalink)

      if (Array.isArray(permalinkExpression) && permalinkExpression.length > 0) {
        // Find the last property token to get the field we want to extract
        const lastPropertyToken = permalinkExpression
          .slice().reverse()
          .find((token: unknown) => (token as { type: string }).type === 'property') as { fieldId: string } | undefined

        if (lastPropertyToken && item && typeof item === 'object') {
          const fieldValue = (item as Record<string, unknown>)[lastPropertyToken.fieldId]

          if (fieldValue && typeof fieldValue === 'string') {
            // Clean up the result to make it more readable as a page name
            const cleanName = fieldValue
              .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
              .replace(/\//g, ' › ') // Replace slashes with breadcrumb separator
              || `Page ${index + 1}`

            return cleanName
          }
        }
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

  if (!body) return

  // Find the items state
  const itemsState = body.attributes.publicStates?.find((s: unknown) => (s as { id: string }).id === 'items')
  if (itemsState?.expression?.length > 0) {
    // Update the preview index
    const token = itemsState.expression[itemsState.expression.length - 1]
    token.previewIndex = index

    // Trigger the preview refresh
    editor.runCommand(COMMAND_REFRESH)
  }
}
