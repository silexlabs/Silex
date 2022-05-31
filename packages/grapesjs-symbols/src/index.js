import Storage from './storage.js'
import Symbols from './model/Symbols.js'
import SymbolsView from './view/SymbolsView.js'
import SymbolsCommands, * as cmd from './SymbolsCommands.js'

export const cmdAddSymbol = cmd.cmdAdd
export const cmdRemoveSymbol = cmd.cmdRemove
export const cmdUnlinkSymbol = cmd.cmdUnlink
export const cmdCreateSymbol = cmd.cmdCreate

export default (editor, opts = {}) => {
  const options = { ...{
    appendTo: '#symbols',
    selectColor: '#EEE',
    emptyText: 'No symbol yet.',
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
