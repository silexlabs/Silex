import { setSymbolId } from './model/Symbol.js'

export default function({ editor, options }) {
  editor.Commands.add('symbols:add', function (editor, sender, {id, label, icon, content}) {
    if(content) {
      // add the symbol
      const s = editor.Symbols.add({ id, label, icon, content })
      // set editor as dirty
      setDirty(editor)
      // return the symbol to the caller
      return s
    } else {
      console.error('Can not create the symbol, missing content', {label, icon, content, id})
      throw new Error('Can not create the symbol, missing content')
    }
  })
  editor.Commands.add('symbols:remove', function (editor, sender, {id}) {
    // remove the symbol
    const s = editor.Symbols.remove(id)
    // unlink all components
    Array.from(s.get('components'))
      .forEach(([id, component]) => editor.runCommand('symbols:unlink', { component }))
    // set editor as dirty
    setDirty(editor)
    // return the symbol to the caller
    return s
  })
  editor.Commands.add('symbols:unlink', function (editor, sender, { component }) {
    if(component) {
      setSymbolId(component, undefined)
    } else {
      console.error('Can not unlink the component, missing component', {component})
      throw new Error('Can not unlink the component, missing component')
    }
  })
  editor.Commands.add('symbols:create', function (editor, sender, { symbol }) {
    if(symbol) {
      const [c] = editor.addComponents([symbol.get('content')])
      console.log('symbols:create', { symbol, c })
      setSymbolId(c, symbol.get('id'))
      return c
    } else {
      console.error('Can not create the component, missing symbol', {symbol})
      throw new Error('Can not create the symbol, missing symbol')
    }
  })
}

/**
 * set editor as dirty
 */
function setDirty(editor) {
  const curr = editor.getDirtyCount() || 0
  editor.getModel().set('changesCount', curr + 1)
}
