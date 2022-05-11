function getAllComponents(editor) {
  const res = []
  editor.Pages.getAll()
    .forEach(page => {
      page.getMainComponent()
        .onAll(c => res.push(c))
    })
  return res
}

/**
 * @param {object} c, a component
 * @return {string} the symbol ID if the component is a symbol
 */
export function getSymbolInfo(c) {
  return {
    id: c.symbolId,
    label: c.symbolLabel,
    icon: c.symbolIcon,
  }
}

/**
 * keep track of symbols and apply changes
 * @returns {WeakMap<string, object>} all symbols hashed by symbolId
 */
export function initSymbolManager(editor, options) {
  if(editor.Symbols) throw new Error('Symbol Manager already exists')
  // init symbols WeekMap
  const symbols = getAllComponents(editor)
    .reduce((aggr, c) => {
      const info = getSymbolInfo(c)
      if(info.id) {
        // get the symbol from Map or a new one
        const symbol = aggr.has(info.id) ? aggr.get(info.id) : {
          components: new Set(),
        }
        // adds the component
        symbol.components.add(c),
        // adds or update the symbol
        aggr.set(info.id, {
          ...symbol,
          label: symbol.label || info.label,
          icon: symbol.icon || info.icon,
        })
      }
      return aggr
    }, new Map())
  // update symbols on events
  editor.on('component:add', (...args) => {
    console.log('UPDATE SYMBOLS', {args})
  })
  // add the Symbols object to the editor
  editor.Symbols = {
    /**
     * @returns {Array<object>} all symbols hashed by symbolId
     */
    getAll: () => Array.from(symbols)
      .map(([symbolId, s]) => s)
      .flatMap(s => Array.from(s.components)),
    /**
     * @returns {WeakMap<string, object>} all symbols hashed by symbolId
     */
    getSymbols: () => symbols,
    /**
     * create a symbol out of a component, turns the component into the symbol instance
     * @throws Error when no component is provided
     */
    createSymbol: ({label, icon, component}) => {
      if(component) {
      } else {
        throw new Error(`No components for the symbol ${label}`)
      }
    }
  }
}

