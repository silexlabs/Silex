import Symbols from './model/Symbols.js'

export default (editor, opts = {}) => {
  editor.on('storage:start:store', (objectToStore) => {
    objectToStore.symbols = JSON.stringify(editor.Symbols.toJSON())
  })
  editor.on('storage:start:load', keys => {
    keys.push('symbols')
  })
  editor.on('storage:end:load', (resultObject) => {
    if(resultObject.symbols) {
      editor.Symbols.reset()
      editor.Symbols.set(JSON.parse(resultObject.symbols))
      // update sybols with existing components
      // call setSymbols on load because
      // the `storage:end:load` event is fired after the components are loaded
      editor.Symbols.updateComponents()
    }
  })
}
