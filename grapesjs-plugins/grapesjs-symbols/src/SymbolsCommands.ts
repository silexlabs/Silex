import { Editor, Component } from 'grapesjs'
import { html, render } from 'lit-html'
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'

import { allowDrop, createSymbol, deleteSymbol, getSymbols, unbindSymbolInstance } from './utils'

export const cmdAdd = 'symbols:add'
export const cmdRemove = 'symbols:remove'
export const cmdUnlink = 'symbols:unlink'
export const cmdCreate = 'symbols:create'
export const cmdList = 'symbols:list'

// Same signature as a grapesjs plugin
export default function(editor: Editor) {
  editor.Commands.add(cmdList, {
    run() {
      return getSymbols(editor).map(({ main, instances }) => ({
        id: main?.getId(),
        label: main?.getName(),
        instances: instances.length,
      }))
    },
  })
  editor.Commands.add(cmdAdd, _addSymbol)
  editor.Commands.add(cmdRemove, _removeSymbol)
  editor.Commands.add(cmdUnlink, _unlinkSymbolInstance)
  editor.Commands.add(cmdCreate, _createSymbolInstance)
}

// Symbol management functions
// These are exported for unit tests

export function displayError(editor: Editor, title: string, message: string) {
  const content = document.createElement('div')
  editor.Modal.open({
    title,
    content,
  })
  render(html`<main>
      <p>${unsafeHTML(message)}</p>
    </main><footer style="
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
    ">
      <div></div>
      <button class="gjs-btn-prim" @click=${() => editor.Modal.close()}>Close</button>
    </footer>`, content)
}

/**
 * Create a new symbol
 * @param options.component - the component which will become the first instance of the symbol
 * @returns {Symbol}
 */
export function _addSymbol(
  editor: Editor,
  _: any,
  { component = editor.getSelected(), label = component?.getName(), icon }: {component?: Component, label?: string, icon?: string} ,
) {
  if(!component || !label) {
    throw new Error('Can not create the symbol: missing required param')
  }
  // Give the component a name
  component.setName(label)
  if(icon) component.set('icon', icon)
  const { main } = createSymbol(editor, component)!
  return { created: [{ id: main!.getId(), label }] }
}

/**
 * Delete a symbol
 * @param {symbolId: string} - object containing the symbolId
 */
export function _removeSymbol(
  editor: Editor,
  _: any,
  {symbolId}: {symbolId: string},
) {
  if (!symbolId) {
    throw new Error('Can not delete symbol: missing param symbolId')
  }
  const symbol = editor.Components.getSymbols()
    .find(symbol => symbol.getId() === symbolId)
  if (!symbol) {
    throw new Error('Can not delete symbol: symbol not found')
  }
  deleteSymbol(editor, symbol)
}

export function _unlinkSymbolInstance(
  editor: Editor,
  _: any, { component = editor.getSelected() }: { component?: Component },
) {
  if(!component) {
    throw new Error('Can not unlink the component: missing param component')
  }
  unbindSymbolInstance(editor, component)
}

const POSITIONS = ['inside', 'before', 'after']

// From an agent: the symbol by its id, placed relative to the selected element
function insertSymbolInstance(editor: Editor, symbolId: string, position = 'inside') {
  const symbols = editor.Components.getSymbols()
  const symbol = symbols.find(s => s.getId() === symbolId)
  if (!symbol) {
    throw new Error(`No symbol "${symbolId}". Nothing was changed. ${symbols.length ? `Symbols: ${symbols.map(s => `${s.getId()} (${s.getName()})`).join(', ')}.` : 'There is no symbol yet: create one with symbols_add.'}`)
  }
  if (!POSITIONS.includes(position)) throw new Error(`position must be one of: ${POSITIONS.join(', ')}. Nothing was changed.`)
  const target = editor.getSelected() ?? editor.getWrapper()!
  const parent = position === 'inside' ? target : target.parent()
  if (!parent) throw new Error('The body has no parent: use position "inside". Nothing was changed.')
  const at = position === 'inside' ? undefined : target.index() + (position === 'after' ? 1 : 0)
  if (!allowDrop(editor, parent)) throw new Error('A symbol can not go inside a symbol. Nothing was changed. Select an element outside of it with components_select, or change position.')
  if (!editor.Components.canMove(parent, symbol, at).result) throw new Error(`The parent element can not contain symbol "${symbol.getName()}". Nothing was changed. Select another element with components_select, or change position.`)
  const [instance] = parent.append(editor.Components.addSymbol(symbol)!, { at })
  editor.select(instance)
  return editor.Commands.has('agent-ids:created')
    ? editor.runCommand('agent-ids:created', { components: [instance] })
    : { created: [{ id: instance.getId() }], parent_id: parent.getId() }
}

/**
 * @param {{index, indexEl, method}} pos Where to insert the component, as [defined by the Sorter](https://github.com/artf/grapesjs/blob/0842df7c2423300f772e9e6cdc88c6ae8141c732/src/utils/Sorter.js#L871)
 */
export function _createSymbolInstance(
  editor: Editor,
  _: any,
  { symbol, pos, target, symbolId, position }: { symbol: Component, pos: any, target: HTMLElement | Component, symbolId?: string, position?: string },
) {
  if (symbolId) return insertSymbolInstance(editor, symbolId, position)
  if (!symbol || !pos || !target) {
    throw new Error('Can not create the symbol: missing param symbol or pos or target')
  }
  pos = pos || {}
  if (symbol && pos && target) {
    const isHtmlElement = target instanceof HTMLElement
    const isComponent = !isHtmlElement
    const parentId = isComponent ? undefined : target.getAttribute('id')
    if(!parentId && !isComponent) {
      throw new Error('Can not create the symbol: missing parentId or target component')
    }
    const parent = isComponent ? target : editor.Components.allById()[parentId!]
    // Check that it is a valid parent
    if (parent) {
      if(allowDrop(editor, parent)) {
        // create the new component
        const symbolInfo = createSymbol(editor, symbol)
        if (!symbolInfo) throw new Error('Can not create the symbol: symbol creation failed')
        const { instances } = symbolInfo
        // Last one is the added one
        const instance = instances[instances.length - 1]
        const [c] = pos.placement === 'after' ? parent.append(instance) :
          parent.append(instance, { at: pos.index })
        // Select the new component
        // Break unit tests? editor.select(c, { scroll: true })
        return c
      } else {
        // Cancel and notify the user
        displayError(editor, 'Error: can not create the symbol', '<p>One of the parent is in the symbol.</p><p>Please remove the parent from the symbol and try again.</p>')
        throw new Error('Can not create the symbol: one of the parent is in the symbol')
      }
    } else {
      throw new Error('Can not create the symbol: parent not found')
    }
  } else {
    throw new Error('Can not create the symbol: missing param symbol or pos or target')
  }
}
