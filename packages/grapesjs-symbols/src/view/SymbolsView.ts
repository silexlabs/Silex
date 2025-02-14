import { render, html } from 'lit-html'
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'
import Backbone, { ViewOptions } from 'backbone'
import { Symbols, SymbolEditor } from '../model/Symbols'
import { Position } from 'grapesjs'

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
  editor: SymbolEditor,
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
  editor: SymbolEditor,
  appendTo: string,
  highlightColor: string,
  emptyText: string,
}

export default class extends Backbone.View {
  protected lastPos: Position | null = null
  protected lastTarget: HTMLElement | null = null
  //initialize(model, { editor, options }) {
  // FIXME: why is editor in options?
  constructor(protected options: SymbolsViewOptions) {
    super(options)
    // listen to redraw UI
    if(!options.model) throw new Error('Could not create Symbol: model is required')
    options.model!.on('add update remove', () => this.render())
    options.editor.on('component:selected', () => this.render())
    // listen to drag event in order to have access to the drop target
    options.editor.on('sorter:drag', event => {
      this.lastPos = event.pos
      this.lastTarget = event.target
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
    const symbols = this.model as any as Symbols
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
    .map(s => html`
          <div
            class="gjs-block gjs-one-bg gjs-four-color-h symbols__symbol
              ${!!selected && s.get('instances')!.has(selected.cid!) ? 'symbols__symbol-selected' : ''}
              fa ${s.attributes.icon}
            "
            title="" draggable="true"
            symbol-id=${s.cid}>
            <div title="Unlink all instances and delete Symbol" class="symbols__remove" @click=${(event: MouseEvent) => this.onRemove(event)}>
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
            </div>
            <div class="gjs-block-label">
              ${s.attributes.label}
              <div class="symbols__num">
                ${s.get('instances')!.size} instances
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
    const symbolId = (event.target! as HTMLElement).getAttribute('symbol-id')
    if(symbolId) {
      const symbol = this.options.editor.Symbols.get(symbolId)
      if(symbol) {
        this.options.editor.runCommand('symbols:create', { symbol, pos: this.lastPos, target: this.lastTarget })
      } else {
        console.error(`Could not create an instance of symbol ${symbolId}: symbol not found`)
      }
    } else {
      // not a symbol creation
    }
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
    const symbolId = closestHtml((target), 'symbol-id')
      ?.getAttribute('symbol-id')
    if(symbolId) {
      this.options.editor.runCommand('symbols:remove', { symbolId })
    } else {
      console.error('not a symbol', symbolId)
    }
  }
}
