import SymbolsView, { SymbolsViewOptions } from './view/SymbolsView'
import initCommands from './SymbolsCommands'
import initTraits from './view/traits'
import { Editor } from 'grapesjs'

export interface SymbolOptions {
  appendTo: string;
  emptyText: string;
  primaryColor: string;
  secondaryColor: string;
  highlightColor: string;
}

export default (editor: Editor, opts: Partial<SymbolOptions> = {}) => {
  const options: SymbolOptions = { ...{
    appendTo: '#symbols',
    emptyText: 'No symbol yet.',
    primaryColor: '#b9a5a6',
    secondaryColor: '#463a3c',
    highlightColor: '#d97aa6',
  },  ...opts }
  console.log('Symbols plugin options', options)

  editor.on('load', () => {
    // Display symbols
    new SymbolsView({ ...options, editor } as SymbolsViewOptions)

  // Commands to create/delete symbols
  initCommands(editor)

  // Add traits like a plugin
  initTraits(editor, options)
  })
}
