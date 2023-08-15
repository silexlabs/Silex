import Storage from './storage'
import { Symbols, SymbolEditor } from './model/Symbols'
import SymbolsView from './view/SymbolsView'
import initCommands, * as cmd from './SymbolsCommands'
import initTraits from './view/traits'

export const cmdAddSymbol = cmd.cmdAdd
export const cmdRemoveSymbol = cmd.cmdRemove
export const cmdUnlinkSymbol = cmd.cmdUnlink
export const cmdCreateSymbol = cmd.cmdCreate

export default (editor: SymbolEditor, opts: any = {}) => {
  const options = { ...{
    appendTo: '#symbols',
    selectColor: '#EEE',
    emptyText: 'No symbol yet.',
  },  ...opts }

  // store the symbols data with the site
  Storage(editor)

  // keep track of symbols and changes
  editor.Symbols = new Symbols([], { options, editor })

  editor.on('load', (...args) => {
    // Display symbols
    new SymbolsView({ ...options, editor, model: editor.Symbols, })

    // Commands to create/delete symbols
    initCommands(editor, options)

    // Add traits like a plugin
    initTraits(editor, options)
  })
}
