import * as grapesjs from 'grapesjs/dist/grapes.min.js'
import { cmdAddSymbol } from '@silexlabs/grapesjs-symbols/src'

export const cmdPromptAddSymbol = 'symbol-prompt-add'

export default grapesjs.plugins.add(name, (editor, opts) => {
  function getNext(prefix) {
    let idx = 1
    while(editor.Symbols.find(s => s.get('label') === prefix + idx)) {
      idx++
    }
    return prefix + idx
  }
  editor.Commands.add(cmdPromptAddSymbol, {
    run: (_, sender) => {
      const label = prompt('Label', getNext('Symbol '))
      const icon = prompt('Icon', 'fa-list')
      editor.runCommand(cmdAddSymbol, { label, icon })
    }
  })
})
