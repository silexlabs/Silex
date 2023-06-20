import { SymbolEditor } from './model/Symbols'
import { getAllComponentsFromEditor } from './utils'

export default (editor: SymbolEditor) => {
  editor.on('storage:start:store', (objectToStore) => {
    objectToStore.symbols = editor.Symbols.toJSON()
  })
  editor.on('storage:end:load', (resultObject) => {
    if(resultObject.symbols) {
      editor.Symbols.reset()
      editor.Symbols.set(resultObject.symbols)
      // update sybols with existing components
      // call setSymbols on load because
      // the `storage:end:load` event is fired after the components are loaded
      editor.Symbols.updateComponents(getAllComponentsFromEditor(editor))
    }
  })
}
