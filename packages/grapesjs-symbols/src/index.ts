import Storage from './storage'
import { Symbols, SymbolEditor } from './model/Symbols'
import SymbolsView, { SymbolsViewOptions } from './view/SymbolsView'
import initCommands from './SymbolsCommands'
import initTraits from './view/traits'
import { SymbolOptions } from './model/Symbol'

export default (editor: SymbolEditor, opts: Partial<SymbolOptions> = {}) => {
  const options: SymbolOptions = { ...{
    appendTo: '#symbols',
    emptyText: 'No symbol yet.',
    primaryColor: '#b9a5a6',
    secondaryColor: '#463a3c',
    highlightColor: '#d97aa6',
  },  ...opts }

  // store the symbols data with the site
  Storage(editor)

  // keep track of symbols and changes
  editor.Symbols = new Symbols([], { options, editor })

  editor.on('load', () => {
    // Display symbols
    new SymbolsView({ ...options, editor, model: editor.Symbols, } as any as SymbolsViewOptions)

    // Commands to create/delete symbols
    initCommands(editor)

    // Add traits like a plugin
    initTraits(editor, options)
  })
}
