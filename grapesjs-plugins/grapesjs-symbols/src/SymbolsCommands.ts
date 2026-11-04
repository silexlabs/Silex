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
  if (!component.parent()) throw new Error('The body can not become a symbol. Nothing was changed. Choose an element inside it with element_id.')
  // Give the component a name
  component.setName(label)
  if(icon) component.set('icon', icon)
  const { main } = createSymbol(editor, component)!
  return { symbol_id: main!.getId(), label, ...editor.runCommand('agent-ids:created', { components: [component] }) }
}

/**
 * Delete a symbol
 * @param {symbolId: string} - object containing the symbolId
 */
export function _removeSymbol(
  editor: Editor,
  _: any,
  { symbol_id }: { symbol_id?: string },
) {
  if (!symbol_id) {
    throw new Error('Can not delete symbol: missing param symbol_id')
  }
  const { symbol, list } = symbolOf(editor, symbol_id)
  if (!symbol) {
    throw new Error(`No symbol "${symbol_id}". Symbols: ${list || 'none'}.`)
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

export const POSITIONS = ['inside', 'before', 'after']

function elementOf(editor: Editor, id?: string): Component | undefined {
  return editor.runCommand('agent-ids:elements', { element_id: id })[0]
}

function symbolOf(editor: Editor, id: string): { symbol?: Component, list: string } {
  const symbols = editor.Components.getSymbols()
  const symbol = symbols.find(s => s.getId() === id)
  return { symbol, list: symbol ? '' : symbols.map(s => `${s.getId()} (${s.getName()})`).join(', ') }
}

function insertSymbolInstance(editor: Editor, symbolId: string, position = 'inside', targetId?: string): Record<string, unknown> {
  const { symbol, list } = symbolOf(editor, symbolId)
  if (!symbol) {
    throw new Error(`No symbol "${symbolId}". Nothing was changed. ${list ? `Symbols: ${list}.` : 'There is no symbol yet: create one with symbol(action:\'create\').'}`)
  }
  if (!POSITIONS.includes(position)) throw new Error(`position must be one of: ${POSITIONS.join(', ')}. Nothing was changed.`)
  const target = (targetId ? elementOf(editor, targetId) : editor.getSelected()) ?? editor.getWrapper()!
  const parent = position === 'inside' ? target : target.parent()
  if (!parent) throw new Error('The body has no parent: use position "inside". Nothing was changed.')
  const at = position === 'inside' ? undefined : target.index() + (position === 'after' ? 1 : 0)
  // Before the instance path, which refuses with a dialog meant for the user
  if (!allowDrop(editor, parent)) throw new Error('A symbol can not go inside a symbol. Nothing was changed. Choose a target_id outside of it, or change position.')
  const instance = _createSymbolInstance(editor, null, { symbol, target: parent, pos: { index: at } })
  return editor.runCommand('agent-ids:created', { components: [instance] })
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
        if (!editor.Components.canMove(parent, symbol, pos.index).result) {
          throw new Error(`The parent element can not contain symbol "${symbol.getName()}". Nothing was changed.`)
        }
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
