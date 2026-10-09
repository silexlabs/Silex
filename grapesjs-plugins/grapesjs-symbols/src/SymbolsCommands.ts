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
  { element_id, component = elementOf(editor, element_id), label = component?.getName(), icon }: {element_id?: string, component?: Component, label?: string, icon?: string} ,
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
  { symbolId, symbol_id = symbolId }: { symbolId?: string, symbol_id?: string },
) {
  if (!symbol_id) {
    throw new Error('Can not delete symbol: missing param symbol_id')
  }
  const symbols = editor.Components.getSymbols()
  const symbol = symbols.find(symbol => symbol.getId() === symbol_id)
  if (!symbol) {
    throw new Error(`No symbol "${symbol_id}". Symbols: ${symbols.map(s => `${s.getId()} (${s.getName()})`).join(', ') || 'none'}.`)
  }
  deleteSymbol(editor, symbol)
}

export function _unlinkSymbolInstance(
  editor: Editor,
  _: any, { element_id, component = elementOf(editor, element_id) }: { element_id?: string, component?: Component },
) {
  if(!component) {
    throw new Error('Can not unlink the component: missing param component')
  }
  unbindSymbolInstance(editor, component)
}

const POSITIONS = ['inside', 'before', 'after']

// The element an agent names by the id it was given, or the selected one
function elementOf(editor: Editor, id?: string): Component | undefined {
  if (!id) {
    const selected = editor.getSelectedAll()
    if (selected.length > 1) throw new Error('Several elements are selected: set element_id. Nothing was changed.')
    return selected[0]
  }
  const found = editor.Commands.has('agent-ids:find')
    ? editor.runCommand('agent-ids:find', { id })
    : editor.Components.allById()[id]
  if (!found) throw new Error(`No element "${id}". Nothing was changed.`)
  return found
}

// From an agent: the symbol by its id, placed relative to target_id or the selected element
function insertSymbolInstance(editor: Editor, symbolId: string, position = 'inside', targetId?: string) {
  const symbols = editor.Components.getSymbols()
  const symbol = symbols.find(s => s.getId() === symbolId)
  if (!symbol) {
    throw new Error(`No symbol "${symbolId}". Nothing was changed. ${symbols.length ? `Symbols: ${symbols.map(s => `${s.getId()} (${s.getName()})`).join(', ')}.` : 'There is no symbol yet: create one with symbol(action:\'create\').'}`)
  }
  if (!POSITIONS.includes(position)) throw new Error(`position must be one of: ${POSITIONS.join(', ')}. Nothing was changed.`)
  const target = (targetId ? elementOf(editor, targetId) : editor.getSelected()) ?? editor.getWrapper()!
  const parent = position === 'inside' ? target : target.parent()
  if (!parent) throw new Error('The body has no parent: use position "inside". Nothing was changed.')
  const at = position === 'inside' ? undefined : target.index() + (position === 'after' ? 1 : 0)
  if (!allowDrop(editor, parent)) throw new Error('A symbol can not go inside a symbol. Nothing was changed. Choose a target_id outside of it, or change position.')
  if (!editor.Components.canMove(parent, symbol, at).result) throw new Error(`The parent element can not contain symbol "${symbol.getName()}". Nothing was changed. Choose another target_id, or change position.`)
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
  { symbol, pos, target, symbol_id, target_id, position }: { symbol: Component, pos: any, target: HTMLElement | Component, symbol_id?: string, target_id?: string, position?: string },
) {
  if (symbol_id) return insertSymbolInstance(editor, symbol_id, position, target_id)
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
