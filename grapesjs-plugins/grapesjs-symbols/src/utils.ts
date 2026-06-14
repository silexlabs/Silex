import { Component, Editor, SymbolInfo } from 'grapesjs'

/**
 * Make sure we can drop a symbol instance
 */
export function allowDrop(editor: Editor, component: Component): boolean {
  if (!component) {
    throw new Error('No component provided to check drop permission.')
  }
  // Check if the component or one of its parents is a symbol instance
  let current: Component | undefined = component
  do {
    const info = editor.Components.getSymbolInfo(current)
    if (info?.isSymbol) {
      return false
    }
    current = current.parent()
  } while (current)
  // If no symbol instance is found, allow the drop
  return true
}

/**
 * Get all the symbols
 */
export function getSymbols(editor: Editor): Array<SymbolInfo> {
  return editor.Components.getSymbols().map(symbol => {
    return editor.Components.getSymbolInfo(symbol)
  })

  // const symbols = editor.Components.getSymbols()
  // return symbols.map(symbol => {
  //   const info = editor.Components.getSymbolInfo(symbol)
  //   return {
  //     symbol,
  //     info,
  //   }
  // })
}

/**
 * Get a symbol by its ID
 */
export function getSymbol(editor: Editor, component: Component): SymbolInfo | null {
  const info = editor.Components.getSymbolInfo(component)
  if (info?.isSymbol) {
    return info
  }
  return null
}

/**
 * Create a new symbol from a component
 */
export function createSymbol(editor: Editor, component: Component): SymbolInfo | null {
  if (!component) {
    throw new Error('No component provided to create a symbol.')
  }
  const symbol = editor.Components.addSymbol(component)
  if (symbol) {
    return editor.Components.getSymbolInfo(symbol)
  } else {
    throw new Error('Failed to create symbol from the provided component.')
  }
}

/**
 * Bind a symbol instance to a component
 */
export function unbindSymbolInstance(editor: Editor, component: Component) {
  const info = editor.Components.getSymbolInfo(component)
  if (info?.isInstance) {
    editor.Components.detachSymbol(component) // Detach instance from its symbol
  } else {
    throw new Error('Component is not a symbol instance.')
  }
}

/**
 * Delete a symbol instance and all its references
 * This will remove the main symbol but leave the instances
 */
export function deleteSymbol(editor: Editor, symbol: Component) {
  const symbolInfo = editor.Components.getSymbolInfo(symbol)
  if (!symbolInfo) {
    throw new Error(`Can not delete symbol: symbol info not found for ${symbol?.getId() || 'unknown'}`)
  }
  // Delete the symbol
  symbol?.remove()
}
