import { render, html } from 'lit-html'
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'
import Backbone, { ViewOptions } from 'backbone'
import { Editor } from 'grapesjs'
import { allowDrop, createSymbol, deleteSymbol, getSymbol, getSymbols } from '../utils'

function closestHtml(child: HTMLElement, attr: string) {
  let ptr: HTMLElement | null = child
  while(ptr && !ptr.getAttribute(attr)) {
    ptr = ptr.parentElement
  }
  return ptr
}

export function confirmDialog({
  editor,
  content: main,
  title,
  primaryLabel,
  secondaryLabel = 'Cancel',
  cbk,
  lsKey,
}: {
  editor: Editor,
  content: string,
  title: string,
  primaryLabel: string,
  secondaryLabel?: string,
  cbk: () => void,
  lsKey: string,
}) {
  // Check if the user has already been asked
  if (localStorage.getItem(lsKey) === 'on') {
    cbk()
  } else {
    const content = document.createElement('div')
    editor.Modal.open({
      title,
      content,
    })
    let remember = 'off'
    render(html`<main>
        ${unsafeHTML(main)}
      </main><footer style="
        display: flex;
        justify-content: space-between;
        margin-top: 30px;
      ">
        <div>
          <label class="gjs-field gjs-field-checkbox" style="
            float: left;
            margin-right: 10px;
          ">
            <input type="checkbox" id="remember" @click=${({ target: rememberCheckbox }: MouseEvent) => remember = (rememberCheckbox as HTMLInputElement)?.value}>
            <i class="gjs-chk-icon"></i>
          </label>
          <label for="remember">Don't ask me again</label>
        </div>
        <div>
          <button
            class="gjs-btn-prim"
            @click=${() => editor.Modal.close()}
            style="
              margin-left: auto;
              background: transparent;
              margin-right: 10px;
            ">${secondaryLabel}</button>
          <button class="gjs-btn-prim" @click=${() => {
    cbk()
    localStorage.setItem(lsKey, remember)
    editor.Modal.close()
  }}>${primaryLabel}</button>
        </div>
      </footer>`, content)
  }
}

export interface SymbolsViewOptions extends ViewOptions {
  editor: Editor,
  appendTo: string,
  highlightColor: string,
  emptyText: string,
}

export default class extends Backbone.View {
  protected lastPos: any | null = null
  protected lastTarget: HTMLElement | null = null
  constructor(protected options: SymbolsViewOptions) {
    super(options)
    // listen to redraw UI
    options.editor.on('component:selected', () => this.render())
    // listen to drag event in order to have access to the drop target
    options.editor.on('sorter:drag', (event: any) => {
      this.lastPos = event.pos
      this.lastTarget = event.target
    })
    // Listen to events on `symbol`
    options.editor.on('symbol', () => {
      // Redraw the UI
      this.render()
    })
    // list wrapper
    this.el = document.createElement('div')
    this.el.classList.add('symbols__wrapper')
    document.querySelector(options.appendTo)!
      .appendChild(this.el)
    // first render
    this.render()

  }
  override render() {
    const symbols = getSymbols(this.options.editor)
    symbols.forEach(symbolInfo => {
      if (!symbolInfo.main) {
        console.warn('Symbol has no main component:', symbolInfo)
        return
      }
    })
    const selected = this.options.editor.getSelected()
    render(html`
    <style>
      .symbols__symbol-selected {
        border: 1px solid ${ this.options.highlightColor };
      }
      .symbols__symbol {
        position: relative;
      }
      .symbols__num {
        font-size: xx-small;
      }
      .symbols__empty {
        padding: 10px;
        text-align: center;
        width: 100%;
      }
      .symbols__remove {
        position: absolute;
        top: 0; right: 0;
        width: 20px;
        line-height: 1;
        cursor: pointer;
      }
    </style>
    <main class="symbols__list" @dragend=${(event: Event) => this.onDrop(event)}>
      <div class="gjs-blocks-c">
      ${
  // keep the same structure as the layers panel
  symbols
    .filter(s => s.main)
    .map(symbolData => html`
          <div
            class="gjs-block gjs-one-bg gjs-four-color-h symbols__symbol
              ${!!selected && symbolData.instances.includes(selected) ? 'symbols__symbol-selected' : ''}
              ${symbolData.main!.get('icon') || 'fa fa-diamond'}
            "
            title="" draggable="true"
            data-symbol-id=${symbolData.main!.getId()}
            >
            <div title="Unlink all instances and delete Symbol" class="symbols__remove" @click=${(event: MouseEvent) => this.onRemove(event)}>
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
            </div>
            <div class="gjs-block-label">
              ${symbolData.main!.getName()}
              <div class="symbols__num">
                ${symbolData.instances.length} instances
              </div>
            </div>
          </div>
         `)
}
       ${symbols.length ? '' : html`<div class="symbols__empty">
        ${ this.options.emptyText }
       </div>`}
       </div>
     </main>
   `, this.el)
    return this
  }

  onDrop(event: Event) {
    const symbolId = (event.target! as HTMLElement).dataset.symbolId
    if(symbolId) {
      const symbolInfo = getSymbol(this.options.editor, this.options.editor.Components.getById(symbolId))
      if(symbolInfo) {
        const parentId = this.lastTarget?.id
        if (!parentId) throw new Error('Can not create the symbol: missing param id')
        const parent = this.lastTarget ? this.options.editor.Components.getById(parentId) : null
        if (parent) {
          // Make sure we have a target and position
          this.lastTarget = this.lastTarget || this.options.editor.Canvas.getBody()
          this.lastPos = this.lastPos || { placement: 'after', index: 0 }
          // Get the parent component from the HTML element
          const parentId = this.lastTarget.getAttribute('id')
          if (!parentId) throw new Error('Can not create the symbol: missing param id')
          const parent = this.options.editor.Components.allById()[parentId]
          // Check if we can drop the symbol there
          if (allowDrop(this.options.editor, parent)) {
            // create the new component
            const {instances} = createSymbol(this.options.editor, symbolInfo.main!)!
            // Last one is the added one
            const instance = instances[instances.length - 1]
            const [c] = this.lastPos.placement === 'after' ? parent.append(instance) :
              parent.append(instance, { at: this.lastPos.index })
            // Select the new component
            // Break unit tests? editor.select(c, { scroll: true })
            return c
          } else {
            throw new Error('Can not create the symbol: one of the parent is in the symbol')
          }
        } else {
          throw new Error('Can not create the symbol: parent not found')
        }

      } else {
        throw new Error(`Could not create an instance of symbol ${symbolId}: symbol not found`)
      }
    } else {
      // not a symbol creation
    }
    return null
  }
  onRemove({ target: deleteButton }: MouseEvent) {
    // Warn the user
    confirmDialog({
      editor: this.options.editor,
      title: 'Delete Symbol',
      content: `
          <p>Are you sure you want to delete this symbol?</p>
          <p>Deleting this symbol <em>will not</em> delete its instances, just disconnects them. Confirm to proceed or cancel to maintain the current link.</p>
        `,
      primaryLabel: 'Delete',
      cbk: () => {
        this.onRemoveConfirm(deleteButton as HTMLElement)
      },
      lsKey: 'delete-symbol',
    })
  }
  onRemoveConfirm(target: HTMLElement) {
    const symbolId = closestHtml((target), 'data-symbol-id')
      ?.dataset.symbolId
    if (!symbolId) {
      throw new Error('Can not delete symbol: missing param symbolId')
    }
    const symbol = this.options.editor.Components.getSymbols()
      .find(symbol => symbol.getId() === symbolId)
    if (!symbol) {
      throw new Error('Can not delete symbol: symbol not found')
    }
    deleteSymbol(this.options.editor, symbol)
  }
}
