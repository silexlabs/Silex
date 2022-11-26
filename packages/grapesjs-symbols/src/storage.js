import { getAllComponentsFromEditor } from './utils.js'

export default (editor, opts = {}) => {
  editor.on('storage:start:store', (objectToStore) => {
    objectToStore.symbols = editor.Symbols.toJSON()
  })
  editor.on('storage:end:load', (resultObject) => {
    if(resultObject.symbols) {
      editor.Symbols.reset()
      console.log({resultObject})
      editor.Symbols.set(resultObject.symbols)
      // update sybols with existing components
      // call setSymbols on load because
      // the `storage:end:load` event is fired after the components are loaded
      editor.Symbols.updateComponents(getAllComponentsFromEditor(editor))
    }
  })
}
