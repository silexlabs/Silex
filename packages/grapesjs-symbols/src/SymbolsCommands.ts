import { Editor, Component } from 'grapesjs'
import Symbol, { createSymbol, getSymbolId } from './model/Symbol'
import { allowDrop, setDirty } from './utils'
import { SymbolEditor } from './model/Symbols'
import { html, render } from 'lit-html'

export const cmdAdd = 'symbols:add'
export const cmdRemove = 'symbols:remove'
export const cmdUnlink = 'symbols:unlink'
export const cmdCreate = 'symbols:create'

export default function({ editor, options }: { editor: Editor, options: any}) {
  editor.Commands.add(cmdAdd, addSymbol)
  editor.Commands.add(cmdRemove, removeSymbol)
  editor.Commands.add(cmdUnlink, unlinkSymbolInstance)
  editor.Commands.add(cmdCreate, createSymbolInstance)
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
      <p>${message}</p>
    </main><footer>
      <button class="gjs-btn-prim" @click=${() => editor.Modal.close()}>Close</button>
    </footer>`, content)
}

/**
 * Create a new symbol
 * @param options.component - the component which will become the first instance of the symbol
 * @returns {Symbol}
 */
export function addSymbol(
  editor: SymbolEditor,
  sender: any,
  {label, icon, component = editor.getSelected()}: {label: string, icon: string, component: Component | undefined},
) {
  if(component) {
    // add the symbol
    const s = editor.Symbols.add(createSymbol(component, { label, icon }))
    setDirty(editor)
    // return the symbol to the caller
    return s
  } else {
    throw new Error('Can not create the symbol: missing param component')
  }
}

/**
 * Delete a symbol
 * @param {symbolId: string} - object containing the symbolId
 */
export function removeSymbol(
  editor: SymbolEditor,
  sender: any,
  {symbolId}: {symbolId: string},
) {
  if(symbolId) {
    if(editor.Symbols.has(symbolId)) {
      // remove the symbol
      const s = editor.Symbols.remove(symbolId)
      // Unlink all instances
      s.unlinkAll()
      // notify the editor that a change occured
      setDirty(editor)
      // return the symbol to the caller
      return s
    } else {
      throw new Error('Could not remove symbol: symbol not found')
    }
  } else {
    throw new Error('Could not remove symbol: missing param symbolId')
  }
}

export function unlinkSymbolInstance(
  editor: SymbolEditor,
  sender: any, { component }: { component: Component },
) {
  if(component) {
    const s = editor.Symbols.get(getSymbolId(component))
    if(s) {
      s.unlink(component)
      // notify the editor that a change occured
      setDirty(editor)
    } else {
      console.warn('Can not unlink component', component, 'Symbol not found')
    }
  } else {
    throw new Error('Can not unlink the component: missing param component')
  }
}

/**
 * @param {{index, indexEl, method}} pos Where to insert the component, as [defined by the Sorter](https://github.com/artf/grapesjs/blob/0842df7c2423300f772e9e6cdc88c6ae8141c732/src/utils/Sorter.js#L871)
 */
export function createSymbolInstance(
  editor: SymbolEditor,
  sender: any,
  { symbol, pos, target }: { symbol: Symbol, pos: any, target: HTMLElement },
): Component | null {
  pos = pos || {}
  if (symbol && pos && target) {
    const parentId = target ? target.getAttribute('id') : undefined
    if (!parentId) throw new Error('Can not create the symbol: missing param id')
    const parent = target ? editor.Components.allById()[parentId!] : undefined
    // Check that it is a valid parent
    if (parent) {
      if(!allowDrop({target: symbol.get('model'), parent})) {
        // Cancel and notify the user
        displayError(editor, 'Error: can not create the symbol', 'One of the parent is in the symbol.</p><p>Please remove the parent from the symbol and try again.')
        return null
      } else {
        // create the new component
        const [c] = parent ? parent.append([symbol.createInstance()], { at: pos.index }) : []
        // Select the new component
        // Break unit tests? editor.select(c, { scroll: true })
        return c
      }
    } else {
      console.error('Can not create the symbol: parent not found')
      return null
    }
  } else {
    throw new Error('Can not create the symbol: missing param symbol or pos or target')
  }
}
