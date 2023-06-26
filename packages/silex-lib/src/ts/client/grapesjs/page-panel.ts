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

import * as grapesjs from 'grapesjs/dist/grapes.min.js'
import {html, render} from 'lit-html'

const pluginName = 'page-panel'
let open

export const cmdTogglePages = 'pages:open-panel'
export const cmdAddPage = 'pages:add'

function selectPage(editor, page) {
  editor.Pages.select(page)
}
function addPage(editor, config) {
  const pages = editor.Pages.getAll()
  let idx = 1
  const newPageName = config.newPageName || 'New page'
  let pageName = newPageName
  while(pages.find(p => p.getName() === pageName)) {
    pageName = `${newPageName} ${idx++}`
  }
  const page = editor.Pages.add({ name: pageName })
  editor.runCommand(config.cmdOpenNewPageDialog, {page})
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
  return html`<section class="pages">
    <main class="pages__main ${pages.length === 1 ? 'pages__single-page' : ''}">
      <div class="pages__list">
        ${ pages.map(page => {
    const name = page.getName() || page.attributes.type
    // keep the same structure as the layers panel
    return html`
           <div class="pages__page ${selected === page ? 'pages__page-selected' : ''}" data-page-id=${page.id} @click=${e => selectPage(editor, getPageFromEvent(e))}>
             <div class="pages__page-name">
               ${ name }
             </div>
             <i class="pages__icon pages__remove-btn fa fa-trash" @click=${e => removePage(editor, getPageFromEvent(e))}></i>
             <i class="pages__icon fa fa-cog" @click=${e => settingsPage(editor, config, getPageFromEvent(e))}></i>
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

export const pagePanelPlugin = grapesjs.plugins.add(pluginName, (editor, opts) => {
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
    document.querySelector(opts.appendTo)
      .appendChild(el)
    doRender()
    // click anywhere close it
    // const close = (event) => {
    //   if(open) {
    //     editor.stopCommand(cmdTogglePages)
    //     //event.preventDefault()
    //   }
    // }
    // document.addEventListener('mousedown', close)
    // add command to add pages
    editor.Commands.add(cmdAddPage, () => addPage(editor, opts))
  })
})

