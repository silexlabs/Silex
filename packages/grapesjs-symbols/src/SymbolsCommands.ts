import { Editor, Component } from 'grapesjs'
import { html, render } from 'lit-html'
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'

import Symbol, { createSymbol, getSymbolId } from './model/Symbol'
import { allowDrop, setDirty } from './utils'
import { SymbolEditor } from './model/Symbols'
import { SymbolEvents } from './events'

export const cmdAdd = 'symbols:add'
export const cmdRemove = 'symbols:remove'
export const cmdUnlink = 'symbols:unlink'
export const cmdCreate = 'symbols:create'

// Same signature as a grapesjs plugin
export default function(editor: SymbolEditor) {
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
export function addSymbol(
  editor: SymbolEditor,
  _: any,
  {label, icon, component = editor.getSelected()}: {label: string, icon: string, component: Component | undefined},
) {
  if(component && label && icon) {
    // add the symbol
    const s = editor.Symbols.add(createSymbol(editor, component, { label, icon }))
    setDirty(editor)
    // Notify plugins
    editor.trigger(SymbolEvents.CREATE, { symbol: s })
    // return the symbol to the caller
    return s
  } else {
    console.error('Can not create the symbol: missing required param', {label, icon, component})
    throw new Error('Can not create the symbol: missing required param')
  }
}

/**
 * Delete a symbol
 * @param {symbolId: string} - object containing the symbolId
 */
export function removeSymbol(
  editor: SymbolEditor,
  _: any,
  {symbolId}: {symbolId: string},
) {
  if(symbolId) {
    if(editor.Symbols.has(symbolId)) {
      // remove the symbol
      const s = editor.Symbols.remove(symbolId)
      const instances = s.get('instances')
      // Unlink all instances
      s.unlinkAll()
      // notify the editor that a change occured
      setDirty(editor)
      // Notify the plugins
      instances.forEach((c: Component) => editor.trigger(SymbolEvents.UNLINK, { symbol: s, component: c }))
      editor.trigger(SymbolEvents.REMOVE, { symbol: s })
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
  _: any, { component }: { component: Component },
) {
  if(component) {
    const s = editor.Symbols.get(getSymbolId(component))
    if(s) {
      s.unlink(component)
      // notify the editor that a change occured
      setDirty(editor)
      // Notify the plugins
      editor.trigger(SymbolEvents.UNLINK, { symbol: s, component })
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
  _: any,
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
        displayError(editor, 'Error: can not create the symbol', '<p>One of the parent is in the symbol.</p><p>Please remove the parent from the symbol and try again.</p>')
        return null
      } else {
        // create the new component
        const [c] = parent ? parent.append([symbol.createInstance()], { at: pos.index }) : []
        // Select the new component
        // Break unit tests? editor.select(c, { scroll: true })
        // Notify plugins
        editor.trigger(SymbolEvents.LINK, { symbol, component: c })
        editor.trigger(SymbolEvents.CREATE_INSTANCE, { symbol, component: c })
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
