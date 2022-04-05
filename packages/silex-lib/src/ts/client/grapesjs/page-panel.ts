import * as grapesjs from 'grapesjs/dist/grapes.min.js'
import {html, render} from 'lit-html'

const name = 'page-panel'
let open

export const cmdTogglePages = 'open-page-panel'

function selectPage(editor, page) {
  editor.Pages.select(page)
}
function addPage(editor, config) {
  const pages = editor.Pages.getAll()
  let idx = 1
  const newPageName = config.newPageName || 'New page'
  let name = newPageName
  while(pages.find(p => p.getName() === name)) {
    name = `${newPageName} ${idx++}`
  }
  const page = editor.Pages.add({ name })
  settingsPage(editor, config, page)
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
  editor.runCommand(config.cmdOpenPageSettings, {page})
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
    <header class="pages__header">
      <h3 class="pages__title">Pages</h3>
      <div class="pages__add-page fa fa-file" @click=${e => addPage(editor, config)}><span>+</span></div>
    </header>
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
          <input
              class="tm-input sm"
              type="text"
              placeholder="No page yet."
          />
      </div>
    </main>
    `}
  </div>`
}

export const pagePanelPlugin = grapesjs.plugins.add(name, (editor, opts) => {
  const el = document.createElement('div')
  el.classList.add('pages__wrapper')
  // update
  const doRender = () => render(renderPages(editor, opts), el)
  editor.on('page', (...args) => {
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
  })
})

