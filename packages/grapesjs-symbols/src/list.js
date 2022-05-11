import { render, html } from 'lit-html';

import { getSymbols } from './symbol';

export default (editor, options) => {
  // list wrapper
  const el = document.createElement('div')
  el.classList.add('symbols__wrapper')
  document.querySelector(options.appendTo)
    .appendChild(el)

  // display the list of symbols
  function renderList() {
    const symbols = getSymbols(editor)
    const selected = editor.getSelected()
    render(html`
      <main class="symbols__list">
        ${
          // keep the same structure as the layers panel
          Array.from(symbols)
          .map(c => html`
             <div class="symbols__symbol ${selected === c ? 'symbols__symbol-selected' : ''}" symbol-id=${c.getId()}>
               <div class="symbols__name">
                 ${c.attributes.title}
                 <span class="symbols__num">
                  ${symbols.length}
                 </span>
               </div>
             </div>
          `)
        }
        ${symbols.length ? '' : html`<div class="flex-row">
          No symbol yet.
        </div>`}
      </main>
    `, el)
  }

  // update the list when necessary
  editor.on('symbol component:add component:remove component:clone undo redo', () => {
    console.log('symbol')
    renderList()
  })
  renderList()
}
