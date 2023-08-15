import Storage from './storage'
import { Symbols, SymbolEditor } from './model/Symbols'
import SymbolsView, { SymbolsViewOptions } from './view/SymbolsView'
import initCommands, * as cmd from './SymbolsCommands'
import initTraits from './view/traits'

export const cmdAddSymbol = cmd.cmdAdd
export const cmdRemoveSymbol = cmd.cmdRemove
export const cmdUnlinkSymbol = cmd.cmdUnlink
export const cmdCreateSymbol = cmd.cmdCreate

export interface SymbolOptions {
  appendTo?: string
  emptyText?: string
  primaryColor?: string
  secondaryColor?: string
  highlightColor?: string
}

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

  editor.on('load', (...args) => {
    // Display symbols
    new SymbolsView({ ...options, editor, model: editor.Symbols, } as any as SymbolsViewOptions)

    // Commands to create/delete symbols
    initCommands(editor, options)

    // Add traits like a plugin
    initTraits(editor, options)
  })
}
