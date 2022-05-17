import Storage from './storage.js'
import Symbols from './model/Symbols.js'
import SymbolsView from './view/SymbolsView.js'
import SymbolsCommands from './SymbolsCommands.js'

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

    // Commands to create/delete symbols
    new SymbolsCommands({options, editor})
  })
}
