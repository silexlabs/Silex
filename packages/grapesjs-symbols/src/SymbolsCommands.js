// exported plugin
import { createSymbol, unlink } from './model/Symbol.js'

export default function({ editor, options }) {
  editor.Commands.add('symbols:add', addSymbol)
  editor.Commands.add('symbols:remove', removeSymbol)
  editor.Commands.add('symbols:unlink', unlinkSymbolInstance)
  editor.Commands.add('symbols:create', createSymbolInstance)
}

// Symbol management functions
// These are exported for unit tests

/**
 * Create a new symbol
 * @param {Component} options.component - the symbol which will become the first instance of the symbol
 * @returns {Symbol}
 */
export function addSymbol(editor, sender, {label, icon, component = editor.getSelected()}) {
  if(component) {
    // add the symbol
    const s = editor.Symbols.add(createSymbol(component, { label, icon }, editor))
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
export function removeSymbol(editor, sender, {symbolId}) {
  if(symbolId) {
    if(editor.Symbols.has(symbolId)) {
      // remove the symbol
      const s = editor.Symbols.remove(symbolId)
      // return the symbol to the caller
      return s
    } else {
      throw new Error('Could not remove symbol: symbol not found')
    }
  } else {
    throw new Error('Could not remove symbol: missing param symbolId')
  }
}

export function unlinkSymbolInstance(editor, sender, { component }) {
  if(component) {
    unlink(component)
  } else {
    throw new Error('Can not unlink the component: missing param component')
  }
}

/**
 * @param {{index, indexEl, method}} pos Where to insert the component, as [defined by the Sorter](https://github.com/artf/grapesjs/blob/0842df7c2423300f772e9e6cdc88c6ae8141c732/src/utils/Sorter.js#L871)
 */
export function createSymbolInstance(editor, sender, { symbol, pos, target }) {
  pos = pos || { }
  if(symbol && pos && target) {
    const parentId = target ? target.getAttribute('id') : undefined
    const parent = editor.Components.allById()[parentId]
    // create the new component
    const [c] = parent.append([symbol.get('model')], { at: pos.index })
    // select the new component
    editor.select(c, { scroll: true })
    return c
  } else {
    throw new Error('Can not create the symbol: missing param symbol, pos or target')
  }
}
