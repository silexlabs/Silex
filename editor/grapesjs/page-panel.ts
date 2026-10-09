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

import { Component, Editor, Page } from 'grapesjs'
import {html, render} from 'lit-html'
import {ref} from 'lit-html/directives/ref.js'
import { getPageSlug } from '~/common/page'
import { getSettingsOf, setSettingsOf, SETTINGS_SCHEMA } from './settings'

const pluginName = 'page-panel'
let open

export const cmdTogglePages = 'pages:open-panel'
export const cmdAddPage = 'pages:add'
export const cmdRemovePage = 'pages:remove'
export const cmdClonePage = 'pages:clone'
export const cmdSelectNextPage = 'pages:select-next'
export const cmdSelectPrevPage = 'pages:select-prev'
export const cmdSelectFirstPage = 'pages:select-first'
export const cmdListPages = 'pages:list'
export const cmdSelectPage = 'pages:select'
export const cmdDeletePage = 'pages:delete'
export const cmdGetPage = 'pages:get'
export const cmdUpdatePage = 'pages:update'

interface PageOptions {
  page_id?: string
  name?: string
}

function pageOf(editor: Editor, id?: string): Page {
  if (!id) return editor.Pages.getSelected()!
  const page = editor.Pages.get(id)
  if (!page) throw new Error(`No page "${id}". Pages: ${editor.Pages.getAll().map(p => `${p.id} (${p.getName() || 'home, no name'})`).join(', ')}.`)
  return page
}

function selectPage(editor: Editor, page: Page) {
  editor.Pages.select(page)
}
function assertNameFree(editor: Editor, name: string, renamed?: Page) {
  if (!name) throw new Error('Set a name, it can not be empty. Nothing was changed.')
  if (!getPageSlug(name).replace(/-/g, '')) throw new Error(`Name "${name}" gives an empty address: use letters or digits. Nothing was changed.`)
  const taken = editor.Pages.getAll().find(p => p !== renamed && getPageSlug(p.getName()) === getPageSlug(name))
  if (taken) {
    throw new Error(`Name "${name}" gives the same address as page "${taken.getName() || '(home, no name)'}". Choose another name. Nothing was changed.`)
  }
}

function created(page: Page) {
  return { created: [{ id: page.id, name: page.getName() }] }
}

function addPage(editor: Editor, config: { newPageName: string, cmdOpenNewPageDialog: string }, name?: string) {
  if (name !== undefined) assertNameFree(editor, name)
  const pages = editor.Pages.getAll()
  // Get a name
  let idx = 1
  const newPageName = config.newPageName || 'New page'
  let pageName = name || newPageName
  while(pages.find(p => p.getName() === pageName)) {
    pageName = `${newPageName} ${idx++}`
  }
  // Add page
  const page = editor.Pages.add({ name: pageName })
  // Select the new page
  editor.Pages.select(page)
  // Open page settings to edit the name
  if (name === undefined) editor.runCommand(config.cmdOpenNewPageDialog, {page})
  return created(page!)
}

function clonePage(editor: Editor, page: Page, name?: string) {
  if (name !== undefined) assertNameFree(editor, name)
  const pages = editor.Pages.getAll()
  // Get a name
  let idx = 1
  const newPageName = (page.getName() || 'main') + ' copy'
  let pageName = name || newPageName
  while(pages.find(p => p.getName() === pageName)) {
    pageName = `${newPageName} ${idx++}`
  }

  // Clone components using Backbone approach
  const sourceBody = page.getMainComponent()
  const clonedComponents = sourceBody.clone()

  // Get custom props but exclude frames (Backbone collection) using toJSON and delete
  const customProps = { ...page.toJSON() }
  delete customProps.frames
  delete customProps.id
  delete customProps._undo

  // Create new page with custom props (but not frames collection)
  const newPage = editor.Pages.add({
    ...customProps,
    name: pageName,
  })

  // Reset components with cloned ones
  const targetBody = newPage.getMainComponent()
  targetBody.components().reset(clonedComponents.components().models)

  // Select the new page
  editor.Pages.select(newPage)
  return created(newPage!)
}

function removePage(editor, page) {
  if(editor.Pages.getAll().length === 1) {
    console.error('can not delete the only page')
  } else {
    const isMain = page.get('type') === 'main'
    const isSelected = editor.Pages.getSelected() === page
    editor.Pages.remove(page.id)
    const firstPage = editor.Pages.getAll()[0]
    if(isMain) firstPage.set('type', 'main')
    if(isSelected) selectPage(editor, firstPage)
  }
}

function removePageWithConfirm(editor, page) {
  if (editor.Pages.getAll().length <= 1) {
    console.error('can not delete the only page')
    return
  }
  const content = document.createElement('div')
  const modal = editor.Modal.open({
    title: 'Are you sure?',
    content,
  })
  render(html`
    <p>Do you really want to remove this page?</p>
    <footer>
      <button
        ${ref((el: HTMLButtonElement) => {
    setTimeout(() => el.focus())
  })}
        @click=${() => {
    removePage(editor, page)
    modal.close()
  }}
        class="silex-button silex-button--primary">Delete page</button>
      <button
        @click=${() => modal.close()}
        class="silex-button silex-button--secondary">Cancel</button
    </footer>
  `, content)
}

function selectNextPage(editor) {
  const pages = editor.Pages.getAll()
  const selected = editor.Pages.getSelected()
  const idx = pages.indexOf(selected)
  if(idx < pages.length - 1) {
    selectPage(editor, pages[idx + 1])
  } else {
    selectPage(editor, pages[0])
  }
}

function selectPrevPage(editor) {
  const pages = editor.Pages.getAll()
  const selected = editor.Pages.getSelected()
  const idx = pages.indexOf(selected)
  if(idx > 0) {
    selectPage(editor, pages[idx - 1])
  } else {
    selectPage(editor, pages[pages.length - 1])
  }
}

function settingsPage(editor, config, page) {
  editor.runCommand(config.cmdOpenSettings, {page})
}

function renderPages(editor, config) {
  const pages = editor.Pages.getAll()
  const selected = editor.Pages.getSelected()
  const getPageFromEvent = (e) => {
    const el = e.target.hasAttribute('data-page-id') ? e.target : e.target.parentNode
    e.stopPropagation()
    return editor.Pages.get(el.getAttribute('data-page-id'))
  }

  // Drag and drop handlers
  let draggedPage: Page | null = null
  let draggedPageElement: HTMLElement | null = null

  const handleDragStart = (e: DragEvent, page: Page) => {
    e.stopPropagation()
    draggedPage = page
    // Find the parent page element
    draggedPageElement = (e.target as HTMLElement).closest('.pages__page') as HTMLElement
    if (e.dataTransfer && draggedPageElement) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/html', draggedPageElement.innerHTML)
      draggedPageElement.classList.add('pages__page-dragging')
    }
  }

  const handleDragEnd = (e: DragEvent) => {
    if (draggedPageElement) {
      draggedPageElement.classList.remove('pages__page-dragging')
    }
    draggedPage = null
    draggedPageElement = null
  }

  const handleDragOver = (e: DragEvent) => {
    if (!draggedPage) return
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    return false
  }

  const handleDragEnter = (e: DragEvent, page: Page) => {
    if (draggedPage && draggedPage !== page) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const handleDragLeave = (e: DragEvent) => {
    // No-op: visual indicator removed
  }

  const handleDrop = (e: DragEvent, targetPage: Page) => {
    e.stopPropagation()
    e.preventDefault()

    if (draggedPage && draggedPage !== targetPage) {
      const pages = editor.Pages.getAll()
      const fromIndex = pages.indexOf(draggedPage)
      const toIndex = pages.indexOf(targetPage)

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        // Access the internal Backbone collection
        const pagesCollection = (editor.Pages as any).pages

        // Assign temporary order attributes for sorting
        pages.forEach((page, idx) => {
          let newOrder = idx
          if (idx === fromIndex) {
            newOrder = toIndex
          } else if (fromIndex < toIndex && idx > fromIndex && idx <= toIndex) {
            newOrder = idx - 1
          } else if (fromIndex > toIndex && idx >= toIndex && idx < fromIndex) {
            newOrder = idx + 1
          }
          page.set('_tempOrder', newOrder, { silent: true })
        })

        // Sort the collection by the temporary order
        const originalComparator = pagesCollection.comparator
        pagesCollection.comparator = (page: Page) => page.get('_tempOrder')
        pagesCollection.sort()
        pagesCollection.comparator = originalComparator

        // Clean up temporary attributes
        pages.forEach(page => page.unset('_tempOrder', { silent: true }))
      }
    }

    return false
  }

  return html`<section class="pages">
    <main class="pages__main ${pages.length === 1 ? 'pages__single-page' : ''}">
      <div class="pages__list">
        ${ pages.map((page: Page, index: number) => {
    const type = page.get('type') || index === 0 ? 'main' : 'Untitled Page'
    const name = page.getName() || type
    // keep the same structure as the layers panel
    return html`
           <div
             class="pages__page ${selected === page ? 'pages__page-selected' : ''}"
             data-page-id=${page.id}
             @click=${e => selectPage(editor, getPageFromEvent(e))}
             @dragover=${handleDragOver}
             @dragenter=${(e: DragEvent) => handleDragEnter(e, page)}
             @dragleave=${handleDragLeave}
             @drop=${(e: DragEvent) => handleDrop(e, page)}
           >
             <div class="pages__page-name">
               <i
                 class="pages__icon pages__drag-handle fa fa-grip-vertical"
                 draggable="true"
                 @dragstart=${(e: DragEvent) => handleDragStart(e, page)}
                 @dragend=${handleDragEnd}
               ></i>
               ${ name }
             </div>
              <i class="pages__icon pages__clone-btn fa fa-clone" title="Clone page" @click=${(e: Event) => { e.stopPropagation(); clonePage(editor, getPageFromEvent(e)) }}></i>
              <i class="pages__icon fa fa-cog" title="Page settings" @click=${(e: Event) => { e.stopPropagation(); settingsPage(editor, config, getPageFromEvent(e)) }}></i>
              <i class="pages__icon pages__remove-btn fa fa-trash" title="Delete page" @click=${(e: Event) => { e.stopPropagation(); removePageWithConfirm(editor, getPageFromEvent(e)) }}></i>
            </div>
          </div>
          `
  })}
      </div>
      ${pages.length ? '' : html`<div class="flex-row">
        No page yet.
      </div>
    `}
    </main></section>`
}

export const pagePanelPlugin = (editor: Editor, opts) => {
  // create wrapper
  const el = document.createElement('div')
  el.classList.add('pages__wrapper')
  // update
  const doRender = () => render(renderPages(editor, opts), el)
  editor.on('page', () => {
    doRender()
  })
  editor.on('load', () => {
    open = false
    document.querySelector(opts.appendTo).appendChild(el)
    doRender()

    // click anywhere close it
    // const close = (event) => {
    //   if(open) {
    //     editor.stopCommand(cmdTogglePages)
    //     //event.preventDefault()
    //   }
    // }
    // document.addEventListener('mousedown', close)

    // add useful commands
    editor.Commands.add(cmdAddPage, (_editor: Editor, _sender: any, options: { name?: string } = {}) => addPage(editor, opts, options.name))
    editor.Commands.add(cmdRemovePage, () => removePageWithConfirm(editor, editor.Pages.getSelected()))
    editor.Commands.add(cmdClonePage, (_editor: Editor, _sender: any, options: PageOptions = {}) => clonePage(editor, pageOf(editor, options.page_id), options.name))
    editor.Commands.add(cmdSelectNextPage, () => selectNextPage(editor))
    editor.Commands.add(cmdSelectPrevPage, () => selectPrevPage(editor))
    editor.Commands.add(cmdSelectFirstPage, () => selectPage(editor, editor.Pages.getAll()[0]))
    editor.Commands.add(cmdListPages, () => {
      return editor.Pages.getAll().map((p: Page) => ({
        id: p.id,
        name: p.getName(),
        selected: editor.Pages.getSelected() === p,
      }))
    })
    editor.Commands.add(cmdSelectPage, (_editor: Editor, _sender: any, options: PageOptions = {}) => {
      if (!options.page_id) throw new Error('Required: page_id. Use page(action:\'list\') to see all pages.')
      selectPage(editor, pageOf(editor, options.page_id))
    })
    editor.Commands.add(cmdDeletePage, (_editor: Editor, _sender: any, options: PageOptions = {}) => {
      const page = pageOf(editor, options.page_id)
      if (editor.Pages.getAll().length === 1) throw new Error('Cannot delete the only page. At least one page must exist.')
      removePage(editor, page)
    })
    editor.Commands.add(cmdGetPage, (_editor: Editor, _sender: any, options: PageOptions = {}) => {
      const page = pageOf(editor, options.page_id)
      return { id: page.id, name: page.getName(), ...getSettingsOf(page) }
    })
    editor.Commands.add(cmdUpdatePage, (_editor: Editor, _sender: any, options: PageOptions & Record<string, unknown> = {}) => {
      const { page_id, name, ...settings } = options
      const page = pageOf(editor, page_id)
      if (name !== undefined) assertNameFree(editor, name, page)
      if (Object.keys(settings).length) setSettingsOf(editor, page, settings)
      else if (name === undefined) throw new Error(`Set name or at least one of: ${Object.keys(SETTINGS_SCHEMA).join(', ')}.`)
      if (name !== undefined) page.set('name', name)
    })

    editor.on('ai-capabilities:ready', (addCapability, describeTool) => {
      const pageId = { type: 'string', description: 'Page id from list. Default: the selected page' }
      describeTool('page', 'Pages of the open website. The element tools work on the selected page. The page with no name is the homepage.')
      addCapability({
        tool: 'page',
        action: 'list',
        command: cmdListPages,
        description: 'the pages.',
        readOnly: true,
      })
      addCapability({
        tool: 'page',
        action: 'add',
        command: cmdAddPage,
        description: 'a new page, which becomes the selected page.',
        inputSchema: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', description: 'Unique. The address of the page comes from it' },
          },
        },
      })
      addCapability({
        tool: 'page',
        action: 'select',
        command: cmdSelectPage,
        description: 'choose the page to work on.',
        inputSchema: {
          type: 'object',
          required: ['page_id'],
          properties: { page_id: { type: 'string', description: 'Page id from list' } },
        },
      })
      addCapability({
        tool: 'page',
        action: 'clone',
        command: cmdClonePage,
        description: 'a copy of a page, which becomes the selected page.',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: pageId,
            name: { type: 'string', description: 'Unique. The address of the page comes from it' },
          },
        },
      })
      addCapability({
        tool: 'page',
        action: 'delete',
        command: cmdDeletePage,
        description: 'delete a page.',
        destructive: true,
        inputSchema: { type: 'object', properties: { page_id: pageId } },
      })
      addCapability({
        tool: 'page',
        action: 'get',
        command: cmdGetPage,
        description: 'the name and settings of a page.',
        readOnly: true,
        inputSchema: { type: 'object', properties: { page_id: pageId } },
      })
      addCapability({
        tool: 'page',
        action: 'update',
        command: cmdUpdatePage,
        description: 'change the name or settings of a page, the others stay.',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: pageId,
            name: { type: 'string', description: 'Unique. The address of the page comes from it' },
            ...SETTINGS_SCHEMA,
          },
        },
      })
    })
  })
}
