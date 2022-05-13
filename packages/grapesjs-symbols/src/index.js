import Symbols from './model/Symbols'
import Storage from './storage'
import SymbolsView from './view/SymbolsView'

export default (editor, opts = {}) => {
  const options = { ...{
    appendTo: '#symbols',
    selectColor: '#EEE',
  },  ...opts }

  // store the symbols data with the site
  Storage(editor, opts)

  // keep track of symbols and changes
  editor.Symbols = new Symbols([], { options, editor })

  editor.on('load', (...args) => {
    // Display symbols
    new SymbolsView(editor.Symbols, { options, editor })
  })
}
