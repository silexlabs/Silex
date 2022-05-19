import { setSymbolId } from './model/Symbol.js'

// exported plugin
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
 */
export function addSymbol(editor, sender, {id, label, icon, content}) {
  if(content) {
    // add the symbol
    const s = editor.Symbols.add({ id, label, icon, content })
    // return the symbol to the caller
    return s
  } else {
    throw new Error('Can not create the symbol: missing param content')
  }
}

/**
 * Delete a symbol
 * @param _getComponents a mock getComponents method for unit test, this is a workaround as jest refuses to mock
 */
export function removeSymbol(editor, sender, {id}, _getComponents = null) {
  if(id) {
    // remove the symbol
    const s = editor.Symbols.remove(id)
    if(s) {
      // unlink all components
      (_getComponents ? _getComponents() : s.getComponents())
        .forEach(component => unlinkSymbolInstance(editor, sender, { component }))
    } else {
      throw new Error(`Cound not remove the symbol: symbol not found with id ${id}`)
    }
    // return the symbol to the caller
    return s
  } else {
    throw new Error('Could not remove symbol: missing param id')
  }
}

export function unlinkSymbolInstance(editor, sender, { component }) {
  if(component) {
    // Remove symbol id
    // The component will be removed from the symbol in Symbols::onRemove
    setSymbolId(component, undefined)
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
    const [c] = parent.append([{
      ...symbol.get('content'),
      symbolId: symbol.get('id'),
    }], { at: pos.index })
    // select the new component
    editor.select(c, { scroll: true })
    return c
  } else {
    throw new Error('Can not create the symbol: missing param symbol, pos or target')
  }
}

